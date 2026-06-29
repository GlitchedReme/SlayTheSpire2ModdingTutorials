---
title: Adding Relics
date: 2026-05-04 13:57:41
permalink: en/docs/04-ritsulib/04-03-add-relic/
categories:
- Basics
---
> The examples below assume you have already called `RitsuLibFramework.EnsureGodotScriptsRegistered(...)` and `ModTypeDiscoveryHub.RegisterModAssembly(...)` in `Entry.Init()`, otherwise auto-registration will not take effect.

Similar to adding cards. Start by creating a new class.

```csharp
using Godot;
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Entities.Relics;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.Localization.DynamicVars;
using MegaCrit.Sts2.Core.Models.RelicPools;
using MegaCrit.Sts2.Core.Saves.Runs;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

// Register the relic. For custom pools, see the beginning of the Adding Characters article
[RegisterRelic(typeof(SharedRelicPool))]
// [RegisterCharacterStarterRelic(typeof(TestCharacter))] // Register as a starter relic
public class TestRelic : ModRelicTemplate
{
    // Rarity
    public override RelicRarity Rarity => RelicRarity.Common;

    // The relic's values. Here {Cards} in localization will be replaced.
    protected override IEnumerable<DynamicVar> CanonicalVars => [new CardsVar(1)];

    public override RelicAssetProfile AssetProfile => new(
        // Small icon (vanilla size 85×85)
        IconPath: $"res://Test/images/relics/{GetType().Name}.png",
        // Outline icon (vanilla size 85×85)
        IconOutlinePath: $"res://Test/images/relics/{GetType().Name}.png",
        // Large icon (vanilla size 256×256)
        BigIconPath: $"res://Test/images/relics/{GetType().Name}.png"
    );

    // At the start of each turn, draw a card
    public override async Task AfterPlayerTurnStart(PlayerChoiceContext choiceContext, Player player)
    {
        await CardPileCmd.Draw(choiceContext, DynamicVars.Cards.IntValue, player);
    }
}
```

* `[RegisterRelic(typeof(TestRelicPool))]` automatically registers the relic into the specified relic pool. The example uses a custom pool; change the type here if you want a different pool.

* Inherit from `ModRelicTemplate`.
* Image resources are all configured in `AssetProfile`.

Then place an image at `Test/images/relics/TestRelic.png`. Here the three images lazily reuse the same file — you can customize the paths yourself.

![Sample relic](../../../../images/image13.png)

Then write a localization file, `{modId}/localization/{Language}/relics.json`.

```json
{
    "TEST_RELIC_TEST_RELIC.title": "Test Relic",
    "TEST_RELIC_TEST_RELIC.description": "At the start of each turn, draw [blue]{Cards}[/blue] card(s).",
    "TEST_RELIC_TEST_RELIC.flavor": "Does this look familiar?"
}
```

* `{Cards}` corresponds to the `CardsVar(1)` above.

## Final Project Reference

```text
Test
├── Scripts
│   ├── Entry.cs
│   └── TestRelic.cs (or inside a dedicated Relics folder)
└── Test
    ├── images
    │   └── relics
    │       └── TestRelic.png
    └── localization
        └── zhs
            └── relics.json
```
