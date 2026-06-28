Adding a new character is rather involved, so it gets its own chapter.

> The examples below assume you have already enabled `RitsuLib`'s auto-registration in `Entry.Init()`, otherwise attributes like `[RegisterCharacter]` won't take effect (see Chapter 0):
>
> ```csharp
> var assembly = Assembly.GetExecutingAssembly();
> RitsuLibFramework.EnsureGodotScriptsRegistered(assembly, Logger);
> ModTypeDiscoveryHub.RegisterModAssembly(ModId, assembly);
> ```

## Creating pools

You need to create one each of card, potion, and relic pools exclusive to your character.

`TestCardPool.cs`:
```csharp
using Godot;
using STS2RitsuLib.Scaffolding.Content;
using STS2RitsuLib.Utils;

namespace Test.Scripts;

public class TestCardPool : TypeListCardPoolModel
{
    // Pool ID. Must be unique to avoid collisions.
    public override string Title => "test";
    public override string EnergyColorName => "test";

    // Energy icon used in descriptions. Size 24x24.
    public override string? TextEnergyIconPath => "res://Test/images/energy_test.png";
    // Energy icon for tooltips and the top-left corner of cards. Size 74x74.
    public override string? BigEnergyIconPath => "res://Test/images/energy_test_big.png";

    // Pool theme color.
    public override Color DeckEntryCardColor => new(0.5f, 0.5f, 1f);
    // Energy counter text outline color
    public override Color EnergyOutlineColor => new(0.5f, 0.5f, 1f);

    // Use the appropriate Material depending on your card frame
    private static readonly Material? _poolFrameMaterial = MaterialUtils.CreateReplaceHueShaderMaterial(0.5f, 0.5f, 1f); // If you use the vanilla card frame, use this to directly replace the hue.
    // private static readonly Material? _poolFrameMaterial = MaterialUtils.CreateRgbShaderMaterial(0.5f, 0.5f, 1f); // Use vanilla card frame hue replacement. Unless your version doesn't have CreateReplaceHueShaderMaterial, you should use the one above
    // private static readonly Material? _poolFrameMaterial = MaterialUtils.CreateUnmodulatedHsvShaderMaterial(); // If using a custom card frame, use this
    public override Material? PoolFrameMaterial => _poolFrameMaterial;

    // Whether the pool is colorless. For example, event and status pools are colorless.
    public override bool IsColorless => false;
}
```

`TestRelicPool.cs`:

```csharp
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

public class TestRelicPool : TypeListRelicPoolModel
{
    // Energy icon used in descriptions. Size 24x24.
    public override string? TextEnergyIconPath => "res://Test/images/energy_test.png";
    // Energy icon for tooltips and the top-left corner of cards. Size 74x74.
    public override string? BigEnergyIconPath => "res://Test/images/energy_test_big.png";

    public override string EnergyColorName => "test";
}
```

`TestPotionPool.cs`:

```csharp
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

public class TestPotionPool : TypeListPotionPoolModel
{
    // Energy icon used in descriptions. Size 24x24.
    public override string? TextEnergyIconPath => "res://Test/images/energy_test.png";
    // Energy icon for tooltips and the top-left corner of cards. Size 74x74.
    public override string? BigEnergyIconPath => "res://Test/images/energy_test_big.png";

    public override string EnergyColorName => "test";
}
```

<b>When creating your own character's pools, don't forget to change the registration target of your cards, potions, relics, etc. (e.g. Strike) to your pool</b>, for example:

```csharp
// Which card pool to join
[RegisterCard(typeof(TestCardPool))]
public class TestCard : ModCardTemplate
```

## Character-exclusive content registration

`Archaic Tooth` can transform a starter card into an Ancient upgrade. Register in the initialization function (`Entry.Init`):

```csharp
RitsuLibFramework.RegisterArchaicToothTranscendenceMapping<TestCard, Shiv>();
```

The first type parameter is your starter card, the second type parameter is the card it gets upgraded into.

`Touch of Orobas` can upgrade the starter relic. Similarly register the mapping in the initialization function:

```csharp
RitsuLibFramework.RegisterTouchOfOrobasRefinementMapping<TestRelic, Akabeko>();
```

`Dusty Grimoire` can grant an Ancient card. The result is obtained from your pool by selecting all Ancient cards and removing the one from `Archaic Tooth`. So you only need to create one more Ancient card.

`Yummy Cookie` uses a different icon depending on your character. Refer to the `VanillaRelicVisualOverrides` value in the `AssetProfile` property below.

`Sea Glass` uses different characters' pool settings for its effect. A localization text entry for your character is needed — add `SEA_GLASS.{yourCharacterId}.title` in your mod's `relics.json`:

```json
{
  "SEA_GLASS.TEST_CHARACTER_TEST_CHARACTER.title": "Godo Glass"
}
```

The `Colorful Philosophers` event generates three characters' card pools. It does not accept your character by default — you need to implement the `IModColorfulPhilosophersCardPool` interface on your card pool and provide localization text.

```csharp
public class TestCardPool : TypeListCardPoolModel, IModColorfulPhilosophersCardPool {}
```

Additionally, write localization text in your own `events.json` (the ID is the uppercase of your card pool's `EnergyColorName`):

```json
  "COLORFUL_PHILOSOPHERS.pages.INITIAL.options.TEST.title": "Pale Blue",
  "COLORFUL_PHILOSOPHERS.pages.INITIAL.options.TEST.description": "Obtain [blue]{Cards}[/blue] Godo card(s).",
```

## Creating the character

Characters require a large amount of resources. In `RitsuLib`, simply inherit `ModCharacterTemplate<CardPool, RelicPool, PotionPool>`. Comment out any resources you don't have to use the vanilla ones. Tutorial-provided resources are at the bottom.

```csharp
using Godot;
using MegaCrit.Sts2.Core.Entities.Characters;
using MegaCrit.Sts2.Core.Models.Relics;
using MegaCrit.Sts2.Core.Nodes.Combat;
using STS2RitsuLib.Data.Models;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Scaffolding.Characters;
using STS2RitsuLib.Scaffolding.Godot;

namespace Test.Scripts;

[RegisterCharacter]
public class TestCharacter : ModCharacterTemplate<TestCardPool, TestRelicPool, TestPotionPool>
{
    // Character name color
    public override Color NameColor => new(0.5f, 0.5f, 1f);
    // Energy icon outline color
    public override Color EnergyLabelOutlineColor => new(0.5f, 0.5f, 1f);
    // Map drawing color
    public override Color MapDrawingColor => new(0.5f, 0.5f, 1f);

    // Character gender (Masculine / Feminine / Neutral)
    public override CharacterGender Gender => CharacterGender.Masculine;

    // Starting HP and gold
    public override int StartingHp => 80;
    public override int StartingGold => 99;

    public override CharacterAssetProfile AssetProfile => CharacterAssetProfiles.Merge(
        CharacterAssetProfiles.Ironclad(),
        new(
            Scenes: new(
                // Character model tscn path.
                VisualsPath: "res://Test/scenes/test_character.tscn",
                // Energy counter tscn path.
                EnergyCounterPath: "res://Test/scenes/test_energy_counter.tscn",
                // Shop character scene.
                MerchantAnimPath: "res://Test/scenes/test_character_merchant.tscn",
                // Rest site scene.
                RestSiteAnimPath: "res://Test/scenes/test_character_rest_site.tscn"
            ),
            Ui: new(
                // For images, any Godot-supported format works, e.g. png, jpg, svg, etc. No further explanation below.
                // Character portrait path. Auto-scaled.
                IconTexturePath: "res://icon.svg",
                // Top-left game avatar, stats page avatar, daily challenge avatar. This is a scene, not an image. Refer to the resources below to build one.
                IconPath: "res://Test/scenes/test_icon.tscn",
                // Character select background.
                CharacterSelectBgPath: "res://Test/scenes/test_bg.tscn",
                // Character select icon.
                CharacterSelectIconPath: "res://Test/images/char_select_test.png",
                // Character select icon - locked state.
                CharacterSelectLockedIconPath: "res://Test/images/char_select_test_locked.png",
                // Character select transition animation.
                // CharacterSelectTransitionPath: "res://materials/transitions/ironclad_transition_mat.tres",
                // Character marker icon on the map, character avatar on the emote wheel.
                MapMarkerPath: "res://icon.svg"
            ),
            Vfx: new(
                // Card trail scene.
                // TrailPath: "res://scenes/vfx/card_trail_ironclad.tscn"
            ),
            Audio: new(
                // Attack sound effect
                // AttackSfx: null,
                // Cast sound effect
                // CastSfx: null,
                // Death sound effect
                // DeathSfx: null,
                // Character select sound effect
                // CharacterSelectSfx: null,
                // Transition sound effect
                // CharacterTransitionSfx: "event:/sfx/ui/wipe_ironclad"
            ),
            Multiplayer: new(
                // Multiplayer - pointing finger.
                // ArmPointingTexturePath: null,
                // Multiplayer rock-paper-scissors - rock.
                // ArmRockTexturePath: null,
                // Multiplayer rock-paper-scissors - paper.
                // ArmPaperTexturePath: null,
                // Multiplayer rock-paper-scissors - scissors.
                // ArmScissorsTexturePath: null
            )
            // For any others you need, uncomment and use them
            // Spine: null,
            // VisualCues: null, // For frame animation / static image characters, see the Character Animation chapter
            // WorldProceduralVisuals: null,
            // The following lets relics display different image resources based on your character. Add entries to the list.
            // VanillaCardVisualOverrides: [],
            // VanillaRelicVisualOverrides: [
            //     new (CharacterOwnedVanillaRelicModelId.YummyCookie, new("res://icon.svg")) // Yummy Cookie override
            // ],
            // VanillaPotionVisualOverrides: []
        ));

    // Attack and cast animation delays to align animations
    public override float AttackAnimDelay => 0f;
    public override float CastAnimDelay => 0f;

    // If your character doesn't need a timeline story, add this line.
    public override bool RequiresEpochAndTimeline => false;

    // Auto-convert character scene so you don't need to manually mount scripts. Copy as-is.
    protected override NCreatureVisuals? TryCreateCreatureVisuals() => RitsuGodotNodeFactories.CreateFromScenePath<NCreatureVisuals>(AssetProfile.Scenes!.VisualsPath!);

    // Starting deck. Alternatively, use RegisterCharacterStarterCard on the card class instead of writing this.
    // protected override IEnumerable<StartingDeckEntry> StartingDeckEntries => [
    //     new(typeof(TestCard), 5)
    // ];

    // Starting relic. Alternatively, use RegisterCharacterStarterRelic on the relic class instead of writing this.
    // protected override IEnumerable<Type> StartingRelicTypes => [
    //     typeof(Akabeko)
    // ];

    // Attack VFX list for the Architect battle
    public override List<string> GetArchitectAttackVfx() => [
        "vfx/vfx_attack_blunt",
        "vfx/vfx_heavy_blunt",
        "vfx/vfx_attack_slash",
        "vfx/vfx_bloody_impact",
        "vfx/vfx_rock_shatter"
    ];
}
```

## Custom character background

```csharp
Ui: new(
    CharacterSelectBgPath: "res://Test/scenes/test_bg.tscn",
)
```

No special requirements — create a new scene in Godot with type `Control` and build it yourself. Reference: (recommended root node size is 2560x1200; you can copy the tscn resources from the bottom)

![Character background](../../../images/image17.png)

## Custom combat model

> If your character uses frame animation or static images, refer to the `Character Animation` chapter for setup

In `AssetProfile`:

```csharp
Scenes: new(
    VisualsPath: "res://Test/scenes/test_character.tscn"
)
```

Create a new scene of type `Node2D` as follows:

```
TestCharacter (Node2D)
├── Visuals (Node2D) %
├── Bounds (Control) %
├── IntentPos (Marker2D) %
├── CenterPos (Marker2D) %
└── TalkPos (Marker2D) %
```

<b>`Visuals`, `Bounds`, `IntentPos`, `CenterPos`, and `TalkPos` need to have `Access as Unique Name` checked via right-click, indicated by `%`. Do not change the names.</b>

`Bounds` is the size of your character's hitbox. If you feel the health bar is too short, adjust its size.

* The character is displayed above the x-axis.
* If you want to use a 3D model, create a hierarchy of `visuals→subviewportcontainer→subviewport`, then add a `camera3d` and any 3D model inside the `subviewport`. Adjust the perspective in the 3D view until it displays correctly in the 2D view. Finally, set the `subviewport`'s `transparent` to `true`.

![alt text](../../../images/image18.png)

* The bonus resources provide a single-image scene that covers the screen as much as possible — just swap the image for your character background image.

### Character animation

* `Visuals` can be changed to any type that inherits `Node2D`, such as `SpineSprite`, `Sprite2D`, `AnimatedSprite2D`, or `AnimationPlayer`, or you can create new nodes under it.

* To naturally support Spine playback, change `Visuals` to the `SpineSprite` type (do not rename it), and your combat character model must have animation names `idle_loop`, `attack`, `cast`, `hurt`, and `die`. (If you don't have `SpineSprite`, refer to the `Card Art & Skin Replacement` chapter to download `Spine Godot Extension` first.)

* Non-Spine requires using an animation state machine. See the `Character Animation` chapter for details.

## Custom energy counter

In `AssetProfile`:

```csharp
Scenes: new(
    EnergyCounterPath: "res://Test/scenes/test_energy_counter.tscn"
)
```

* We recommend copying a tscn from the vanilla game or the bonus resources below to get started quickly.

Create a new scene of type `Control` with the following structure (*names cannot be changed*):

```
TestEnergyCounter (Control)
├── EnergyVfxBack (Node2D) %
├── Layers (Control) %
│   ├── Layer1 (TextureRect, or any)
│   └── RotationLayers (Control) %
├── EnergyVfxFront (Node2D) %
└── Label (Label)
```

* Items marked with `%` need `Access as Unique Name`. Do not change the names, including `label`.
* Place layers that need to rotate inside `RotationLayers`. It's fine if there are none.

![alt text](../../../images/image19.png)

## Custom merchant model

Modify in `AssetProfile`:

```csharp
Scenes: new(
    MerchantAnimPath: "res://Test/scenes/test_character_merchant.tscn"
)
```

Create a new scene of type `Node2D` with just one node:

```
TestCharacterMerchant (any type)
```

* If using a Spine model, change the type to `SpineSprite`. The default animation played is `relaxed_loop`.
* For other animations, change it to whatever type you want.

## Custom rest site model

Modify in `AssetProfile`:

```csharp
Scenes: new(
    RestSiteAnimPath: "res://RitsuTest/scenes/test_character_rest_site.tscn"
)
```
* We recommend copying a tscn from the vanilla game or the bonus resources below to get started quickly.

Create a new scene of type `Node2D` with the following structure:

```
TestCharacterRestSite (Node2D)
├── Node (any)
└── ControlRoot (Control) %
    ├── SelectionReticle (Control) %
    ├── Hitbox (Control) %
    ├── ThoughtBubbleRight (Control) %
    └── ThoughtBubbleLeft (Control) %
```

* Change the type of `Node` to create animations; you can also add more nodes. The character faces right.

* If using a Spine model, the code will find all nodes of type `SpineSprite` and play `overgrowth_loop`, `hive_loop`, or `glory_loop` animations depending on the current act. The only difference between these animations is the lighting color.

* If using other animations, simply change `Node` to your type. You can create a custom script (inheriting `NRestSiteCharacter`) and play animations yourself.

## Custom transition animation

For the transition animation, first prepare a 2560x1200 image, as shown below.

Areas closer to pure white appear first, gradually covering toward black. The transition image shown below goes from left to right.

![Transition animation](../../../images/test_transition.png)

Then create a resource of type `shader material` and add the accompanying shader. The code is at the end.

Set your own transition texture in `shader parameters`.

## Localization files

Create `{modId}/localization/{Language}/characters.json` with the following content:

- When adding content via `ritsulib`, its ID becomes `{modid}_{category}_{originalID}`. For example, here `modid` is `TEST` and the category is `CHARACTER`.

```json
{
  // Inner monologue in the Aroma event
  "TEST_CHARACTER_TEST_CHARACTER.aromaPrinciple": "[sine][blue]……waiting……[/blue][/sine]",
  // Multiplayer: end-of-turn banter when alive
  "TEST_CHARACTER_TEST_CHARACTER.banter.alive.endTurnPing": "……",
  // Multiplayer: end-of-turn banter when dead
  "TEST_CHARACTER_TEST_CHARACTER.banter.dead.endTurnPing": "……",
  // Custom mode text
  "TEST_CHARACTER_TEST_CHARACTER.cardsModifierDescription": "Godo's cards will now appear in rewards and shops.",
  // Card pool name
  "TEST_CHARACTER_TEST_CHARACTER.cardsModifierTitle": "Godo Cards",
  // Character select screen description
  "TEST_CHARACTER_TEST_CHARACTER.description": "A presence in an endless wait.\nTo [gold]Godo[/gold], time is merely another form of eternity.",
  // Death prevention event dialogue
  "TEST_CHARACTER_TEST_CHARACTER.eventDeathPrevention": "I still have to keep waiting……",
  // Monologue about gold in the Sunken Vault event
  "TEST_CHARACTER_TEST_CHARACTER.goldMonologue": "[sine]These coins…… might come in handy……[/sine]",
  // Possessive adjective, used in dynamic text
  "TEST_CHARACTER_TEST_CHARACTER.possessiveAdjective": "his",
  // Object pronoun
  "TEST_CHARACTER_TEST_CHARACTER.pronounObject": "him",
  // Possessive pronoun
  "TEST_CHARACTER_TEST_CHARACTER.pronounPossessive": "his",
  // Subject pronoun
  "TEST_CHARACTER_TEST_CHARACTER.pronounSubject": "he",
  // Character name (for titles)
  "TEST_CHARACTER_TEST_CHARACTER.title": "Godo",
  // Character name (for use as object)
  "TEST_CHARACTER_TEST_CHARACTER.titleObject": "Godo",
  // Unlock condition text, {Prerequisite} will be replaced
  "TEST_CHARACTER_TEST_CHARACTER.unlockText": "Complete a run with [pink]{Prerequisite}[/pink] to unlock this character."
}
```

You also need the Ancient dialogue JSON. Create `{modId}/localization/{Language}/ancients.json`. See the `Ancient Dialogues` chapter for details.

```json
{
  "DARV.talk.TEST_CHARACTER_TEST_CHARACTER.0-0.char": "It's…… noisy here. But there are many things. While I'm waiting, I'll just take a look.",
  "DARV.talk.TEST_CHARACTER_TEST_CHARACTER.0-0.next": "Continue",
  "DARV.talk.TEST_CHARACTER_TEST_CHARACTER.0-1.ancient": "Of course! In this tedious waiting, pick any forgotten gem you like!",
  "DARV.talk.TEST_CHARACTER_TEST_CHARACTER.1-0r.ancient": "Still waiting? I'm in no rush — take your time choosing from that pile. You can wait, and so can I!",
  "DARV.talk.TEST_CHARACTER_TEST_CHARACTER.2-0.ancient": "I have countless gems here, but I don't seem to see the one you've been waiting for……",
  "DARV.talk.TEST_CHARACTER_TEST_CHARACTER.2-0.next": "Respond",
  "DARV.talk.TEST_CHARACTER_TEST_CHARACTER.2-1.char": "If you really do have the one I'm waiting for…… it doesn't need to shine. It only needs to appear when it's supposed to.\n[i][font_size=22]Godo just stands there, like a nail dulled by time.[/font_size][/i]",
  "DARV.talk.TEST_CHARACTER_TEST_CHARACTER.2-1.next": "Continue",
  "DARV.talk.TEST_CHARACTER_TEST_CHARACTER.2-2.ancient": "……Never mind. Save your choice for next time. It seems you're accustomed to making \"next time\" a very long wait.",

  "NEOW.talk.TEST_CHARACTER_TEST_CHARACTER.0-0.char": "You've fished me out of the silence again…… Where am I to go waiting this time?",
  "NEOW.talk.TEST_CHARACTER_TEST_CHARACTER.0-0.next": "Continue",
  "NEOW.talk.TEST_CHARACTER_TEST_CHARACTER.0-1.ancient": "[sine]...go... into the spire... ...continue... waiting.....[/sine]",
  "NEOW.talk.TEST_CHARACTER_TEST_CHARACTER.1-0r.ancient": "[sine]...I hear... ..your footsteps..... \n...waiting... ..is never in a hurry.....[/sine]",
  "NEOW.talk.TEST_CHARACTER_TEST_CHARACTER.2-0.ancient": "[sine]...you.. still lack... ..what...?[/sine]",
  "NEOW.talk.TEST_CHARACTER_TEST_CHARACTER.2-0.next": "Plead",
  "NEOW.talk.TEST_CHARACTER_TEST_CHARACTER.2-1.char": "If you grant me anything…… grant me the strength to \"wait one more time.\" I lack nothing else.",
  "NEOW.talk.TEST_CHARACTER_TEST_CHARACTER.2-1.next": "Continue",
  "NEOW.talk.TEST_CHARACTER_TEST_CHARACTER.2-2.ancient": "[sine]...go... \n..I will... be where you... turn back... ..still there.....[/sine]",

  "NONUPEIPE.talk.TEST_CHARACTER_TEST_CHARACTER.0-0.char": "A splendid room. A dazzling you. But I…… am merely an old coat that hasn't been claimed yet.",
  "NONUPEIPE.talk.TEST_CHARACTER_TEST_CHARACTER.0-0.next": "Continue",
  "NONUPEIPE.talk.TEST_CHARACTER_TEST_CHARACTER.0-1.ancient": "Oh my, even an old coat can become radiant under my blessing.",
  "NONUPEIPE.talk.TEST_CHARACTER_TEST_CHARACTER.1-0r.ancient": "Are you waiting for a belated victory? Come quickly, let me dress you up more like a winner.",
  "NONUPEIPE.talk.TEST_CHARACTER_TEST_CHARACTER.2-0.ancient": "Even if you want to tie yourself to a moment that will never come, you shouldn't look so dusty and forlorn.",
  "NONUPEIPE.talk.TEST_CHARACTER_TEST_CHARACTER.2-0.next": "Politely decline",
  "NONUPEIPE.talk.TEST_CHARACTER_TEST_CHARACTER.2-1.char": "……I don't need to look good. I only need \"it's not over yet.\"",
  "NONUPEIPE.talk.TEST_CHARACTER_TEST_CHARACTER.2-1.next": "Continue",
  "NONUPEIPE.talk.TEST_CHARACTER_TEST_CHARACTER.2-2.ancient": "So lacking in taste. Take it. Let me watch you keep waiting — wearing my light, and your patience.",

  "OROBAS.talk.TEST_CHARACTER_TEST_CHARACTER.0-0.char": "You're jumping. I'm waiting. Which of us is crazier?",
  "OROBAS.talk.TEST_CHARACTER_TEST_CHARACTER.0-0.next": "Continue",
  "OROBAS.talk.TEST_CHARACTER_TEST_CHARACTER.0-1.ancient": "Neither is crazy!! Neither is crazy!! Try this to pass the time!!",
  "OROBAS.talk.TEST_CHARACTER_TEST_CHARACTER.1-0r.ancient": "Don't rush don't rush! You mustn't rush! Waiting is…… is…… very long lightning!!",
  "OROBAS.talk.TEST_CHARACTER_TEST_CHARACTER.2-0.ancient": "Giving you things!! What do you want? A sound that \"will still ring tomorrow\"!?",
  "OROBAS.talk.TEST_CHARACTER_TEST_CHARACTER.2-0.next": "Respond",
  "OROBAS.talk.TEST_CHARACTER_TEST_CHARACTER.2-1.char": "……I put silence in my pocket. Would you like to touch it?",
  "OROBAS.talk.TEST_CHARACTER_TEST_CHARACTER.2-1.next": "Continue",
  "OROBAS.talk.TEST_CHARACTER_TEST_CHARACTER.2-2.ancient": "Good! Good! Then it's settled: I'll keep making noise, and you keep waiting!!",

  "PAEL.talk.TEST_CHARACTER_TEST_CHARACTER.0-0.char": "Your snoring is like the tides…… In the tide, I wait — I won't drown, only grow quieter.",
  "PAEL.talk.TEST_CHARACTER_TEST_CHARACTER.0-0.next": "Continue",
  "PAEL.talk.TEST_CHARACTER_TEST_CHARACTER.0-1.ancient": "[thinky_dots]Quiet traveler…… take a part of me, seek peace in the tides……[/thinky_dots]",
  "PAEL.talk.TEST_CHARACTER_TEST_CHARACTER.1-0r.ancient": "[thinky_dots]The awake always want to hurry, only the sleeping understand staying…… you should sleep a while too……[/thinky_dots]",
  "PAEL.talk.TEST_CHARACTER_TEST_CHARACTER.2-0.ancient": "[thinky_dots]Take my flesh…… a bit of flesh that \"won't rush you\"……[/thinky_dots]",
  "PAEL.talk.TEST_CHARACTER_TEST_CHARACTER.2-0.next": "Answer",
  "PAEL.talk.TEST_CHARACTER_TEST_CHARACTER.2-1.char": "……I'm not afraid of pain. Only afraid that pain will drag me away from the waiting.",
  "PAEL.talk.TEST_CHARACTER_TEST_CHARACTER.2-1.next": "Continue",
  "PAEL.talk.TEST_CHARACTER_TEST_CHARACTER.2-2.ancient": "[thinky_dots]Accept it…… so you can keep lying here…… waiting for that road that has yet to come……[/thinky_dots]",

  "TANX.talk.TEST_CHARACTER_TEST_CHARACTER.0-0.char": "You want to fight. I want to wait. Can we…… each do our own thing?",
  "TANX.talk.TEST_CHARACTER_TEST_CHARACTER.0-0.next": "Continue",
  "TANX.talk.TEST_CHARACTER_TEST_CHARACTER.0-1.ancient": "[b]No!! Take this weapon! Go become stronger!!![/b]",
  "TANX.talk.TEST_CHARACTER_TEST_CHARACTER.1-0r.ancient": "[b]Your blood has long gone cold! But battle can make even patience boil!![/b]",
  "TANX.talk.TEST_CHARACTER_TEST_CHARACTER.2-0.ancient": "[b]Stop waiting for that person! Fight me — this is your destiny now!![/b]",
  "TANX.talk.TEST_CHARACTER_TEST_CHARACTER.2-0.next": "Yield",
  "TANX.talk.TEST_CHARACTER_TEST_CHARACTER.2-1.char": "If we must fight…… wait until I've waited for that person to arrive. He'll return the blow for me.\n[i][font_size=22]Godo steps back half a pace, as if yielding the battlefield to the future.[/font_size][/i]",
  "TANX.talk.TEST_CHARACTER_TEST_CHARACTER.2-1.next": "Continue",
  "TANX.talk.TEST_CHARACTER_TEST_CHARACTER.2-2.ancient": "[b]Coward!! But you have endless patience!! Take this weapon and go wait![/b]",

  "TEZCATARA.talk.TEST_CHARACTER_TEST_CHARACTER.0-0.char": "The fire is warm. But what I'm waiting for isn't warmth — it's \"the appointed time.\"",
  "TEZCATARA.talk.TEST_CHARACTER_TEST_CHARACTER.0-0.next": "Continue",
  "TEZCATARA.talk.TEST_CHARACTER_TEST_CHARACTER.0-1.ancient": "It's fine even if it hasn't come yet. Come in quickly, let me [jitter][b]warm[/b][/jitter] you a little while you wait.",
  "TEZCATARA.talk.TEST_CHARACTER_TEST_CHARACTER.1-0r.ancient": "Is the only luggage you carry that bit of [jitter][b]hesitation[/b][/jitter]? Shall I burn it away for you?",
  "TEZCATARA.talk.TEST_CHARACTER_TEST_CHARACTER.2-0.ancient": "Dear, try this [jitter][b]treat[/b][/jitter] I made for you. It's the kind of treat that cools slowly, and waits slowly.",
  "TEZCATARA.talk.TEST_CHARACTER_TEST_CHARACTER.2-0.next": "Decline",
  "TEZCATARA.talk.TEST_CHARACTER_TEST_CHARACTER.2-1.char": "……I'm not hungry. I'm just empty. Empty and hungry look alike.",
  "TEZCATARA.talk.TEST_CHARACTER_TEST_CHARACTER.2-1.next": "Continue",
  "TEZCATARA.talk.TEST_CHARACTER_TEST_CHARACTER.2-2.ancient": "Fine, just a taste then. Then we'll keep waiting — waiting for the bitterness to [jitter][b]fade[/b][/jitter].",

  "VAKUU.talk.TEST_CHARACTER_TEST_CHARACTER.0-0.char": "Demons also make deals. So what do you want from me? My time? It was never worth anything.",
  "VAKUU.talk.TEST_CHARACTER_TEST_CHARACTER.0-0.next": "Continue",
  "VAKUU.talk.TEST_CHARACTER_TEST_CHARACTER.0-1.ancient": "Worthless [sine]time[/sine], when accumulated, can also be quite considerable……",
  "VAKUU.talk.TEST_CHARACTER_TEST_CHARACTER.1-0r.ancient": "I usually sell \"right now\" at a steep price. But facing you, I'd even want to put a high price on [sine]\"later.\"[/sine]",
  "VAKUU.talk.TEST_CHARACTER_TEST_CHARACTER.2-0.ancient": "If at the bottom of the contract I wrote a small line: granting you the right to [sine]wait forever[/sine] — would you sign?",
  "VAKUU.talk.TEST_CHARACTER_TEST_CHARACTER.2-0.next": "Respond",
  "VAKUU.talk.TEST_CHARACTER_TEST_CHARACTER.2-1.char": "……My name doesn't matter. What matters is that I haven't been called yet.",
  "VAKUU.talk.TEST_CHARACTER_TEST_CHARACTER.2-1.next": "Continue",
  "VAKUU.talk.TEST_CHARACTER_TEST_CHARACTER.2-2.ancient": "Take your price. I will never wake you — unless [sine]that moment[/sine] truly arrives.",

  "THE_ARCHITECT.talk.TEST_CHARACTER_TEST_CHARACTER.0-0r.ancient": "You stand here, yet it's as if you are nowhere. What are you waiting for? The top of the Spire? An ending? Or a permission?",
  "THE_ARCHITECT.talk.TEST_CHARACTER_TEST_CHARACTER.0-0r.next": "Answer",
  "THE_ARCHITECT.talk.TEST_CHARACTER_TEST_CHARACTER.0-1r.char": "……I'm waiting for a name to be called out. Until it is, I'm not going anywhere.",
  "THE_ARCHITECT.talk.TEST_CHARACTER_TEST_CHARACTER.0-1r.next": "Continue",
  "THE_ARCHITECT.talk.TEST_CHARACTER_TEST_CHARACTER.0-2r.ancient": "Permission? You've never needed it. You're only afraid of \"waiting for the wrong thing.\"",
  "THE_ARCHITECT.talk.TEST_CHARACTER.0-attack": "Both",

  "THE_ARCHITECT.talk.TEST_CHARACTER_TEST_CHARACTER.1-0r.ancient": "You're back again. Time is like a corridor to you — you can't finish walking it because you don't want to.",
  "THE_ARCHITECT.talk.TEST_CHARACTER_TEST_CHARACTER.1-0r.next": "Continue",
  "THE_ARCHITECT.talk.TEST_CHARACTER_TEST_CHARACTER.1-1r.char": "Corridors are good. Ends are not good. Ends mean…… no more waiting.",
  "THE_ARCHITECT.talk.TEST_CHARACTER_TEST_CHARACTER.1-1r.next": "Continue",
  "THE_ARCHITECT.talk.TEST_CHARACTER_TEST_CHARACTER.1-2r.ancient": "Foolish. If you don't walk toward the end, you will forever be nothing but an echo.",
  "THE_ARCHITECT.talk.TEST_CHARACTER.1-attack": "Both",

  "THE_ARCHITECT.talk.TEST_CHARACTER_TEST_CHARACTER.2-0r.ancient": "Then stand there. The Spire will remember for you: you came, many times, yet took nothing away.",
  "THE_ARCHITECT.talk.TEST_CHARACTER_TEST_CHARACTER.2-0r.next": "Continue",
  "THE_ARCHITECT.talk.TEST_CHARACTER_TEST_CHARACTER.2-1r.char": "Will taking something away…… make me stop waiting?",
  "THE_ARCHITECT.talk.TEST_CHARACTER_TEST_CHARACTER.2-1r.next": "Continue",
  "THE_ARCHITECT.talk.TEST_CHARACTER_TEST_CHARACTER.2-2r.ancient": "It will. So don't take anything. Keep waiting — it's the only weapon you're good at.",
  "THE_ARCHITECT.talk.TEST_CHARACTER.2-attack": "Both",
}
```

![alt text](../../../images/image20.png)

## Bonus resources

<div style="display:flex; gap:8px; flex-wrap:nowrap;">
    <img src="../../../images/image21.png" alt="image21" style="width:24%;" />
    <img src="../../../images/image22.png" alt="image22" style="width:24%;" />
    <img src="../../../images/energy_test.png" alt="energy_test" style="width:24px; height:24px; object-fit:contain; max-width:none; flex:0 0 auto;" />
    <img src="../../../images/energy_test_big.png" alt="energy_test_big" style="width:74px; height:74px; object-fit:contain; max-width:none; flex:0 0 auto;" />
</div>

### test_bg.tscn

```tscn
[gd_scene load_steps=2 format=3]

[ext_resource type="Texture2D" path="res://icon.svg" id="1_c8lhi"]

[node name="TestBg" type="Control"]
layout_mode = 3
anchors_preset = 8
anchor_left = 0.5
anchor_top = 0.5
anchor_right = 0.5
anchor_bottom = 0.5
offset_left = -960.0
offset_top = -540.0
offset_right = 1600.0
offset_bottom = 660.0
grow_horizontal = 2
grow_vertical = 2
pivot_offset = Vector2(1280, 600)

[node name="Control" type="Control" parent="."]
layout_mode = 1
anchors_preset = 8
anchor_left = 0.5
anchor_top = 0.5
anchor_right = 0.5
anchor_bottom = 0.5
offset_left = -1280.0
offset_top = -600.0
offset_right = 640.0
offset_bottom = 478.0
grow_horizontal = 2
grow_vertical = 2

[node name="ColorRect" type="ColorRect" parent="Control"]
layout_mode = 1
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
grow_horizontal = 2
grow_vertical = 2
color = Color(0.44705883, 0.49803922, 1, 1)

[node name="Icon" type="TextureRect" parent="Control"]
layout_mode = 1
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
offset_left = -28.0
offset_top = 67.0
offset_right = 612.0
offset_bottom = 189.0
grow_horizontal = 2
grow_vertical = 2
scale = Vector2(0.82, 0.82)
texture = ExtResource("1_c8lhi")
expand_mode = 1

[node name="ash1" type="CPUParticles2D" parent="."]
position = Vector2(1832, -17)
amount = 40
lifetime = 15.0
preprocess = 15.0
local_coords = true
emission_shape = 3
emission_rect_extents = Vector2(2000, 1)
gravity = Vector2(27, 27)
orbit_velocity_max = 0.03
angle_min = 45.0
angle_max = 90.0
scale_amount_min = 10.0
scale_amount_max = 10.0

[node name="ash2" type="CPUParticles2D" parent="."]
position = Vector2(1832, -17)
amount = 40
lifetime = 15.0
preprocess = 15.0
local_coords = true
emission_shape = 3
emission_rect_extents = Vector2(2000, 1)
gravity = Vector2(27, 27)
orbit_velocity_max = 0.03
angle_min = 45.0
angle_max = 90.0
scale_amount_min = 10.0
scale_amount_max = 10.0
color = Color(0.121879734, 0.15283081, 0.33476263, 1)
```

### test_character.tscn

```tscn
[gd_scene load_steps=2 format=3]

[ext_resource type="Texture2D" path="res://icon.svg" id="1_hxav6"]

[node name="TestCharacter" type="Node2D"]

[node name="Visuals" type="Sprite2D" parent="."]
unique_name_in_owner = true
position = Vector2(0, -73)
texture = ExtResource("1_hxav6")

[node name="Bounds" type="Control" parent="."]
unique_name_in_owner = true
layout_mode = 3
anchors_preset = 0
offset_left = -70.0
offset_top = -140.0
offset_right = 70.0

[node name="IntentPos" type="Marker2D" parent="."]
unique_name_in_owner = true
position = Vector2(0, -159)

[node name="CenterPos" type="Marker2D" parent="."]
unique_name_in_owner = true
position = Vector2(0, -72)

[node name="TalkPos" type="Marker2D" parent="."]
unique_name_in_owner = true
position = Vector2(0, -144)
```

### test_energy_counter.tscn

```tscn
[gd_scene load_steps=2 format=3]

[ext_resource type="Texture2D" path="res://icon.svg" id="1_85qf2"]

[node name="TestEnergyCounter" type="Control"]
layout_mode = 3
anchors_preset = 0
offset_right = 128.0
offset_bottom = 128.0
metadata/_edit_lock_ = true

[node name="EnergyVfxBack" type="Node2D" parent="."]
unique_name_in_owner = true
position = Vector2(64, 64)

[node name="Layers" type="Control" parent="."]
unique_name_in_owner = true
layout_mode = 1
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
grow_horizontal = 2
grow_vertical = 2

[node name="RotationLayers" type="Control" parent="Layers"]
unique_name_in_owner = true
anchors_preset = 0
offset_right = 40.0
offset_bottom = 40.0

[node name="Layer1" type="TextureRect" parent="Layers"]
layout_mode = 1
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
grow_horizontal = 2
grow_vertical = 2
texture = ExtResource("1_85qf2")
expand_mode = 1

[node name="EnergyVfxFront" type="Node2D" parent="."]
unique_name_in_owner = true
position = Vector2(64, 64)

[node name="Label" type="Label" parent="."]
layout_mode = 1
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
offset_left = 16.0
offset_top = -29.0
offset_right = -16.0
offset_bottom = 29.0
grow_horizontal = 2
grow_vertical = 2
theme_override_colors/font_color = Color(1, 0.9647059, 0.8862745, 1)
theme_override_colors/font_shadow_color = Color(0, 0, 0, 0.1882353)
theme_override_colors/font_outline_color = Color(0.1, 0.1, 0.8, 1)
theme_override_constants/shadow_offset_x = 3
theme_override_constants/shadow_offset_y = 2
theme_override_constants/outline_size = 16
theme_override_constants/shadow_outline_size = 16
theme_override_font_sizes/font_size = 36
text = "3/3"
horizontal_alignment = 1
vertical_alignment = 1
```

### test_character_merchant.tscn
```tscn
[gd_scene load_steps=2 format=3]

[ext_resource type="Texture2D" path="res://icon.svg" id="1_diepv"]

[node name="IroncladMerchant" type="Node2D"]

[node name="Icon" type="Sprite2D" parent="."]
texture = ExtResource("1_diepv")
```

### test_character_rest_site.tscn
```tscn
[gd_scene load_steps=2 format=3]

[ext_resource type="Texture2D" path="res://icon.svg" id="1_74iws"]

[node name="TestCharacterRestSite" type="Node2D"]

[node name="Sprite" type="Sprite2D" parent="."]
texture = ExtResource("1_74iws")

[node name="Sprite2" type="Sprite2D" parent="."]
position = Vector2(75, -58)
texture = ExtResource("1_74iws")

[node name="ControlRoot" type="Control" parent="."]
layout_mode = 3
anchors_preset = 0

[node name="SelectionReticle" type="Control" parent="ControlRoot"]
unique_name_in_owner = true
anchors_preset = 0
offset_left = -153.0
offset_top = -350.0
offset_right = 267.0
offset_bottom = 320.0

[node name="Hitbox" type="Control" parent="ControlRoot"]
unique_name_in_owner = true
anchors_preset = 0
offset_left = -155.0
offset_top = -165.0
offset_right = 154.0
offset_bottom = 166.0

[node name="ThoughtBubbleRight" type="Control" parent="ControlRoot"]
unique_name_in_owner = true
anchors_preset = 0
offset_left = 121.0
offset_top = -125.0
offset_right = 121.0
offset_bottom = -125.0

[node name="ThoughtBubbleLeft" type="Control" parent="ControlRoot"]
unique_name_in_owner = true
anchors_preset = 0
offset_left = -113.0
offset_top = -95.0
offset_right = -113.0
offset_bottom = -95.0
```

### test_icon.tscn

```tscn
[gd_scene load_steps=2 format=3]

[ext_resource type="Texture2D" path="res://icon.svg" id="1_by5rm"]

[node name="TestIcon" type="TextureRect"]
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
grow_horizontal = 2
grow_vertical = 2
mouse_filter = 2
texture = ExtResource("1_by5rm")
expanded_mode = 1
stretch_mode = 5
```

### test_transition.tres

```tscn
[gd_resource type="ShaderMaterial" load_steps=3 format=3]

[ext_resource type="Texture2D" path="res://RitsuTest/images/test_transition.png" id="1_2pnya"]

[sub_resource type="Shader" id="Shader_wjwex"]
code = "shader_type canvas_item;

uniform sampler2D transitionTex;
uniform float threshold : hint_range(0,1);

void fragment() {
    float falloff = 1.0 - texture(transitionTex, UV).r;
    
    // helps with falloff artifacts issues towards the transition extremes
    float remap  = mix(-0.1, 1.1, threshold);
    falloff = step(falloff, remap);
    COLOR.a = falloff;
}"

[resource]
shader = SubResource("Shader_wjwex")
shader_parameter/transitionTex = ExtResource("1_2pnya")
shader_parameter/threshold = 0.0
```
