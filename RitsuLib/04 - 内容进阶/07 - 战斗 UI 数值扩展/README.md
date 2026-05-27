这一章只讲两个更细的战斗 UI 扩展点：图标角标和血条预告。

已有的“血条覆盖”教程讲的是在血条节点上挂自己的视觉层；这里讲的是 RitsuLib 已经接入原版战斗 UI 的小数值：能力、遗物、意图图标角落的额外数字，以及像中毒、末日那样贴在血条上的预告条。

## 能力图标角标

给能力实现 `IPowerExtraIconAmountLabelSpecsProvider`。RitsuLib 会在 `NPower` 刷新时读取这些 spec，并把它们放到指定角落。

```csharp
using Godot;
using MegaCrit.Sts2.Core.Entities.Powers;
using STS2RitsuLib.Combat.Ui.ExtraCornerAmountLabels;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

[RegisterPower]
public sealed class TestMeterPower
    : ModPowerTemplate, IPowerExtraIconAmountLabelSpecsProvider
{
    public override PowerType Type => PowerType.Buff;

    public override PowerStackType StackType => PowerStackType.Counter;

    public override PowerAssetProfile AssetProfile => new(
        IconPath: "res://Test/images/powers/test_meter.png",
        BigIconPath: "res://Test/images/powers/test_meter.png");

    public IReadOnlyList<ExtraIconAmountLabelSpec> GetPowerExtraIconAmountLabelSpecs()
    {
        return
        [
            ExtraIconAmountLabelSpec.Plain(
                ExtraIconAmountLabelCorner.TopLeft,
                Amount.ToString()),
            ExtraIconAmountLabelSpec.RichText(
                ExtraIconAmountLabelCorner.BottomLeft,
                "[color=gold]x2[/color]"),
        ];
    }
}
```

如果只需要纯文本，也可以实现 `IPowerExtraIconAmountLabelsProvider` 并返回 `ExtraIconAmountLabelSlot`。当同一个能力同时实现 slot provider 和 spec provider 时，RitsuLib 优先使用 spec provider，因为它能声明普通文本或富文本。

可选角落：

| 位置 | 说明 |
| - | - |
| `TopLeft` | 左上角，适合额外层数或回合数 |
| `TopRight` | 右上角，适合小标记 |
| `BottomLeft` | 左下角，适合副计数 |
| `BottomRight` | 右下角，原版常用于主计数，谨慎占用 |
| `Custom` | 自己提供 `Rect2`，适合特殊图标 |

## 遗物角标

遗物写法一样，只是接口换成 `IRelicExtraIconAmountLabelSpecsProvider`。

```csharp
using MegaCrit.Sts2.Core.Entities.Relics;
using STS2RitsuLib.Combat.Ui.ExtraCornerAmountLabels;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

public sealed class TestCounterRelic
    : ModRelicTemplate, IRelicExtraIconAmountLabelSpecsProvider
{
    private int _charges;

    public override RelicRarity Rarity => RelicRarity.Common;

    public override RelicAssetProfile AssetProfile => new(
        IconPath: "res://Test/images/relics/test_counter.png",
        IconOutlinePath: "res://Test/images/relics/test_counter_outline.png",
        BigIconPath: "res://Test/images/relics/test_counter_big.png");

    public IReadOnlyList<ExtraIconAmountLabelSpec> GetRelicExtraIconAmountLabelSpecs()
    {
        return
        [
            ExtraIconAmountLabelSpec.Plain(
                ExtraIconAmountLabelCorner.TopLeft,
                _charges.ToString()),
        ];
    }

    private void SetCharges(int value)
    {
        _charges = value;
        InvokeDisplayAmountChanged();
    }
}
```

角标刷新通常跟随原版 `DisplayAmountChanged`。如果你的角标不依赖 `DisplayAmount`，也可以实现 `IRelicExtraIconAmountLabelsChangeSource`，在内部状态变化时触发 `RelicExtraIconAmountLabelsInvalidated`。

## 意图角标

怪物意图需要在你的 `AbstractIntent` 子类上实现接口。这个适合显示“这次攻击会额外造成几次触发”之类的辅助信息。

```csharp
using STS2RitsuLib.Combat.Ui.ExtraCornerAmountLabels;

namespace Test.Scripts;

public sealed class TestIntent : AbstractIntent, IIntentExtraCornerAmountLabelsProvider
{
    public IReadOnlyList<ExtraIconAmountLabelSlot> GetIntentExtraCornerAmountLabelSlots()
    {
        return
        [
            ExtraIconAmountLabelSlot.At(ExtraIconAmountLabelCorner.TopRight, "+2"),
        ];
    }
}
```

意图图标会随战斗 UI 刷新重新读取；如果你的意图角标只在某个外部状态变化时刷新，可以实现 `IIntentExtraCornerAmountLabelsChangeSource` 并触发 `IntentExtraCornerAmountLabelsInvalidated`。

## 能力血条预告

能力模型可以直接实现 `IHealthBarForecastSource`。RitsuLib 会从生物身上的 `Creature.Powers` 自动发现，不需要额外注册。

```csharp
using Godot;
using MegaCrit.Sts2.Core.Combat;
using MegaCrit.Sts2.Core.Entities.Powers;
using STS2RitsuLib.Combat.HealthBars;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

public sealed class TestBurnPower
    : ModPowerTemplate, IHealthBarForecastSource
{
    public override PowerType Type => PowerType.Debuff;

    public override PowerStackType StackType => PowerStackType.Counter;

    public IEnumerable<HealthBarForecastSegment> GetHealthBarForecastSegments(
        HealthBarForecastContext context)
    {
        if (context.Creature != Owner)
            return [];

        return HealthBarForecasts
            .FromRight(context, new Color(1f, 0.32f, 0.08f))
            .AtSideTurnEnd(CombatSide.Player, Amount)
            .Build();
    }
}
```

`FromRight` 表示从当前生命值边缘向左覆盖，适合“即将受到伤害”。`FromLeft` 表示从空血一侧向右覆盖，适合“即将回复、护盾式填充、末日式从空侧开始的条”。

常用顺序：

```csharp
return HealthBarForecasts.For(context)
    .AddSideTurnEnd(
        CombatSide.Player,
        new Color(1f, 0.32f, 0.08f),
        HealthBarForecastGrowthDirection.FromRight,
        Amount)
    .Build();
```

`HealthBarForecastOrder.ForSideTurnStart/End` 会让多个来源按当前回合相对顺序排列，避免同一条血条上的预告互相抢位置。

## 非能力预告来源

如果预告不是能力本身提供的，比如遗物、全局规则或某个运行时系统，可以注册一个无参构造的 source。

```csharp
using Godot;
using STS2RitsuLib;
using STS2RitsuLib.Combat.HealthBars;

namespace Test.Scripts;

public sealed class TestLowHpWarningSource : IHealthBarForecastSource
{
    public IEnumerable<HealthBarForecastSegment> GetHealthBarForecastSegments(
        HealthBarForecastContext context)
    {
        var creature = context.Creature;
        if (!creature.IsAlive || creature.CurrentHp * 2 > creature.MaxHp)
            return [];

        return HealthBarForecasts.Single(
            amount: Math.Max(1, creature.MaxHp / 10),
            color: new Color(0.8f, 0.2f, 1f),
            direction: HealthBarForecastGrowthDirection.FromLeft,
            order: 50);
    }
}
```

注册：

```csharp
RitsuLibFramework.RegisterHealthBarForecast<TestLowHpWarningSource>(
    Entry.ModId,
    sourceId: "low_hp_warning");
```

也可以放进内容包：

```csharp
RitsuLibFramework.CreateContentPack(Entry.ModId)
    .HealthBarForecast<TestLowHpWarningSource>("low_hp_warning")
    .Apply();
```

`sourceId` 在同一个 Mod 内要唯一。重复注册同一个 id 会替换旧 source，适合开发期热调，但发布后不要频繁改名。

## 什么时候用哪一个

| 需求 | 入口 |
| - | - |
| 能力图标上额外显示两个数字 | `IPowerExtraIconAmountLabelSpecsProvider` |
| 遗物图标上显示副计数 | `IRelicExtraIconAmountLabelSpecsProvider` |
| 怪物意图图标上标记额外次数 | `IIntentExtraCornerAmountLabelsProvider` |
| 某个能力要在拥有者血条上显示预告 | 能力实现 `IHealthBarForecastSource` |
| 遗物或全局规则要显示血条预告 | `RegisterHealthBarForecast<TSource>` |

不要用角标承载长句子。角标最好保持 1 到 3 个字符；说明性文本放 hover tip 或卡牌/遗物描述里。

## 验证

* 能力、遗物、意图图标出现后，额外角标位置正确，没有遮住原版主计数。
* 角标文本变化后能跟随刷新；必要时触发 invalidated 事件。
* 血条预告只在 `Amount > 0` 时显示。
* 多个预告来源同时存在时，颜色和顺序能区分清楚。
* 保存读档、切房间、战斗结束后没有残留的角标或预告条。
