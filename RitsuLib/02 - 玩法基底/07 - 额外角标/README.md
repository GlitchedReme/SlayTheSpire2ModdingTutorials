## 能力图标角标

用于显示能力双数字，或者更多数量。

给能力实现 `IPowerExtraIconAmountLabelSpecsProvider`。RitsuLib 会把它们放到指定角落。

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
        // 这里额外指定了两个
        return
        [
            // 纯文本
            ExtraIconAmountLabelSpec.Plain(
                ExtraIconAmountLabelCorner.TopLeft,
                Amount.ToString()),
            // 可支持bbcode富文本
            ExtraIconAmountLabelSpec.RichText(
                ExtraIconAmountLabelCorner.BottomLeft,
                "[color=gold]x2[/color]"),
        ];
    }
}
```

可选角落：

| 位置 | 说明 |
| - | - |
| `TopLeft` | 左上角 |
| `TopRight` | 右上角 |
| `BottomLeft` | 左下角 |
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
