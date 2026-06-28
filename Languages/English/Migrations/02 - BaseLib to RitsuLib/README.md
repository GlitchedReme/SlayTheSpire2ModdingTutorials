A guide for migrating mods between `BaseLib` and `RitsuLib`.

## Content Registration

Both libraries support automatic content registration.

`BaseLib`:

```csharp
[Pool(typeof(TestCardPool))]
public class TestCard : CustomCardModel {} // Other content uses CustomXXXModel equivalents
```

`RitsuLib`:

You need to call `ModTypeDiscoveryHub.RegisterModAssembly` in your init function (`Entry.Init`). Explicit registration is also supported.

```csharp
[RegisterCard(typeof(TestCardPool))] // Other content uses RegisterXXX equivalents
public class TestCard : ModCardTemplate {} // Other content uses ModXXXTemplate equivalents
```

## IDs

Apart from keywords:

`BaseLib` uses `{namespace first segment uppercase}-{original card id}`, e.g. `TEST-TEST_CARD`.

`RitsuLib` uses `{ModId}_{Category}_{original card id}`, e.g. `TEST_CARD_TEST_CARD`.

## Variable Mapping

### Registration & Base Classes

| Description | BaseLib | RitsuLib |
| --- | --- | --- |
| Card registration | `[Pool(typeof(TestCardPool))]` | `[RegisterCard(typeof(TestCardPool))]` |
| Relic registration | `[Pool(typeof(TestRelicPool))]` | `[RegisterRelic(typeof(TestRelicPool))]` |
| Potion registration | `[Pool(typeof(TestPotionPool))]` | `[RegisterPotion(typeof(TestPotionPool))]` |
| Event registration | Not needed | `[RegisterSharedEvent]` `[RegisterActEvent(typeof(XXX))]` |
| Ancient registration | Not needed | `[RegisterSharedAncient]` `[RegisterActAncient(typeof(XXX))]` |
| Card base class | `CustomCardModel` | `ModCardTemplate` |
| Relic base class | `CustomRelicModel` | `ModRelicTemplate` |
| Potion base class | `CustomPotionModel` | `ModPotionTemplate` |
| Power base class | `CustomPowerModel` | `ModPowerTemplate` |
| Enchantment base class | `CustomEnchantmentModel` | `ModEnchantmentTemplate` |
| Encounter base class | `CustomEncounterModel` | `ModEncounterTemplate` |
| Ancient base class | `CustomAncientModel` | `ModAncientEventTemplate` |
| Character base class | `PlaceholderCharacterModel` | `ModCharacterTemplate<TestCardPool, TestRelicPool, TestPotionPool>` |

### Keywords & Dynamic Variables

| Description | BaseLib | RitsuLib |
| --- | --- | --- |
| Hover tips | `ExtraHoverTips` | `AdditionalHoverTips` |
| Custom keywords | `CanonicalKeywords` | `RegisteredKeywordIds` |
| Custom keyword hover tip creation | `HoverTipFactory.FromKeyword(MyKeywords.Unique)` | `ModKeywordRegistry.CreateHoverTip(MyKeywords.Unique)` |
| Custom keyword declaration | `[CustomEnum("UNIQUE")]` | `[RegisterOwnedCardKeyword("Unique", IconPath = "res://icon.svg")]` |
| Dynamic variable tooltip binding | `.WithTooltip` | `.WithSharedTooltip` |

### Characters & Pools

| Description | BaseLib | RitsuLib |
| --- | --- | --- |
| Character visual scene path | `CustomVisualPath` | `CustomVisualsPath` |
| Character select background path | `CustomCharacterSelectBg` | `CustomCharacterSelectBgPath` |
| Starting deck | `StartingDeck` | `StartingDeckEntries` (or `[RegisterCharacterStarterCard]` on the card class) |
| Starting relics | `StartingRelics` | `StartingRelicTypes` (or `[RegisterCharacterStarterRelic]` on the relic class) |
| Bind card/relic/potion pool | `CardPool` / `RelicPool` / `PotionPool` | `ModCharacterTemplate<TestCardPool, TestRelicPool, TestPotionPool>` |
| Card pool | `CustomCardPoolModel` | `TypeListCardPoolModel` |
| Potion pool | `CustomPotionPoolModel` | `TypeListPotionPoolModel` |
| Relic pool | `CustomRelicPoolModel` | `TypeListRelicPoolModel` |

### Relics, Potions, Powers, Orbs

| Description | BaseLib | RitsuLib |
| --- | --- | --- |
| Potion small icon path | `CustomPackedImagePath` | `CustomImagePath` |
| Potion outline path | `CustomPackedOutlinePath` | `CustomOutlinePath` |
| Power small icon path | `CustomPackedIconPath` | `CustomIconPath` |
| Orb custom scene | `CreateCustomSprite()` | `CustomVisualsScenePath` |
| Monster custom scene | `CreateCustomVisuals()` | `CustomVisualsPath` |

### Events, Encounters, Ancients

| Description | BaseLib | RitsuLib |
| --- | --- | --- |
| Encounter act filter | `IsValidForAct(ActModel act)` | `[RegisterActEncounter(typeof(Glory))]` |
| Encounter room type | `base(RoomType.Monster)` | `public override RoomType RoomType => RoomType.Monster` |
| Custom encounter scene path | `CustomScenePath` | `CustomEncounterScenePath` |
| Ancient background scene path | `CustomScenePath` | `CustomBackgroundScenePath` |
| Ancient appearance condition | `IsValidForAct(ActModel act)` | `IsAllowed(IRunState runState)` |
| Ancient option pools | `MakeOptionPools` | `AllPossibleOptions` + `GenerateInitialOptions()` |
| Ancient relic option creation | `AncientOption<T>()` | `CreateModRelicOption<T>()` |
| Event initial option creation | `Option(TakeDamage)` | `new EventOption(this, TakeDamage, InitialOptionKey("TAKE_DAMAGE"))` |
| Event paged option creation | `Option(ChoosePotions, "CHOOSE_TYPE")` | `new EventOption(this, ChoosePotions, ModOptionKey("CHOOSE_TYPE", "CHOOSE_POTIONS"))` |
| Event page description lookup | `PageDescription("CHOOSE_TYPE")` | `L10NLookup($"{Id.Entry}.pages.CHOOSE_TYPE.description")` |

## Relic & Card Upgrades

`BaseLib`:

> `Ancient Tooth` transforms a starting card into an ancient upgrade. Implement the `ITranscendenceCard` interface:
> 
> ```csharp
> [Pool(typeof(TestCardPool))]
> public class TestCard : CustomCardModel, ITranscendenceCard
> {
>     // Other content omitted
>     public CardModel GetTranscendenceTransformedCard() => ModelDb.Card<TestCard2>();
> }
> ```
> 
> `Touch of Ouroboros` upgrades the starting relic:
> 
> ```csharp
> [Pool(typeof(TestRelicPool))]
> public class TestRelic : CustomRelicModel
> {
>     // Other content omitted
>     public override RelicModel? GetUpgradeReplacement() => ModelDb.Relic<TestRelic2>();
> }
> ```
> 
> `Dusty Grimoire` grants an ancient card from your pool, excluding the one from Ancient Tooth. Just create one more ancient card.

`RitsuLib`:

Add these attributes to the card or relic class to be transformed:

```csharp
[RegisterCard(typeof(TestCardPool))]
[RegisterArchaicToothTranscendence(typeof(Shiv))] // Ancient Tooth transforms this card into the specified type
public class TestCard : ModCardTemplate {}
```

```csharp
[RegisterRelic(typeof(TestRelicPool))]
[RegisterTouchOfOrobasRefinement(typeof(Akabeko))] // Touch of Ouroboros transforms this relic into the specified type
public class TestRelic : ModRelicTemplate {}
```

Or in your `Init` function:

```csharp
public static void Init()
{
    // Other content omitted
    RitsuLibFramework.RegisterArchaicToothTranscendenceMapping<TestCard, Shiv>();
    RitsuLibFramework.RegisterTouchOfOrobasRefinementMapping<TestRelic, Akabeko>();
}
```

### Scenes

`BaseLib` supports automatic scene conversion for most cases — no script attachment or unique naming needed.

`RitsuLib` supports semi-automatic conversion, e.g. overriding `TryCreateCreatureVisuals` in the character class. Energy counters are fully automatic.
