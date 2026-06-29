---
title: Extra Badges
date: 2026-05-27 15:36:11
permalink: en/docs/04-ritsulib/04-22-1-extra-badge/
author: alkaid616
categories:
- Basics
---
## Power Icon Badges

Used to display dual numbers on a power or additional amounts.

Implement `IPowerExtraIconAmountLabelSpecsProvider` on your power. RitsuLib will place them in the designated corners.

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
        // Two additional labels are specified here
        return
        [
            // Plain text
            ExtraIconAmountLabelSpec.Plain(
                ExtraIconAmountLabelCorner.TopLeft,
                Amount.ToString()),
            // Supports bbcode rich text
            ExtraIconAmountLabelSpec.RichText(
                ExtraIconAmountLabelCorner.BottomLeft,
                "[color=gold]x2[/color]"),
        ];
    }
}
```

Available corners:

| Position | Description |
| - | - |
| `TopLeft` | Top-left corner |
| `TopRight` | Top-right corner |
| `BottomLeft` | Bottom-left corner |
| `BottomRight` | Bottom-right corner; commonly used by vanilla for the main count; use with caution |
| `Custom` | Provide your own `Rect2`; suitable for special icons |

## Relic Badges

The same approach for relics; just use the `IRelicExtraIconAmountLabelSpecsProvider` interface instead.

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

Badge refresh usually follows the vanilla `DisplayAmountChanged`. If your badges do not depend on `DisplayAmount`, you may also implement `IRelicExtraIconAmountLabelsChangeSource` and trigger `RelicExtraIconAmountLabelsInvalidated` when internal state changes.

## Intent Badges

Monster intents require implementing the interface on your `AbstractIntent` subclass. This is suitable for displaying auxiliary information such as "this attack will trigger additional hits".

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

Intent icons are re-read with each combat UI refresh. If your intent badges should only refresh when some external state changes, implement `IIntentExtraCornerAmountLabelsChangeSource` and trigger `IntentExtraCornerAmountLabelsInvalidated`.
