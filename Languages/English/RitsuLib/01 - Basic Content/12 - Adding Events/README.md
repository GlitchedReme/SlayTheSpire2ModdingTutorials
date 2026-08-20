## Simple multi-stage event

First, create the class:

```csharp
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Gold;
using MegaCrit.Sts2.Core.Events;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.Helpers;
using MegaCrit.Sts2.Core.Localization.DynamicVars;
using MegaCrit.Sts2.Core.Rewards;
using MegaCrit.Sts2.Core.Runs;
using MegaCrit.Sts2.Core.ValueProps;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

[RegisterActEvent(typeof(Glory))] // Spawn only in the Glory act
// [RegisterSharedEvent] // If you need custom spawn conditions, register as shared then override IsAllowed
public sealed class TestEvent : ModEventTemplate
{
    // Background image path
    public override EventAssetProfile AssetProfile => new(
        InitialPortraitPath: "res://images/events/battleworn_dummy.png"
    );

    // Set some values
    protected override IEnumerable<DynamicVar> CanonicalVars =>
    [
        new DamageVar(10m, ValueProp.Unblockable | ValueProp.Unpowered),
        new GoldVar(60)
    ];

    // When can this event be encountered. Condition here: all players' gold >= 60
    public override bool IsAllowed(IRunState runState) => runState.Players.All(p => p.Gold >= DynamicVars.Gold.BaseValue);

    // Logic before the event starts. Here: prevent the player from removing potions
    protected override Task BeforeEventStarted(bool isPreFinished)
    {
        // 0.107: Owner!.CanRemovePotions = false;
        Owner!.CanUseOrRemovePotions = false;
        return Task.CompletedTask;
    }

    // Logic after the event ends. Here: allow the player to remove potions
    protected override void OnEventFinished()
    {
        // 0.107: Owner!.CanRemovePotions = true;
        Owner!.CanUseOrRemovePotions = true;
    }

    // Generate initial event options. Here: two options — lose HP or lose gold, then enter reward selection stage
    // Same as CustomEventModel.Option(delegate, pageKey): textKey = Id.Entry + ".pages." + page + ".options." + Slugify(methodName)
    protected override IReadOnlyList<EventOption> GenerateInitialOptions() =>
    [
        new EventOption(this, TakeDamage, InitialOptionKey("TAKE_DAMAGE")),
        new EventOption(this, LoseGold, InitialOptionKey("LOSE_GOLD")),
    ];

    // Lose health
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

    // Enter event stage two: two options — choose potion or choose card
    private void ChooseRewardTypePage()
    {
        SetEventState(L10NLookup($"{Id.Entry}.pages.CHOOSE_TYPE.description"), [
            new EventOption(this, ChoosePotions, ModOptionKey("CHOOSE_TYPE", "CHOOSE_POTIONS")),
            new EventOption(this, ChooseCards, ModOptionKey("CHOOSE_TYPE", "CHOOSE_CARDS")),
        ]);
    }

    // Choose potion reward, then end the event
    private async Task ChoosePotions()
    {
        await RewardsCmd.OfferCustom(Owner!, [new PotionReward(Owner!)]);
        SetEventFinished(L10NLookup($"{Id.Entry}.pages.POTIONS_CHOSEN.description"));
    }

    // Choose card reward, then end the event
    private async Task ChooseCards()
    {
        await RewardsCmd.OfferCustom(Owner!, [new CardReward(CardCreationOptions.ForNonCombatWithDefaultOdds([Owner!.Character.CardPool]), 3, Owner)]);
        SetEventFinished(L10NLookup($"{Id.Entry}.pages.CARDS_CHOSEN.description"));
    }
}
```

The strings in the above code are basically all related to the JSON text keys.

Create `{modId}/localization/{Language}/events.json`.

- When adding content via `ritsulib`, its ID becomes `{modid}_{category}_{originalID}`. For example, here `modid` is `TEST` and the category is `EVENT`.

```json
{
  // Event title
  "TEST_EVENT_TEST_EVENT.title": "Encounter with Godo",
  // INITIAL is the initial page. This is the initial page description
  "TEST_EVENT_TEST_EVENT.pages.INITIAL.description": "The bench at the crossroads was empty, only the wind brushing through the grass.\n\n[sine]Then you saw him.[/sine]\n\nThat small, blue silhouette sat quietly, as if waiting for a letter that would never be delivered, or waiting for a build that would forever be \"almost ready.\"\n\n[gold]Godo[/gold] lifted his eyes — if they could be called eyes — and his tone was flat to the point of gentleness:\n\n\"[sine]Time is early still… and also long. Would you be willing to pay a small price, in exchange for something… to pass the waiting?[/sine]\"",
  // This is the option title. TAKE_DAMAGE is the ID name generated from your function. (Generated from TakeDamage)
  "TEST_EVENT_TEST_EVENT.pages.INITIAL.options.TAKE_DAMAGE.title": "Remember this moment through pain",
  // Option description.
  "TEST_EVENT_TEST_EVENT.pages.INITIAL.options.TAKE_DAMAGE.description": "Take [red]{Damage}[/red] damage.",
  "TEST_EVENT_TEST_EVENT.pages.INITIAL.options.LOSE_GOLD.title": "Leave a toll",
  "TEST_EVENT_TEST_EVENT.pages.INITIAL.options.LOSE_GOLD.description": "Lose [gold]{Gold}[/gold] gold.",
  // This is the second page. CHOOSE_TYPE is what we set ourselves.
  "TEST_EVENT_TEST_EVENT.pages.CHOOSE_TYPE.description": "Godo fished out a cloth bundle from under the bench, as if pulling out the patience of the entire universe.\n\n\"[sine]You can have a drink… or take a few cards. After all,[/sine]\" he paused, \"[sine]we're not going anywhere.[/sine]\"",
  "TEST_EVENT_TEST_EVENT.pages.CHOOSE_TYPE.options.CHOOSE_POTIONS.title": "Take a potion",
  "TEST_EVENT_TEST_EVENT.pages.CHOOSE_TYPE.options.CHOOSE_POTIONS.description": "Receive a potion reward, then say goodbye to this wait.",
  "TEST_EVENT_TEST_EVENT.pages.CHOOSE_TYPE.options.CHOOSE_CARDS.title": "Grab a card before going",
  "TEST_EVENT_TEST_EVENT.pages.CHOOSE_TYPE.options.CHOOSE_CARDS.description": "Receive a card reward, then say goodbye to this wait.",
  // End page. POTIONS_CHOSEN is also set by us.
  "TEST_EVENT_TEST_EVENT.pages.POTIONS_CHOSEN.description": "The liquid swayed gently in the bottle, like the rhythm of a distant engine idling.\n\n[gold]Godo[/gold] raised the empty bottle toward you slightly, as if toasting — to you, or to time itself.\n\n[sine]…Alright. The rest, you wait out on your own.[/sine]",
  "TEST_EVENT_TEST_EVENT.pages.CARDS_CHOSEN.description": "The edges of the cards slid across your fingers, leaving a crisp rustle — at least livelier than the silence.\n\n[gold]Godo[/gold] watched you stow the cards away and nodded.\n\n[sine]Take them with you. The road is long. Don't let yourself… wait too quietly.[/sine]"
}
```

![alt text](../../../images/image33.webp)

## Combat event

Add in your event class:

```csharp
    public override EventLayoutType LayoutType => EventLayoutType.Combat; // Use the combat scene

    public override EncounterModel CanonicalEncounter => ModelDb.Encounter<TestEncounter>(); // The upcoming encounter

    // Effect of one of the options: start combat
    public Task Fight()
    {
        // Start combat
        EnterCombatWithoutExitingEvent<TestEncounter>(
            [new SpecialCardReward(Owner!.RunState.CreateCard<LanternKey>(Owner), Owner)], // additional rewards granted
            shouldResumeAfterCombat: false // whether to continue the event after combat ends
        );
        return Task.CompletedTask;
    }

    // If shouldResumeAfterCombat is set to true, this logic executes after combat ends
    public override async Task Resume(AbstractRoom room)
    {
    }
```
