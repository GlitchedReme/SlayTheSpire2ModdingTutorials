---
title: 网络与联机
date: 2026-08-13 22:41:58
permalink: docs/04-ritsulib/04-31-network-multiplayer/
categories:
- Basics
---
杀戮尖塔2 支持最多 4 人联机。联机时游戏用**主机-客户端**模型：主机持有权威状态，客户端发请求，主机裁决后再广播结果。你的 mod 如果想要在联机时跨玩家通信（比如给队友发通知、同步自定义数据、执行跨端效果），就需要用到网络 API。

本章先讲清楚游戏原版是怎么同步的，再介绍 RitsuLib 提供的两个网络工具，最后给出选型建议。

> 联机相关的数据持久化（大厅暂存、跑局数据同步）见`局内数据`章节，本章专注实时通信。

## 原版网络同步过程

### 网络模型

游戏用 `NetGameType` 表示当前网络状态：

| 值 | 含义 |
| - | - |
| `None` | 无网络 |
| `Singleplayer` | 单机 |
| `Host` | 联机主机（创建房间） |
| `Client` | 联机客户端（加入房间） |
| `Replay` | 回放 |

网络入口是 `INetGameService`，通过 `RunManager.Instance.NetService` 获取。它提供：

```csharp
public interface INetGameService
{
    ulong NetId { get; }                    // 本机网络ID
    bool IsConnected { get; }
    bool IsGameLoading { get; }
    NetGameType Type { get; }               // 当前网络类型
    event Action<NetErrorInfo>? Disconnected;
    void SendMessage<T>(T message, ulong playerId) where T : INetMessage; // 发给指定玩家
    void SendMessage<T>(T message) where T : INetMessage;                 // 广播
    void RegisterMessageHandler<T>(MessageHandlerDelegate<T> handler) where T : INetMessage;
    void UnregisterMessageHandler<T>(...) where T : INetMessage;
}
```

### 动作队列同步（ActionQueueSynchronizer）

多人下所有玩家看到的游戏状态必须**完全一致**。如果两个玩家同时打出卡牌，效果执行的先后顺序不一致，两边的状态就会分叉。所以游戏把所有动作放进一个统一的**动作队列**（`ActionQueueSynchronizer`），按确定顺序执行。

流程如下：

```
客户端                             主机
  │  打出卡牌                       │
  │── RequestEnqueueActionMessage →│  收到请求，校验
  │    (INetMessage)               │  动作入队
  │←── ActionEnqueuedMessage ───── │  回发确认
  │   (INetMessage)                │
  │  确认后才真正执行效果             │  主机自己执行
```

- 客户端**不能**直接执行动作，必须先把 `RequestEnqueueActionMessage` 发给主机
- 主机收到后检查自己是不是 Host（不是就拒绝），把动作加入队列，回发 `ActionEnqueuedMessage`
- 客户端收到确认后才执行，保证两端顺序一致

发送的消息不是立即投递，而是经过 `RunLocationTargetedMessageBuffer`（按场景/位置缓冲），保证延迟动作在正确的场景重放。

## RitsuLib 网络工具一：Sidecar（消息通信）

Sidecar 是 RitsuLib 提供的类型化消息通道：你定义一个消息类型 + 序列化方式，RitsuLib 帮你搞定 opcode、注册表和底层 `INetMessage`，你只管收发。

### 定义消息

消息就是普通的 record/class：

```csharp
public record struct MyPingMessage(string Text, int Number);
```

### 定义描述符

`RitsuLibSidecarMessageDescriptor<T>` 描述一条消息：模块 ID + 消息键 + 序列化/反序列化委托。

```csharp
using System.Text.Json;
using STS2RitsuLib.Networking.Sidecar;

private static readonly RitsuLibSidecarMessageDescriptor<MyPingMessage> PingDescriptor = new(
    ModuleId: Entry.ModId,        // 你的 mod id，opcode 的一部分
    MessageKey: "my_ping",           // 消息键，同 mod 内唯一
    Serialize: static msg => JsonSerializer.SerializeToUtf8Bytes(msg),
    Deserialize: static bytes => JsonSerializer.Deserialize<MyPingMessage>(bytes),
    Delivery: RitsuLibSidecarDeliverySemantics.StableSync); // 默认 StableSync，可省略
```

`ModuleId + MessageKey` 会生成一个稳定 opcode（`RitsuLibSidecarOpcodes.For`）。不同 mod 用不同 ModuleId 就不会冲突。

### 订阅接收

```csharp
// 返回 IDisposable，释放即退订
private static IDisposable? _pingSubscription;

// 在你的初始化函数里调用这个，例如Init()
_pingSubscription ??= RitsuLibSidecarTypedMessageRegistry.Subscribe(PingDescriptor, OnPingReceived);

private static void OnPingReceived(RitsuLibSidecarTypedDispatchContext<MyPingMessage> context)
{
    // context.Message      消息内容
    // context.SenderNetId  发送者网络ID
    // context.TransferMode 传输模式
    // context.Channel      通道
    // context.IsHostIngest 是否是主机收到的客户端消息
    Entry.Logger.Info($"[Ping] from {context.SenderNetId}: {context.Message.Text}");
}
```

### 发送

```csharp
using MegaCrit.Sts2.Core.Runs;

// 客户端 → 主机
RitsuLibSidecarTypedMessageRegistry.SendToHost(RunManager.Instance, PingDescriptor, new("hello", 1));

// 主机 → 指定玩家
RitsuLibSidecarTypedMessageRegistry.SendToPeer(
    RunManager.Instance.NetService, peerNetId, PingDescriptor, new("hi", 2));

// 主机广播给所有对端
RitsuLibSidecarTypedMessageRegistry.Broadcast(RunManager.Instance, PingDescriptor, new("all", 3));
```

每个发送方法都有 `INetGameService` 和 `RunManager` 两个重载，任选其一。

### 投递语义

| 值 | 含义 |
| - | - |
| `BestEffort` | 不可靠传输（可能丢帧/乱序），性能好 |
| `StableSync` | 可靠传输（默认），不丢不重 |

### 实际例子：皮肤同步

联机时把玩家选择的皮肤同步给所有队友。

核心逻辑：客户端把自己的皮肤发给主机，主机收到后转发广播给其他队友，每个人收到后应用。

```csharp
using System.Text.Json;
using MegaCrit.Sts2.Core.Multiplayer.Game;
using MegaCrit.Sts2.Core.Runs;
using STS2RitsuLib.Networking.Sidecar;

public static class SkinSync
{
    // 本机当前选择的皮肤（换成你自己的实际存储）
    public static string MySkinKey = "default";

    // 远端玩家的皮肤缓存：NetId -> 皮肤
    public static readonly Dictionary<ulong, string> RemoteSkins = [];

    // 消息：谁 + 哪个皮肤
    public record SkinSyncMessage(ulong NetId, string SkinKey);

    private static readonly RitsuLibSidecarMessageDescriptor<SkinSyncMessage> SkinSyncDescriptor = new(
        ModuleId: Entry.ModId,
        MessageKey: "skin_sync_v1",
        Serialize: static msg => JsonSerializer.SerializeToUtf8Bytes(msg),
        Deserialize: static bytes => JsonSerializer.Deserialize<SkinSyncMessage>(bytes)!,
        Delivery: RitsuLibSidecarDeliverySemantics.StableSync);

    private static IDisposable? _subscription;

    // 在 Entry.Init 里调用一次
    public static void Init()
    {
        _subscription ??= RitsuLibSidecarTypedMessageRegistry.Subscribe(SkinSyncDescriptor, OnSkinSyncReceived);
    }

    // 开局 / 换肤 / 读档时调用：把自己的皮肤同步出去
    public static void SendSkinSync()
    {
        var netService = RunManager.Instance?.NetService;
        if (netService == null)
            return;

        var msg = new SkinSyncMessage(netService.NetId, MySkinKey);

        // 客户端 → 主机；主机/单机 → 广播
        switch (netService.Type)
        {
            case NetGameType.Client:
                RitsuLibSidecarTypedMessageRegistry.SendToHost(netService, SkinSyncDescriptor, msg);
                break;
            default: // Host / Singleplayer
                RitsuLibSidecarTypedMessageRegistry.Broadcast(netService, SkinSyncDescriptor, msg);
                break;
        }
    }

    private static void OnSkinSyncReceived(RitsuLibSidecarTypedDispatchContext<SkinSyncMessage> context)
    {
        // 记下远端玩家选的皮肤
        RemoteSkins[context.Message.NetId] = context.Message.SkinKey;

        // 主机收到客户端的皮肤后，转发给其他队友（这样所有人都有）
        if (context.IsHostIngest && context.Message.NetId != context.SenderNetId)
        {
            RitsuLibSidecarTypedMessageRegistry.Broadcast(
                RunManager.Instance?.NetService, SkinSyncDescriptor, context.Message);
        }

        // 应用皮肤（换成你的实际逻辑）
        ApplySkin(context.Message.NetId, context.Message.SkinKey);
    }

    private static void ApplySkin(ulong netId, string skinKey)
    {
        // 根据 netId 找到对应玩家角色并套用皮肤
    }
}
```

要点：

- **谁发**：客户端发给主机，主机/单机直接广播
- **谁收**：所有端订阅同一条消息，收到就记入 `RemoteSkins` 并应用
- **主机转发**：客户端→主机的消息在主机上 `IsHostIngest == true`，主机再广播给其他队友，保证全员一致
- **消息内容最小化**：只传 `NetId + SkinKey`，不含大对象，符合 64KB 限制

## RitsuLib 网络工具二：ManagedNetAction（动作队列）

Sidecar 是即时消息——收到就回调，**不保证**按游戏动作顺序执行。如果你的跨端效果需要和其他动作（出牌、结算）按同一顺序、同一确定性执行（且能被回放记录），用 ManagedNetAction。

它把自定义动作伪装成原版 `GameAction`，塞进原版动作队列：客户端通过原版 `RequestEnqueueActionMessage` 链路请求，主机裁决后入队，所有玩家按同一顺序执行。

### 定义描述符

`RitsuLibManagedNetActionDescriptor<T>` 比 Sidecar 多一个 `ActionType` 和一个执行委托：

```csharp
using MegaCrit.Sts2.Core.Entities.Multiplayer; // GameActionType
using STS2RitsuLib.Networking.ManagedActions;

private static readonly RitsuLibManagedNetActionDescriptor<MyPingMessage> PingActionDescriptor = new(
    ModuleId: Entry.ModId,
    ActionKey: "ping_action",
    Serialize: static msg => JsonSerializer.SerializeToUtf8Bytes(msg),
    Deserialize: static bytes => JsonSerializer.Deserialize<MyPingMessage>(bytes),
    Execute: ExecutePingActionAsync,
    ActionType: GameActionType.Any);   // 必填
```

`ActionType` 决定动作在什么时机可执行：

| 值 | 含义 |
| - | - |
| `Combat` | 战斗内执行；战斗结束或不在战斗时入队会被取消 |
| `CombatPlayPhaseOnly` | 只在玩家出牌阶段执行；否则延迟到本地玩家出牌阶段 |
| `NonCombat` | 非战斗执行；战斗期间排到队首会等到战斗结束 |
| `Any` | 任何时候都能执行（默认选择） |

### 执行逻辑

执行委托接收 `RitsuLibManagedNetActionContext<T>`，里面有动作所属玩家和可用的选择上下文：

```csharp
private static async Task ExecutePingActionAsync(RitsuLibManagedNetActionContext<MyPingMessage> context)
{
    // context.Message               消息内容
    // context.Player               拥有该动作的玩家
    // context.Action               底层队列动作
    // context.PlayerChoiceContext  可用选择上下文（可传给命令API）
    Entry.Logger.Info($"[ManagedPing] {context.Player.NetId}: {context.Message.Text}");
    await Task.CompletedTask;
}
```

### 注册与请求

```csharp
// 在你的初始化函数里调用这个，例如Init()
RitsuLibManagedNetActions.Register(PingActionDescriptor);

// 请求执行：客户端发起，走原版动作队列
bool queued = RitsuLibManagedNetActions.Request(
    RunManager.Instance,
    PingActionDescriptor,
    new("hello", 1));
```

> `Request` 返回 `true` 只代表**入队请求已发出**，不代表执行成功。且 `ownerNetId` 参数（省略时用本机）只能是本机 ID，不能替别人请求。

### 限制

| 项 | 值 |
| - | - |
| 单个载荷上限 | 64 KB |
| `Request` 返回语义 | 只表示入队成功 |
| `ownerNetId` | 只能传本机 ID |

## 选型建议

| 场景 | 用哪个 |
| - | - |
| 判断是否联机、我是谁、玩家数 | 直接读 `INetGameService` 属性（`Type`/`NetId`），不需要通信 |
| 传任意数据给队友/主机（通知、UI、自定义配置） | **Sidecar** |
| 跨端执行需要按动作队列同步、可回放的效果（卡牌、药水同类型） | **ManagedNetAction** |
