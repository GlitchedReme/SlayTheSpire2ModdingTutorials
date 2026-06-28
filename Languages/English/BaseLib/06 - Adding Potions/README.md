Start by creating the class (much of the code is similar to cards — use those as reference):

```csharp
using BaseLib.Abstracts;
using BaseLib.Utils;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Creatures;
using MegaCrit.Sts2.Core.Entities.Potions;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.HoverTips;
using MegaCrit.Sts2.Core.Localization.DynamicVars;
using MegaCrit.Sts2.Core.Models.Cards;

namespace Test.Scripts;

// Register the potion. For custom pools, see the Adding Characters introduction.
[Pool(typeof(TestPotionPool))]
public class TestPotion : CustomPotionModel
{
    // Rarity
    public override PotionRarity Rarity => PotionRarity.Common;

    // Usage: CombatOnly means it can only be used in combat.
    public override PotionUsage Usage => PotionUsage.CombatOnly;

    // Target type
    public override TargetType TargetType => TargetType.Self;

    // Define dynamic variables
    protected override IEnumerable<DynamicVar> CanonicalVars => [new CardsVar(3)];

    // Preview card hover tip. Or you can add keyword hover tips.
    public override IEnumerable<IHoverTip> ExtraHoverTips => [HoverTipFactory.FromCard<Soul>()];

    // Potion image. Doesn't have to be SVG — any format that becomes a Texture works.
    public override string? CustomPackedImagePath => "res://icon.svg";
    public override string? CustomPackedOutlinePath => "res://icon.svg";

    // Effect logic when used — creates 3 Souls in hand.
    protected override async Task OnUse(PlayerChoiceContext choiceContext, Creature? target)
    {
        // DynamicVars.Cards.IntValue is the CardsVar value (3) defined in CanonicalVars.
        await Soul.CreateInHand(Owner, DynamicVars.Cards.IntValue, Owner.Creature.CombatState!);
    }
}
```

Then create `{modId}/localization/{Language}/potions.json`.

```json
{
    "TEST-TEST_POTION.title": "Godo Potion",
    "TEST-TEST_POTION.description": "Add [blue]{Cards}[/blue] [gold]Soul(s)[/gold] to your [gold]hand[/gold]."
}
```
