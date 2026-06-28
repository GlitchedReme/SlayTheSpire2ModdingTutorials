## Per-Object In-Game Saving (SavedAttachedState)

If you want to add a state to objects like cards, relics, etc. that persists with the save file, use `SavedAttachedState<TOwner, TValue>`.

Below is an example using a relic: record the number of turns elapsed at the start of each turn, and display this value as `{GameTurns}` in the relic's description.

```csharp
using Godot;
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Entities.Relics;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.Localization.DynamicVars;
using MegaCrit.Sts2.Core.Models.RelicPools;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Scaffolding.Content;
using STS2RitsuLib.Utils;

namespace Test.Scripts;

[RegisterRelic(typeof(SharedRelicPool))]
// [RegisterCharacterStarterRelic(typeof(TestCharacter))]
public class TestRelic : ModRelicTemplate
{
    // Add this line
    public static readonly SavedAttachedState<TestRelic, int> GameTurns = new("GameTurns", _ => 0);

    public override RelicRarity Rarity => RelicRarity.Common;

    protected override IEnumerable<DynamicVar> CanonicalVars => [
        new CardsVar(1),
        new DynamicVar("GameTurns", GameTurns[this])
    ];

    public override RelicAssetProfile AssetProfile => new(
        IconPath: $"res://Test/images/relics/{Id.Entry.ToLowerInvariant()}.png",
        IconOutlinePath: $"res://Test/images/relics/{Id.Entry.ToLowerInvariant()}.png",
        BigIconPath: $"res://Test/images/relics/{Id.Entry.ToLowerInvariant()}.png"
    );

    public override async Task AfterPlayerTurnStart(PlayerChoiceContext choiceContext, Player player)
    {
        // At the start of each turn, modify the GameTurns value and update the relic description's {GameTurns} value
        GameTurns[this]++;
        DynamicVars["GameTurns"].BaseValue = GameTurns[this];
        await CardPileCmd.Draw(choiceContext, DynamicVars.Cards.IntValue, player);
    }
}
```

`SavedAttachedState<TestRelic, int>` means attaching a saveable `int` state to `TestRelic`.

```csharp
public static readonly SavedAttachedState<TestRelic, int> GameTurns = new("GameTurns", _ => 0);
```

* The first parameter `"GameTurns"` is the state name used for saving; must not be duplicated within the same object type.

* The second parameter `_ => 0` is the default value factory; if this value does not exist when loading a save, `0` is used.

* Use `GameTurns[this]` to read or modify the state on the current relic instance.

If this value needs to appear in the description, remember to also add a `DynamicVar`:

```csharp
protected override IEnumerable<DynamicVar> CanonicalVars => [
    new CardsVar(1),
    new DynamicVar("GameTurns", GameTurns[this])
];
```

Localization text example:

```json
{
  "TEST_RELIC_TEST_RELIC.title": "Test Relic",
  "TEST_RELIC_TEST_RELIC.description": "At the start of each turn, draw [blue]{Cards}[/blue] card(s).\n[blue]{GameTurns}[/blue] turns have passed.",
  "TEST_RELIC_TEST_RELIC.flavor": "Does this look familiar?"
}
```

This way `GameTurns` is saved and loaded within the run, without you needing to write additional serialization logic.

## Global In-Run Saving (RunSavedData)

`RunSavedData` can be used for globally persistent data across a single run, including per-player data in multiplayer mode. See the corresponding chapter (`RitsuLib/02 - Gameplay Foundation/09 - In-Run Data`).

This feature is suitable for global configuration within a single run. If you need per-combat data saving, `SavedAttachedState` and `SavedProperty` are more appropriate.

## Game-Wide Data Persistence (ModDataStore)

To implement **data that persists forever** (e.g., unlock progress, kill statistics, your Mod's independent settings panel parameters), use `ModDataStore`.

RitsuLib's persistence architecture provides fully automatic file reading/writing and dispatch handling, supporting per-save-slot isolation or cross-save global configuration.

### Define and Register Your Data

Similar to saving in-run data, you need to write a very simple C# class as a serialization carrier. And at the earliest content initialization stage, tell the system that this data exists.

```csharp
using STS2RitsuLib;
using STS2RitsuLib.Data;
using STS2RitsuLib.Utils.Persistence;

namespace Test.Scripts.Data;

// Define the data structure we want to save
public sealed class ModProgressData
{
    public int GlobalMonstersKilled { get; set; } = 0;
    public bool HasUnlockedSecret { get; set; } = false;
}

// Place in the initialization function
using (RitsuLibFramework.BeginModDataRegistration(Entry.ModId))
{
    var store = RitsuLibFramework.GetDataStore(Entry.ModId);

    // Register an item of data to disk
    store.Register<ModProgressData>(
        key: "mod_progress",               // ID key; once set, do not easily change it
        fileName: "test_mod_progress.json", // Determines its name on disk
        scope: SaveScope.Global,           // This is universal global data
        defaultFactory: () => new ModProgressData(), // Default value for first creation
        autoCreateIfMissing: true          // Whether to automatically generate the file on disk the first time the player mounts the Mod
    );
}
```

RitsuLib divides "data storage scope" into two common levels:
- **Global (`SaveScope.Global`)**: Shared across all save slots. Suitable for Mod-independent "game options/settings", keybindings, the player's universal global achievements within your Mod, etc.
- **Per Profile (`SaveScope.Profile`)**: Only applies to the specific save slot (Profile) selected on the main menu. Things unlocked in save A will not exist if you switch to a newly created save B. Perfect for storing the current player's experience progress on your new character, or card unlock status specific to a particular save slot.

### Reading and Writing Slot Data

When the game is loaded, you can fetch and store this data.

**Reading data:**
```csharp
var store = RitsuLibFramework.GetDataStore(Entry.ModId);

// Retrieve the data we registered earlier with the key "mod_progress"
var progress = store.Get<ModProgressData>("mod_progress");

if (progress.HasUnlockedSecret)
{
    // ...enable specific card generation
}
```

**Updating and writing data:** If you need to modify it and save it to disk to prevent loss:

```csharp
var store = RitsuLibFramework.GetDataStore(Entry.ModId);

// Use the built-in Modify closure function for modification; it ensures thread consistency of state
store.Modify<ModProgressData>("mod_progress", data => 
{
    data.GlobalMonstersKilled += 1;
    if (data.GlobalMonstersKilled > 1000)
    {
        data.HasUnlockedSecret = true;
    }
});

// You must manually call this, otherwise it will not be saved.
store.Save("mod_progress");
```

> ⚠️ **You must explicitly call `.Save("your_key")` for it to be safely written to physical disk**. You can call `.Save()` once after multiple modifications.

**Checking if data exists:**

```csharp
var store = RitsuLibFramework.GetDataStore(Entry.ModId);
if (!store.HasExistingData("mod_progress"))
{
    Entry.Logger.Info("My data has not been generated.");
    // Execute initialization logic such as giving a welcome gift...
}
```
