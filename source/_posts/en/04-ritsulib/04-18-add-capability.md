---
title: Adding Components
date: 2026-06-06 21:32:41
permalink: en/docs/04-ritsulib/04-18-add-capability/
categories:
- Basics
---
> The examples below assume `ModTypeDiscoveryHub.RegisterModAssembly(...)` has already been called in `Entry.Init()`, otherwise auto-registration won't take effect.

Components (ModelCapability) are a general-purpose additional behavior system provided by RitsuLib that can be attached to any `AbstractModel` (cards, relics, potions, powers, monsters, characters, etc.) to achieve modular feature injection.

Similar to STS1's CardModifier, or STS2's enchantments (but can exist in multiples and are not limited to cards).

## Code

Suppose you want to implement an effect: "Whenever this card is drawn, gain 1 Strength":

```csharp
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.Logging;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Models.Cards;
using MegaCrit.Sts2.Core.Models.Powers;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Models.Capabilities;

namespace Test.Scripts.Capabilities;

[RegisterModelCapability]
public class DrawPowerCapability : CardCapability
{
    protected override void OnAttach(CardModel model)
    {
        Log.Info("Capability attached");
    }

    protected override void OnDetach(CardModel model)
    {
        Log.Info("Capability detached");
    }

    public override async Task AfterCardDrawn(
        PlayerChoiceContext choiceContext,
        CardModel card,
        bool fromHandDraw)
    {
        if (Owner != null && card == Owner)
            await PowerCmd.Apply<StrengthPower>(choiceContext, Owner.Owner.Creature, 1, Owner.Owner.Creature, null);
    }
}
```

- `[RegisterModelCapability]` will auto-register this capability; the capability ID is `{MODID}_MODEL_CAPABILITY_{ClassNameInUppercaseSnakeCase}`.
- A capability is also essentially an `AbstractModel`.
- `Owner` points to the attached model instance (here a `CardModel`).
- `CardCapability` is a base class specifically for cards. There are also base classes for other content types.

Then attach the capability to the card:

```csharp
[RegisterCard(typeof(ColorlessCardPool))]
public class TestCard : ModCardTemplate
{
    // ... base implementation ...

    protected override async Task OnPlay(PlayerChoiceContext choiceContext, CardPlay cardPlay)
    {
        this.GetOrCreateCapability<DrawPowerCapability>(); // attach capability
        await DamageCmd.Attack(DynamicVars.Damage.BaseValue)
            .FromCard(this)
            .Targeting(cardPlay.Target!)
            .Execute(choiceContext);
    }
}
```

- `this.GetOrCreateCapability<DrawPowerCapability>()` attaches the capability to the card, automatically triggering `OnAttach`.

## Registration

### Auto-registration

Use the `[RegisterModelCapability]` attribute to mark the class. `ModTypeDiscoveryHub` will auto-register it:

```csharp
[RegisterModelCapability]
public class MyCardCapability : CardCapability { ... }
```

### Manual registration

In `Entry.Init()`:

```csharp
// Via ContentRegistry
var content = RitsuLibFramework.GetContentRegistry(ModId);
content.RegisterModelCapability<MyCardCapability>();

// Or static method
RitsuLibFramework.RegisterModelCapability<MyCardCapability>(ModId);
```

## Base class overview

RitsuLib provides ready-made base classes for different model types:

| Base class                              | Bound owner type      | Description                                                                             |
| --------------------------------------- | --------------------- | --------------------------------------------------------------------------------------- |
| `CardCapability`                        | `CardModel`           | Card capability, additionally exposes card-specific hooks like `OnOwnerCardUpgraded`, `OnOwnerCardDowngraded` |
| `CardPlayCapability`                    | `CardModel`           | Card play capability, automatically matches `cardPlay.Card` against `Owner`, only handles its own card's play |
| `OneShotCardPlayCapability`             | `CardModel`           | Automatically removes itself after one play                                             |
| `OrbCapability`                         | `OrbModel`            | Orb capability, contains `OnOwnerOrbPassiveTriggered`, `OnOwnerOrbEvoked`, etc.         |
| `RelicCapability`, `PotionCapability`, etc. | -                  | Relic, potion, power, monster, etc. also have corresponding capabilities                |
| `CharacterCapability`                   | `CharacterModel`      | Character capability (does not receive vanilla hooks)                                    |
| `OwnerHookCapability<TModel>`           | Any `AbstractModel`   | General hook base class, requires manually specifying the owner type                    |
| `UntilCombatEndCapability<TModel>`      | Any                   | Automatically removes itself after combat ends                                          |
| `TurnLimitedCapability<TModel>`         | Any                   | Automatically removes itself after a counted number of turns; remaining turns are automatically persisted |

If you want a capability that can only be attached to a type you specify, simply inherit from `ModelCapability` or `ModelCapability<TModel>` directly.

## Contributor interfaces

Capabilities can implement the following interfaces to inject additional content into the owner.

Take `ICardDescriptionContributor` as an example — it appends a line of text to the bottom of the card description:

```csharp
using MegaCrit.Sts2.Core.Combat;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Creatures;
using MegaCrit.Sts2.Core.Localization;
using MegaCrit.Sts2.Core.Models.Cards;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Models.Capabilities;

namespace Test.Scripts.Capabilities;

[RegisterModelCapability]
public class HealOnExhaustCapability : CardCapability,
    ICardDescriptionContributor
{
    protected override IEnumerable<DynamicVar> CanonicalVars => [
        new DynamicVar("HealAmount", 2)
    ];

    public IEnumerable<CardDescriptionFragment> GetDescriptionFragments(
        CardDescriptionContext context) =>
    [
        // Append a line at the bottom of the description: "When Exhausted, heal 2 HP."
        new CardDescriptionFragment(
            new LocString("cards", $"{Id.Entry}.exhaustHealDescription"),
            CardDescriptionFragmentPlacement.AfterBase
        )
    ]
}
```

You can specify which localization table the locstring uses. If you use `cards`, the localization file `{modId}/localization/{Language}/cards.json` needs the corresponding entry:

```json
{
  "TEST_MODELCAPABILITY_HEAL_ON_EXHAUST_CAPABILITY.exhaustHealDescription": "When [gold]Exhausted[/gold], heal [blue]{HealAmount}[/blue] HP."
}
```

Divided into three categories by target:

### General model interfaces (any owner)

| Interface                     | Purpose                                              | Method                                          |
| ----------------------------- | ---------------------------------------------------- | ----------------------------------------------- |
| `IModelDynamicVarContributor` | Provide dynamic variables for the owner's text       | `GetDynamicVars(AbstractModel)`                 |
| `IModelHoverTipContributor`   | Add hover tips to the owner                          | `GetHoverTips(AbstractModel)`                   |
| `IModelAssetPathContributor`  | Declare resource paths needed by the owner (prevents packaging from stripping them) | `GetAssetPaths(ModelAssetPathContext)` |
| `IModelRightClickCapability`  | Handle right-click interactions                      | `OnRightClick(ModRightClickExecutionContext)`    |

### Card capability-specific interfaces

| Interface                          | Purpose                                                    |
| ---------------------------------- | ---------------------------------------------------------- |
| `ICardDescriptionContributor`      | Contribute card description fragments                      |
| `ICardHoverTipContributor`         | Contribute card hover tips                                 |
| `ICardGlowContributor`             | Control whether the card shows gold/red glow               |
| `ICardPropertyContributor`         | Override card type, rarity, target type, tags              |
| `ICardPlayStateContributor`        | Control whether the card can be played, hand end-of-turn effects |
| `ICardPlayResultContributor`       | Customize which pile the card enters after being played    |
| `ICardTransformCarryOverCapability`| Carry itself over to the resulting card during card transformation |

### Orb capability-specific interfaces

| Interface                           | Purpose                               |
| ----------------------------------- | ------------------------------------- |
| `IOrbValueDisplayContributor`       | Override the display of passive/evoke value labels |
| `IOrbHoverTipDescriptionContributor`| Contribute orb hover description fragments |

## Runtime operations

> Capabilities inherit from `AbstractModel`. **Do NOT use `new`** to create them. They must be created through the registry or framework API, e.g. via `ModelCapabilityRegistry.GetCapabilityId` and `ModelCapabilityRegistry.Create`.

```csharp
// Get the capability collection (returns ModelCapabilitySet)
var caps = model.Capabilities();

// Get the first capability of a specified type (returns null if not found)
var cap = model.Capability<DrawPowerCapability>();

// Check whether a capability of a certain type exists
if (model.TryGetCapability<DrawPowerCapability>(out var existing)) { ... }

// Create via registry and attach if it doesn't exist (most common)
model.GetOrCreateCapability<DrawPowerCapability>();

// Attach when the card is upgraded
model.GetOrCreateUpgradeCapability<DrawPowerCapability>();

// Remove capability
var removedCap = model.RemoveCapability<DrawPowerCapability>();

// Apply an existing capability (triggers merge)
model.ApplyCapability(removedCap);

// Add capability stacks
model.AddCapability(existingCap);

// Subtract capability stacks
model.SubtractCapability(existingCap);

// Insert before/after a specified capability
caps.InsertBefore<SomeOtherCapability>(myCap);
caps.InsertAfter<SomeOtherCapability>(myCap);

// Batch apply
caps.ApplyRange([cap1, cap2, cap3]);
```

## Default capabilities

If you want a certain model type to always come with certain capabilities, configure default capabilities during the Entry phase:

```csharp
// All TestRelic instances automatically attach ChargingRelicCapability upon creation
content.ConfigureDefaultModelCapabilities<TestRelic>(
    "charge-on-play", // modifier id (unique within the same mod)
    (relic, caps) => caps.Add<ChargingRelicCapability>()
);
```

## Persistence / saving

To save data in save files, override `SaveAdditionalState` and `LoadAdditionalState` in your capability:

```csharp
[RegisterModelCapability]
public class ChargeCounterCapability : CardCapability
{
    public int Charge { get; private set; }

    // Save data when saving
    protected override JsonNode? SaveAdditionalState()
    {
        return JsonSerializer.SerializeToNode(new ChargeData { Charge = Charge });
    }

    // Load data when loading
    protected override void LoadAdditionalState(JsonNode? state, int schemaVersion)
    {
        var data = state?.Deserialize<ChargeData>();
        if (data != null) Charge = data.Charge;
    }
}

public class ChargeData
{
    public int Charge { get; set; }
}
```

You can also use `StatefulModelCapability<TState>` or `StatefulModelCapability<TModel, TState>` for automatic serialization — choose whichever suits the situation.

## Merge behavior

To control stacking behavior when capabilities are combined, implement `IModelCapabilityMergeHandler`:

```csharp
[RegisterModelCapability]
public class StackableBuffCapability : CardCapability, IModelCapabilityMergeHandler
{
    protected override IEnumerable<DynamicVar> CanonicalVars => [
        new CardsVar(3)
    ];

    // The following implements an additive stacking effect.
    // Of course it's not limited to same-type; incoming is any capability being applied. You can decide for yourself,
    // e.g. directly return true to prevent any other capability from being attached
    public bool TryMergeWith(IModelCapability incoming, ApplyModelCapabilityOptions options, out IModelCapability? merged)
    {
        if (incoming is StackableBuffCapability other)
        {
            DynamicVars.Cards.BaseValue += other.DynamicVars.Cards.BaseValue;
            merged = this;
            return true;
        }
        merged = null;
        return false;
    }

    // Subtractive merge for same type
    public bool TrySubtractiveMergeWith(IModelCapability incoming, ApplyModelCapabilityOptions options, out IModelCapability? merged)
    {
        if (incoming is StackableBuffCapability other)
        {
            DynamicVars.Cards.BaseValue -= other.DynamicVars.Cards.BaseValue;
            merged = DynamicVars.Cards.BaseValue <= 0 ? null : this; // Remove self when value reaches zero
            return true;
        }
        merged = null;
        return false;
    }
}
```

**Only `AddCapability` / `SubtractCapability` / `ApplyCapability` go through the merge process**:

```csharp
// ✅ Stacking: each Add triggers a merge
var cap = ModelCapabilityRegistry.Create<DrawPowerCapability>();
cap.DynamicVars.Cards.BaseValue = 3;
this.AddCapability(cap); // Stack. Use SubtractCapability to remove stacks

// ❌ Does not stack: GetOrCreate only creates once
this.GetOrCreateCapability<StackableBuffCapability>();
```
