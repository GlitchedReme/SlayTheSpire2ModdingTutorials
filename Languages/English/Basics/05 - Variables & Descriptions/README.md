How to write descriptions for STS2 cards, relics, potions, powers, etc.

## Godot Native

Since descriptions use `RichTextLabel`, all Godot native BBCode works. Reference: https://docs.godotengine.org/en/4.x/tutorials/ui/bbcode_in_richtextlabel.html

Quick overview:

| BBCode | Description | Example |
|-----------|------|------|
| `[b]...[/b]` | Bold | `[b]bold[/b]` |
| `[i]...[/i]` | Italic | `[i]italic[/i]` |
| `[u]...[/u]` | Underline | `[u]underline[/u]` |
| `[color=...]...[/color]` | Text color | `[color=red]red text[/color]` |
| `[font=...]...[/font]` | Font | `[font=Arial]Arial text[/font]` |
| `[font_size=...]...[/font_size]` | Font size | `[font_size=24]large text[/font_size]` |

## Game Custom Tags

| Tag | Effect |
| - | - |
| `[ancient_banner]...[/ancient_banner]` | Ancient banner style |
| `[aqua]...[/aqua]` | Aqua text |
| `[blue]...[/blue]` | Blue text |
| `[fade_in]...[/fade_in]` | Fade-in animation |
| `[fly_in]...[/fly_in]` | Fly-in animation |
| `[gold]...[/gold]` | Gold text |
| `[green]...[/green]` | Green text |
| `[jitter]...[/jitter]` | Jitter animation |
| `[orange]...[/orange]` | Orange text |
| `[pink]...[/pink]` | Pink text |
| `[purple]...[/purple]` | Purple text |
| `[red]...[/red]` | Red text |
| `[sine]...[/sine]` | Sine wave animation |
| `[thinky_dots]...[/thinky_dots]` | Thinking dots animation |
| `[rainbow freq=0.3 sat=0.8 val=1]...[/rainbow]` | Rainbow text |

## Placeholder Variables

Replaced by the corresponding values in the model's `DynamicVars`.

| Name | Corresponding Class | Description | Example |
|------|--------|------|------|
| `{Damage}` | `DamageVar` | Damage | `Deal {Damage:diff()} damage.` |
| `{Block}` | `BlockVar` | Block | `Gain {Block:diff()} Block.` |
| `{Cards}` | `CardsVar` | Card count | `Draw {Cards:diff()} card(s).` |
| `{Energy}` | `EnergyVar` | Energy (dynamic value) | `Gain {Energy:energyIcons()}.` |
| `{energyPrefix}` | - | Energy (fixed value) | `Gain {energyPrefix:energyIcons(1)}.` |
| `{Repeat}` | `RepeatVar` | Repeat count | `Deal {Damage:diff()} damage {Repeat:diff()} times.` |
| `{Heal}` | `HealVar` | Healing | `Heal {Heal:diff()} HP.` |
| `{HpLoss}` | `HpLossVar` | HP loss | `Lose {HpLoss:diff()} HP.` |
| `{MaxHp}` | `MaxHpVar` | Max HP | `Gain {MaxHp:diff()} Max HP.` |
| `{Gold}` | `GoldVar` | Gold | `Gain {Gold:diff()} Gold.` |
| `{Summon}` | `SummonVar` | Summon | `Summon {Summon:diff()}.` |
| `{Forge}` | `ForgeVar` | Forge | `Forge {Forge:diff()}.` |
| `{Stars}` | `StarsVar` | Stars | `Gain {Stars:starIcons()}.` |
| `{StrengthPower}` | `PowerVar<StrengthPower>` | Strength | `Gain {StrengthPower:diff()} Strength.` |
| `{DexterityPower}` | `PowerVar<DexterityPower>` | Dexterity | `Gain {DexterityPower:diff()} Dexterity.` |
| `{WeakPower}` | `PowerVar<WeakPower>` | Weak | `Apply {WeakPower:diff()} Weak.` |
| `{VulnerablePower}` | `PowerVar<VulnerablePower>` | Vulnerable | `Apply {VulnerablePower:diff()} Vulnerable.` |
| `{PoisonPower}` | `PowerVar<PoisonPower>` | Poison | `Apply {PoisonPower:diff()} Poison.` |
| `{DoomPower}` | `PowerVar<DoomPower>` | Doom | `Apply {DoomPower:diff()} Doom.` |
| `{CalculatedDamage}` | `CalculatedDamageVar` | Calculated damage amount | `(Deal {CalculatedDamage:diff()} damage)` |
| `{CalculatedBlock}` | `CalculatedBlockVar` | Calculated block amount | `(Gain {CalculatedBlock:diff()} Block)` |


## Formatters

Format a variable's display using the `SmartFormat` library.

For example, `{Energy:energyIcons()}` renders n energy icons, where n is the `Energy` value. See the corresponding formatter class for details.

Game custom formatters:

| Name | Description | Example |
|-----------|------|------|
| `diff()` | Green if above base, red if below. For combat or upgrade preview. | `Deal {Damage:diff()} damage.` |
| `inverseDiff()` | Red if above base, green if below. | `Lose {HpLoss:inverseDiff()} HP.` |
| `energyIcons()` | Render value as energy icons. | `Gain {Energy:energyIcons()}.` |
| `starIcons()` | Render value as star icons. | `Gain {Stars:starIcons()}.` |
| `IfUpgraded:show` | Show different text based on upgrade state. | `{IfUpgraded:show:upgraded text\|unupgraded text}` |
| `abs` | Absolute value. | `{Damage:abs()}` |
| `percentMore()` / `percentLess()` | Percentage. `PercentMore` turns 1.25 into 25%. `PercentLess` turns 0.75 into 25%. | `Deal {Boost:percentMore()}% extra damage.` |

`SmartFormat` built-in formatters:

https://github.com/axuno/SmartFormat/wiki

| Name | Description | Example |
|-----------|------|------|
| `cond` | Conditional branch, e.g. `{X:cond:>0?active\|inactive}` | `{FanOfKnivesAmount:cond:>0? to ALL enemies\|} deal {Damage:diff()} damage.` |
| `choose` | Select branch by index or value, e.g. `{X:choose(1\|2\|3):one\|two\|three\|other}` — X=1,2,3 picks the matching string, any other value picks "other". | `The next {Skills:choose(1):one\|{:diff()}} Skill you play is played twice.` |
| `plural` | Pluralization. | In English: `Draw {Cards:diff()} {Cards:plural:card\|cards}.` |
| `list` | Joining. | https://github.com/axuno/SmartFormat/wiki/v2-Lists |

See the wiki for the rest.

## Card-Specific

Cards have extra context variables:

| Name | Meaning | Typical Usage |
| - | - | - |
| `singleStarIcon` | Star icon | `Whenever you gain {singleStarIcon}` |
| `InCombat` | Whether in combat | `{InCombat:\n(Hit {CalculatedHits:diff()} times)\|}` |
| `IsTargeting` | Whether currently targeting | `{IsTargeting:\n(Deal {CalculatedDamage:diff()} damage)\|}` |
| `OnTable` | Whether card is in hand or play area | `{OnTable:on the table\|not on the table}` |
| `IfUpgraded` | Whether upgraded | `[gold]Upgrade[/gold] {IfUpgraded:show:all cards\|a card} in your [gold]hand[/gold].` |

## Power-Specific

Power tooltip localization usually has three entries: `description`, `smartDescription`, and for multiplayer, `remoteDescription`.

- **`description`**: Static description. Used when the power is non-variable (e.g. the card tooltip shows non-smart text). No special variables.
- **`smartDescription`**: Dynamic description. Used when the power is variable (hovering over the player character) and `smartDescription` is configured. Injects the runtime variables listed below, plus `DynamicVars`.
- **`remoteDescription`**: Multiplayer only. When a power is applied by someone else (`Applier` exists and is not the local player) and this key is configured, it replaces `smartDescription`.

Runtime variables available in `smartDescription` / `remoteDescription`:

| Name | Meaning | Typical Usage |
| - | - | - |
| `Amount` | Current stacks/value | `Gain [blue]{Amount}[/blue] [gold]Strength[/gold].` |
| `OnPlayer` | Whether the owner is a player | `{OnPlayer:You\|This enemy} gain {Amount} Strength.` |
| `IsMultiplayer` | Whether the fight is multiplayer | `{IsMultiplayer: (multiplayer)\|}` |
| `PlayerCount` | Number of players in this fight | `There are {PlayerCount} players in the fight.` |
| `OwnerName` | Owner's name | `{OwnerName} gains {Amount} Strength.` |
| `ApplierName` | Applier's name | `Applied by {ApplierName}.` |
| `TargetName` | Target's name | `Affects {TargetName}.` |

## LocString

`LocString` is the game's localized string class, commonly used for localizing description text. All localized text follows this pattern:

```csharp
LocString description = new LocString("powers", base.Id.Entry + ".description"); // Fetch localized text from powers.json
// Inject variables. For example, this replaces {Amount} and other placeholders with actual values
description.Add("Amount", amountOverride ?? Amount); 
description.Add("singleStarIcon", "[img]res://images/packed/sprite_fonts/star_icon.png[/img]");
description.Add("energyPrefix", EnergyIconHelper.GetPrefix(this));
// Use .GetFormattedText() to get the final formatted text
stringBuilder.Append(description.GetFormattedText());
```

## DynamicVar

`DynamicVar` records a named value on a model. Use `CanonicalVars` to specify a model's initial values:

```csharp
protected override IEnumerable<DynamicVar> CanonicalVars => [
        new DamageVar(12, ValueProp.Move)
    ];
```

- After that, access or modify the value via `DynamicVars["Damage"].BaseValue`, since `DamageVar`'s ID is `"Damage"`.

- Decompile to see each var's ID. You can also pass a custom ID as the first constructor argument, e.g. `new DamageVar("TestDamage", 12, ValueProp.Move)`.

- `DynamicVars` also has convenience accessors for vanilla properties, like `DynamicVars.Damage`.

## CalculatedVar

A special var type, `CalculatedVar`, uses the formula `base + extra * calculated`. Example — Body Slam:

```csharp
	protected override IEnumerable<DynamicVar> CanonicalVars => new global::_003C_003Ez__ReadOnlyArray<DynamicVar>(new DynamicVar[3]
	{
		new CalculationBaseVar(0m),
		new ExtraDamageVar(1m),
		new CalculatedDamageVar(ValueProp.Move).WithMultiplier((CardModel card, Creature? _) => card.Owner.Creature.Block)
	});
```

This means: base 0, plus 1x the owner's Block as extra damage. If you use a `CalculatedVar`, you must also provide the corresponding `base` and `extra` vars.

Given how cumbersome and bug-prone this design is, it's generally not recommended. If your base library is `ritsulib`, use `ComputedDynamicVar`.

### ComputedDynamicVar (RitsuLib only)

`ComputedDynamicVar` is a `DynamicVar` subclass provided by RitsuLib, suited for scenarios where the display value needs to be dynamically computed based on target, upgrade state, preview mode, etc.

#### Basic Usage

Use `ModCardVars.Computed()` to create a computed variable, passing in the variable name, fallback base value, and computation delegate:

```csharp
using MegaCrit.Sts2.Core.Localization.DynamicVars;
using STS2RitsuLib.Cards.DynamicVars;

public class MyStrike : ModCardTemplate(1, CardType.Attack, CardRarity.Common, TargetType.SingleEnemy)
{
    public override DynamicVarSet DynamicVars => [
        // Computed variable: show 5 when upgraded, 3 otherwise
        ModCardVars.Computed("TestValue", 3, card => card?.Upgraded == true ? 5 : 3),
    ];
}
```

#### Wrappers

If you're computing damage or block values and want the preview to still go through vanilla modification pipelines, use `ComputedDamage` and `ComputedBlock` instead of plain `Computed`:

```csharp
public override DynamicVarSet DynamicVars => new()
{
    // BonusDamage is implemented by you.
    // Preview goes through Hook.ModifyDamage (Strength, Vulnerable, etc.)
    ModCardVars.ComputedDamage("ExtraDamage", 6, (card, target) => DynamicVars["ExtraDamage"].BaseValue + BonusDamage(card, target)),
    // Preview goes through Hook.ModifyBlock (Dexterity, Frail, etc.)
    ModCardVars.ComputedBlock("ExtraBlock", 5, card => DynamicVars["ExtraBlock"].BaseValue + BonusBlock(card)),
};
```

There are also `ComputedEnergy`, `ComputedStars`, `ComputedPower`, etc.

`ComputedPower<T>` does **not** go through power amount modification hooks by default. If your computed value represents power being applied by the card and should use the same preview hook path as vanilla `PowerVar<T>` (e.g. `Hook.ModifyPowerAmountGiven`), use `ComputedPowerAmountGiven<T>`:

```csharp
// Preview goes through Hook.ModifyPowerAmountGiven
ModCardVars.ComputedPowerAmountGiven<WeakPower>(
    baseValue: 2,
    currentValueFactory: (card, target) => ResolveWeakAmount(card, target));
```

#### Reading Computed Values

When you need to read a `ComputedDynamicVar`'s current value from another card, use the extension method `ComputeDynamicValue`:

```csharp
// Read ComputedDynamicVar's computed value; returns default when missing
decimal damage = card.DynamicVars.ComputeDynamicValue("CalcDamage", defaultValue: 0m, target: enemy);

// Similarly for other computed variable types
decimal energy = card.DynamicVars.ComputeEnergyValue("EnergyGain");
decimal stars = card.DynamicVars.ComputeStarsValue("StarGain");
decimal power = card.DynamicVars.ComputePowerValue<StrengthPower>("StrengthPower");
```
