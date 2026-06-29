## Code

Create a new `Cards` folder for organization and add a new `.cs` file, e.g. `TestCard.cs`.

```csharp
using BaseLib.Abstracts;
using BaseLib.Utils;
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.Localization.DynamicVars;
using MegaCrit.Sts2.Core.Models.CardPools;
using MegaCrit.Sts2.Core.ValueProps;

namespace Test.Scripts.Cards;

// Register the card. For custom pools, see the Adding Characters introduction.
[Pool(typeof(ColorlessCardPool))]
public class TestCard : CustomCardModel
{
    // Base energy cost
    private const int energyCost = 1;
    // Card type
    private const CardType type = CardType.Attack;
    // Card rarity
    private const CardRarity rarity = CardRarity.Common;
    // Target type (AnyEnemy means any enemy)
    private const TargetType targetType = TargetType.AnyEnemy;
    // Whether to show in the card library
    private const bool shouldShowInCardLibrary = true;

    // Base card values (e.g. 12 damage)
    protected override IEnumerable<DynamicVar> CanonicalVars => [new DamageVar(12, ValueProp.Move)];

    public TestCard() : base(energyCost, type, rarity, targetType, shouldShowInCardLibrary)
    {
    }

    // Effect logic when played
    protected override async Task OnPlay(PlayerChoiceContext choiceContext, CardPlay cardPlay)
    {
        await DamageCmd.Attack(DynamicVars.Damage.BaseValue) // Deal damage from the card's base damage value
            .FromCard(this) // Damage comes from this card
            .Targeting(cardPlay.Target) // Target is the player's selection
            .Execute(choiceContext);
    }

    // Upgrade effect logic
    protected override void OnUpgrade()
    {
        DynamicVars.Damage.UpgradeValueBy(4); // Increase damage by 4 on upgrade
    }
}
```

* `CanonicalVars` specifies the card's base values. Adding a `DamageVar` sets the card's base damage — here it's 12.

* `ValueProp` defines the value's properties. `ValueProp.Move` means damage/block dealt by the card. `ValueProp.Unpowered` means unaffected by modifiers (Strength, etc.). `ValueProp.Unblockable` means the damage can't be blocked. `ValueProp.SkipHurtAnim` skips the hurt animation. This is a bitflag enum — you can combine values, e.g. `ValueProp.Unblockable | ValueProp.Unpowered`.

* STS2 uses `async` and `await` to control effect sequencing, similar to STS1's `action` system. The `OnPlay` here executes a single-target damage command.

* To make a particular kind of card, look at vanilla cards with similar effects and follow their pattern.

* Add a `Pool` attribute specifying the color pool to auto-register the card.

* Inherit from `CustomCardModel`, not `CardModel`.

* <b>Note</b>: When adding cards through `BaseLib`, the ID becomes `{namespace first segment uppercase}-{original card id}`. For example, `namespace Test.Scripts;` yields `TEST`, and the original card ID `TEST-CARD` (the uppercase snake_case of `TestCard`) becomes `TEST-TEST_CARD`.

## Card Art

Add a portrait path via an expression-bodied property to specify the art location: `public override string PortraitPath => $"res://{modid}/images/cards/{GetType().Name}.png";`
With this, the path would be `test/images/cards/TestCard.png`. You can organize resource paths however you like.

`modId` is what you put in `{modId}.json`. <b>It's a new folder, not your project root.</b>

Card art can be any size and doesn't need cropping. Official sizes: regular cards 250×190, ancient cards 250×351.

```csharp
public class TestCard : TestCardModel
{
    private const int energyCost = 1;
    private const CardType type = CardType.Attack;
    private const CardRarity rarity = CardRarity.Common;
    private const TargetType targetType = TargetType.AnyEnemy;
    private const bool shouldShowInCardLibrary = true;

    protected override IEnumerable<DynamicVar> CanonicalVars => [new DamageVar(12, ValueProp.Move)];

    // Add this line to specify the card portrait path: test/images/cards/TestCard.png
    public override string PortraitPath => $"res://test/images/cards/{nameof(TestCard)}.png";

    public TestCard() : base(energyCost, type, rarity, targetType, shouldShowInCardLibrary)
    {
    }
}
```

![Example card art](../../images/image10.webp)

You can also create an `abstract` base class to avoid repeating the portrait path on every card and to centralize custom functionality.

```csharp
public abstract class TestCardModel : CustomCardModel
{
    public override string PortraitPath => $"res://test/images/cards/{GetType().Name}.png";

    public TestCardModel(int energyCost, CardType type, CardRarity rarity, TargetType targetType, bool shouldShowInCardLibrary) : base(energyCost, type, rarity, targetType, shouldShowInCardLibrary)
    {
    }
}

public class TestCard : TestCardModel {}
```

## Text

You also need a localization file. Create `{modId}/localization/{Language}/cards.json`.
* `modId` is what you put in `{modId}.json`. <b>It's a new folder, not your project root.</b>
* `Language` can be `zhs` for Simplified Chinese, `eng` for English, etc. Write `{CardId}.title` (card name) and `{CardId}.description` (card description):

```json
{
    "TEST-TEST_CARD.title": "Test Card",
    "TEST-TEST_CARD.description": "Deal {Damage:diff()} damage."
}
```

* `{Damage:diff()}` corresponds to the `DamageVar` defined earlier.

Build the `dll` and `pck`, then launch the game. If you see the card in the expected pool, it worked. If no card appears (or there's one stuck in the top-left corner), something went wrong.

Press `~` to open the console and type `card TEST-TEST_CARD` to get the card.

* You must be in combat to use the command to get this card.
* If you see ??? in the card library, that's normal — you just haven't encountered the card yet.

![Example card](../../images/image11.webp)

## Final Project Reference

If you get errors, double-check everything. Final project structure:

```
Test (your project folder)
├── Scripts (your scripts folder, name is flexible)
│   ├── TestCard.cs
│   └── Entry.cs
└── Test (don't forget this folder — it's your modId)
    ├── images
    │   └── cards
    │       └── TestCard.png
    └── localization
        └── zhs
            └── cards.json
```
