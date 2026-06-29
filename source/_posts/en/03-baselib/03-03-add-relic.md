---
title: Adding Relics
date: 2026-05-04 13:57:41
permalink: en/docs/03-baselib/03-03-add-relic/
categories:
- Basics
---
Similar to adding cards. Start with a new class.

```csharp
// Register the relic. For custom pools, see the Adding Characters introduction.
[Pool(typeof(SharedRelicPool))]
public class TestRelic : CustomRelicModel
{
    // Rarity
    public override RelicRarity Rarity => RelicRarity.Common;

    // Relic values. Replaces {Cards} in localization.
    protected override IEnumerable<DynamicVar> CanonicalVars => [new CardsVar(1)];

    // Small icon (vanilla: 85×85)
    public override string PackedIconPath => $"res://test/images/relics/{Id.Entry.ToLowerInvariant()}.png";
    // Outline icon (vanilla: 85×85)
    protected override string PackedIconOutlinePath => $"res://test/images/relics/{Id.Entry.ToLowerInvariant()}.png";
    // Large icon (vanilla: 256×256)
    protected override string BigIconPath => $"res://test/images/relics/{Id.Entry.ToLowerInvariant()}.png";

    public override async Task AfterPlayerTurnStart(PlayerChoiceContext choiceContext, Player player)
    {
        // DynamicVars.Cards.IntValue is the CardsVar value set above.
        await CardPileCmd.Draw(choiceContext, DynamicVars.Cards.IntValue, player);
    }

    // For starter relic upgrades, override this:
    // public override RelicModel? GetUpgradeReplacement() => ModelDb.Relic<Circlet>().ToMutable();
}
```

Then place an image at `test/images/relics/test_relic.png`. The path doesn't have to be `test` — organize as you like, same as the card art section. The three icon paths are all set to the same image here for simplicity; you can use separate images.

![Example relic](../../../../images/image13.webp)

Then create a localization file: `{modId}/localization/{Language}/relics.json`.

```json
{
  "TEST-TEST_RELIC.title": "Test Relic",
  "TEST-TEST_RELIC.description": "At the start of your turn, draw [blue]{Cards}[/blue] card(s).",
  "TEST-TEST_RELIC.flavor": "Looks familiar?"
}
```
