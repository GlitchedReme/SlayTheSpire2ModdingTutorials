> The examples below assume you have already called `RitsuLibFramework.EnsureGodotScriptsRegistered(...)` and `ModTypeDiscoveryHub.RegisterModAssembly(...)` in `Entry.Init()`, otherwise auto-registration will not take effect.

## Code

Create a new class:

```csharp
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Powers;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.Models.Cards;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

[RegisterPower]
public class TestPower : ModPowerTemplate
{
    // Type — Buff or Debuff
    public override PowerType Type => PowerType.Buff;
    // Stack type — Counter means stackable, Single means not stackable
    public override PowerStackType StackType => PowerStackType.Counter;

    // Custom icon path. 1:1 is fine. Vanilla game uses 256×256 for large icons and 64×64 for small icons.
    public override PowerAssetProfile AssetProfile => new(
        IconPath: "res://Test/images/powers/test_power.png",
        BigIconPath: "res://Test/images/powers/test_power.png"
    );

    // After drawing a card, grant the player Strength
    public override async Task AfterCardDrawn(PlayerChoiceContext choiceContext, CardModel card, bool fromHandDraw)
    {
        await PowerCmd.Apply<StrengthPower>(choiceContext, Owner, Amount, Owner, null);
    }
}
```

* `[RegisterPower]` auto-registers the power.
* Inherit from `ModPowerTemplate`.
* `IconPath` and `BigIconPath` in `AssetProfile` correspond to the small and large power icons respectively.
* The example demonstrates the `AfterCardDrawn` hook. When you want to listen to other timings, just continue overriding the corresponding methods.

## Text

Add a JSON file at `{ModId}/localization/{Language}/powers.json`.

* When adding content via `ritsulib`, the id becomes `{modid}_{category}_{original id}`. For example, here `modid` is `TEST` and the category is `POWER`.

```json
{
    "TEST_POWER_TEST_POWER.description": "Whenever you draw a card, gain 1 [gold]Strength[/gold].",
    "TEST_POWER_TEST_POWER.smartDescription": "Whenever you draw a card, gain [blue]{Amount}[/blue] [gold]Strength[/gold].",
    "TEST_POWER_TEST_POWER.title": "Wicked Flame"
}
```

`smartDescription` can use `{Amount}` to display the current stack count.

Then use `PowerCmd.Apply<TestPower>(...)` to grant it. Or use the console: `power TEST_POWER_TEST_POWER 1 0`.

![alt text](../../../images/image25.png)

## Final Project Reference

```text
Test
├── Scripts
│   ├── Entry.cs
│   └── TestPower.cs
└── Test
    ├── images
    │   └── powers
    │       └── test_power.png
    └── localization
        └── zhs
            └── powers.json
```

## Temporary Powers

Temporary powers in Spire 2 display their source, so a convenient wrapper is provided.

This temporary power automatically expires at the end of the turn.

For icon resources and additional effects, refer to the section above.

```csharp
using MegaCrit.Sts2.Core.Localization;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Models.Powers;
using STS2RitsuLib.Combat.Powers;
using STS2RitsuLib.Interop.AutoRegistration;

namespace Test.Scripts;

// Register the power and set Inherit = true so that powers inheriting this class are auto-registered
[RegisterPower(Inherit = true)]
public abstract class TempPower<T> : ModTemporaryAppliedPowerTemplate<T, StrengthPower> where T : AbstractModel
{
    // Custom icon path
    public override PowerAssetProfile AssetProfile => new(
        IconPath: $"res://Test/images/powers/{GetType().Name}.png",
        BigIconPath: $"res://Test/images/powers/{GetType().Name}.png"
    );
    
    // protected override bool IsPositive => false; // Whether it's a positive or negative effect

    // protected override bool UntilEndOfOtherSideTurn => false; // If true, expires at the end of the other side's turn; otherwise expires at the owner's turn end.

    // protected override int LastForXExtraTurns => 0; // Extra turns to last

    // Overriding the description is recommended to share a single localization string across multiple powers
    // For example, the text here requires "TEST_POWER_TEMP_POWER.description" and "TEST_POWER_TEMP_POWER_DOWN.description" in powers.json
    public override LocString Description => new("powers", IsPositive ? "TEST_POWER_TEMP_POWER.description" : "TEST_POWER_TEMP_POWER_DOWN.description");
}

// Create multiple classes to mark different sources and use different icons.
// Of course, if all temporary powers of this type share one icon, remove the abstract on the parent and grant TempPower directly.
public class TempFromTestCardPower : TempPower<TestCard>
{
}
```
