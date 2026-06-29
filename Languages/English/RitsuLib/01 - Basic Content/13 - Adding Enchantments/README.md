First, create the enchantment class:

```csharp
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Enchantments;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.HoverTips;
using MegaCrit.Sts2.Core.Localization.DynamicVars;
using MegaCrit.Sts2.Core.Models;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

[RegisterEnchantment]
public class TestEnchantment : ModEnchantmentTemplate
{
    // Whether to display the amount on the card
    public override bool ShowAmount => true;

    // Override this to change the displayed number
    // public override int DisplayAmount => DynamicVars.Cards.IntValue;

    // Whether additional card description text will be added
    public override bool HasExtraCardText => true;

    // Like cards, relics, potions, etc., you can use DynamicVars and ExtraHoverTips
    protected override IEnumerable<DynamicVar> CanonicalVars => [new CardsVar(2)];
    protected override IEnumerable<IHoverTip> ExtraHoverTips => [HoverTipFactory.FromKeyword(CardKeyword.Retain)];

    // Icon path. 1:1 size works, vanilla is 64x64
    public override EnchantmentAssetProfile AssetProfile => new(
        IconPath: "res://icon.svg"
    );

    // Determines whether this enchantment can be applied to a card. Here we make it only enchantable on cards that gain block.
    public override bool CanEnchant(CardModel card)
    {
        if (base.CanEnchant(card))
        {
            return card.GainsBlock;
        }
        return false;
    }

    // Called when the enchantment is applied. Here we give the card Retain.
    protected override void OnEnchant()
    {
        Card.AddKeyword(CardKeyword.Retain);
    }

    // Modify the block value gained by the card, returning the increased amount.
    public override decimal EnchantBlockAdditive(decimal originalBlock)
    {
        // Block gained increases by Amount. This amount is specified when you grant the enchantment.
        return Amount;
    }

    // Called when the enchanted card is played.
    public override async Task OnPlay(PlayerChoiceContext choiceContext, CardPlay? cardPlay)
    {
        // Draw only when usable. Set to Disabled after playing.
        if (Status == EnchantmentStatus.Normal)
        {
            await CardPileCmd.Draw(choiceContext, DynamicVars.Cards.IntValue, Card.Owner);
            Status = EnchantmentStatus.Disabled;
        }
    }
}

```

Then create `{modId}/localization/{Language}/enchantments.json`.

```json
{
    "TEST_ENCHANTMENT_TEST_ENCHANTMENT.title": "Godo",
    "TEST_ENCHANTMENT_TEST_ENCHANTMENT.extraCardText": "The first time you play this card, draw {Cards} card(s).", // extra text added on the card
    "TEST_ENCHANTMENT_TEST_ENCHANTMENT.description": "This card gains [gold]Retain[/gold].\nThe [gold]Block[/gold] gained by this card is increased by [blue]{Amount}[/blue].\nDraw {Cards} card(s) the first time it is played." // enchantment description
}
```

How to use:
* In the console, enter `enchant TEST_ENCHANTMENT_TEST_ENCHANTMENT [amount] [hand index]`.
* In effects, use `CardCmd.Enchant<TestEnchantment>(card, 2m)`. The second parameter modifies Amount.

![alt text](../../../images/image32.webp)
