---
title: Adding Potions
date: 2026-05-04 13:57:41
permalink: en/docs/04-ritsulib/04-06-add-potion/
categories:
- Basics
---
> The examples below assume you have already called `RitsuLibFramework.EnsureGodotScriptsRegistered(...)` and `ModTypeDiscoveryHub.RegisterModAssembly(...)` in `Entry.Init()`, otherwise auto-registration will not take effect.

First, create the class: (much of the code is similar to cards — use them as a reference)

```csharp
using MegaCrit.Sts2.Core.Entities.Creatures;
using MegaCrit.Sts2.Core.Entities.Potions;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.HoverTips;
using MegaCrit.Sts2.Core.Localization.DynamicVars;
using MegaCrit.Sts2.Core.Models.Cards;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

// Register the potion. For custom pools, see the beginning of the Adding Characters article
[RegisterPotion(typeof(SharedPotionPool))]
public class TestPotion : ModPotionTemplate
{
    // Rarity
    public override PotionRarity Rarity => PotionRarity.Common;

    // Usage — CombatOnly means can only be used in combat
    public override PotionUsage Usage => PotionUsage.CombatOnly;

    // Target type
    public override TargetType TargetType => TargetType.Self;

    // Define dynamic variables
    protected override IEnumerable<DynamicVar> CanonicalVars => [new CardsVar(3)];

    // Display a preview card — Soul. Or you can add keyword hover tips instead
    protected override IEnumerable<IHoverTip> AdditionalHoverTips => [HoverTipFactory.FromCard<Soul>()];

    // Potion image. Does not have to be PNG — any format readable by Godot as a Texture works.
    public override PotionAssetProfile AssetProfile => new(
        ImagePath: "res://icon.svg",
        OutlinePath: "res://icon.svg"
    );

    // Effect logic when used — here, create 3 Souls in hand.
    protected override async Task OnUse(PlayerChoiceContext choiceContext, Creature? target)
    {
        await Soul.CreateInHand(Owner, DynamicVars.Cards.IntValue, Owner.Creature.CombatState!);
    }
}
```

* `[RegisterPotion(typeof(TestPotionPool))]` automatically registers the potion into the specified potion pool. The example uses a custom character potion pool.
* Inherit from `ModPotionTemplate`.
* `CanonicalVars`, `AdditionalHoverTips`, etc. are written the same way as cards.
* `ImagePath` and `OutlinePath` in `AssetProfile` correspond to the potion body and outline image respectively.

Then create `{ModId}/localization/{Language}/potions.json`.

```json
{
    "TEST_POTION_TEST_POTION.title": "Godo Potion",
    "TEST_POTION_TEST_POTION.description": "Add [blue]{Cards}[/blue] [gold]Soul(s)[/gold] to your [gold]hand[/gold]."
}
```

* `{Cards}` corresponds to the `CardsVar(3)` above.

## Final Project Reference

```text
Test
├── Scripts
│   ├── Entry.cs
│   ├── TestPotion.cs
│   └── TestPotionPool.cs
├── icon.svg
└── Test
    └── localization
        └── zhs
            └── potions.json
```
