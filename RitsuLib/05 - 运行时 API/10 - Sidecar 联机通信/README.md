Sidecar 是 RitsuLib 在原版联机通道旁边加的一层轻量协议，用来发送 Mod 自己的同步消息。它适合联机状态同步、主机权威配置、请求/响应和少量诊断信号；如果只是“开局大厅里要进跑局快照的数据”，优先用上一章的 `RunSavedData.Lobby`，不需要 Sidecar。

## 注册类型化消息

最常见的用法是给一个消息定义 descriptor。RitsuLib 会根据 `ModuleId` 和 `MessageKey` 生成稳定 opcode，并负责序列化、发送和反序列化。

```csharp
using System.Text.Json;
using MegaCrit.Sts2.Core.Runs;
using STS2RitsuLib.Networking.Sidecar;

namespace Test.Scripts.Sidecar;

public readonly record struct ChallengeVoteMessage(string ChallengeId, bool HardMode);

public static class TestSidecarMessages
{
    private static readonly RitsuLibSidecarMessageDescriptor<ChallengeVoteMessage> ChallengeVote = new(
        Entry.ModId,
        "challenge_vote_v1",
        static message => JsonSerializer.SerializeToUtf8Bytes(message),
        static payload => JsonSerializer.Deserialize<ChallengeVoteMessage>(payload)
                          ?? throw new InvalidOperationException("Invalid challenge vote payload."),
        RitsuLibSidecarDeliverySemantics.StableSync,
        Required: true);

    public static void Register()
    {
        RitsuLibSidecarTypedMessageRegistry.Subscribe(
            ChallengeVote,
            ctx =>
            {
                if (!ctx.IsHostIngest)
                    return;

                Entry.Logger.Info(
                    $"收到玩家 {ctx.SenderNetId} 的挑战投票：{ctx.Message.ChallengeId}");
                TestChallengeLobbyState.SetVote(ctx.SenderNetId, ctx.Message);
            });
    }

    public static bool SendVoteToHost(RunManager? runManager, string challengeId, bool hardMode)
    {
        return RitsuLibSidecarTypedMessageRegistry.SendToHost(
            runManager,
            ChallengeVote,
            new ChallengeVoteMessage(challengeId, hardMode));
    }
}
```

`MessageKey` 是线协议的一部分。字段含义改变、兼容性断裂时改成 `challenge_vote_v2` 这类新 key；只是新增可空字段或默认字段时可以保留原 key。

`Required: true` 会把这条 descriptor 注册到 required capability 检查里。默认策略是警告；如果你的联机玩法没有这条消息就不能安全开局，可以把策略改成 fail：

```csharp
RitsuLibSidecarRequiredCapabilities.Policy =
    RitsuLibSidecarRequiredCapabilityPolicy.Fail;
```

## 监听连接状态

Sidecar 只会向已确认支持的 peer 发送数据。用事件监听 session、peer reachability 和握手结果，能更容易定位“为什么消息没出去”。

```csharp
using STS2RitsuLib.Networking.Sidecar;

namespace Test.Scripts.Sidecar;

public static class TestSidecarDiagnostics
{
    private static readonly List<IDisposable> Subscriptions = [];

    public static void Register()
    {
        Subscriptions.Add(RitsuLibSidecarEvents.OnSessionBound(evt =>
        {
            Entry.Logger.Info($"Sidecar session bound epoch={evt.Epoch}");
        }));

        Subscriptions.Add(RitsuLibSidecarEvents.OnPeerReachabilityChanged(evt =>
        {
            Entry.Logger.Info(
                $"Sidecar peer {evt.PeerNetId}: {evt.Previous} -> {evt.Current}, {evt.Reason}");
        }));

        Subscriptions.Add(RitsuLibSidecarEvents.OnRequiredCapabilityCheck(evt =>
        {
            if (evt.Passed)
                return;

            foreach (var miss in evt.MissingByPeer)
                Entry.Logger.Warn(
                    $"玩家 {miss.PeerNetId} 缺少 Sidecar 能力：{string.Join(", ", miss.MissingCapabilities)}");
        }));
    }
}
```

这些事件返回的 `IDisposable` 可以在你的 Mod 卸载或测试重载时释放。普通发布版通常在初始化时注册一次即可。

## 主机广播和点对点发送

主机可以把同一个 typed message 广播给所有 sidecar 可达的玩家，也可以只发给某个 `peerNetId`。

```csharp
public readonly record struct ChallengeStateMessage(
    string ChallengeId,
    bool HardMode,
    IReadOnlyDictionary<ulong, string> Votes);

public static class TestSidecarStateBroadcast
{
    private static readonly RitsuLibSidecarMessageDescriptor<ChallengeStateMessage> ChallengeState = new(
        Entry.ModId,
        "challenge_state_v1",
        static message => JsonSerializer.SerializeToUtf8Bytes(message),
        static payload => JsonSerializer.Deserialize<ChallengeStateMessage>(payload)
                          ?? throw new InvalidOperationException("Invalid challenge state payload."),
        RitsuLibSidecarDeliverySemantics.StableSync);

    public static void Register()
    {
        RitsuLibSidecarTypedMessageRegistry.Subscribe(
            ChallengeState,
            ctx =>
            {
                if (ctx.IsHostIngest)
                    return;

                TestChallengeLobbyState.ApplyHostState(ctx.Message);
            });
    }

    public static bool Broadcast(RunManager? runManager, ChallengeStateMessage state)
    {
        return RitsuLibSidecarTypedMessageRegistry.Broadcast(
            runManager,
            ChallengeState,
            state);
    }
}
```

发送方法返回 `false` 时，通常表示当前不是对应的 host/client 角色、没有 net service、peer 不支持 sidecar，或会话还没握手完成。不要在失败时无限重试；等待 reachability 事件或下一次状态变化再发。

## 请求和响应

需要“发一个请求，等一个回复”时，用 `RitsuLibSidecarRequestReply`。它会帮你注册等待者、处理超时，并在发送失败时释放等待者。

```csharp
using System.Buffers;
using System.IO;
using System.Text.Json;
using STS2RitsuLib.Networking.Sidecar;

namespace Test.Scripts.Sidecar;

public readonly record struct RulesetRequest(string RequestedBy);
public readonly record struct RulesetResponse(string RulesetId, int Revision);

public sealed class JsonSidecarCodec<T>(string key) : IRitsuLibSidecarMessageCodec<T>
    where T : notnull
{
    public ulong Opcode { get; } = RitsuLibSidecarOpcodes.For(Entry.ModId, key);

    public bool TryDecode(ReadOnlySpan<byte> input, out T? message)
    {
        message = JsonSerializer.Deserialize<T>(input);
        return message != null;
    }

    public void Encode(IBufferWriter<byte> writer, T message)
    {
        using var stream = new MemoryStream();
        JsonSerializer.Serialize(stream, message);
        writer.Write(stream.ToArray());
    }
}
```

客户端发请求：

```csharp
private static readonly JsonSidecarCodec<RulesetRequest> RulesetRequestCodec =
    new("ruleset_request_v1");

private static readonly JsonSidecarCodec<RulesetResponse> RulesetResponseCodec =
    new("ruleset_response_v1");

public static async Task<RulesetResponse> AskHostRulesetAsync(RunManager? runManager)
{
    var task = RitsuLibSidecarRequestReply.SendCorrelatedRequestToHostAsync(
        runManager,
        RulesetRequestCodec,
        RulesetResponseCodec,
        new RulesetRequest(Entry.ModId),
        timeout: TimeSpan.FromSeconds(5));

    return await task.ContinueOnGodotMainLoopAsync();
}
```

如果 `await` 后要操作 Godot 节点或场景树，接 `ContinueOnGodotMainLoopAsync()`。普通后台计算不需要切回主循环。

## 主机权威配置同步

对于“客户端请求改设置，主机判断能不能改，然后广播最新状态”的场景，可以直接用内置 config topic。

```csharp
using STS2RitsuLib.Networking.Sidecar;

namespace Test.Scripts.Sidecar;

public readonly record struct ChallengeSyncState(string ChallengeId, bool HardMode);
public readonly record struct ChallengeSyncDelta(string ChallengeId, bool? HardMode);

public static class TestSidecarConfigTopic
{
    private const string Topic = "test.challenge";

    public static void Register()
    {
        RitsuLibSidecarConfigSyncService.RegisterTopic(
            Topic,
            new ChallengeSyncState("standard", false),
            canClientRequest: (peerNetId, delta) => TestLobbyPermissions.CanVote(peerNetId, delta.ChallengeId),
            applyDelta: (state, delta) => state with
            {
                ChallengeId = delta.ChallengeId,
                HardMode = delta.HardMode ?? state.HardMode,
            });

        RitsuLibSidecarEvents.OnConfigTopicChanged(evt =>
        {
            if (evt.Topic != Topic)
                return;

            Entry.Logger.Info($"挑战配置更新 revision={evt.Revision}, reason={evt.Reason}");
        });
    }

    public static bool RequestChange(RunManager? runManager, ChallengeSyncDelta delta)
    {
        return RitsuLibSidecarConfigSyncService.TryRequestClientChange(
            runManager,
            Topic,
            delta,
            reason: "challenge_select");
    }
}
```

主机会应用 `applyDelta` 并广播 snapshot；客户端会收到 topic-change 事件。这个服务适合房间内配置、草稿规则、投票结果这类主机权威状态。

## 投递语义和线程

| 语义 | 适合场景 |
| - | - |
| `StableSync` | 需要可靠有序的状态同步、配置、请求/响应。typed message 默认用它。 |
| `BestEffort` | 可丢弃、会频繁刷新、下一帧还能覆盖的提示数据。 |
| `Unspecified` | 不写投递标签；发送 helper 会按 `StableSync` 处理。 |

Sidecar 接收回调不保证在 Godot 主线程。需要改节点、UI 或场景树时，用 `RitsuLibSidecarMessageBinding.RegisterForGodotMainLoop(...)`，或在 async helper 后接 `ContinueOnGodotMainLoopAsync()`。

## 什么时候用裸 envelope

只有在你要自己定义二进制 payload、header extension 或压缩策略时，才需要下探到 `RitsuLibSidecar.CreateEnvelopeWithDelivery(...)` 和 `RitsuLibSidecarHighLevelSend`。opcode 用 `RitsuLibSidecarOpcodes.For(Entry.ModId, "message_key_v1")` 生成，不要手写固定数字，避免和框架保留范围冲突。

## 验证

1. 双人联机进大厅，确认日志出现 `Sidecar session bound` 和 peer `Supported`。
2. 客户端发送 `ChallengeVoteMessage`，主机应收到 `ctx.IsHostIngest == true` 的消息。
3. 主机广播 `ChallengeStateMessage`，客户端应应用主机状态。
4. 让一个客户端缺少对应 Mod，确认 required capability 检查会警告或阻止开局。
5. 断线重连后再次发送消息，确认没有旧等待者或旧 UI 状态残留。
