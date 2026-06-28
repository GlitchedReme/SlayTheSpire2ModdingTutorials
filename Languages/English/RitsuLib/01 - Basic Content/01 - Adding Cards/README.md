> The examples below assume you have already enabled `RitsuLib`'s auto-registration in `Entry.Init()`, otherwise attributes like `[RegisterCard]` will not take effect (see Chapter 0):

```csharp
var assembly = Assembly.GetExecutingAssembly();
RitsuLibFramework.EnsureGodotScriptsRegistered(assembly, Logger);
ModTypeDiscoveryHub.RegisterModAssembly(ModId, assembly);
```

## Code

Create a new `Cards` folder for organization, and create a new `.cs` file, e.g. `TestCard.cs`.

```csharp
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.HoverTips;
using MegaCrit.Sts2.Core.Localization.DynamicVars;
using MegaCrit.Sts2.Core.Models.CardPools;
using MegaCrit.Sts2.Core.Models.Cards;
using MegaCrit.Sts2.Core.ValueProps;
using STS2RitsuLib.Cards.DynamicVars;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Keywords;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

// Register the card into the specified pool (Colorless here). For custom pools, see the beginning of the Adding Characters article
[RegisterCard(typeof(ColorlessCardPool))]
// Register as a character starter card with the specified quantity. Remove this line if not needed.
// [RegisterCharacterStarterCard(typeof(TestCharacter), 5)]
public class TestCard : ModCardTemplate
{
    // Base energy cost
    private const int energyCost = 1;
    // Card type
    private const CardType type = CardType.Attack;
    // Card rarity
    private const CardRarity rarity = CardRarity.Common;
    // Target type (AnyEnemy means any enemy)
    private const TargetType targetType = TargetType.AnyEnemy;
    // Whether this card appears in the card library
    private const bool shouldShowInCardLibrary = true;

    // Card art resource
    public override CardAssetProfile AssetProfile => new(
        PortraitPath: $"res://Test/images/cards/{GetType().Name}.png"
        // Frame, etc. — add as needed. You need to determine the card type (Attack, Skill, Power) yourself; writing this in a base class is recommended.
        // If using a custom card pool, you may need to change the material — see the Adding Card Pools section of the Adding Characters article
        // FramePath: "", // Card background
        // PortraitBorderPath: "", // Portrait border (used by status cards like Infection)
        // BannerTexturePath: "" // Banner (varies by type)
    );

    // Card base values
    protected override IEnumerable<DynamicVar> CanonicalVars => [
        new DamageVar(12, ValueProp.Move)
    ];

    public TestCard() : base(energyCost, type, rarity, targetType, shouldShowInCardLibrary)
    {
    }

    // Effect logic when played
    protected override async Task OnPlay(PlayerChoiceContext choiceContext, CardPlay cardPlay)
    {
        await DamageCmd.Attack(DynamicVars.Damage.BaseValue)
            .FromCard(this)
            .Targeting(cardPlay.Target!)
            .Execute(choiceContext);
    }

    // Effect logic after upgrading
    protected override void OnUpgrade()
    {
        DynamicVars.Damage.UpgradeValueBy(4);
    }
}
```

* `[RegisterCard(typeof(ColorlessCardPool))]` automatically registers this card into the specified card pool. The example uses the Colorless pool.

* `[RegisterCharacterStarterCard(typeof(TestCharacter), 5)]` automatically registers it as part of that character's starting deck. Delete this line if you aren't making a starter card.

* `CanonicalVars` refers to the card's base values. Adding a `DamageVar` specifies the card's base damage — `12` here.

* `ValueProp` indicates the value's properties. For example, `ValueProp.Move` means this is damage/block dealt by a card; `ValueProp.Unpowered` means it is unaffected by modifiers (e.g. Strength); `ValueProp.Unblockable` means the damage cannot be blocked; `ValueProp.SkipHurtAnim` means skip the hurt animation. This is a bitflag enum — you can combine them, e.g. `ValueProp.Unblockable | ValueProp.Unpowered` makes damage unblockable and unaffected by modifiers.

* Spire 2 uses `async` and `await` to control sequential execution of effect logic — for example, waiting on a card selection via `await` prevents subsequent code from executing. This fills a similar role to STS1's `action` system. The `OnPlay` here writes a command that deals single-target damage.

* To design a card, look at how a vanilla card with a similar effect is implemented and use it as a reference.

* Inherit from `ModCardTemplate`, not `CardModel`.

* <b>Note</b>: When adding cards via `ritsulib`, the id becomes `{modid}_CARD_{original card id}`. For example, if the original card id is `TEST_CARD` (the uppercase snake-case of `TestCard`), the final id becomes `TEST_CARD_TEST_CARD`.

## Card Art

You can specify the card art path in the `AssetProfile` property:

```csharp
public override CardAssetProfile AssetProfile => new(
    PortraitPath: $"res://Test/images/cards/{GetType().Name}.png"
);
```

If you follow this line of code, the file name corresponds to `Test/images/cards/TestCard.png`. Here `res://Test/...` is a Godot resource path, corresponding to your resource folder name.

Remember to replace `Test` with your `modid`. `modId` is what you filled in in your `{modId}.json`. <b>This is not your root directory, but a new folder.</b>

Card art can be any size and does not need to be cropped. The official sizes used are 250×190 for regular cards and 250×351 for Ancient cards.

![Sample card art](../../../images/image10.png)

If you want to manage card art paths centrally, you can also write an abstract base class, e.g. `TestCardModel.cs`, and have other card classes inherit from it.

```csharp
using MegaCrit.Sts2.Core.Entities.Cards;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

// Set Inherit = true to allow auto-registration of all subclasses of this class
[RegisterCard(typeof(TestCardPool), Inherit = true)]
public abstract class TestCardModel : ModCardTemplate
{
    public override CardAssetProfile AssetProfile => new(
        PortraitPath: $"res://RitsuTest/images/cards/{GetType().Name}.png",
        // Set different frames based on type
        FramePath: type switch
        {
            CardType.Attack => "res://RitsuTest/images/card_frame_attack.png",
            CardType.Skill => "res://RitsuTest/images/card_frame_skill.png",
            CardType.Power => "res://RitsuTest/images/card_frame_power.png",
            _ => ""
        }
        // PortraitBorderPath: "",
        // BannerTexturePath: ""
    );

    public TestCardModel(int energyCost, CardType type, CardRarity rarity, TargetType targetType, bool shouldShowInCardLibrary)
        : base(energyCost, type, rarity, targetType, shouldShowInCardLibrary)
    {
    }
}
```

## Text

You also need a localization file. Create `{modId}/localization/{Language}/cards.json`.
* `modId` is what you filled in in your `{modId}.json`. <b>This is not your root directory, but a new folder.</b>

* `Language` can be `zhs` for Simplified Chinese. Fill in `{CardId}.title` (card name) and `{CardId}.description` (card description):

* When adding content via `ritsulib`, the id becomes `{modid}_{category}_{original id}`. For example, here `modid` is `TEST` and the category is `CARD`. The original card id is `TEST_CARD` (the uppercase snake-case of `TestCard`).

```json
{
    "TEST_CARD_TEST_CARD.title": "Test Card",
    "TEST_CARD_TEST_CARD.description": "Deal {Damage:diff()} damage."
}
```

* `{Damage:diff()}` corresponds to the `DamageVar` above.

After compiling and packing the `dll` and `pck`, open the game. If you see the card in the corresponding pool, it worked. If there are no cards (or a card in the top-left corner), something went wrong.

Press `~` to open the console and enter `card TEST_CARD_TEST_CARD` to obtain this card.

* You can only use this command to obtain the card while in combat.

* If you see `???` in the card library, that's normal — you simply haven't encountered this card yet.

![Sample card](../../../images/image11.png)

## Final Project Reference

If you get errors, double-check everything. Final project structure reference:

```
Test (your project folder)
├── Scripts (feel free to organize your scripts however you like)
│   ├── TestCard.cs (or inside a Cards subfolder)
│   └── Entry.cs
└── Test (don't forget this folder layer — it is your modid)
    ├── images
    │   └── cards
    │       └── TestCard.png
    └── localization
        └── zhs
            └── cards.json
```
