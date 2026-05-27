---
title: LocString 占位符
date: 2026-05-25 23:00:30
permalink: docs/04-ritsulib/04-36-locstring-placeholders/
author: alkaid616
categories:
- Basics
---
`LocString` 是游戏内容文本的主通道。卡牌描述、遗物描述、事件选项、hover tip 和大多数原版 UI 文本都会从本地化表取原始字符串，再把 `{...}` 占位符交给游戏的格式化管线解析。

这一章只讲“占位符从哪里来、怎么命名、缺了以后怎么排查”。普通内容 key 和 I18N 已经在上一章讲过。

## 卡牌数值占位符

卡牌描述里的数值占位符通常来自 `DynamicVars`。

```csharp
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Localization.DynamicVars;
using MegaCrit.Sts2.Core.Models.Cards;
using MegaCrit.Sts2.Core.ValueProps;
using STS2RitsuLib.Cards.DynamicVars;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

public sealed class TestStrike
    : ModCardTemplate(1, CardType.Attack, CardRarity.Common, TargetType.SingleEnemy)
{
    protected override IEnumerable<DynamicVar> CanonicalVars =>
    [
        new DamageVar(10, ValueProp.Move),
        ModCardVars.Int("bleed", 2),
    ];
}
```

`cards/zhs.json`：

```json
{
  "TEST_CARD_TEST_STRIKE.title": "测试打击",
  "TEST_CARD_TEST_STRIKE.description": "造成 {Damage} 点伤害。施加 {bleed} 层流血。"
}
```

`DamageVar` 这种原版变量通常使用它自己的标准名称；你自己创建的变量名建议使用小写语义名，例如 `bleed`、`heat`、`copies`。发布后不要随意改名，否则旧文本、其它 Mod 的兼容和翻译都要跟着改。

## 计算型变量

如果显示值不是一个固定字段，而是依赖升级、目标或预览状态，用 `ModCardVars.Computed(...)`。

```csharp
protected override IEnumerable<DynamicVar> CanonicalVars =>
[
    ModCardVars.Computed(
        "echo",
        1,
        card => card?.Upgraded == true ? 2 : 1),
];
```

带目标的版本：

```csharp
protected override IEnumerable<DynamicVar> CanonicalVars =>
[
    ModCardVars.Computed(
        "bonus",
        0,
        static (card, target) =>
            target is { CurrentHp: < 20 } ? 5 : 0),
];
```

预览值和实战值不一样时，再传 `previewValueFactory`。不要为了一个固定数值写 source 或 formatter，`DynamicVar` 更直观。

## 字符串变量

少量状态词可以用字符串变量：

```csharp
protected override IEnumerable<DynamicVar> CanonicalVars =>
[
    ModCardVars.String("mode", Upgraded ? "强化" : "普通"),
];
```

```json
{
  "TEST_CARD_MODE_SHIFT.description": "当前模式：{mode}。"
}
```

字符串变量适合短词，不适合塞整句描述。整句仍然应该放本地化表里，让翻译者控制语序。

## 给变量挂 Hover Tip

变量本身也能有 hover tip。最常见的是指向 `static_hover_tips`：

```csharp
protected override IEnumerable<DynamicVar> CanonicalVars =>
[
    ModCardVars.Int("heat", 3)
        .WithSharedTooltip(
            "TEST_HEAT",
            "res://Test/images/ui/heat.png"),
];
```

`static_hover_tips/zhs.json`：

```json
{
  "TEST_HEAT.title": "热量",
  "TEST_HEAT.description": "部分卡牌会根据热量改变效果。"
}
```

需要更特殊的 tooltip 时，用 `.WithTooltip(...)` 传工厂。

## 事件和选项占位符

事件文本 key 由事件 Entry、页面名和选项名组成。占位符依然写在对应字符串里。

```json
{
  "TEST_EVENT_QUIET_DOOR.pages.INITIAL.description": "门缝里透出 {gold} 枚金币的光。",
  "TEST_EVENT_QUIET_DOOR.pages.INITIAL.options.TAKE": "[拿走] 获得 {gold} 枚金币。"
}
```

页面名和选项名是文本契约的一部分。改 `INITIAL`、`TAKE` 这种名字，等同于改本地化 key。

如果这个数值来自事件类，优先使用事件模板提供的 key 构造辅助方法，例如 `InitialOptionKey(...)` 和 `ModOptionKey(...)`。不要在代码里拼一份看起来差不多的字符串。

## 设置页文本

设置页不一定走原版 `LocString`。RitsuLib 的设置页文本使用 `ModSettingsText`：

```csharp
using MegaCrit.Sts2.Core.Localization;
using STS2RitsuLib.Settings;

var literal = ModSettingsText.Literal("启用");
var i18n = ModSettingsText.I18N(TestUiText.Text, "settings.enabled", "启用");
var loc = ModSettingsText.LocString(
    new LocString("static_hover_tips", "TEST_HEAT.title"),
    fallback: "热量");
var dynamicText = ModSettingsText.Dynamic(() => $"已导出 {ExportCount} 张图片");
```

固定文本用 `Literal`；你的 UI JSON 用 `I18N`；已经存在于游戏表里的文本用 `LocString`；运行时计数或状态用 `Dynamic`。

## SmartFormat 的位置

SmartFormat 扩展适合“同一种格式化规则要被很多文本复用”。比如上一章的 `test_percent` formatter 可以让多个文本写：

```json
{
  "TEST_CARD_PRECISION.description": "暴击率为 {CritChance:test_percent}。"
}
```

`CritChance` 这个值仍然要由 `DynamicVar`、上下文 source 或原版对象提供；formatter 只负责把已有值格式化成字符串。

## 命名建议

| 场景 | 建议 |
| - | - |
| 内容 Entry | 用 RitsuLib 生成的稳定公开 Entry |
| DynamicVar | 小写语义名，例如 `damage`、`heat`、`bleed` |
| 事件页面/选项 | 使用稳定的大写枚举式名字，例如 `INITIAL`、`LEAVE` |
| I18N key | 按 UI 结构命名，例如 `settings.enabled` |
| SmartFormat formatter | 加 Mod 前缀，例如 `test_percent` |

面向玩家的文本里不要出现类名、方法名、补丁名或内部 id。它们可以出现在 key 里，但不该出现在翻译文本里。

## 排查

* 文本完全不显示：先确认 table 名和 key 是否存在。
* `{Damage}` 原样显示：检查卡牌是否暴露了对应 `DynamicVar`。
* 数值为 0：检查变量当前值、升级逻辑和预览逻辑是否更新。
* hover tip 缺失：检查 `static_hover_tips` 的 `.title` 和 `.description` 是否都存在。
* formatter 没生效：检查是否在文本首次解析前注册，formatter `Name` 是否和 JSON 中一致。
