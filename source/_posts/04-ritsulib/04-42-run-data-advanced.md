---
title: 跑局数据进阶
date: 2026-05-25 23:41:55
permalink: docs/04-ritsulib/04-42-run-data-advanced/
author: alkaid616
categories:
- Basics
---
这一章只补充 `RunSavedData` 的进阶用法：开局大厅暂存、多人同步、写入策略、schema 迁移和提交时机。普通“把跑局字段保存起来”的最小例子已经在数据持久化一章讲过，这里直接从完整跑局配置开始。

## 注册两个槽位

跑局数据仍然放在 `BeginModDataRegistration` 批处理中注册。共享配置用 `RunSavedData<T>`，按玩家分桶的数据用 `PlayerRunSavedData<T>`。

```csharp
using STS2RitsuLib;
using STS2RitsuLib.RunData;

namespace Test.Scripts.RunData;

public sealed class ChallengeRunState
{
    public string? ChallengeId { get; set; }
    public int ElitesKilled { get; set; }
    public bool HardMode { get; set; }
}

public sealed class PlayerRunState
{
    public string? LoadoutId { get; set; }
    public int DraftRerolls { get; set; }
}

public static class TestRunData
{
    public static RunSavedData<ChallengeRunState> Challenge = null!;
    public static PlayerRunSavedData<PlayerRunState> Player = null!;

    public static void Register()
    {
        using (RitsuLibFramework.BeginModDataRegistration(Entry.ModId))
        {
            var store = RitsuLibFramework.GetRunSavedDataStore(Entry.ModId);

            Challenge = store.Register(
                key: "challenge",
                defaultFactory: () => new ChallengeRunState(),
                options: new RunSavedDataOptions
                {
                    WritePolicy = RunSavedDataWritePolicy.WhenNonDefault,
                    SyncLobbyOnChange = true,
                });

            Player = store.RegisterPerPlayer(
                key: "player",
                defaultFactory: () => new PlayerRunState(),
                options: new RunSavedDataOptions
                {
                    WritePolicy = RunSavedDataWritePolicy.WhenSet,
                    SyncLobbyOnChange = true,
                });
        }
    }
}
```

`key` 会进入跑局快照，发布后不要改名。需要新增字段时优先在 class 里加可空属性或默认值，而不是换一个新槽位。`RunSavedData<T>` 的值由主机大厅贡献写入；`PlayerRunSavedData<T>` 会按 `NetId` 存成多个玩家条目。

## 写入大厅暂存

开局前选择的挑战、加载包、草稿限制等数据，不要先写到全局或 profile 保存里再复制。直接写对应句柄的 `Lobby` scope，RitsuLib 会在真正开局时把暂存数据提交进 run snapshot。

```csharp
using MegaCrit.Sts2.Core.Multiplayer.Game.Lobby;
using STS2RitsuLib.RunData;

namespace Test.Scripts.RunData;

public static class TestLobbyRunData
{
    public static void SelectChallenge(StartRunLobby lobby, string challengeId, bool hardMode)
    {
        TestRunData.Challenge.Lobby.Modify(lobby, data =>
        {
            data.ChallengeId = challengeId;
            data.HardMode = hardMode;
        });
    }

    public static void SelectLocalLoadout(StartRunLobby lobby, string loadoutId)
    {
        TestRunData.Player.Lobby.Modify(lobby, lobby.NetService.NetId, data =>
        {
            data.LoadoutId = loadoutId;
        });
    }
}
```

当槽位开启 `SyncLobbyOnChange` 时，`Lobby.Set` 和 `Lobby.Modify` 会调用 `RunSavedDataLobby.TryPushContribution(lobby)`。在多人大厅里，RitsuLib 会复用原版大厅消息尾部把当前机器贡献推给主机；单人和主机本机会直接合并到本地 session。这个流程只适合“开局前要进入跑局快照”的数据，不需要 Sidecar。

如果你一次改了多个控件，并且想在最后再通知预览 UI，可以显式发布一次暂存事件：

```csharp
RunSavedDataLobby.NotifyStagingChanged(lobby);
RunSavedDataLobby.TryPushContribution(lobby);
```

## 在跑局里修改

跑局开始后，使用 `RunState` 或 `Player` 修改已提交的数据。`Modify` 会把槽位标记为 dirty，符合写入策略时会随跑局保存一起导出。

```csharp
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Runs;

namespace Test.Scripts.RunData;

public static class TestRunCounters
{
    public static void RecordEliteKilled(RunState runState)
    {
        TestRunData.Challenge.Modify(runState, data =>
        {
            data.ElitesKilled++;
        });
    }

    public static void SpendDraftReroll(Player player)
    {
        TestRunData.Player.Modify(player, data =>
        {
            data.DraftRerolls++;
        });
    }
}
```

如果只是读取已有数据，不想因为读取而创建默认值，用 `TryGet`。这在判断旧存档是否真的带有某个槽位时很有用。

## 监听提交时机

`RunSavedDataLobbyStagingEvent` 用来驱动大厅 UI 预览，`RunSavedDataPreparingEvent` 用来在 run snapshot 导出前补齐最终值。

```csharp
using STS2RitsuLib;
using STS2RitsuLib.RunData;

namespace Test.Scripts.RunData;

public static class TestRunDataEvents
{
    public static void RegisterEvents()
    {
        RitsuLibFramework.SubscribeLifecycle<RunSavedDataLobbyStagingEvent>(evt =>
        {
            if (evt.IsHost && evt.Reason == RunSavedDataLobbyStagingReason.ContributionMerged)
                Entry.Logger.Info("大厅跑局数据已合并，可以刷新预览。");
        });

        RitsuLibFramework.SubscribeLifecycle<RunSavedDataPreparingEvent>(evt =>
        {
            TestRunData.Challenge.Modify(evt.RunState, data =>
            {
                data.ChallengeId ??= "standard";
            });
        });
    }
}
```

`RunSavedDataLobbyStagingReason` 常见值如下：

| 值 | 何时出现 |
| - | - |
| `ContributionMerged` | 主机合并了本地或远端玩家贡献。 |
| `PlayerJoined` | 新玩家进入大厅，RitsuLib 给 session 补玩家槽。 |
| `Manual` | 你调用了 `RunSavedDataLobby.NotifyStagingChanged(lobby)`。 |
| `Committing` | 主机即将构建新开局快照。 |

## 选择写入策略

| 策略 | 适合场景 |
| - | - |
| `WhenSet` | 默认选择。只有通过 `Set` 或 `Modify` 显式改过的值才写入。 |
| `WhenNonDefault` | 默认对象可以被反复读取，但只有和默认值不同才进存档。适合挑战开关、计数器。 |
| `AlwaysWhenRegistered` | 只要槽位能解析就写入。适合每局都必须带 schema 的控制数据。 |

`WhenNonDefault` 会把当前值和 `defaultFactory` 创建的新对象序列化后比较，所以默认工厂要稳定，不要放随机数、时间戳或运行时对象引用。

## 给槽位加迁移

`RunSavedDataOptions.SchemaVersion` 写进每个槽位。旧版本读入时，RitsuLib 会按 `IMigration.FromVersion` 找迁移，直到升级到当前版本。

```csharp
using System.Text.Json.Nodes;
using STS2RitsuLib.Utils.Persistence.Migration;

namespace Test.Scripts.RunData;

public sealed class ChallengeV1ToV2Migration : IMigration
{
    public int FromVersion => 1;
    public int ToVersion => 2;

    public bool Migrate(JsonObject data)
    {
        if (data["data"] is not JsonObject payload)
            return false;

        payload["hardMode"] ??= false;
        return true;
    }
}
```

注册时挂到同一个槽位：

```csharp
Challenge = store.Register(
    key: "challenge",
    defaultFactory: () => new ChallengeRunState(),
    options: new RunSavedDataOptions
    {
        SchemaVersion = 2,
        WritePolicy = RunSavedDataWritePolicy.WhenNonDefault,
        SyncLobbyOnChange = true,
        Migrations = new[] { new ChallengeV1ToV2Migration() },
    });
```

迁移操作的是槽位 JSON 包装对象：共享槽位的实际数据在 `data["data"]`，玩家槽位的实际数据在 `data["players"]`。迁移失败时该槽位不会导入，日志里会出现 `RunSavedData` 警告。

## 多人联机注意点

共享槽位只接受主机 net id 的贡献。客户端如果需要提交自己的选择，应写 `PlayerRunSavedData<T>`，并用本机 `lobby.NetService.NetId` 作为玩家 key。主机开始跑局时提交权威快照，之后所有玩家通过跑局存档和重连恢复同一份数据。

不要把临时 UI 状态、调试面板状态或账号设置塞进 RunSavedData。它会进入 run snapshot，并跟随存档、读档和联机同步流转；只保存“这局本身的一部分”。

## 验证

本地可以按这个顺序测：

1. 在大厅选择挑战和玩家 loadout，确认 `RunSavedDataLobbyStagingEvent` 会触发。
2. 开局后读取 `Challenge.TryGet(runState, out var challenge)`，确认大厅值已经提交。
3. 打一场精英后保存、退出、读档，确认 `ElitesKilled` 保留。
4. 双人联机时让客户端改 loadout，主机收到 `ContributionMerged` 后开局，确认各自 `NetId` 下的数据不同。
5. 临时改一次 `key` 或降低 `SchemaVersion`，确认旧存档无法读到该槽位；再改回稳定值。
