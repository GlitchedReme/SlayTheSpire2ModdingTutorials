`ComputedDynamicVar` is a `DynamicVar` subclass provided by RitsuLib whose displayed value is computed at runtime by delegates you supply.

Regular variables (like `IntVar`, `DamageVar`) are **static**: fixed at creation, only changing through explicit operations like `UpgradeValueBy` or assigning `BaseValue`. But when the displayed value depends on the **target**, **upgrade state**, **preview mode**, **combat context**, or **other variables**, a static variable isn't enough.

The vanilla game has a `CalculatedVar` (formula `base + extra * calculated`), but its design is cumbersome and bug-prone, so it's generally not recommended. `ComputedDynamicVar` computes with a delegate — flexible and easy to understand.

## Basic Usage

### Simplest form: card-only

Here's an example with a base value of 3, where the actual value also adds the target's Strength stacks:

```csharp
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Localization.DynamicVars;
using MegaCrit.Sts2.Core.Models.Cards;
using MegaCrit.Sts2.Core.ValueProps;
using MegaCrit.Sts2.Core.Entities.Creatures;
using MegaCrit.Sts2.Core.Models.Powers;
using STS2RitsuLib.Cards.DynamicVars;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Scaffolding.Content;


namespace Test.Scripts;

[RegisterCard(typeof(TestCardPool))]
public class MyStrike() : ModCardTemplate(1, CardType.Attack, CardRarity.Common, TargetType.AnyEnemy)
{
    protected override IEnumerable<DynamicVar> CanonicalVars =>
    [
        // Displayed value = base value + the target's Strength stacks
        ModCardVars.Computed("TestValue", 3, (card, target) => DynamicVars["TestValue"].BaseValue + (target?.GetPowerAmount<StrengthPower>() ?? 0)),
    ];

    // Modify BaseValue on upgrade
    protected override void OnUpgrade()
    {
        DynamicVars["TestValue"].UpgradeValueBy(2m);
    }
}
```

Then reference the variable name in the localized description:

```json
{
  "MY_STRIKE.description": "Deal {Damage:diff()} damage. Gain {TestValue:diff()} temporary Strength."
}
```

Parameters:

| Parameter | Meaning |
| - | - |
| `name` | Variable key, referenced as `{name}` in descriptions |
| `baseValue` | Initial stored base value. **The evaluator does not return it automatically** — it only exists as fallback data; read it via `ctx.BaseValue` or `DynamicVars["x"].BaseValue` when needed |
| `currentValueFactory` | Delegate computing the current value; parameters are the owning card (may be `null`, e.g. when previewing a canonical card) and the target |

> **Note:** read base values via `DynamicVars["xxx"].BaseValue` (or `ctx.BaseValue` in the context form) instead of hardcoding a constant. Apply upgrade changes in `OnUpgrade` via `UpgradeValueBy` so upgrade highlighting, `IntValue`, and everything depending on `BaseValue` stays consistent.

### Context form

When the value depends on many inputs (card, target, combat, preview mode, other variables), use the context factory:

```csharp
[
    ModCardVars.Int("TestHeat", 2),
    ModCardVars.Computed(
        "TestCtx",
        static ctx =>
        {
            var heat = ctx.GetCardIntOrDefault("TestHeat");
            var targetBonus = ctx.HasTarget && ctx.IsInCombat
                ? ResolveTargetBonus(ctx.CombatState, ctx.Target)
                : 0m;

            return ctx.BaseValue + heat + targetBonus;
        },
        baseValue: 6);
]
```

The context factory is the **second** argument, with `baseValue` last, so it doesn't conflict with the old `(name, baseValue, card => ...)` form.

> **Recommendation:** make context factories `static`. Dynamic vars are cloned with their cards; a static factory can't accidentally retain the card instance from which the variable was created.

## ComputedDynamicVarContext In Detail

The context is a `ComputedDynamicVarContext` parameter `ctx`, shared by live values and previews. It provides null-safe convenience members so you don't hand-write `if (x != null)` chains.

### Evaluation state

| Member | Meaning |
| - | - |
| `IsCurrentValue` | Evaluating the current value (not a preview) |
| `IsPreview` | Evaluating a preview value |
| `IsNormalPreview` | Normal card preview |
| `IsUpgradePreview` | Upgrade preview (NUpgradePreview) |
| `IsMultiTargetPreview` | Multi-creature targeting preview |
| `ShouldRunGlobalHooks` | Preview and global hooks allowed (`IsPreview && RunGlobalHooks`) |

### Card state

| Member | Meaning |
| - | - |
| `Card` | Effective card for this evaluation. During an enchantment preview it may differ from `ModelOwner` |
| `ModelOwner` | Model assigned via `DynamicVar.SetOwner` |
| `IsMutableCard` | Effective card is a mutable instance (the actual in-combat card) |
| `IsCanonicalCard` | Effective card is a canonical instance (e.g. collection) |
| `IsUpgraded` | Card is upgraded |
| `IsEnchantmentPreview` | Currently an enchantment preview |

### Ownership and scope

| Member | Meaning |
| - | - |
| `Player` | Player owning the mutable card. Returns `null` for canonical cards without invoking the guarded `Owner` getter |
| `SourceCreature` | Creature owning/using the card (`Player?.Creature`) |
| `RunState` | Run containing the card |
| `CombatState` | Combat associated with the card or its owner. Falls back to the owner's combat when the card is outside combat piles |
| `CardScope` | Lowest-level scope reported by the card |

Each has a matching `HasPlayer` / `HasSourceCreature` / `HasRunState` / `HasCombatState` / `HasCardScope`, combined with `[MemberNotNullWhen]` so you can dereference right after the null check.

### Location

| Member | Meaning |
| - | - |
| `IsInRun` | Card belongs to a run (`HasRunState`) |
| `IsInCombat` | Card **owner** is currently in combat. May be `true` even when the card sits in a non-combat pile like the deck |
| `IsCardInCombat` | Card **itself** reports a combat state (`Card.CombatState != null`) |

### Reading variables

| Member | Meaning |
| - | - |
| `TryGetCardVar(name, out var)` / `TryGetCardVar<T>(name, out var)` | Try to get a variable from the card's `DynamicVars` |
| `GetRequiredCardVar<T>(name)` | Must exist with a matching type, otherwise throws `KeyNotFoundException` |
| `GetCardBaseValueOrDefault(name, default)` | Reads the base value, returns the default when missing |
| `GetCardIntOrDefault(name, default)` | Reads the integer value, returns the default when missing |
| `EvaluateCardVarOrDefault(name, default)` | Evaluates a computed variable for the current target, or reads a regular variable's base value |

`EvaluateCardVarOrDefault` has recursion protection: if the target variable is the one currently being evaluated (or is already on the evaluation stack), it returns its `BaseValue` directly, avoiding infinite loops.

## Preview Logic

### Regular form: separate preview factory

When the preview value (card preview, target preview, upgrade preview) should show something **different from what's actually computed**, pass a fourth argument:

(e.g. computing hand size: in preview, subtract one to exclude the card in your hand; when actually played, don't)

```csharp
ModCardVars.Computed(
    "ExtraDamage",
    Damage,
    (card, target) => ResolveDamage(card, target),                    // current value
    (card, mode, target, runGlobalHooks) => ResolvePreviewDamage(card, mode, target)); // preview value
```

Preview factory parameters:

| Parameter | Meaning |
| - | - |
| `card` | Card being previewed |
| `mode` | `CardPreviewMode`: `None` / `Normal` / `Upgrade` / `MultiCreatureTargeting` |
| `target` | Preview target creature, may be `null` |
| `runGlobalHooks` | Whether global hooks (e.g. Strength, Vulnerable) should run |

When the preview factory is omitted, previews fall back to the current-value factory.

### Context form: use state members directly

The context version needs no separate preview delegate — use `ctx.BaseValue` together with the preview-state members inside the factory:

```csharp
ModCardVars.Computed(
    "TestMode",
    static ctx => ctx.BaseValue + (ctx.IsPreview ? 1m : 0m),
    baseValue: 3);
```

## Damage / Block Wrappers

If you're computing a **damage** or **block** value and want the preview to still pass through the vanilla modification pipeline (Strength, Dexterity, Vulnerable, Frail, enchantments), use `ComputedDamage` / `ComputedBlock` instead of plain `Computed`.

### ComputedDamage

```csharp
// Preview goes through Hook.ModifyDamage (Strength, Vulnerable, enchantments, etc.)
// ResolveTargetBonus is a function you implement yourself for custom computation, or compute it inline
ModCardVars.ComputedDamage(
    "ExtraDamage",
    6,
    (card, target) => DynamicVars["ExtraDamage"].BaseValue + ResolveTargetBonus(card?.CombatState, target));
```

### ComputedOstyDamage

For Osty attacks use `ComputedOstyDamage` so damage preview modifiers see Osty as the dealer:

```csharp
ModCardVars.ComputedOstyDamage("damage", 7, (card, target) => ResolveOstyDamage(card, target));
```

### ComputedBlock

```csharp
// Preview goes through Hook.ModifyBlock (Dexterity, Frail, enchantments, etc.)
ModCardVars.ComputedBlock("ExtraBlock", 5, _ => DynamicVars["ExtraBlock"].BaseValue);
```

### Custom dealer / receiver

`ComputedDamage` accepts a custom dealer, `ComputedBlock` a custom receiver (not necessarily the card owner):

```csharp
ModCardVars.ComputedDamage(
    "damage",
    6,
    (card, target) => ResolveDamage(card, target),
    card => card.Owner.Osty,  // dealer is the Osty
    ValueProp.Move);

ModCardVars.ComputedBlock(
    "block",
    5,
    (card, target) => ResolveBlock(card, target),
    card => card.Owner.Osty); // receiver is the Osty
```

### Context versions

The context versions need no extra preview delegate and keep the same preview modification rules:

```csharp
ModCardVars.ComputedDamage(
    "damage",
    static ctx => ctx.BaseValue + ResolveBonus(ctx.Player, ctx.Target),
    baseValue: 6);

ModCardVars.ComputedBlock(
    "block",
    static ctx => ctx.BaseValue + (ctx.HasSourceCreature ? 1m : 0m),
    baseValue: 5);
```

If the value should **not** pass through damage/block hooks, keep using plain `Computed`.

## Energy / Star / Power Icon Counts

When the description renders an amount through the game's icon formatters, use the concrete icon helpers:

```csharp
ModCardVars.ComputedEnergy("EnergyGain", 1, card => ResolveEnergyGain(card)),
ModCardVars.ComputedStars("StarGain", 1, card => ResolveStarGain(card)),
ModCardVars.ComputedPower<StrengthPower>("StrengthPower", 2, card => ResolveStrength(card)),
```

Localization:

```json
{
  "MY_CARD.description": "Gain {EnergyGain:energyIcons()}.\nGain {StarGain:starIcons()}.\nGain {StrengthPower:diff()} Strength."
}
```

| Method | Description |
| - | - |
| `ComputedEnergy` | Energy icon count, compatible with the `energyIcons` formatter |
| `ComputedStars` | Star icon count, compatible with the `starIcons` formatter |
| `ComputedPower<T>` | Power amount, keeps the typed `PowerVar<T>` shape. **Does not** run power-amount hooks by default |
| `ComputedPowerAmountGiven<T>` | Power amount whose previews pass through `Hook.ModifyPowerAmountGiven`, same path as vanilla `PowerVar<T>` |

Both `ComputedPower<T>` and `ComputedPowerAmountGiven<T>` support named overloads, target-aware evaluation, and the context form, e.g.:

```csharp
// Context version of a power amount
ModCardVars.ComputedPower<StrengthPower>(
    "StrengthCtx",
    static ctx => ctx.BaseValue + ResolveStrengthBonus(ctx),
    baseValue: 2);

// Preview goes through Hook.ModifyPowerAmountGiven
ModCardVars.ComputedPowerAmountGiven<WeakPower>(
    "WeakPower",
    2,
    (card, target) => ResolveWeakAmount(card, target));
```

## Reading Computed Values

### From the owning card

Use the extension methods in your play logic. `EvaluateValueOrDefault` is the unified entry point: computed variables are evaluated for a target, regular variables read `BaseValue`, and missing keys return the default:

```csharp
using MegaCrit.Sts2.Core.Localization.DynamicVars;
using STS2RitsuLib.Cards.DynamicVars;

// Computed variables: evaluate for a target, default when missing
// Regular variables read BaseValue, same as GetValueOrDefault
decimal ctxValue = DynamicVars.EvaluateValueOrDefault("TestCtx");
decimal targetValue = DynamicVars.EvaluateValueOrDefault("TestTarget", target: cardPlay.Target);
decimal energy = DynamicVars.EvaluateValueOrDefault("EnergyGain");
decimal stars = DynamicVars.EvaluateValueOrDefault("StarGain");
decimal power = DynamicVars.EvaluateValueOrDefault("StrengthPower");
```

It checks the `IComputedDynamicVar` interface internally, so all computed subtypes — `Computed`, `ComputedEnergy`, `ComputedStars`, `ComputedPower<T>` — are handled correctly.

### Other common reads

| Extension | Behavior |
| - | - |
| `EvaluateValueOrDefault(key, default, target)` | Evaluates computed vars, reads base value for regular vars, default when missing |
| `GetIntOrDefault(key, default)` | Integer value, default when missing |
| `GetValueOrDefault(key, default)` | Base value, default when missing |
| `HasPositiveValue(key)` | Whether the base value is greater than 0 |
| `TryGet<T>(key, out var)` | Typed try-get |
| `GetRequired<T>(key)` | Throws when missing or type mismatch |

`...OrDefault` / `Try...` never throw for missing keys; `GetRequired` throws exceptions with descriptive messages.

## Complete Example

A full card tying everything together:

```csharp
using MegaCrit.Sts2.Core.Combat;
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Creatures;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.Localization.DynamicVars;
using MegaCrit.Sts2.Core.Models.Cards;
using MegaCrit.Sts2.Core.Models.Powers;
using MegaCrit.Sts2.Core.ValueProps;
using STS2RitsuLib.Cards.DynamicVars;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

[RegisterCard(typeof(TestCardPool))]
public class TestComputedVarCard() : ModCardTemplate(1, CardType.Attack, CardRarity.Uncommon, TargetType.AnyEnemy)
{
    private static decimal ResolveTargetBonus(ICombatState? combatState, Creature? target)
    {
        return target is { } && combatState is { } ? 1m : 0m;
    }

    protected override IEnumerable<DynamicVar> CanonicalVars =>
    [
        // Basic: displayed value = BaseValue (upgrade changes modify BaseValue in OnUpgrade)
        ModCardVars.Computed("TestValue", 3, _ => DynamicVars["TestValue"].BaseValue),

        // Target-aware
        ModCardVars.Computed(
            "TestTarget",
            4,
            (card, target) => DynamicVars["TestTarget"].BaseValue + (target != null ? 1 : 0)),

        // Context
        ModCardVars.Computed(
            "TestCtx",
            static ctx =>
            {
                var heat = ctx.GetCardIntOrDefault("TestHeat");
                var targetBonus = ctx.HasTarget && ctx.IsInCombat
                    ? ResolveTargetBonus(ctx.CombatState, ctx.Target)
                    : 0m;
                return ctx.BaseValue + heat + targetBonus;
            },
            baseValue: 6),

        // Context reading another computed var (recursion-safe)
        ModCardVars.Computed(
            "TestCtxEval",
            static ctx => ctx.EvaluateCardVarOrDefault("TestCtx", 0m) + 1m,
            baseValue: 0),

        // Regular var read by TestCtx
        ModCardVars.Int("TestHeat", 2),

        // Damage wrapper: preview goes through Hook.ModifyDamage
        ModCardVars.ComputedDamage(
            "ExtraDamage",
            6,
            (card, target) => DynamicVars["ExtraDamage"].BaseValue + ResolveTargetBonus(card?.CombatState, target)),

        // Damage + separate preview base factory
        ModCardVars.ComputedDamage(
            "ExtraDamagePreview",
            6,
            (card, target) => DynamicVars["ExtraDamagePreview"].BaseValue,
            (card, mode, target, runGlobalHooks) => DynamicVars["ExtraDamagePreview"].BaseValue + 2m),

        // Osty damage
        ModCardVars.ComputedOstyDamage("OstyDamage", 7, (card, target) => DynamicVars["OstyDamage"].BaseValue),

        // Block wrapper: preview goes through Hook.ModifyBlock
        ModCardVars.ComputedBlock("ExtraBlock", 5, _ => DynamicVars["ExtraBlock"].BaseValue),

        // Context versions of block / energy
        ModCardVars.ComputedBlock(
            "BlockCtx",
            static ctx => ctx.BaseValue + (ctx.HasSourceCreature ? 1m : 0m),
            baseValue: 5),
        ModCardVars.ComputedEnergy(
            "EnergyCtx",
            static ctx => ctx.BaseValue + (ctx.IsPreview ? 1m : 0m),
            baseValue: 1),

        // Energy / star / power icons
        ModCardVars.ComputedEnergy("EnergyGain", 1, _ => DynamicVars["EnergyGain"].BaseValue),
        ModCardVars.ComputedStars("StarGain", 1, _ => DynamicVars["StarGain"].BaseValue),
        ModCardVars.ComputedPower<StrengthPower>("StrengthPower", 2, _ => DynamicVars["StrengthPower"].BaseValue),
        ModCardVars.ComputedPowerAmountGiven<WeakPower>(
            "WeakPower",
            2,
            (card, target) => DynamicVars["WeakPower"].BaseValue),
        ModCardVars.ComputedPower<StrengthPower>(
            "StrengthCtx",
            static ctx => ctx.BaseValue + ResolveStrengthBonus(ctx),
            baseValue: 2),

        // Tooltip
        ModCardVars.Computed("TestTooltip", 3, _ => DynamicVars["TestTooltip"].BaseValue)
            .WithSharedTooltip("MY_MOD_HEAT"),
    ];

    private static decimal ResolveStrengthBonus(ComputedDynamicVarContext ctx)
    {
        return ctx.HasSourceCreature ? 1m : 0m;
    }

    // Play logic
    protected override async Task OnPlay(PlayerChoiceContext choiceContext, CardPlay cardPlay)
    {
        // Read computed values
        var ctxValue = DynamicVars.EvaluateValueOrDefault("TestCtx");
        var ctxEvalValue = DynamicVars.EvaluateValueOrDefault("TestCtxEval");
        var targetValue = DynamicVars.EvaluateValueOrDefault("TestTarget", target: cardPlay.Target);
        var energy = DynamicVars.EvaluateValueOrDefault("EnergyGain");
        var stars = DynamicVars.EvaluateValueOrDefault("StarGain");
        var power = DynamicVars.EvaluateValueOrDefault("StrengthPower");
        var any = DynamicVars.EvaluateValueOrDefault("ExtraDamage", target: cardPlay.Target);
        var fallback = DynamicVars.GetIntOrDefault("NotExists", defaultValue: 42);
        var hasHeat = DynamicVars.HasPositiveValue("TestHeat");

        // Use the computed value in effects
        await DamageCmd.Attack(any)
            .FromCard(this, cardPlay)
            .Targeting(cardPlay.Target!)
            .Execute(choiceContext);
    }

    // Upgrade logic
    protected override void OnUpgrade()
    {
        DynamicVars["TestValue"].UpgradeValueBy(1m);
        DynamicVars["TestHeat"].UpgradeValueBy(1m);
        DynamicVars["ExtraDamage"].UpgradeValueBy(3m);
    }
}
```
