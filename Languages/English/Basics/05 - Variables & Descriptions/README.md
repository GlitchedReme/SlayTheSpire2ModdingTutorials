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

Given how cumbersome and bug-prone this design is, it's generally not recommended. If your base library is `ritsulib`, use `ComputedDynamicVar`. Or write your own custom var that accepts two callback functions, for example (conceptual only, not fully functional):

```csharp
// Conceptual only, not fully functional
public class VariableVar(string name, Func<CardModel, CardPreviewMode, Creature?, bool, decimal> baseValueFunc, Func<CardModel, CardPreviewMode, Creature?, bool, decimal>? previewValueFunc = null) : DynamicVar(name, 0)
{
    private readonly Func<CardModel, CardPreviewMode, Creature?, bool, decimal> _valueFunc = baseValueFunc;
    private readonly Func<CardModel, CardPreviewMode, Creature?, bool, decimal>? _previewValueFunc = previewValueFunc;

    public override void UpdateCardPreview(CardModel card, CardPreviewMode previewMode, Creature? target, bool runGlobalHooks)
    {
        _baseValue = _valueFunc(card, previewMode, target, runGlobalHooks);
        if (_previewValueFunc != null)
            _previewValue = _previewValueFunc(card, previewMode, target, runGlobalHooks);
    }
}
```
