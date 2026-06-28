## Monster

First, create your monster class somewhere:

```csharp
using BaseLib.Abstracts;
using BaseLib.Utils.NodeFactories;
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

namespace Test.Scripts;

// A simple monster with two alternating intents:
// Intent 1: deal damage and gain block
// Intent 2: heavy attack
public class TestMonster : CustomMonsterModel
{
    // Minimum HP scales with ascension: 120 at A8+, 100 otherwise
    public override int MinInitialHp => AscensionHelper.GetValueIfAscension(AscensionLevel.ToughEnemies, 120, 100);

    // Maximum HP scales with ascension: 140 at A8+, 120 otherwise
    public override int MaxInitialHp => AscensionHelper.GetValueIfAscension(AscensionLevel.ToughEnemies, 140, 120);

    // Intent 1 values — damage scales with ascension
    private int BasicDamage => AscensionHelper.GetValueIfAscension(AscensionLevel.DeadlyEnemies, 12, 10);
    private int BasicBlock => 8;

    // Intent 2 values — heavy damage scales with ascension
    private int HeavyDamage => AscensionHelper.GetValueIfAscension(AscensionLevel.DeadlyEnemies, 24, 20);

    // Monster scene (if your scene doesn't have a script attached)
    public override NCreatureVisuals? CreateCustomVisuals() => NodeFactory<NCreatureVisuals>.CreateFromScene("res://test/scenes/test_monster.tscn");

    // If you attached your own custom script, use this instead:
    // public override string? CustomVisualPath => "res://test/scenes/test_monster.tscn";


    // Called when the monster enters combat — apply buffs here
    public override async Task AfterAddedToRoom()
    {
        await PowerCmd.Apply<StrengthPower>(new ThrowingPlayerChoiceContext(), Creature, 2m, Creature, null);
    }

    protected override MonsterMoveStateMachine GenerateMoveStateMachine()
    {
        // Intent 1: deal damage and gain block
        var basicAttack = new MoveState(
            "BASIC_ATTACK", // State ID
            BasicAttackMove, // Execution function. A lambda works too.
            // Variable number of intent parameters — all are displayed
            new SingleAttackIntent(BasicDamage),
            new DefendIntent()
        );

        // Intent 2: heavy attack
        var heavyAttack = new MoveState(
            "HEAVY_ATTACK",
            async targets => await DamageCmd // Lambda for the heavy attack effect
                .Attack(HeavyDamage)
                .FromMonster(this)
                .WithAttackerFx(null, AttackSfx)
                .WithHitFx("vfx/vfx_attack_blunt")
                .Execute(null),
            new SingleAttackIntent(HeavyDamage)
        );

        // You can also create RandomBranchState and ConditionalBranchState for more complex transitions

        // Set transitions: intent 1 → intent 2 → intent 1
        basicAttack.FollowUpState = heavyAttack;
        heavyAttack.FollowUpState = basicAttack;

        // Two intents, starting with basicAttack
        return new MonsterMoveStateMachine([basicAttack, heavyAttack], basicAttack);
    }

    // Intent 1 effect logic
    private async Task BasicAttackMove(IReadOnlyList<Creature> targets)
    {
        // Dialogue
        TalkCmd.Play(L10NMonsterLookup("TEST-TEST_MONSTER.moves.BASIC_ATTACK.banter"), Creature, VfxColor.Blue);
        await DamageCmd
            .Attack(BasicDamage)
            .FromMonster(this)
            // .WithAttackerAnim("Attack", 0.5f) // If you have an attack animation, uncomment and replace
            .WithAttackerFx(null, AttackSfx) // Attack SFX
            .WithHitFx("vfx/vfx_attack_blunt") // Hit VFX
            .Execute(null);
        await CreatureCmd.GainBlock(Creature, BasicBlock, ValueProp.Move, null);
    }
}

```

Then create the `tscn` scene file at your specified path. Requirements are similar to character scenes. An example scene is provided below.

> ```
> TestCharacter (Node2D)
> ├── Visuals (Node2D) %
> ├── Bounds (Control) %
> ├── IntentPos (Marker2D) %
> └── CenterPos (Marker2D) %
> ```
> <b>`Visuals`, `Bounds`, `IntentPos`, `CenterPos` must be right-clicked and set to `Access as Unique Name` (indicated by `%`). Don't rename them.</b>
>
> `Bounds` is the character hitbox. Adjust its size if the health bar looks too short.
>
> Characters are displayed above the x-axis.

Then create `{modId}/localization/{Language}/monsters.json`.

```json
{
    "TEST-TEST_MONSTER.name": "Godo", // Monster name
    "TEST-TEST_MONSTER.moves.BASIC_ATTACK.title": "Basic Attack", // Intent name
    "TEST-TEST_MONSTER.moves.BASIC_ATTACK.banter": "[jitter]Take this![/jitter]", // Dialogue text used in the intent. Delete if unused.
    "TEST-TEST_MONSTER.moves.HEAVY_ATTACK.title": "Heavy Attack"
}
```

## Encounter

To make your monster appear in a run, you also need to create an encounter.

### Simple Encounter

A single-monster encounter:

```csharp
using BaseLib.Abstracts;
using BaseLib.Extensions;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Rooms;

namespace Test.Scripts;

public class TestEncounter : CustomEncounterModel
{
    // All possible monsters
    public override IEnumerable<MonsterModel> AllPossibleMonsters => [ModelDb.Monster<TestMonster>()];

    // Which acts this encounter appears in
    public override bool IsValidForAct(ActModel act) => act.ActNumber() == 1; // Act 1 only

    // Whether this is a weak monster pool encounter
    public override bool IsWeak => false;

    public TestEncounter() : base(RoomType.Monster) // Room type: regular monster
    {
    }

    // Don't forget: models here need ToMutable() since they're mutable combat data, not static definitions
    protected override IReadOnlyList<(MonsterModel, string?)> GenerateMonsters() => [
        (ModelDb.Monster<TestMonster>().ToMutable(), null) // Pass null to auto-assign a slot
    ];
}
```

![alt text](../../images/image29.png)

### Multi-Monster Encounter

```csharp
using BaseLib.Abstracts;
using BaseLib.Extensions;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Rooms;

namespace Test.Scripts;

public class TestMultiEncounter : CustomEncounterModel
{
    // All possible monsters
    public override IEnumerable<MonsterModel> AllPossibleMonsters => [ModelDb.Monster<TestMonster>()];

    // Which acts this encounter appears in
    public override bool IsValidForAct(ActModel act) => act.ActNumber() == 1; // Act 1 only

    // Whether this is a weak monster pool encounter
    public override bool IsWeak => false;

    // Encounter scene (specifies where each monster stands)
    public override string? CustomScenePath => "res://test/scenes/test_multi_encounter.tscn";

    // Monster slot names
    public override IReadOnlyList<string> Slots => [
        "first", "second", "third", "fourth",
        "first2", "second2", "third2", "fourth2"
    ];

    // If your scene is too large, adjust scaling. Also use GetCameraOffset to move the camera.
    public override float GetCameraScaling() => 0.8f;

    public TestMultiEncounter() : base(RoomType.Monster) // Room type: regular monster
    {
    }

    // Generate 8 monsters, each assigned to a slot
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

Then create the scene at your specified path (use `Marker2D` nodes to mark monster positions). An example is provided at the bottom.

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

![alt text](../../images/image30.png)

### Custom Scene Encounter

TODO: override CustomEncounterBackground

### Text

Don't forget the text. Create `{modId}/localization/{Language}/encounters.json`.

```json
{
    "TEST-TEST_ENCOUNTER.title": "A Godo", // Title
    "TEST-TEST_ENCOUNTER.loss": "{character} was tormented to death by [gold]{encounter}[/gold].", // Defeat text
    "TEST-TEST_MULTI_ENCOUNTER.title": "Lots of Godos",
    "TEST-TEST_MULTI_ENCOUNTER.loss": "{character} was drowned by a swarm of new [gold]{encounter}[/gold] variants."
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
