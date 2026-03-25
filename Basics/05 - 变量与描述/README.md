这里介绍如何编写塔2的卡牌、遗物、药水、能力等的描述。

## Godot原生

由于是`RichTextLabel`，Godot原生的bbcode都可以使用，参考 https://docs.godotengine.org/zh-cn/4.x/tutorials/ui/bbcode_in_richtextlabel.html 。

速览：

| BBCode | 说明 | 示例 |
|-----------|------|------|
| `[b]...[/b]` | 粗体 | `[b]bold[/b]` |
| `[i]...[/i]` | 斜体 | `[i]italic[/i]` |
| `[u]...[/u]` | 下划线 | `[u]underline[/u]` |
| `[color=...]...[/color]` | 文字颜色 | `[color=red]red text[/color]` |
| `[font=...]...[/font]` | 字体 | `[font=Arial]Arial text[/font]` |
| `[size=...]...[/size]` | 字号 | `[size=24]large text[/size]` |

## 游戏自定义tag

| 标签名 | 作用 |
| - | - |
| [ancient_banner]...[/ancient_banner] | 古代横幅风格 |
| [aqua]...[/aqua] | 水绿色文字 |
| [blue]...[/blue] | 蓝色文字 |
| [fade_in]...[/fade_in] | 渐显动画效果 |
| [fly_in]...[/fly_in] | 飞入动画效果 |
| [gold]...[/gold] | 金色文字 |
| [green]...[/green] | 绿色文字 |
| [jitter]...[/jitter] | 抖动动画效果 |
| [orange]...[/orange] | 橙色文字 |
| [pink]...[/pink] | 粉色文字 |
| [purple]...[/purple] | 紫色文字 |
| [red]...[/red] | 红色文字 |
| [sine]...[/sine] | 正弦波动动画效果 |
| [thinky_dots]...[/thinky_dots] | 思考点点动画效果 |

## 占位变量

会被model中的dynamicvars中的对应数值替换。

| 名称 | 说明 | 示例 |
|-----------|------|------|
| `{Damage}` | 伤害 | `造成{Damage:diff()}点伤害。` |
| `{Block}` | 格挡 | `获得{Block:diff()}点格挡。` |
| `{Cards}` | 卡牌数量 | `抽{Cards:diff()}张牌。` |
| `{Energy}` | 能量（动态值） | `获得{Energy:energyIcons()}。` |
| `{energyPrefix}` | 能量（固定数值） | `获得{energyPrefix:energyIcons(1)}。` |
| `{Repeat}` | 重复次数 | `造成{Damage:diff()}点伤害{Repeat:diff()}次。` |
| `{Heal}` | 治疗 | `回复{Heal:diff()}点生命。` |
| `{HpLoss}` | 失去生命 | `失去{HpLoss:Diff()}点生命。` |
| `{MaxHp}` | 最大生命 | `获得{MaxHp:diff()}点最大生命。` |
| `{Gold}` | 金币 | `获得{Gold:diff()}金币。` |
| `{Summon}` | 召唤 | `召唤{Summon:diff()}。` |
| `{Forge}` | 铸造 | `铸造{Forge:diff()}。` |
| `{Stars}` | 辉星 | `获得{Stars:starIcons()}。` |
| `{StrengthPower}` | 力量 | `获得{StrengthPower:diff()}点力量。` |
| `{DexterityPower}` | 敏捷 | `获得{DexterityPower:diff()}点敏捷。` |
| `{WeakPower}` | 虚弱 | `给予{WeakPower:diff()}层虚弱。` |
| `{VulnerablePower}` | 易伤 | `给予{VulnerablePower:diff()}层易伤。` |
| `{PoisonPower}` | 中毒 | `给予{PoisonPower:diff()}层中毒。` |
| `{DoomPower}` | 灾厄 | `给予{DoomPower:diff()}层灾厄。` |
| `{CalculatedDamage}` | 计算出的伤害量 | `（造成{CalculatedDamage:diff()}点伤害）` |
| `{CalculatedBlock}` | 计算出的格挡值 | `（获得{CalculatedBlock:diff()}点格挡）` |

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
| `percentMore()` / `percentLess()` | 百分比 | `额外造成{Boost:percentMore()}伤害。` |

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
| `energyPrefix` | 能量图标 | `{energyPrefix:energyIcons(1)}` |
| `singleStarIcon` | 星星图标 | `每获得{singleStarIcon}时` |
| `InCombat` | 是否处于战斗 | `{InCombat:\n（命中{CalculatedHits:diff()}次）\|}` |
| `IsTargeting` | 当前是否有目标 | `{IsTargeting:\n（造成{CalculatedDamage:diff()}）\|}` |
| `OnTable` | 牌是否在手牌或出牌区 | `{OnTable:cond:true?在场上\|不在场上}` |
| `{IfUpgraded}` | 是否升级 | `[gold]升级[/gold]你[gold]手牌[/gold]中的{IfUpgraded:show:所有牌\|一张牌}。` |


## DynamicVar

TODO: 如何进行各种复杂的伤害计算