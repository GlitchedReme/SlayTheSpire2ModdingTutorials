---
title: Lifecycle Events
date: 2026-05-16 23:27:19
permalink: en/docs/04-ritsulib/04-23-lifecycle-events/
author: alkaid616
categories:
- Basics
---
`RitsuLib` provides a lifecycle event system, allowing you to listen to events at various stages such as game startup, a single run, and combat.

## Subscription Methods

Subscribe in `Entry.Init`. Choose your preferred subscription style.

### Method 1: Lambda Subscription

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
            Logger.Info($"Game ready: {evt.Game}");
        });

        // To unsubscribe when no longer needed:
        // sub.Dispose();
    }
}
```

### Method 2: Interface Subscription

Implement `ILifecycleObserver` to handle multiple event types in a single class:

```csharp
using STS2RitsuLib;

namespace Test.Scripts;

public sealed class MyLifecycleObserver : ILifecycleObserver
{
    public void OnEvent(IFrameworkLifecycleEvent evt)
    {
        if (evt is CombatStartingEvent)
            Entry.Logger.Info("Combat is about to start");
        else if (evt is RunEndedEvent run)
            Entry.Logger.Info($"Run ended, victory={run.IsVictory}, abandoned={run.IsAbandoned}");
    }
}
```

Register in `Entry.Init`:

```csharp
RitsuLibFramework.SubscribeLifecycle(new MyLifecycleObserver());
```

## Common Events

* Below are common events categorized by game flow. Other events can be found by searching event names in the RitsuLib source code (typically in `*LifecycleContracts.cs` files under the `STS2RitsuLib` namespace).

* Each event carries an occurrence time `OccurredAtUtc`. If you subscribe after the event has already occurred, you will by default only receive new events thereafter.
* Set the second parameter `replayCurrentState` of `SubscribeLifecycle` to `true`, and some events will re-send the current state to you (e.g., subscribing to `GameReadyEvent` when the game is already ready will still immediately receive it once).

### Framework Events

| Event | Trigger Timing | Parameters |
| --- | --- | --- |
| `FrameworkInitializedEvent` | RitsuLib framework initialization complete | `FrameworkModId`, `IsActive` |
| `ProfileServicesInitializingEvent` | Save about to initialize | (timestamp only) |
| `ProfileServicesInitializedEvent` | Save initialization ready | `ProfileId` |

### Game Bootstrap Events

| Event | Trigger Timing | Parameters |
| --- | --- | --- |
| `EssentialInitializationStartingEvent` | Vanilla essential initialization beginning | (timestamp only) |
| `EssentialInitializationCompletedEvent` | Vanilla essential initialization complete | (timestamp only) |
| `DeferredInitializationStartingEvent` | Vanilla deferred initialization beginning | (timestamp only) |
| `DeferredInitializationCompletedEvent` | Vanilla deferred initialization complete | (timestamp only) |
| `ContentRegistrationClosedEvent` | `ModelDb.Init` freezes mod registration at start; do not register cards, characters, etc. after this | `Reason` |
| `ModelRegistryInitializingEvent` | Model registry about to be populated | (timestamp only) |
| `ModelRegistryInitializedEvent` | `ModelDb.Init` complete | `RegisteredModelTypeCount` |
| `ModelIdsInitializingEvent` | Model ID assignment beginning | (timestamp only) |
| `ModelIdsInitializedEvent` | `ModelDb.InitIds` complete; `ModelDb.GetId<T>()` is usable from here on | (timestamp only) |
| `ModelPreloadingStartingEvent` | Model preloading beginning | (timestamp only) |
| `ModelPreloadingCompletedEvent` | Model preloading complete | (timestamp only) |
| `GameTreeEnteredEvent` | Game root node `NGame` entered the scene tree | `Game` |
| `GameReadyEvent` | `NGame` ready | `Game` |

### In-Run Events

| Event | Trigger Timing | Parameters |
| --- | --- | --- |
| `RunStartedEvent` | A new run started | `RunState`, `IsMultiplayer`, `IsDaily` |
| `RunLoadedEvent` | Loaded from save and continuing a run | `RunState`, `IsMultiplayer`, `IsDaily` |
| `RunEndedEvent` | A run ended (victory, defeat, or abandoned) | `Run`, `IsVictory`, `IsAbandoned` |

### Room & Act Events

| Event | Trigger Timing | Parameters |
| --- | --- | --- |
| `RoomEnteringEvent` | About to enter a room | `RunState`, `Room` |
| `RoomEnteredEvent` | Entered a room | `RunState`, `Room` |
| `RoomExitedEvent` | Exited a room | `RunManager`, `Room` |
| `ActEnteringEvent` | Act transition beginning | `RunManager`, `TargetActIndex`, `DoTransition` |
| `ActEnteredEvent` | Act transition complete | `RunState`, `CurrentActIndex` |
| `RewardsScreenContinuingEvent` | Continue button clicked on rewards screen | `RunManager` |

### Combat Events

| Event | Trigger Timing | Parameters |
| --- | --- | --- |
| `CombatStartingEvent` | Combat about to begin | `RunState`, `CombatState` (may be null) |
| `CombatVictoryEvent` | Player won this combat | `RunState`, `CombatState`, `Room` |
| `CombatEndedEvent` | Combat ended | `RunState`, `CombatState`, `Room` |
| `SideTurnStartingEvent` | A side's (player or enemy) turn about to begin | `CombatState`, `Side` |
| `SideTurnStartedEvent` | That side's turn has begun | `CombatState`, `Side` |
| `CardPlayingEvent` | Card play effect resolving | `CombatState`, `CardPlay` |
| `CardPlayedEvent` | Card play effect resolution complete | `CombatState`, `CardPlay` |
| `CardDrawnEvent` | Card drawn | `CombatState`, `Card`, `FromHandDraw` |
| `CardDiscardedEvent` | Card discarded | `CombatState`, `Card` |
| `CardExhaustedEvent` | Card exhausted | `CombatState`, `Card`, `CausedByEthereal` |
| `CardMovedBetweenPilesEvent` | Card moved between piles | `RunState`, `CombatState`, `Card`, `PreviousPile`, `Source` |
| `BeforeFlushEvent` | End-of-turn about to resolve | `CombatState`, `Player` |
| `CardsFlushedEvent` | End-of-turn resolution complete | `CombatState`, `Player`, `FlushedCards`, `RetainedCards` |
| `CreatureDyingEvent` | Creature dying | `RunState`, `CombatState`, `Creature` |
| `CreatureDiedEvent` | Death determination complete; if `WasRemovalPrevented` is true, the creature may not have actually died | `RunState`, `CombatState`, `Creature`, `WasRemovalPrevented`, `DeathAnimationDurationSeconds` |

### Reward Events

| Event | Trigger Timing | Parameters |
| --- | --- | --- |
| `GoldGainedEvent` | Gold increased | `RunState`, `Player`, `GoldTotal` |
| `GoldLostEvent` | Gold decreased | `Player`, `Amount`, `LossType`, `GoldTotal` |
| `RelicObtainedEvent` | Relic obtained | `Player`, `Relic` |
| `RelicRemovedEvent` | Relic removed | `Player`, `Relic` |
| `PotionProcuredEvent` | Potion entered potion bar | `RunState`, `CombatState`, `Potion` |
| `PotionDiscardedEvent` | Potion removed from potion bar | `RunState`, `CombatState`, `Potion` |
| `RewardTakenEvent` | Player selected a reward | `RunState`, `Player`, `Reward` |

### Unlock Events

| Event | Trigger Timing | Parameters |
| --- | --- | --- |
| `EpochObtainedEvent` | A new epoch obtained (not unlocked) | `SaveManager`, `EpochId` |
| `EpochRevealedEvent` | Epoch revealed (unlocked) | `SaveManager`, `EpochId`, `IsDebug` |
| `UnlockIncrementedEvent` | Unlock count increased (e.g., after a run ends) | `SaveManager`, `TotalUnlocks`, `PendingEpochId` |

### Save Events

| Event | Trigger Timing | Parameters |
| --- | --- | --- |
| `ProfileIdInitializedEvent` | Save initialization complete | `SaveManager`, `ProfileId` |
| `ProfileSwitchingEvent` | About to switch save | `PreviousProfileId`, `NextProfileId` |
| `ProfileSwitchedEvent` | Save switch complete | `PreviousProfileId`, `CurrentProfileId` |
| `RunSavingEvent` | About to write run save | `SaveManager`, `PreFinishedRoom`, `SaveProgress` |
| `RunSavedEvent` | Run save written | `SaveManager`, `PreFinishedRoom`, `SaveProgress` |
| `ProgressSavingEvent` | About to write overall progress save | `SaveManager`, `ProfileId` |
| `ProgressSavedEvent` | Overall progress save written | `SaveManager`, `ProfileId` |
| `ProfileDeletingEvent` | About to delete save | `SaveManager`, `ProfileId` |
| `ProfileDeletedEvent` | Save deleted | `SaveManager`, `ProfileId` |
| `ProfileDataReadyEvent` | Current save's mod save path is ready; `ModDataStore` can be read/written | `ProfileId`, `IsInitialReady`, `IsProfileSwitch`, `DataReloaded` |
| `ProfileDataChangedEvent` | Profile switch caused mod data context change | `OldProfileId`, `NewProfileId` |
| `ProfileDataInvalidatedEvent` | Profile deletion etc. caused mod data context invalidation | `ProfileId`, `Reason` |
