`RitsuLib` provides `RunSavedData` and `PlayerRunSavedData` to help you implement in-run data persistence, and also comes with built-in **lobby staging** and **multiplayer sync** support.

This feature is suitable for global configuration within a single run. If you need per-combat data saving, `SavedAttachedState` and `SavedProperty` are more appropriate.

---

## Defining the Data Structure

First, we need to create a class to hold the data.
Depending on the scope, there are two cases:
- **Globally shared** (`RunSavedData<T>`): data shared by the entire team. For example, the run's difficulty, total elites killed.
- **Per-player** (`PlayerRunSavedData<T>`): data calculated separately per player. For example, in multiplayer, which card pack player 1 chose vs. player 2.

```csharp
namespace Test.Scripts.RunData;

// Globally shared
public sealed class ChallengeRunState
{
    public string? ChallengeId { get; set; }
    public int ElitesKilled { get; set; }
    public bool HardMode { get; set; }
}

// Per-player data
public sealed class PlayerRunState
{
    public string? LoadoutId { get; set; }
    public int DraftRerolls { get; set; }
}
```

---

## Registering the Data Slot

For convenient access later, we can store the handle returned by registration as a static variable.

```csharp
using MegaCrit.Sts2.Core.Modding;
using STS2RitsuLib;
using STS2RitsuLib.RunData;

namespace Test.Scripts.RunData;

[ModInitializer(nameof(Init))]
public static class Entry
{
    public const string ModId = "test";
    // Global data handle
    public static RunSavedData<ChallengeRunState> Challenge = null!;
    // Player data handle
    public static PlayerRunSavedData<PlayerRunState> Player = null!;

    public static void Init()
    {
        using (RitsuLibFramework.BeginModDataRegistration(ModId))
        {
            var store = RitsuLibFramework.GetRunSavedDataStore(ModId);

            // Register globally shared configuration
            Challenge = store.Register(
                key: "challenge",
                defaultFactory: () => new ChallengeRunState(),
                options: new RunSavedDataOptions
                {
                    WritePolicy = RunSavedDataWritePolicy.WhenNonDefault,
                    SyncLobbyOnChange = true, // Allow syncing lobby changes to teammates
                });

            // Register per-player configuration
            Player = store.RegisterPerPlayer(
                key: "player",
                defaultFactory: () => new PlayerRunState(),
                options: new RunSavedDataOptions
                {
                    WritePolicy = RunSavedDataWritePolicy.WhenSet,
                    SyncLobbyOnChange = true, // Allow syncing lobby changes to teammates
                });
        }
    }
}
```

> **Tip**: `key` is the unique identifier for this data in the game save. After the mod is published and players have started using it, **never change the registered `key`**, otherwise existing players' saved data in this slot will be lost. (If you need to add new content to the data, just add new properties to the C# class you wrote.)

---

## Reading and Modifying Data In-Game

Once in the game, we can read and write data at any time using the static handles we saved. You just need to pass in the current `RunState`.

### Accessing Globally Shared Data
```csharp
using MegaCrit.Sts2.Core.Runs;
// Suppose we are in a card effect, where we can get runState
RunState runState = ...;

// Read
var challengeData = TestRunData.Challenge.Get(runState);
if (challengeData.HardMode)
{
    // Trigger hard mode effects...
}

// Modify
TestRunData.Challenge.Modify(runState, data => 
{
    data.ElitesKilled += 1; // Increment elite kills
});
```
`Modify` is the highly recommended approach. Not only does it let you modify data directly via a closure, it also **automatically marks it as "modified"**, telling the engine that this data needs to be saved to disk.

### Accessing Per-Player Data
Accessing per-player data is just as simple; the only difference is you need to additionally tell it "which player" to look up (via the player instance itself, or the network ID `netId`).

```csharp
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Runs;

Player player = ...;

// Read current player's data
var playerData = TestRunData.Player.Get(player);
int currentRerolls = playerData.DraftRerolls;

// Modify current player's data
TestRunData.Player.Modify(player, data =>
{
    data.DraftRerolls -= 1;
});

// You can also operate on other players' data via RunState + NetId
ulong teammateNetId = ...;
TestRunData.Player.Modify(runState, teammateNetId, data => 
{
    data.LoadoutId = "shared_loadout";
});
```

Shared slots only accept contributions from the host's net id. Clients that need to submit their own choices should write to `PlayerRunSavedData<T>`, using the local `lobby.NetService.NetId` as the player key. When the host starts the run, an authoritative snapshot is committed; thereafter all players recover the same data through the run save and reconnection.

---

## Lobby Staging Data

This part is used before a run is formally established. In many cases, we need players to change their desired run data in the **lobby screen** (e.g., when selecting characters or challenge options).

Before the game officially "starts", `RunState` hasn't been created yet, so we can't directly call `Get(runState)`. RitsuLib provides a pre-game staging area (Lobby Scope).

```csharp
using MegaCrit.Sts2.Core.Multiplayer.Game.Lobby;

namespace Test.Scripts.RunData;

public static class TestLobbyRunData
{
    // Switch global challenge in the lobby screen
    public static void SelectChallenge(StartRunLobby lobby, string challengeId, bool hardMode)
    {
        TestRunData.Challenge.Lobby.Modify(lobby, data =>
        {
            data.ChallengeId = challengeId;
            data.HardMode = hardMode;
        });
    }

    // Switch player starting loadout in the lobby screen
    public static void SelectLocalLoadout(StartRunLobby lobby, string loadoutId)
    {
        // NetService.NetId is your current local network ID
        TestRunData.Player.Lobby.Modify(lobby, lobby.NetService.NetId, data =>
        {
            data.LoadoutId = loadoutId;
        });
    }
}
```

When registering the slot earlier, we passed `SyncLobbyOnChange = true`. This means that whenever you call `Lobby.Modify` here, RitsuLib will automatically **sync this data change to the host and teammates**.

## Listening for Commit Timing

You can listen via the event pipeline: `RunSavedDataLobbyStagingEvent` is used to drive lobby UI previews, and `RunSavedDataPreparingEvent` is used to fill in final values before the run snapshot is exported.

```csharp
RitsuLibFramework.SubscribeLifecycle<RunSavedDataLobbyStagingEvent>(evt =>
{
    if (evt.IsHost && evt.Reason == RunSavedDataLobbyStagingReason.ContributionMerged)
        Entry.Logger.Info("Lobby run data merged; preview can be refreshed.");
});

RitsuLibFramework.SubscribeLifecycle<RunSavedDataPreparingEvent>(evt =>
{
    TestRunData.Challenge.Modify(evt.RunState, data =>
    {
        data.ChallengeId ??= "standard";
    });
});
```

Common `RunSavedDataLobbyStagingReason` values:

| Value | When it occurs |
| - | - |
| `ContributionMerged` | The host merged local or remote player contributions. |
| `PlayerJoined` | A new player joined the lobby; RitsuLib added a player slot to the session. |
| `Manual` | You called `RunSavedDataLobby.NotifyStagingChanged(lobby)`. |
| `Committing` | The host is about to build a new run snapshot. |

## Choosing a Write Policy

| Policy | Suitable scenario |
| - | - |
| `WhenSet` | Default choice. Only values explicitly changed via `Set` or `Modify` are written. |
| `WhenNonDefault` | The default object can be read repeatedly, but only values different from the default are saved. Suitable for challenge toggles and counters. |
| `AlwaysWhenRegistered` | Written as long as the slot can be resolved. Suitable for control data where a schema must be present every run. |

`WhenNonDefault` compares the current value against the serialized form of a new object from `defaultFactory`, so the default factory must be stable — do not put random numbers, timestamps, or runtime object references in it.

## Adding Migrations to a Slot

If you are forced to modify the data structure, you need to set up a structural migration to move data from the old version to the new version.

`RunSavedDataOptions.SchemaVersion` is written into every slot. When an older version is read, RitsuLib will look for `IMigration.FromVersion` migrations and upgrade until it reaches the current version.

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

Attach it to the same slot during registration:

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
