Timelines are a feature in STS2 used for both unlocking character content and storytelling.

## Explanation

Characters generally have the following "Epochs".

| Type | Unlock Condition | Unlock Content | Required Code |
|---|---|---|---|
| Own Character | - | Character | `[RegisterEpoch]`, `[RegisterStoryEpoch]`, `[RequireEpoch]` on character |
| Complete a Run | Complete a run with the character | Cards/Relics/Potions | `[UnlockEpochAfterRunAs]` on character |
| Win a Run | Win a run with the character | Cards/Relics/Potions | `[UnlockEpochAfterWinAs]` on character |
| Defeat Act 1 | Defeat the Act 1 Boss with the character | Cards | Specified ID |
| Defeat Act 2 | Defeat the Act 2 Boss with the character | Relics | Specified ID |
| Defeat Act 3 | Defeat the Act 3 Boss with the character | Potions/Cards | Specified ID |
| Cumulative Elite Kills | Kill 15 elites cumulatively with the character | Cards/Relics/Potions | `[UnlockEpochAfterEliteVictories]` on character |
| Cumulative Boss Kills | Kill 15 bosses cumulatively with the character | Cards/Relics/Potions | `[UnlockEpochAfterBossVictories]` on character |
| Ascension 1 | Win on Ascension 1 with the character | Cards/Relics/Potions | `[UnlockEpochAfterAscensionOneWin]` on character |

## Code

* First you need your own character. Refer to `Adding Characters`.

* Create a `TestCharacterStory.cs`. For convenience, we put all stories and epochs in one file.

```csharp
using MegaCrit.Sts2.Core.Timeline;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Timeline.Scaffolding;

namespace Test.Scripts;

// Register story
[RegisterStory]
public class TestStory : ModStoryTemplate
{
    // Unique identifier, make it different to avoid collisions
    protected override string StoryKey => "test";

    // Function to generate the key for epochs that unlock by clearing an act
    internal static string ActEpochKey(int actNum) => ModContentRegistry.GetFixedPublicEntry(Entry.ModId, typeof(TestCharacter)) + $"_{actNum + 1}_EPOCH";
}

// First epoch. This epoch will use AutoTimelineSlotBeforeColumn to auto-assign a timeline position
[RegisterEpoch]
[RegisterStoryEpoch(typeof(TestStory), Order = 0)]
// Auto-assign timeline position, before the Seeds0 epoch
[AutoTimelineSlotBeforeColumn(EpochEra.Seeds0)]
// All cards in this pool depend on this epoch, i.e. our character's card pool
[RequireAllCardsInPool(typeof(TestCardPool))]
public class TestEpoch : CharacterUnlockEpochTemplate<TestCharacter>
{
    // Key used for localization
    public override string Id => "TEST_CHARACTER_EPOCH";

    // Epoch image paths
    public override EpochAssetProfile AssetProfile => new(
        PackedPortraitPath: "res://icon.svg",
        BigPortraitPath: "res://icon.svg"
    );

    // All subsequent epochs unlocked after unlocking this epoch
    protected override IEnumerable<Type> ExpansionEpochTypes =>
    [
        typeof(TestCardEpoch),
        typeof(TestAct1Epoch),
        typeof(TestAct2Epoch),
        typeof(TestAct3Epoch),
        typeof(TestVictoryEpoch),
        typeof(TestEliteEpoch),
        typeof(TestBossEpoch),
        typeof(TestAscensionOneEpoch),
    ];
}

[RegisterEpoch]
[RegisterStoryEpoch(typeof(TestStory), Order = 1)]
// Auto-assign timeline position, at the Seeds0 epoch
[AutoTimelineSlot(EpochEra.Seeds0)]
// All cards unlocked by this epoch
[RegisterEpochCards(typeof(TestCard), typeof(TestCard2), typeof(TestCard3))]
public class TestCardEpoch : PackDeclaredCardUnlockEpochTemplate
{
    // Key used for localization
    public override string Id => "TEST_CARD_EPOCH";

    // Epoch image paths
    public override EpochAssetProfile AssetProfile => new(
        PackedPortraitPath: "res://icon.svg",
        BigPortraitPath: "res://icon.svg"
    );
}

[RegisterEpoch]
[RegisterStoryEpoch(typeof(TestStory), Order = 2)]
[AutoTimelineSlot(EpochEra.Blight1)]
[RegisterEpochCards(typeof(TestCard), typeof(TestCard2), typeof(TestCard3))]
public sealed class TestAct1Epoch : PackDeclaredCardUnlockEpochTemplate
{
    // Key used for localization. Clearing an act is retrieved by ID
    public override string Id => TestStory.ActEpochKey(1);

    // Epoch image paths
    public override EpochAssetProfile AssetProfile => new(
        PackedPortraitPath: "res://icon.svg",
        BigPortraitPath: "res://icon.svg"
    );
}

[RegisterEpoch]
[RegisterStoryEpoch(typeof(TestStory), Order = 3)]
[AutoTimelineSlot(EpochEra.Peace0)]
// After reaching this epoch, unlock all relics in TestRelicPool
[RegisterEpochRelicsFromPool(typeof(TestRelicPool))]
public sealed class TestAct2Epoch : PackDeclaredRelicUnlockEpochTemplate
{
    // Key used for localization. Clearing an act is retrieved by ID
    public override string Id => TestStory.ActEpochKey(2);

    // Epoch image paths
    public override EpochAssetProfile AssetProfile => new(
        PackedPortraitPath: "res://icon.svg",
        BigPortraitPath: "res://icon.svg"
    );
}

[RegisterEpoch]
[RegisterStoryEpoch(typeof(TestStory), Order = 4)]
[AutoTimelineSlot(EpochEra.Seeds2)]
[RegisterEpochCards(typeof(TestCard), typeof(TestCard2), typeof(TestCard3))]
public sealed class TestAct3Epoch : PackDeclaredCardUnlockEpochTemplate
{
    // Key used for localization. Clearing an act is retrieved by ID
    public override string Id => TestStory.ActEpochKey(3);

    // Epoch image paths
    public override EpochAssetProfile AssetProfile => new(
        PackedPortraitPath: "res://icon.svg",
        BigPortraitPath: "res://icon.svg"
    );
}

[RegisterEpoch]
[RegisterStoryEpoch(typeof(TestStory), Order = 5)]
[AutoTimelineSlot(EpochEra.Blight2)]
[RegisterEpochCards(typeof(TestCard), typeof(TestCard2), typeof(TestCard3))]
public sealed class TestVictoryEpoch : PackDeclaredCardUnlockEpochTemplate
{
    // Key used for localization
    public override string Id => "TEST_VICTORY_EPOCH";

    // Epoch image paths
    public override EpochAssetProfile AssetProfile => new(
        PackedPortraitPath: "res://icon.svg",
        BigPortraitPath: "res://icon.svg"
    );
}

[RegisterEpoch]
[RegisterStoryEpoch(typeof(TestStory), Order = 6)]
[AutoTimelineSlot(EpochEra.Prehistoria2)]
[RegisterEpochCards(typeof(TestCard), typeof(TestCard2), typeof(TestCard3))]
public sealed class TestEliteEpoch : PackDeclaredCardUnlockEpochTemplate
{
    // Key used for localization
    public override string Id => "TEST_ELITE_MILESTONE_EPOCH";

    // Epoch image paths
    public override EpochAssetProfile AssetProfile => new(
        PackedPortraitPath: "res://icon.svg",
        BigPortraitPath: "res://icon.svg"
    );
}

[RegisterEpoch]
[RegisterStoryEpoch(typeof(TestStory), Order = 7)]
[AutoTimelineSlot(EpochEra.Flourish0)]
[RegisterEpochCards(typeof(TestCard), typeof(TestCard2), typeof(TestCard3))]
public sealed class TestBossEpoch : PackDeclaredCardUnlockEpochTemplate
{
    // Key used for localization
    public override string Id => "TEST_BOSS_MILESTONE_EPOCH";

    // Epoch image paths
    public override EpochAssetProfile AssetProfile => new(
        PackedPortraitPath: "res://icon.svg",
        BigPortraitPath: "res://icon.svg"
    );
}

[RegisterEpoch]
[RegisterStoryEpoch(typeof(TestStory), Order = 8)]
[AutoTimelineSlot(EpochEra.Invitation5)]
[RegisterEpochCards(typeof(TestCard), typeof(TestCard2), typeof(TestCard3))]
public sealed class TestAscensionOneEpoch : PackDeclaredCardUnlockEpochTemplate
{
    // Key used for localization
    public override string Id => "TEST_ASCENSION_ONE_EPOCH";

    // Epoch image paths
    public override EpochAssetProfile AssetProfile => new(
        PackedPortraitPath: "res://icon.svg",
        BigPortraitPath: "res://icon.svg"
    );
}
```

## Usage

Then you need to add these attributes on your character class for registration:

```csharp
[RegisterCharacter]
[RequireEpoch(typeof(TestEpoch))]
[UnlockEpochAfterRunAs(typeof(TestCardEpoch))]
[UnlockEpochAfterWinAs(typeof(TestVictoryEpoch))]
[UnlockEpochAfterEliteVictories(typeof(TestEliteEpoch))]
[UnlockEpochAfterBossVictories(typeof(TestBossEpoch))]
[UnlockEpochAfterAscensionOneWin(typeof(TestAscensionOneEpoch))]
[RevealAscensionAfterEpoch(typeof(TestVictoryEpoch))]
public class TestCharacter : ModCharacterTemplate<TestCardPool, TestRelicPool, TestPotionPool> {
    // rest omitted

    // Display which character unlocks this one, display only — no actual effect
    protected override Type? UnlocksAfterRunAsType => typeof(Ironclad);

    // If you need a timeline
    public override bool RequiresEpochAndTimeline => true;
}
```

If you want to unlock via a specific character, add in the initialization function:
```csharp
    ModUnlockRegistry.For(ModId).UnlockEpochAfterRunAs<Silent, TestEpoch>(); // After Silent completes a run, unlock your character's epoch.
```

## Text

Then create `{modId}/localization/{Language}/epochs.json`.

```json
{
  "STORY_TEST": "Godo",
  "TEST_CHARACTER_EPOCH.description": "By the roadside there is only a single [green]tree[/green], a rock, and a [gold]pocket watch[/gold] polished over and over.\n\nThey say [blue]Godo[/blue] always arrives. Others say he already came, but no one recognized his shadow.\n\nSo the waiting itself began to take shape. It put on a coat, adjusted its hat brim, and slowly walked toward the [gold]Spire[/gold].",
  "TEST_CHARACTER_EPOCH.title": "The One Who Waits",
  "TEST_CHARACTER_EPOCH.unlock": "[blue]Godo[/blue] finally appeared at the end of the road.\nHe may be ready to enter the [gold]Spire[/gold].",
  "TEST_CHARACTER_EPOCH.unlockInfo": "{IsRevealed:Have completed|Complete} a run with [green]Silent[/green]{IsRevealed: to reveal this history node|}.",
  "TEST_CHARACTER_EPOCH.unlockText": "Unlock [blue]Godo[/blue] as a playable character.",
  "TEST_CARD_EPOCH.description": "[blue]Godo[/blue] spread the cards across his lap one by one, as if taking inventory of belated letters.\n\nSome cards were inscribed with [gold]promises[/gold], others with [sine]tomorrow[/sine]. The remaining ones had no words — they merely let out a soft sigh when played.\n\n\"Not enough yet,\" he said. \"But I can wait like this for now.\"",
  "TEST_CARD_EPOCH.title": "The First Deck",
  "TEST_CARD_EPOCH.unlock": "[blue]Godo[/blue] begins organizing his deck.",
  "TEST_CARD_EPOCH.unlockInfo": "{IsRevealed:Have completed|Complete} a run as [blue]Godo[/blue]{IsRevealed: to reveal this history node|}.",
  "TEST_CARD_EPOCH.unlockText": "Unlock more cards for [blue]Godo[/blue].",
  "TEST_CHARACTER_TEST_CHARACTER_2_EPOCH.description": "The air on the first floor was damp and dim, the walls covered with scratches left by past travelers.\n\n[blue]Godo[/blue] stopped at every fork, listening intently to the footsteps in the distance. The sound always drew closer, and always vanished at the corner.\n\nHe didn't chase after it. He simply kept climbing.",
  "TEST_CHARACTER_TEST_CHARACTER_2_EPOCH.title": "Footsteps",
  "TEST_CHARACTER_TEST_CHARACTER_2_EPOCH.unlockInfo": "Clear the [blue]First[/blue] [gold]Act[/gold] as [blue]Godo[/blue]{IsRevealed: to reveal this history node|}.",
  "TEST_CHARACTER_TEST_CHARACTER_2_EPOCH.unlockText": "Unlock more cards for [blue]Godo[/blue].",
  "TEST_CHARACTER_TEST_CHARACTER_3_EPOCH.description": "The merchants and monsters on the second floor were all very busy. Everyone had a destination, everything had a price.\n\n[blue]Godo[/blue] bought a pair of [gold]boots[/gold] that didn't fit, then neatly placed them back where they were.\n\n\"Perhaps someone will need them,\" he said.\n\nThat night, the boots walked upstairs on their own.",
  "TEST_CHARACTER_TEST_CHARACTER_3_EPOCH.title": "Ill-Fitting Boots",
  "TEST_CHARACTER_TEST_CHARACTER_3_EPOCH.unlockInfo": "Clear the [blue]Second[/blue] [gold]Act[/gold] as [blue]Godo[/blue]{IsRevealed: to reveal this history node|}.",
  "TEST_CHARACTER_TEST_CHARACTER_3_EPOCH.unlockText": "Unlock relics for [blue]Godo[/blue].",
  "TEST_CHARACTER_TEST_CHARACTER_4_EPOCH.description": "The sky on the third floor hung close, like a curtain about to fall.\n\n[blue]Godo[/blue] stood before the curtain, hearing no sound from the audience seats. No applause, no boos, no one leaving.\n\nHe bowed toward those empty seats.\n\nThe [gold]lights[/gold] came on. The Spire did not take a curtain call.",
  "TEST_CHARACTER_TEST_CHARACTER_4_EPOCH.title": "Empty Seats",
  "TEST_CHARACTER_TEST_CHARACTER_4_EPOCH.unlock": "[blue]Godo[/blue] is still waiting for a harder tomorrow.\nYou can now select [red]Ascension[/red] difficulty when starting a game.",
  "TEST_CHARACTER_TEST_CHARACTER_4_EPOCH.unlockInfo": "Clear the [blue]Third[/blue] [gold]Act[/gold] as [blue]Godo[/blue]{IsRevealed: to reveal this history node|}.",
  "TEST_CHARACTER_TEST_CHARACTER_4_EPOCH.unlockText": "Unlock [red]Ascension[/red] for [blue]Godo[/blue]. Also unlock [gold]{Potion1}[/gold], [gold]{Potion2}[/gold] and [gold]{Potion3}[/gold].",
  "TEST_VICTORY_EPOCH.description": "After the [purple]Heart[/purple] stopped beating, the Spire grew eerily quiet.\n\n[blue]Godo[/blue] took out his pocket watch and found the hands still hadn't moved. Victory did not restart time, nor did it end the waiting.\n\nHe thought for a long while, then finally smiled.\n\n\"Then, see you tomorrow.\"",
  "TEST_VICTORY_EPOCH.title": "See You Tomorrow",
  "TEST_VICTORY_EPOCH.unlock": "[blue]Godo[/blue] completed a long wait.",
  "TEST_VICTORY_EPOCH.unlockInfo": "{IsRevealed:Have won|Win} a run as [blue]Godo[/blue]{IsRevealed: to reveal this history node|}.",
  "TEST_VICTORY_EPOCH.unlockText": "Unlock more cards for [blue]Godo[/blue].",
  "TEST_ELITE_MILESTONE_EPOCH.description": "The [purple]Elites[/purple] always appear on time.\n\nThis gives [blue]Godo[/blue] some small comfort. At least in this Spire, some things still don't need to be waited for.\n\nHe recorded every hard-fought victory in the same little notebook. When the fifteenth line was written, the ink ran out.",
  "TEST_ELITE_MILESTONE_EPOCH.title": "The Punctual Ones",
  "TEST_ELITE_MILESTONE_EPOCH.unlockInfo": "{IsRevealed:Have||}Defeat [blue]15[/blue] [purple]Elites[/purple] as [blue]Godo[/blue]{IsRevealed: to reveal this history node|}.",
  "TEST_ELITE_MILESTONE_EPOCH.unlockText": "Unlock more cards for [blue]Godo[/blue].",
  "TEST_BOSS_MILESTONE_EPOCH.description": "The [red]Bosses[/red] fell one after another, each like a rehearsed final act.\n\nBut after the curtain fell, there was always another floor, another door, another unspoken word.\n\n[blue]Godo[/blue] took his hat off and put it back on.\n\n\"Seems it's not yet my turn to leave the stage.\"",
  "TEST_BOSS_MILESTONE_EPOCH.title": "After the Final Act",
  "TEST_BOSS_MILESTONE_EPOCH.unlockInfo": "{IsRevealed:Have||}Defeat [blue]15[/blue] [red]Bosses[/red] as [blue]Godo[/blue]{IsRevealed: to reveal this history node|}.",
  "TEST_BOSS_MILESTONE_EPOCH.unlockText": "Unlock more cards for [blue]Godo[/blue].",
  "TEST_ASCENSION_ONE_EPOCH.description": "Higher difficulty did not change the road; it only made each step feel more like a choice.\n\n[blue]Godo[/blue] began to understand that waiting is not staying in place. Waiting is pulling your feet out of the mud, knowing the ending may never come.\n\nIn a colder wind, he walked toward the top of the Spire once more.",
  "TEST_ASCENSION_ONE_EPOCH.title": "A Colder Tomorrow",
  "TEST_ASCENSION_ONE_EPOCH.unlockInfo": "Clear [red]Ascension[/red] [blue]1[/blue] as [blue]Godo[/blue]{IsRevealed: to reveal this history node|}.",
  "TEST_ASCENSION_ONE_EPOCH.unlockText": "Unlock more cards for [blue]Godo[/blue]."
}
```
