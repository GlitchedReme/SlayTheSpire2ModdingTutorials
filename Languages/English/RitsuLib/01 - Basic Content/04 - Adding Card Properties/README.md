## Adding New Card Keywords

Here "keywords" refer to card properties like `Exhaust`, `Ethereal`, etc. `RitsuLib` does not have `customenum` but manages them in a unified way.

* Create a new class:

```csharp
using MegaCrit.Sts2.Core.Entities.Cards;
using STS2RitsuLib.Content;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Keywords;

namespace Test.Scripts;

[RegisterOwnedCardKeyword(nameof(Unique), IconPath = "res://icon.svg", CardDescriptionPlacement = ModKeywordCardDescriptionPlacement.BeforeCardDescription)]
// [RegisterOwnedCardKeyword(nameof(Unique2), IconPath = "res://icon.svg")] // To add more keywords, add more attributes
// Because the syntax differs from the RitsuLib standard, this cannot be a static class!!
public class MyKeywords
{
    public static readonly CardKeyword Unique = ModContentRegistry.GetQualifiedKeywordId(Entry.ModId, nameof(Unique)).GetModCardKeyword();
    // public static readonly CardKeyword Unique2 = ModContentRegistry.GetQualifiedKeywordId(Entry.ModId, nameof(Unique2)).GetModCardKeyword();
}
```

* `CardDescriptionPlacement` indicates where the keyword description appears on the card. `BeforeCardDescription` means before the description. Defaults to not being displayed.

* Both `IconPath` and `CardDescriptionPlacement` are optional.

* Add a localization file, `{modId}/localization/{Language}/card_keywords.json`. The key used is `TEST_KEYWORD_{UPPERCASE_ID}`.

```json
{
    "TEST_KEYWORD_UNIQUE.description": "You can only have one copy of this card in your deck.",
    "TEST_KEYWORD_UNIQUE.title": "Unique"
}
```

* Then add the custom keyword here in your card class:

```csharp
using STS2RitsuLib.Keywords; // Additional using required

// Inside your card class
public override IEnumerable<CardKeyword> CanonicalKeywords => [
    MyKeywords.Unique, // Add a custom keyword
    // CardKeyword.Exhaust, // Add a vanilla keyword
];
```

Check for existence: `Keywords.Contains(MyKeywords.Unique)`

Can be combined with a singleton (`SingletonModel`) for logic. See the corresponding article.

![alt text](../../../images/image23.webp)

## Adding New Dynamic Variables

Dynamic variables refer to dynamic numeric values like `Damage`, `Block`, `draw count`, `energy gained`, etc. While you can add them through forms like `new DynamicPower("xxx", 1)`, writing a new class is more standardized and easier to extend with features. See the Variables & Descriptions chapter.

Adding `WithSharedTooltip` via `ritsulib` adds a tooltip. <b>If you don't need localization text, skip this line.</b>

If you only need a simple value, this is enough:

```csharp
    protected override IEnumerable<DynamicVar> CanonicalVars => [
        new DamageVar(12, ValueProp.Move),
        ModCardVars.Int("Leech", 3)
        //.WithSharedTooltip("TEST_LEECH") // Add localization if needed
    ];
```

(Optional) Then add a new localization file `{modId}/localization/{Language}/static_hover_tips.json`.

```json
{
    "TEST_LEECH.description": "Drain an equal amount of HP.",
    "TEST_LEECH.title": "Leech"
}
```

Then use `{Leech}` in the card's description:

```json
{
    "TEST_CARD_TEST_CARD.title": "Test Card",
    "TEST_CARD_TEST_CARD.description": "[gold]Leech[/gold] {Leech:diff()}.\nDeal {Damage:diff()} damage."
}
```

`:diff()` means that if this value differs from its base value, it will turn red or green (e.g. increased by an upgrade — preview turns green).


In simple terms, the effect can be written in `OnPlay` like this, or you can write your own Cmd for convenient effect execution:
```csharp
    // Use DynamicVars["Leech"] to get the value. First, make the enemy lose HP (take unblockable damage unaffected by powers)
    await CreatureCmd.Damage(choiceContext, [cardPlay.Target!], DynamicVars["Leech"].BaseValue, ValueProp.Unblockable | ValueProp.Unpowered, cardPlay.Card.Owner.Creature);
    // Then heal the player
    await CreatureCmd.Heal(cardPlay.Card.Owner.Creature, DynamicVars["Leech"].BaseValue);
```

![alt text](../../../images/image26.webp)


## Adding Card Hover Tips

This refers to the tooltip box that appears next to a card, or the card preview. Keywords in the description are generally implemented by pairing hover tips with text coloring, e.g. `Vulnerable`, `Evoke`, etc.

Unlike STS1, keyword tooltips are implemented by coloring the description (`[gold]Vulnerable[/gold]`) and then adding card hover tips.

For example, adding `Exhaust` to a card automatically adds its hover tip. But if your card doesn't have `Exhaust` yet its description says *"Exhaust a card"*, you add the hover tip this way.

Simply override `AdditionalHoverTips` in your card class:

```csharp
[RegisterCard(typeof(TestCardPool))]
public class TestCard : ModCardTemplate
{
    // Others omitted

    // Add various hover tips via HoverTipFactory
    protected override IEnumerable<IHoverTip> AdditionalHoverTips => [
        HoverTipFactory.FromCard<Shiv>(),
        HoverTipFactory.FromPower<TestPower>(),
        HoverTipFactory.FromKeyword(CardKeyword.Exhaust),
    ];
}
```

## Adding Card Tags

Tags refer to things like `Strike` and `Defend`. A card with the Strike tag takes extra damage from the Strike Dummy.

Don't forget to add the Strike and Defend tags to your Strikes and Defends.

```csharp
using MegaCrit.Sts2.Core.Entities.Cards;
using STS2RitsuLib.CardTags;
using STS2RitsuLib.Content;
using STS2RitsuLib.Interop.AutoRegistration;

namespace Test.Scripts;

[RegisterOwnedCardTag(nameof(Heavy))]
// [RegisterOwnedCardTag(nameof(Heavy2))] // Add more by adding more attributes
public class MyTags
{
    public static readonly CardTag Heavy = ModContentRegistry.GetQualifiedCardTagId(Entry.ModId, nameof(Heavy)).GetModCardTag();

    // public static readonly CardTag Heavy2 = ModContentRegistry.GetQualifiedCardTagId(Entry.ModId, nameof(Heavy2)).GetModCardTag();
}
```

Then add this in your card class:

```csharp
using STS2RitsuLib.CardTags; // Additional using required

// Add this in your card class, or append to existing ones
protected override HashSet<CardTag> CanonicalTags => [
    MyTags.Heavy, // Add a custom tag
    // CardTag.Strike, // Add a vanilla tag
];
```

To use it, write like this. `Card` must be a `CardModel` type.

```csharp
if (Card.Tags.Any(t => t == MyTags.Heavy))
{
    // Do something
}
```
