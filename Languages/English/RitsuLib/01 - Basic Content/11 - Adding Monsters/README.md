## Monster

First, create your monster class somewhere:

```csharp
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Ascension;
using MegaCrit.Sts2.Core.Entities.Creatures;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.Helpers;
using MegaCrit.Sts2.Core.Models.Powers;
using MegaCrit.Sts2.Core.MonsterMoves.Intents;
using MegaCrit.Sts2.Core.MonsterMoves.MonsterMoveStateMachine;
using MegaCrit.Sts2.Core.Nodes.Combat;
using MegaCrit.Sts2.Core.Nodes.Vfx;
using MegaCrit.Sts2.Core.ValueProps;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

// Create a simple monster. Intent 1 and Intent 2 cycle.
// Intent 1: Deal damage, gain block
// Intent 2: Heavy attack
[RegisterMonster]
public class TestMonster : ModMonsterTemplate
{
    // Increase minimum HP based on Ascension level. Ascension 8 and above = 20, otherwise 15
    public override int MinInitialHp => AscensionHelper.GetValueIfAscension(AscensionLevel.ToughEnemies, 20, 15);

    // Increase maximum HP based on Ascension level. Ascension 8 and above = 30, otherwise 20
    public override int MaxInitialHp => AscensionHelper.GetValueIfAscension(AscensionLevel.ToughEnemies, 30, 20);

    // Intent 1 values: damage and block, increase damage based on Ascension
    private int BasicDamage => AscensionHelper.GetValueIfAscension(AscensionLevel.DeadlyEnemies, 4, 3);
    private int BasicBlock => 8;

    // Intent 2 values: heavy damage, increase damage based on Ascension
    private int HeavyDamage => AscensionHelper.GetValueIfAscension(AscensionLevel.DeadlyEnemies, 8, 6);

    // Monster scene
    public override MonsterAssetProfile AssetProfile => new(
        VisualsScenePath: "res://Test/scenes/test_monster.tscn"
    );

    // If you mount your own custom script, use this instead — no need for the above
    // public override string? CustomVisualsPath => "res://Test/scenes/test_monster.tscn";


    // When combat starts, apply buffs and such here
    public override async Task AfterAddedToRoom()
    {
        await PowerCmd.Apply<StrengthPower>(new ThrowingPlayerChoiceContext(), Creature, 2m, Creature, null);
    }

    protected override MonsterMoveStateMachine GenerateMoveStateMachine()
    {
        // Intent 1: Deal damage, gain block
        var basicAttack = new MoveState(
            "BASIC_ATTACK", // state ID
            BasicAttackMove, // execution function, or use a lambda directly
                             // The following are variadic parameters; you can fill in any number of intents, all displayed
            new SingleAttackIntent(BasicDamage),
            new DefendIntent()
        );

        // Intent 2: Heavy attack
        var heavyAttack = new MoveState(
            "HEAVY_ATTACK",
            async targets => await DamageCmd // Intent 2 actual execution effect, using a lambda directly here
                .Attack(HeavyDamage)
                .FromMonster(this)
                .WithAttackerFx(null, AttackSfx)
                .WithHitFx("vfx/vfx_attack_blunt")
                .Execute(null),
            new SingleAttackIntent(HeavyDamage)
        );

        // You can also create RandomBranchState and ConditionalBranchState for more complex state transition logic

        // Set state transitions: Intent 1 followed by Intent 2, Intent 2 followed by Intent 1
        basicAttack.FollowUpState = heavyAttack;
        heavyAttack.FollowUpState = basicAttack;

        // Add 2 intents, with initial intent set to basicAttack
        return new MonsterMoveStateMachine([basicAttack, heavyAttack], basicAttack);
    }

    // Intent 1 actual execution effect
    private async Task BasicAttackMove(IReadOnlyList<Creature> targets)
    {
        // Talk
        TalkCmd.Play(L10NMonsterLookup("TEST_MONSTER_TEST_MONSTER.moves.BASIC_ATTACK.banter"), Creature, VfxColor.Blue);
        await DamageCmd
            .Attack(BasicDamage)
            .FromMonster(this)
            // .WithAttackerAnim("Attack", 0.5f) // If there is an attack animation, uncomment and replace with the actual animation name and delay
            .WithAttackerFx(null, AttackSfx) // attack sound effect
            .WithHitFx("vfx/vfx_attack_blunt") // attack VFX
            .Execute(null);
        await CreatureCmd.GainBlock(Creature, BasicBlock, ValueProp.Move, null);
    }
}

```

Then create the `tscn` scene file at the specified path. The requirements are similar to the character scene. An example scene is provided at the bottom.

> ```
> TestCharacter (NCreatureVisuals)
> ├── Visuals (Node2D) %
> ├── Bounds (Control) %
> ├── IntentPos (Marker2D) %
> ├── CenterPos (Marker2D) %
> └── TalkPos (Marker2D) %
> ```
>
> <b>`Visuals`, `Bounds`, `IntentPos`, `CenterPos`, and `TalkPos` need to have `Access as Unique Name` checked via right-click, indicated by `%`. Do not change the names.</b>
>
> `Bounds` is the size of your character's hitbox. If you feel the health bar is too short, adjust its size.
>
> - The character is displayed above the x-axis.

Then create `{modId}/localization/{Language}/monsters.json`.

```json
{
  "TEST_MONSTER_TEST_MONSTER.name": "Godo", // monster name
  "TEST_MONSTER_TEST_MONSTER.moves.BASIC_ATTACK.title": "Basic Attack", // intent name
  "TEST_MONSTER_TEST_MONSTER.moves.BASIC_ATTACK.banter": "[jitter]Take this![/jitter]", // dialogue text, used in the intent. Remove if not needed.
  "TEST_MONSTER_TEST_MONSTER.moves.HEAVY_ATTACK.title": "Heavy Attack"
}
```

## Encounter

To make your monster appear in a game run, you also need to create an encounter.

### Simple encounter

Below creates a single-monster encounter.

```csharp
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Models.Acts;
using MegaCrit.Sts2.Core.Rooms;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

[RegisterActEncounter(typeof(Glory))]
public class TestEncounter : ModEncounterTemplate
{
    // All possible monsters
    public override IEnumerable<MonsterModel> AllPossibleMonsters => [ModelDb.Monster<TestMonster>()];

    public override RoomType RoomType => RoomType.Monster; // The room type of this encounter, here it's a normal monster

    // Don't forget: the model here needs to call ToMutable(), indicating it's not a standard value but mutable combat data
    protected override IReadOnlyList<(MonsterModel, string?)> GenerateMonsters() => [
        (ModelDb.Monster<TestMonster>().ToMutable(), null) // If you don't want to specify which slot the monster spawns in, pass null directly and the system will auto-assign
    ];

    // Optional spawn condition, e.g. only spawn in Overgrowth
    // public override bool IsValidForAct(ActModel act)
    // {
    //     return act is Overgrowth;
    // }
}
```

![alt text](../../../images/image29.png)

### Multi-monster encounter

Below creates a multi-monster encounter.

```csharp
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Models.Acts;
using MegaCrit.Sts2.Core.Rooms;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

[RegisterActEncounter(typeof(Glory))]
public class TestMultiEncounter : ModEncounterTemplate
{
    // All possible monsters
    public override IEnumerable<MonsterModel> AllPossibleMonsters => [ModelDb.Monster<TestMonster>()];

    // Whether this encounter is in the weak monster pool
    public override bool IsWeak => false;

    // Encounter scene (used to specify where each monster stands)
    public override EncounterAssetProfile AssetProfile => new(
        EncounterScenePath: "res://Test/scenes/test_multi_encounter.tscn"
    );

    // Names of monster slots
    public override IReadOnlyList<string> Slots => [
        "first", "second", "third", "fourth",
        "first2", "second2", "third2", "fourth2"
    ];

    public override RoomType RoomType => RoomType.Monster; // The room type of this encounter, here it's a normal monster

    // If your scene is too large, you can adjust scaling. You can also use GetCameraOffset to adjust the camera position
    public override float GetCameraScaling() => 0.8f;

    // Generate monster list. Here generates 8 monsters placed in 8 slots
    protected override IReadOnlyList<(MonsterModel, string?)> GenerateMonsters() => [
        (ModelDb.Monster<TestMonster>().ToMutable(), "first"),
        (ModelDb.Monster<TestMonster>().ToMutable(), "second"),
        (ModelDb.Monster<TestMonster>().ToMutable(), "third"),
        (ModelDb.Monster<TestMonster>().ToMutable(), "fourth"),
        (ModelDb.Monster<TestMonster>().ToMutable(), "first2"),
        (ModelDb.Monster<TestMonster>().ToMutable(), "second2"),
        (ModelDb.Monster<TestMonster>().ToMutable(), "third2"),
        (ModelDb.Monster<TestMonster>().ToMutable(), "fourth2")
    ];
}

```

Then you need to create the scene at the specified path: (use `Marker2D` nodes to mark where monsters are)

An example is also provided at the bottom.

```
TestMultiEncounter (Node2D)
├── first (Marker2D)
├── second (Marker2D)
├── third (Marker2D)
├── fourth (Marker2D)
├── first2 (Marker2D)
├── second2 (Marker2D)
├── third2 (Marker2D)
└── fourth2 (Marker2D)
```

![alt text](../../../images/image30.png)

### Custom scene encounter

TODO: Override CustomEncounterBackground

### Text

Don't forget to add text. Create `{modId}/localization/{Language}/encounters.json`.

```json
{
  "TEST-TEST_ENCOUNTER.title": "A Godo", // title
  "TEST-TEST_ENCOUNTER.loss": "{character} was tormented to death by [gold]{encounter}[/gold].", // defeat text
  "TEST-TEST_MULTI_ENCOUNTER.title": "Many Godos",
  "TEST-TEST_MULTI_ENCOUNTER.loss": "{character} was overwhelmed by a swarm of new versions of [gold]{encounter}[/gold]."
}
```

`test_monster.tscn`:

```tscn
[gd_scene load_steps=2 format=3 uid="uid://cbw3dj7nq7hdh"]

[ext_resource type="Texture2D" uid="uid://ddxmxgyyfy8mn" path="res://icon.svg" id="1_qdik8"]

[node name="TestCharacter" type="Node2D"]

[node name="Visuals" type="Sprite2D" parent="."]
unique_name_in_owner = true
position = Vector2(0, -73)
texture = ExtResource("1_qdik8")

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

```

`test_multi_encounter.tscn`:

```tscn
[gd_scene format=3 uid="uid://kgw234hyrd7y"]

[node name="Encounter" type="Control"]
layout_mode = 3
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
grow_horizontal = 2
grow_vertical = 2
mouse_filter = 2

[node name="first" type="Marker2D" parent="."]
position = Vector2(882, 697)

[node name="second" type="Marker2D" parent="."]
position = Vector2(1157, 729)

[node name="third" type="Marker2D" parent="."]
position = Vector2(1457, 716)

[node name="fourth" type="Marker2D" parent="."]
position = Vector2(1757, 716)

[node name="first2" type="Marker2D" parent="."]
position = Vector2(875, 368)

[node name="second2" type="Marker2D" parent="."]
position = Vector2(1150, 400)

[node name="third2" type="Marker2D" parent="."]
position = Vector2(1450, 387)

[node name="fourth2" type="Marker2D" parent="."]
position = Vector2(1750, 387)

```
