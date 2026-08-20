## Simple Multi-Stage Event

Start by creating the class:

```csharp
using BaseLib.Abstracts;
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Gold;
using MegaCrit.Sts2.Core.Events;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.Localization.DynamicVars;
using MegaCrit.Sts2.Core.Rewards;
using MegaCrit.Sts2.Core.Runs;
using MegaCrit.Sts2.Core.ValueProps;

namespace Test.Scripts;

public sealed class TestEvent : CustomEventModel
{
    // Background image
    public override string? CustomInitialPortraitPath => "res://images/events/battleworn_dummy.png";

    // Set up values
    protected override IEnumerable<DynamicVar> CanonicalVars =>
    [
        new DamageVar(10m, ValueProp.Unblockable | ValueProp.Unpowered),
        new GoldVar(60)
    ];

    // When the event can appear. All players must have ≥ 60 gold.
    public override bool IsAllowed(IRunState runState) => runState.Players.All(p => p.Gold >= DynamicVars.Gold.BaseValue);

    // Logic before the event starts. Prevents the player from removing potions.
    protected override Task BeforeEventStarted(bool isPreFinished)
    {
        // 0.107: Owner!.CanRemovePotions = false;
        Owner!.CanUseOrRemovePotions = false;
        return Task.CompletedTask;
    }

    // Logic after the event finishes. Allows potion removal again.
    protected override void OnEventFinished()
    {
        // 0.107: Owner!.CanRemovePotions = true;
        Owner!.CanUseOrRemovePotions = true;
    }

    // Generate initial options: lose HP or lose gold, then move to reward selection
    protected override IReadOnlyList<EventOption> GenerateInitialOptions() =>
    [
        Option(TakeDamage),
        Option(LoseGold),
    ];

    // Lose HP
    private async Task TakeDamage()
    {
        // 0.107: await CreatureCmd.Damage(new ThrowingPlayerChoiceContext(), Owner!.Creature, DynamicVars.Damage, null, null);
        await CreatureCmd.Damage(new ThrowingPlayerChoiceContext(), Owner!.Creature, DynamicVars.Damage, null, null, null);
        ChooseRewardTypePage();
    }

    // Lose gold
    private async Task LoseGold()
    {
        await PlayerCmd.LoseGold(DynamicVars.Gold.BaseValue, Owner!, GoldLossType.Stolen);
        ChooseRewardTypePage();
    }

    // Second stage: pick a potion or pick a card
    private void ChooseRewardTypePage()
    {
        SetEventState(PageDescription("CHOOSE_TYPE"), [
            Option(ChoosePotions, "CHOOSE_TYPE"), // Second parameter is the page this option belongs to
            Option(ChooseCards, "CHOOSE_TYPE"),
        ]);
    }

    // Choose potion reward, then end the event
    private async Task ChoosePotions()
    {
        await RewardsCmd.OfferCustom(Owner!, [new PotionReward(Owner!)]);
        SetEventFinished(PageDescription("POTIONS_CHOSEN")); // Call this when the event ends
    }

    // Choose card reward, then end the event
    private async Task ChooseCards()
    {
        await RewardsCmd.OfferCustom(Owner!, [new CardReward(CardCreationOptions.ForNonCombatWithDefaultOdds([Owner!.Character.CardPool]), 3, Owner)]);
        SetEventFinished(PageDescription("CARDS_CHOSEN"));
    }
}
```

The strings in the code above mostly correspond to keys in the localization JSON.

Create `{modId}/localization/{Language}/events.json`.

```json
{
  // Event title
  "TEST-TEST_EVENT.title": "Encounter with Godo",
  // INITIAL is the initial page. This is its description.
  "TEST-TEST_EVENT.pages.INITIAL.description": "The bench at the fork in the road was empty, only the wind brushing through the grass.\n\n[sine]Then you saw him.[/sine]\n\nThe small, blue silhouette sat quietly, as if waiting for a letter that would never arrive, or a build that would forever be \"almost ready.\"\n\n[gold]Godo[/gold] lifted his eyes — if they could be called eyes — his tone flat, almost gentle:\n\n\"[sine]It's still early... and it'll be a long while. Would you pay a small price now, in exchange for... something to pass the time?[/sine]\"",
  // Option title. TAKE_DAMAGE is generated from your function name (TakeDamage → TAKE_DAMAGE).
  "TEST-TEST_EVENT.pages.INITIAL.options.TAKE_DAMAGE.title": "Remember this moment with pain",
  // Option description.
  "TEST-TEST_EVENT.pages.INITIAL.options.TAKE_DAMAGE.description": "Take [red]{Damage}[/red] damage.",
  "TEST-TEST_EVENT.pages.INITIAL.options.LOSE_GOLD.title": "Leave a toll",
  "TEST-TEST_EVENT.pages.INITIAL.options.LOSE_GOLD.description": "Lose [gold]{Gold}[/gold] gold.",
  // Second page. CHOOSE_TYPE is what we set ourselves.
  "TEST-TEST_EVENT.pages.CHOOSE_TYPE.description": "Godo pulled a cloth bundle from under the bench, as if pulling out the patience of the entire universe.\n\n\"[sine]You can have something to drink... or take a few cards. Either way,[/sine]\" he paused, \"[sine]we're not going anywhere.[/sine]\"",
  "TEST-TEST_EVENT.pages.CHOOSE_TYPE.options.CHOOSE_POTIONS.title": "Take a potion",
  "TEST-TEST_EVENT.pages.CHOOSE_TYPE.options.CHOOSE_POTIONS.description": "Receive a potion reward, then bid farewell to this wait.",
  "TEST-TEST_EVENT.pages.CHOOSE_TYPE.options.CHOOSE_CARDS.title": "Take a card and go",
  "TEST-TEST_EVENT.pages.CHOOSE_TYPE.options.CHOOSE_CARDS.description": "Receive a card reward, then bid farewell to this wait.",
  // Ending page. POTIONS_CHOSEN is also set by us.
  "TEST-TEST_EVENT.pages.POTIONS_CHOSEN.description": "The liquid swayed gently in the bottle, like the idle rhythm of a distant engine.\n\n[gold]Godo[/gold] raised the empty bottle toward you, as if toasting — or toasting time itself.\n\n[sine]...Alright. The rest, you can wait for on your own.[/sine]",
  "TEST-TEST_EVENT.pages.CARDS_CHOSEN.description": "The edges of the cards brushed against your fingers, leaving a crisp sound — at least louder than silence.\n\n[gold]Godo[/gold] watched you put the cards away and nodded.\n\n[sine]Take them. The road is long. Don't let yourself... wait too quietly.[/sine]"
}

```

![alt text](../../images/image33.webp)

## Combat Event

Add this to your event class:

```csharp
    public override EventLayoutType LayoutType => EventLayoutType.Combat; // Use combat scene

    public override EncounterModel CanonicalEncounter => ModelDb.Encounter<TestEncounter>(); // The encounter to start

    // One of the options — starts combat
    public Task Fight()
    {
        // Start combat
        EnterCombatWithoutExitingEvent<TestEncounter>(
            [new SpecialCardReward(Owner!.RunState.CreateCard<LanternKey>(Owner), Owner)], // Additional rewards
            shouldResumeAfterCombat: false // Whether to continue the event after combat
        );
        return Task.CompletedTask;
    }

    // If shouldResumeAfterCombat is true, this runs after combat ends
    public override async Task Resume(AbstractRoom room)
    {
    }
```
