---
title: 生命周期事件
date: 2026-05-16 23:27:19
permalink: docs/04-ritsulib/04-23-lifecycle-events/
author: alkaid616
categories:
- Basics
---
`RitsuLib`提供了一套生命周期事件系统，可以在游戏启动、一局游戏、战斗等各个阶段监听事件。

## 订阅方式

在 `Entry.Init` 中订阅。选择你喜欢的方式订阅。

### 方式一：lambda订阅

```csharp
using MegaCrit.Sts2.Core.Logging;
using MegaCrit.Sts2.Core.Modding;
using STS2RitsuLib;

namespace Test.Scripts;

[ModInitializer(nameof(Init))]
public class Entry
{
    public const string ModId = "Test";
    public static readonly Logger Logger = RitsuLibFramework.CreateLogger(ModId);

    public static void Init()
    {
        var sub = RitsuLibFramework.SubscribeLifecycle<GameReadyEvent>(evt =>
        {
            Logger.Info($"游戏已就绪：{evt.Game}");
        });

        // 若不再需要监听，可取消订阅：
        // sub.Dispose();
    }
}
```

### 方式二：接口订阅

实现 `ILifecycleObserver` 以在一个类型里处理多种事件：

```csharp
using STS2RitsuLib;

namespace Test.Scripts;

public sealed class MyLifecycleObserver : ILifecycleObserver
{
    public void OnEvent(IFrameworkLifecycleEvent evt)
    {
        if (evt is CombatStartingEvent)
            Entry.Logger.Info("战斗即将开始");
        else if (evt is RunEndedEvent run)
            Entry.Logger.Info($"一局游戏结束，胜利={run.IsVictory}，放弃={run.IsAbandoned}");
    }
}
```

在 `Entry.Init` 中注册：

```csharp
RitsuLibFramework.SubscribeLifecycle(new MyLifecycleObserver());
```

## 常用事件

* 下面按游戏流程分类列出常用事件。其他事件可以在RitsuLib源码里搜事件名查看（一般在 `STS2RitsuLib` 命名空间下的 `*LifecycleContracts.cs` 文件）。

* 每个事件都会带一个发生时间 `OccurredAtUtc`。如果你在事件已经发生之后才订阅，默认只会收到之后的新事件。
* 把 `SubscribeLifecycle` 的第二个参数 `replayCurrentState` 设为 `true`，部分事件会把当前状态再发给你一次（例如游戏已经就绪时订阅 `GameReadyEvent`，仍会立刻收到一次）。

### 框架事件

| 事件 | 触发时机 | 参数 |
| --- | --- | --- |
| `FrameworkInitializedEvent` | RitsuLib 框架初始化完成 | `FrameworkModId`、`IsActive` |
| `ProfileServicesInitializingEvent` | 存档即将初始化 | （仅时间戳） |
| `ProfileServicesInitializedEvent` | 存档初始化已就绪 | `ProfileId` |

### 游戏引导事件

| 事件 | 触发时机 | 参数 |
| --- | --- | --- |
| `EssentialInitializationStartingEvent` | 原版必要初始化开始 | （仅时间戳） |
| `EssentialInitializationCompletedEvent` | 原版必要初始化完成 | （仅时间戳） |
| `DeferredInitializationStartingEvent` | 原版延迟初始化开始 | （仅时间戳） |
| `DeferredInitializationCompletedEvent` | 原版延迟初始化完成 | （仅时间戳） |
| `ContentRegistrationClosedEvent` | `ModelDb.Init` 开始时冻结 mod 注册，之后不要再注册卡牌、人物等 | `Reason` |
| `ModelRegistryInitializingEvent` | 模型注册表即将填充 | （仅时间戳） |
| `ModelRegistryInitializedEvent` | `ModelDb.Init` 完成 | `RegisteredModelTypeCount` |
| `ModelIdsInitializingEvent` | 模型 ID 分配开始 | （仅时间戳） |
| `ModelIdsInitializedEvent` | `ModelDb.InitIds` 完成，此后可用 `ModelDb.GetId<T>()` | （仅时间戳） |
| `ModelPreloadingStartingEvent` | 模型预加载开始 | （仅时间戳） |
| `ModelPreloadingCompletedEvent` | 模型预加载完成 | （仅时间戳） |
| `GameTreeEnteredEvent` | 游戏根节点 `NGame` 进入场景树 | `Game` |
| `GameReadyEvent` | `NGame` 就绪 | `Game` |

### 局内游戏事件

| 事件 | 触发时机 | 参数 |
| --- | --- | --- |
| `RunStartedEvent` | 新开一局 | `RunState`、`IsMultiplayer`、`IsDaily` |
| `RunLoadedEvent` | 从存档读入并继续一局 | `RunState`、`IsMultiplayer`、`IsDaily` |
| `RunEndedEvent` | 一局游戏结束（胜、败或放弃） | `Run`、`IsVictory`、`IsAbandoned` |

### 房间与章节事件

| 事件 | 触发时机 | 参数 |
| --- | --- | --- |
| `RoomEnteringEvent` | 即将进入房间 | `RunState`、`Room` |
| `RoomEnteredEvent` | 已进入房间 | `RunState`、`Room` |
| `RoomExitedEvent` | 离开房间 | `RunManager`、`Room` |
| `ActEnteringEvent` | 章节切换开始 | `RunManager`、`TargetActIndex`、`DoTransition` |
| `ActEnteredEvent` | 章节切换完成 | `RunState`、`CurrentActIndex` |
| `RewardsScreenContinuingEvent` | 奖励界面点继续 | `RunManager` |

### 战斗事件

| 事件 | 触发时机 | 参数 |
| --- | --- | --- |
| `CombatStartingEvent` | 战斗即将开始 | `RunState`、`CombatState`（可为 null） |
| `CombatVictoryEvent` | 玩家打赢本场战斗 | `RunState`、`CombatState`、`Room` |
| `CombatEndedEvent` | 战斗结束 | `RunState`、`CombatState`、`Room` |
| `SideTurnStartingEvent` | 玩家方或敌方某一方的回合即将开始 | `CombatState`、`Side` |
| `SideTurnStartedEvent` | 该方回合已开始 | `CombatState`、`Side` |
| `CardPlayingEvent` | 卡牌打出效果正在结算 | `CombatState`、`CardPlay` |
| `CardPlayedEvent` | 卡牌打出效果结算完毕 | `CombatState`、`CardPlay` |
| `CardDrawnEvent` | 抽到牌 | `CombatState`、`Card`、`FromHandDraw` |
| `CardDiscardedEvent` | 弃牌 | `CombatState`、`Card` |
| `CardExhaustedEvent` | 消耗 | `CombatState`、`Card`、`CausedByEthereal` |
| `CardMovedBetweenPilesEvent` | 牌在牌堆之间移动 | `RunState`、`CombatState`、`Card`、`PreviousPile`、`Source` |
| `BeforeFlushEvent` | 回合末即将结算 | `CombatState`、`Player` |
| `CardsFlushedEvent` | 回合末结算完成 | `CombatState`、`Player`、`FlushedCards`、`RetainedCards` |
| `CreatureDyingEvent` | 生物濒死 | `RunState`、`CombatState`、`Creature` |
| `CreatureDiedEvent` | 死亡判定结束；若 `WasRemovalPrevented` 为 true，可能没真正死亡 | `RunState`、`CombatState`、`Creature`、`WasRemovalPrevented`、`DeathAnimationDurationSeconds` |

### 奖励事件

| 事件 | 触发时机 | 参数 |
| --- | --- | --- |
| `GoldGainedEvent` | 金币增加 | `RunState`、`Player`、`GoldTotal` |
| `GoldLostEvent` | 金币减少 | `Player`、`Amount`、`LossType`、`GoldTotal` |
| `RelicObtainedEvent` | 获得遗物 | `Player`、`Relic` |
| `RelicRemovedEvent` | 失去遗物 | `Player`、`Relic` |
| `PotionProcuredEvent` | 药水进入药水栏 | `RunState`、`CombatState`、`Potion` |
| `PotionDiscardedEvent` | 药水从药水栏移除 | `RunState`、`CombatState`、`Potion` |
| `RewardTakenEvent` | 玩家选取一项奖励 | `RunState`、`Player`、`Reward` |

### 解锁事件

| 事件 | 触发时机 | 参数 |
| --- | --- | --- |
| `EpochObtainedEvent` | 获得新的时期（非解锁） | `SaveManager`、`EpochId` |
| `EpochRevealedEvent` | 时期被揭露（解锁） | `SaveManager`、`EpochId`、`IsDebug` |
| `UnlockIncrementedEvent` | 解锁计数增加（例如一局结束后） | `SaveManager`、`TotalUnlocks`、`PendingEpochId` |

### 存档事件

| 事件 | 触发时机 | 参数 |
| --- | --- | --- |
| `ProfileIdInitializedEvent` | 存档初始化完成 | `SaveManager`、`ProfileId` |
| `ProfileSwitchingEvent` | 即将切换存档 | `PreviousProfileId`、`NextProfileId` |
| `ProfileSwitchedEvent` | 存档已切换完成 | `PreviousProfileId`、`CurrentProfileId` |
| `RunSavingEvent` | 即将写入本局存档 | `SaveManager`、`PreFinishedRoom`、`SaveProgress` |
| `RunSavedEvent` | 本局存档已写入 | `SaveManager`、`PreFinishedRoom`、`SaveProgress` |
| `ProgressSavingEvent` | 即将写入总进度存档 | `SaveManager`、`ProfileId` |
| `ProgressSavedEvent` | 总进度存档已写入 | `SaveManager`、`ProfileId` |
| `ProfileDeletingEvent` | 即将删除存档 | `SaveManager`、`ProfileId` |
| `ProfileDeletedEvent` | 存档已删除 | `SaveManager`、`ProfileId` |
| `ProfileDataReadyEvent` | 当前存档的 mod 存档路径就绪，可读写 `ModDataStore` | `ProfileId`、`IsInitialReady`、`IsProfileSwitch`、`DataReloaded` |
| `ProfileDataChangedEvent` | 换档导致 mod 数据上下文变化 | `OldProfileId`、`NewProfileId` |
| `ProfileDataInvalidatedEvent` | 删档等导致 mod 数据上下文失效 | `ProfileId`、`Reason` |
