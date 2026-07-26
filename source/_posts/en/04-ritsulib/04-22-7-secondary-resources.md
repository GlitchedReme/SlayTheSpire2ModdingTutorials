---
title: Secondary Resources
date: 2026-06-09 14:42:30
permalink: en/docs/04-ritsulib/04-22-7-secondary-resources/
categories:
- Basics
---
> This feature is in beta; please report any issues.

Secondary Resources are a **second combat resource system** similar to `Starlight`. You can use them to create cards, relics, and powers that require additional costs or additional resource management.

## Registering Resources

Each resource needs a definition registered first before it can be used in combat. Register in the initialization function.

We can create a new class to manage this, or put it directly in your main class. Just make sure it is called during initialization.

```csharp
using STS2RitsuLib;
using STS2RitsuLib.Combat.SecondaryResources;

public static class ModResources
{
    public static SecondaryResourceDefinition ManaDefinition { get; private set; } = null!;
    public static SecondaryResourceDefinition RageDefinition { get; private set; } = null!;
    public static string ManaId { get; private set; } = string.Empty;
    public static string RageId { get; private set; } = string.Empty;

    public static void Register()
    {
        var registry = RitsuLibFramework.GetSecondaryResourceRegistry(Entry.ModId);

        // This is a "mana" resource: max 3, persists across combats, refills each turn.
        ManaDefinition = registry.Register("mana", new SecondaryResourceDefinition(
            defaultAmount: 0,
            baseMaxAmount: 3,
            turnStartPolicy: SecondaryResourceTurnStartPolicy.AddMaxToCurrent,
            persistencePolicy: SecondaryResourcePersistencePolicy.Run,
            smallIconPath: "res://Test/images/resources/mana_small.png",
            largeIconPath: "res://Test/images/resources/mana_large.png"
        ));
        ManaId = ManaDefinition.Id;

        // This is a "rage" resource: uncapped, cleared at the start of each turn, stored within combat.
        RageDefinition = registry.Register("rage", new SecondaryResourceDefinition(
            defaultAmount: 0,
            baseMaxAmount: null,
            turnStartPolicy: SecondaryResourceTurnStartPolicy.Clear,
            persistencePolicy: SecondaryResourcePersistencePolicy.Combat,
            smallIconPath: "res://Test/images/resources/rage_small.png",
            largeIconPath: "res://Test/images/resources/rage_large.png"
        ));
        RageId = RageDefinition.Id;
    }
}
```

**Don't forget to call this in your `Entry.Init`.**

* The first parameter `"mana"` to `Register` is the local ID; the returned format is `TEST_SECONDARY_RESOURCE_MANA` (`{MODID}_{TYPE}_{LOCALID}`).

`turnStartPolicy` is the automatic behavior at the start of each turn, and includes the following types:

| Policy | Effect |
|------|------|
| `None` | Do nothing |
| `ResetToMax` | Refill the current amount to the maximum |
| `AddMaxToCurrent` | Add the max amount to the current amount (like energy accumulation) |
| `Clear` | Set to zero |

`persistencePolicy` is the save persistence scope, and includes:

| Policy | Effect |
|------|------|
| `None` | Not saved; runtime only |
| `Combat` | Restored within the current combat |
| `Run` | Persists across combats (valid for the entire run) |

## Modifying Resource Amounts

Use the `SecondaryResourceCmd` static class to operate on resources:

```csharp
using STS2RitsuLib.Combat.SecondaryResources;

// Read current amount
int currentMana = SecondaryResourceCmd.Get(player, ModResources.ManaId);

// Read current max (returns null for uncapped resources)
int? maxMana = SecondaryResourceCmd.GetMax(player, ModResources.ManaId);

// Gain 2 mana (modified by Gain Hooks)
await SecondaryResourceCmd.Gain(player, ModResources.ManaId, 2);

// Lose 1 mana
await SecondaryResourceCmd.Lose(player, ModResources.ManaId, 1);

// Directly set to 5
await SecondaryResourceCmd.Set(player, ModResources.ManaId, 5);

// Spend 3 mana (goes through Spend Hook; if insufficient, no deduction occurs and returns false)
bool success = await SecondaryResourceCmd.Spend(player, ModResources.ManaId, 3);

// Reset to default (toMax: true resets to max)
await SecondaryResourceCmd.Reset(player, ModResources.ManaId, toMax: true);
```

## Adding Secondary Resource Costs to Cards

Card costs are attached to `CardModel` via the `SecondaryCosts()` extension method, set in the constructor:

```csharp
using STS2RitsuLib.Combat.SecondaryResources;

public class TestManaCard : ModCardTemplate
{
    public TestManaCard()
    {
        // Fixed cost: playing this card requires spending 2 mana
        this.SecondaryCosts().Set(ModResources.ManaId, 2);
    }
}
```

### Setting Cost Behaviors

X cost:

```csharp
this.SecondaryCosts().Set(ModResources.ManaId, SecondaryResourceCost.X());       // Spend all mana
this.SecondaryCosts().Set(ModResources.ManaId, SecondaryResourceCost.X(2));      // Spend all mana, multiply the X value by 2
```

The third parameter `duration` of `Set` can give the card a **temporary** secondary resource cost, which is automatically cleared upon expiry:

```csharp
this.SecondaryCosts().Set(ModResources.ManaId, 1, SecondaryResourceCostDuration.ThisTurn);    // This turn only, costs 1 mana
this.SecondaryCosts().Set(ModResources.RageId, 2, SecondaryResourceCostDuration.ThisCombat);  // This combat only, costs 1 mana
this.SecondaryCosts().Set(ModResources.ManaId, 1, SecondaryResourceCostDuration.UntilPlayed); // Costs 1 mana, cleared after being played
```

To manually clean up expired costs, use these extension methods:

```csharp
card.ClearSecondaryCostsThisTurn();       // Automatically called by the framework at end of turn; generally no need to write manually
card.ClearSecondaryCostsUntilPlayed();    // Automatically called by the framework after playing
```

Free to play or remove cost:

```csharp
this.SecondaryCosts().Set(ModResources.ManaId, SecondaryResourceCost.Free, SecondaryResourceCostDuration.UntilPlayed);  // Play for free once
this.SecondaryCosts().Clear(ModResources.ManaId);  // Completely remove the cost for this resource; no longer displayed
```

### Getting the X Effect Value

If the cost is set to X (spend all), you need to get the actual effective value in the card's `OnPlay`:

```csharp
using STS2RitsuLib.Combat.SecondaryResources;

protected override async Task OnPlay(PlayerChoiceContext choiceContext, CardPlay cardPlay)
{
    // Get the effect value of the X cost (current holding amount × XMultiplier, after Hook modifications)
    int effectValue = cardPlay.SecondaryResources().Value(ModResources.ManaId);

    // Check if it was an X cost
    bool wasX = cardPlay.SecondaryResources().CostsX(ModResources.ManaId);

    // Get the actual amount spent
    int spent = cardPlay.SecondaryResources().Spent(ModResources.ManaId);
}
```

## Hook System

Implement the `ISecondaryResourceHookListener` interface on relics, powers, or characters to modify resource behavior. **All hooks have default implementations; only override the methods you need.**

```csharp
using STS2RitsuLib.Combat.SecondaryResources;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

[RegisterRelic(typeof(SharedRelicPool))]
public class ManaRelic : ModRelicTemplate, ISecondaryResourceHookListener
{
    public override RelicRarity Rarity => RelicRarity.Boss;

    public override RelicAssetProfile AssetProfile => new(
        IconPath: "res://Test/images/relics/ManaRelic.png",
        IconOutlinePath: "res://Test/images/relics/ManaRelic.png",
        BigIconPath: "res://Test/images/relics/ManaRelic.png"
    );

    // Increase max mana +2
    public decimal ModifyMaxSecondaryResource(SecondaryResourceMaxContext context, decimal amount)
    {
        if (context.Definition.Id == ModResources.ManaId)
            return amount + 2;
        return amount;
    }

    // Gain an extra +1 when gaining mana
    public decimal ModifySecondaryResourceGain(SecondaryResourceContext context, decimal amount)
    {
        if (context.Definition.Id == ModResources.ManaId)
            return amount + 1;
        return amount;
    }

    // When mana changes, lose HP if it reaches zero
    public async Task AfterSecondaryResourceChanged(SecondaryResourceChangeContext context)
    {
        if (context.Definition.Id != ModResources.ManaId || context.NewAmount > 0)
            return;

        await context.Player.LoseHp(2, context.Player);
    }
}
```

Hooks identify which resource by comparing `context.Definition.Id` with `ModResources.ManaId`.

Full list of hooks provided by the interface:

| Hook | Purpose |
|------|------|
| `ModifySecondaryResourceGain` | Modify gain amount |
| `ModifyMaxSecondaryResource` | Modify maximum |
| `ModifySecondaryResourceCost` | Modify card fixed costs (excluding X portion) |
| `ModifySecondaryResourceXValue` | Modify X cost value |
| `ShouldGainSecondaryResource` | Prevent resource gain (return `false` to deny) |
| `ShouldSpendSecondaryResource` | Prevent resource spending (return `false` to deny) |
| `ShouldResetSecondaryResource` | Prevent turn reset (return `false` to deny) |
| `AfterSecondaryResourceChanged` | Callback after amount changes |
| `AfterSecondaryResourceSpent` | Callback after resource is spent |
| `AfterSecondaryResourceReset` | Callback after resource is reset |

## Combat UI

You can register secondary resource combat UI elements via `RegisterCombatUi` and `RegisterCardUi`.

RitsuLib includes built-in, ready-to-use components for the energy orb and card cost display, such as `NSecondaryResourceCounter` and `NSecondaryResourceCardCostUi`.

If you want custom UI, create and return your own, and bind the values and player manually.

The following uses the built-in UI:

```csharp
using Godot;
using MegaCrit.Sts2.Core.Nodes.Combat;
using MegaCrit.Sts2.Core.Nodes.Cards;
using STS2RitsuLib.Combat.SecondaryResources;

// Add to ModResources.Register():

// Combat counter. The icon used is the one you provided during registration
registry.RegisterCombatUi(
    "mana_combat_counter",
    parent =>
    {
        var row = NSecondaryResourceCounter.Create(ManaDefinition, new SecondaryResourceCounterStyle
        {
            FontSize = 32,
            PositiveColor = Colors.Cyan,
            FormatAmount = (amount, max) => amount.ToString(),
            IconStyle = SecondaryResourceIconStyle.Default with
            {
                Size = new Vector2(80, 80),
                HoverTip = SecondaryResourceHoverTipStyle.Default,
            },
        });
        // Freely specify the position. For example, find the energy counter's position and place it next to it
        var energyCounter = parent.GetNode<Control>("%EnergyCounterContainer");
        row.Position = energyCounter.Position + new Vector2(120, -120);
        return row;
    },
    ctx => ctx.Node.Bind(ctx.Player)
);

// Secondary resource cost display on the card face. The icon used is the one you provided during registration
registry.RegisterCardUi(
    "mana_card_ui",
    parent =>
    {
        var ui = NSecondaryResourceCardCostUi.Create(ManaId, new SecondaryResourceCardCostUiStyle
        {
            IconSize = new Vector2(48, 48),
            FontSize = 24,
        });
        // Freely specify the position. For example, find the energy icon's position and place it next to it
        var energyIcon = parent.GetNode<TextureRect>("%EnergyIcon");
        ui.Position = energyIcon.Position + new Vector2(0, 80);
        return ui;
    },
    ctx => ctx.Node.Refresh(ctx)
);

// Limit display to a specific character only
// registry.AlwaysShowInCombatUiForCharacter<Ironclad>(ManaDefinition.LocalId);
// Always show (not restricted by character)
registry.AlwaysShowInCombatUi(ManaDefinition.LocalId);

```

* `RegisterCombatUi` is automatically mounted based on the `NodeAttachment` system (see the "Node Attachments" tutorial for details).
* `SecondaryResourceCounterStyle` and other styles can be freely configured to your preferred look.

## Localization

The hover tooltip for secondary resources reads from the `static_hover_tips` table by default. The `locTable` parameter in the `SecondaryResourceDefinition` can specify a custom localization table.

```json
{
    "TEST_SECONDARY_RESOURCE_MANA.title": "Mana",
    "TEST_SECONDARY_RESOURCE_MANA.description": "Gains the value at the start of each turn. Persists across combats.",
    "TEST_SECONDARY_RESOURCE_RAGE.title": "Rage",
    "TEST_SECONDARY_RESOURCE_RAGE.description": "Clears at the start of each turn. Playing attack cards grants Rage."
}
```

If `titleKey` / `descriptionKey` are not provided, the framework will auto-derive the keys as `{resourceId}.title` and `{resourceId}.description`.

## Displaying Icons in Card Text

```csharp
using STS2RitsuLib.Combat.SecondaryResources;

// Set variables in CanonicalVars
protected override IEnumerable<DynamicVar> CanonicalVars => [
    SecondaryResourceVars.For("Mana", ModResources.ManaId, 2)
];

// Localization text:
// "Spend {Mana:secondaryResourceIcons()} Mana."
// Or {Mana} to use a number
```
