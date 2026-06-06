这里介绍如何编写塔2的卡牌、遗物、药水、能力等的描述。

## Godot原生

由于描述是`RichTextLabel`，Godot原生的bbcode都可以使用，参考 https://docs.godotengine.org/zh-cn/4.x/tutorials/ui/bbcode_in_richtextlabel.html 。

速览：

| BBCode | 说明 | 示例 |
|-----------|------|------|
| `[b]...[/b]` | 粗体 | `[b]bold[/b]` |
| `[i]...[/i]` | 斜体 | `[i]italic[/i]` |
| `[u]...[/u]` | 下划线 | `[u]underline[/u]` |
| `[color=...]...[/color]` | 文字颜色 | `[color=red]red text[/color]` |
| `[font=...]...[/font]` | 字体 | `[font=Arial]Arial text[/font]` |
| `[font_size=...]...[/font_size]` | 字号 | `[font_size=24]large text[/font_size]` |

## 游戏自定义tag

| 标签名 | 作用 |
| - | - |
| `[ancient_banner]...[/ancient_banner]` | 先古之民横幅风格 |
| `[aqua]...[/aqua]` | 水绿色文字 |
| `[blue]...[/blue]` | 蓝色文字 |
| `[fade_in]...[/fade_in]` | 渐显动画效果 |
| `[fly_in]...[/fly_in]` | 飞入动画效果 |
| `[gold]...[/gold]` | 金色文字 |
| `[green]...[/green]` | 绿色文字 |
| `[jitter]...[/jitter]` | 抖动动画效果 |
| `[orange]...[/orange]` | 橙色文字 |
| `[pink]...[/pink]` | 粉色文字 |
| `[purple]...[/purple]` | 紫色文字 |
| `[red]...[/red]` | 红色文字 |
| `[sine]...[/sine]` | 正弦波动动画效果 |
| `[thinky_dots]...[/thinky_dots]` | 思考点点动画效果 |
| `[rainbow freq=0.3 sat=0.8 val=1]...[/rainbow]` | 彩虹文字 |

## 占位变量

会被model中的dynamicvars中的对应数值替换。

| 名称 | 对应类 | 说明 | 示例 |
|------|--------|------|------|
| `{Damage}` | `DamageVar` | 伤害 | `造成{Damage:diff()}点伤害。` |
| `{Block}` | `BlockVar` | 格挡 | `获得{Block:diff()}点格挡。` |
| `{Cards}` | `CardsVar` | 卡牌数量 | `抽{Cards:diff()}张牌。` |
| `{Energy}` | `EnergyVar` | 能量（动态值） | `获得{Energy:energyIcons()}。` |
| `{energyPrefix}` | - | 能量（固定数值） | `获得{energyPrefix:energyIcons(1)}。` |
| `{Repeat}` | `RepeatVar` | 重复次数 | `造成{Damage:diff()}点伤害{Repeat:diff()}次。` |
| `{Heal}` | `HealVar` | 治疗 | `回复{Heal:diff()}点生命。` |
| `{HpLoss}` | `HpLossVar` | 失去生命 | `失去{HpLoss:diff()}点生命。` |
| `{MaxHp}` | `MaxHpVar` | 最大生命 | `获得{MaxHp:diff()}点最大生命。` |
| `{Gold}` | `GoldVar` | 金币 | `获得{Gold:diff()}金币。` |
| `{Summon}` | `SummonVar` | 召唤 | `召唤{Summon:diff()}。` |
| `{Forge}` | `ForgeVar` | 铸造 | `铸造{Forge:diff()}。` |
| `{Stars}` | `StarsVar` | 辉星 | `获得{Stars:starIcons()}。` |
| `{StrengthPower}` | `PowerVar<StrengthPower>` | 力量 | `获得{StrengthPower:diff()}点力量。` |
| `{DexterityPower}` | `PowerVar<DexterityPower>` | 敏捷 | `获得{DexterityPower:diff()}点敏捷。` |
| `{WeakPower}` | `PowerVar<WeakPower>` | 虚弱 | `给予{WeakPower:diff()}层虚弱。` |
| `{VulnerablePower}` | `PowerVar<VulnerablePower>` | 易伤 | `给予{VulnerablePower:diff()}层易伤。` |
| `{PoisonPower}` | `PowerVar<PoisonPower>` | 中毒 | `给予{PoisonPower:diff()}层中毒。` |
| `{DoomPower}` | `PowerVar<DoomPower>` | 灾厄 | `给予{DoomPower:diff()}层灾厄。` |
| `{CalculatedDamage}` | `CalculatedDamageVar` | 计算出的伤害量 | `（造成{CalculatedDamage:diff()}点伤害）` |
| `{CalculatedBlock}` | `CalculatedBlockVar` | 计算出的格挡值 | `（获得{CalculatedBlock:diff()}点格挡）` |


## formatter

用于格式化一个变量的表现形式，使用`SmartFormat`库。

例如`{Energy:energyIcons()}`表示展示n个能量图标，n为`Energy`的数值。具体逻辑查看对应的formatter类。

游戏自定义的formatter：

| 名称 | 说明 | 示例 |
|-----------|------|------|
| `diff()` | 高于基础变绿，低于基础变红。用于战斗或者升级预览 | `造成{Damage:diff()}点伤害。` |
| `inverseDiff()` | 高于基础变红，低于基础变绿 | `失去{HpLoss:inverseDiff()}点生命。` |
| `energyIcons()` | 把数值渲染成能量 | `获得{Energy:energyIcons()}。` |
| `starIcons()` | 把数值渲染为辉星 | `获得{Stars:starIcons()}。` |
| `IfUpgraded:show` | 根据升级情况显示不同文本 | `{IfUpgraded:show:升级文本\|未升级文本}` |
| `abs` | 绝对值 | `{Damage:abs()}` |
| `percentMore()` / `percentLess()` | 百分比。<br>`PercentMore`把1.25变成25%。<br>`PercentLess`把0.75变成25%。 | `额外造成{Boost:percentMore()}%伤害。` |

`SmartFormat`的内置formatter：

https://github.com/axuno/SmartFormat/wiki

| 名称 | 说明 | 示例 |
|-----------|------|------|
| `cond` | 条件分支，例如`{X:cond:>0?生效\|不生效}` | `{FanOfKnivesAmount:cond:>0? 对所有敌人\|}造成{Damage:diff()}点伤害。` |
| `choose` | 按索引或值选择分支，例如`{X:choose(1\|2\|3):one\|two\|three\|other}`，X为1、2、3时分别为对应值，为其他值时为other | `你打出的下{Skills:choose(1):一\|{:diff()}}张技能牌会被额外打出一次。` |
| `plural` | 复数 | 英语环境下，`Draw {Cards:diff()} {Cards:plural:card\|cards}.` |
| `list` | 拼接 | https://github.com/axuno/SmartFormat/wiki/v2-Lists |

其他的参考wiki。

## 卡牌独有

卡牌有一些额外的上下文变量，例如：

| 名称 | 含义 | 典型写法 |
| - | - | - |
| `singleStarIcon` | 星星图标 | `每当你获得{singleStarIcon}时` |
| `InCombat` | 是否处于战斗 | `{InCombat:\n（命中{CalculatedHits:diff()}次）\|}` |
| `IsTargeting` | 当前是否有目标 | `{IsTargeting:\n（造成{CalculatedDamage:diff()}点伤害）\|}` |
| `OnTable` | 牌是否在手牌或出牌区 | `{OnTable:在场上\|不在场上}` |
| `IfUpgraded` | 是否升级 | `[gold]升级[/gold]你[gold]手牌[/gold]中的{IfUpgraded:show:所有牌\|一张牌}。` |

## 能力独有

能力的提示本地化里通常写三条：`description`、`smartDescription`，联机时还可写 `remoteDescription`。

- **`description`**：静态描述。能力非可变（例如从卡牌弹出的这个能力的提示显示非smart文本）使用，没有任何独有变量。
- **`smartDescription`**：动态描述。能力可变（悬浮玩家角色弹出的提示）且配置了 `smartDescription` 时使用，会注入下文列出的运行时变量并叠加 `DynamicVars`。
- **`remoteDescription`**：联机专用。当能力由他人施加（`Applier` 存在且不是本地玩家）且配置了该键时，用其替换 `smartDescription`。

`smartDescription` / `remoteDescription` 可用的运行时变量：

| 名称 | 含义 | 典型写法 |
| - | - | - |
| `Amount` | 当前层数/数值 | `获得[blue]{Amount}[/blue]点[gold]力量[/gold]。` |
| `OnPlayer` | 持有者是否为玩家 | `{OnPlayer:你\|该敌人}获得{Amount}点力量。` |
| `IsMultiplayer` | 本场战斗是否多人 | `{IsMultiplayer:（联机）\|}` |
| `PlayerCount` | 本场战斗玩家数量 | `场上共有{PlayerCount}名玩家。` |
| `OwnerName` | 持有者名称 | `{OwnerName}获得{Amount}点力量。` |
| `ApplierName` | 施加者名称 | `由{ApplierName}施加。` |
| `TargetName` | 目标名称 | `对{TargetName}生效。` |

## DynamicVar

`DynamicVar`是记录在一个model上的指定值。使用`CanonicalVars`指定这个model的各种初始值，例如：

```csharp
protected override IEnumerable<DynamicVar> CanonicalVars => [
        new DamageVar(12, ValueProp.Move)
    ];
```

- 那之后就可以用`DynamicVars["Damage"].BaseValue`来获得或者修改这个值，因为`DamageVar`的ID是"Damage"。

- 你可以反编译查看每个var的id是什么。一般这些var也可以通过传入第一个参数设置ID，例如`new DamageVar("TestDamage", 12, ValueProp.Move)`。

- 特殊的，`DynamicVars`有便捷的方法来获得原版的属性，例如`DynamicVars.Damage`。

## CalculatedVar

此外有一种特殊的var为`CalculatedVar`，其公式为`base + extra * calculated`，例如全身撞击：

```csharp
	protected override IEnumerable<DynamicVar> CanonicalVars => new global::_003C_003Ez__ReadOnlyArray<DynamicVar>(new DynamicVar[3]
	{
		new CalculationBaseVar(0m),
		new ExtraDamageVar(1m),
		new CalculatedDamageVar(ValueProp.Move).WithMultiplier((CardModel card, Creature? _) => card.Owner.Creature.Block)
	});
```

就是基础值为0，额外增加1倍自己格挡值的伤害。如果你要使用一个`CalculatedVar`，那么另外两个`base`和`extra`的var必须也要写。

由于其设计过于繁琐而且问题不少，一般不推荐使用。如果你前置库为`ritsulib`可以使用`ComputedDynamicVar`，或者自行写一个传入双回调函数的自定义var也可，例如：（仅供思路展示，不可完全正常运作）

```csharp
// 仅供思路展示，不可完全正常运作
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