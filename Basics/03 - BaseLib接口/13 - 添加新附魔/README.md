首先创建附魔类：

```csharp
using BaseLib.Abstracts;
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Enchantments;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.HoverTips;
using MegaCrit.Sts2.Core.Localization.DynamicVars;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.ValueProps;

namespace Test.Scripts;

public class TestEnchantment : CustomEnchantmentModel
{
    // 是否在卡牌上显示数值
    public override bool ShowAmount => true;

    // 重载这个以改变显示的数字
    // public override int DisplayAmount => DynamicVars.Cards.IntValue;

    // 是否会添加额外的卡牌描述文本
    public override bool HasExtraCardText => true;

    // 像卡牌、遗物、药水等一样，可以使用DynamicVars和ExtraHoverTips
    protected override IEnumerable<DynamicVar> CanonicalVars => [new CardsVar(2)];
    protected override IEnumerable<IHoverTip> ExtraHoverTips => [HoverTipFactory.FromKeyword(CardKeyword.Retain)];

    // 图标位置。大小1:1就行，原版是64x64
    protected override string? CustomIconPath => "res://icon.svg";

    // 决定是否可以附魔到某张卡牌上，这里我们让它只能附魔到获得格挡的卡牌上。
    public override bool CanEnchant(CardModel card)
    {
        if (base.CanEnchant(card))
        {
            return card.GainsBlock;
        }
        return false;
    }

    // 当附魔被应用时调用，这里我们给卡牌添加保留。
    protected override void OnEnchant()
    {
        Card.AddKeyword(CardKeyword.Retain);
    }

    // 修改卡牌获得的格挡值，返回增加的改变量。
    public override decimal EnchantBlockAdditive(decimal originalBlock, ValueProp props)
    {
        if (!props.IsPoweredCardOrMonsterMoveBlock())
        {
            return 0m;
        }
        // 获得格挡额外增加Amount数量。这个数量是你给予附魔时指定的。
        return Amount;
    }

    // 当附魔的卡牌被打出时调用。
    public override async Task OnPlay(PlayerChoiceContext choiceContext, CardPlay? cardPlay)
    {
        // 只有可用时打出才能抽牌。打出后设置为Disabled。
        if (Status == EnchantmentStatus.Normal)
        {
            await CardPileCmd.Draw(choiceContext, DynamicVars.Cards.IntValue, Card.Owner);
            Status = EnchantmentStatus.Disabled;
        }
    }
}

```

然后创建`{modId}/localization/{Language}/enchantments.json`。

```json
{
    "TEST-TEST_ENCHANTMENT.title": "戈多",
    "TEST-TEST_ENCHANTMENT.extraCardText": "你第一次打出这张牌时，抽{Cards}张牌。", // 额外添加在卡牌上的文本
    "TEST-TEST_ENCHANTMENT.description": "这张牌获得[gold]保留[/gold]。\n这张牌获得的[gold]格挡[/gold]值增加[blue]{Amount}[/blue]点。\n第一次打出时抽{Cards}张牌。" // 附魔介绍
}
```

如何使用：
* 控制台里输入`enchant TEST-TEST_ENCHANTMENT [数量] [给予手牌的编号]`。
* 在效果里，使用`CardCmd.Enchant<TestEhchantment>(card, 2m)`。第二个参数用于修改Amount。

![alt text](../../../images/image32.png)