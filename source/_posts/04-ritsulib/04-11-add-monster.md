---
title: 04-11 添加新怪物
date: 2026-04-21 00:00:00
permalink: docs/04-ritsulib/04-11-add-monster/
categories:
- Basics
---
## 怪物

首先找地方创建你的怪物类：

```csharp
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Ascension;
using MegaCrit.Sts2.Core.Entities.Creatures;
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

// 创建一个简单的怪物，意图1和意图2循环
// 意图1：造成伤害，获得格挡
// 意图2：重击
[RegisterMonster]
public class TestMonster : ModMonsterTemplate
{
    // 根据进阶提高最小血量，进阶8及以上为20，否则为15
    public override int MinInitialHp => AscensionHelper.GetValueIfAscension(AscensionLevel.ToughEnemies, 20, 15);

    // 根据进阶提高最大血量，进阶8及以上为30，否则为20
    public override int MaxInitialHp => AscensionHelper.GetValueIfAscension(AscensionLevel.ToughEnemies, 30, 20);

    // 意图1的数值，伤害和格挡，根据进阶提高伤害
    private int BasicDamage => AscensionHelper.GetValueIfAscension(AscensionLevel.DeadlyEnemies, 4, 3);
    private int BasicBlock => 8;

    // 意图2的数值，重击伤害，根据进阶提高伤害
    private int HeavyDamage => AscensionHelper.GetValueIfAscension(AscensionLevel.DeadlyEnemies, 8, 6);

    // 怪物场景
    public override MonsterAssetProfile AssetProfile => new(
        VisualsScenePath: "res://Test/scenes/test_monster.tscn"
    );

    // 如果你挂载了自己的自定义脚本，使用这个即可，不需要上面的
    // public override string? CustomVisualPath => "res://Test/scenes/test_monster.tscn";


    // 战斗开始时，在这里给自己上buff之类
    public override async Task AfterAddedToRoom()
    {
        await PowerCmd.Apply<StrengthPower>(Creature, 2m, Creature, null);
    }

    protected override MonsterMoveStateMachine GenerateMoveStateMachine()
    {
        // 意图1：造成伤害，获得格挡
        var basicAttack = new MoveState(
            "BASIC_ATTACK", // 状态ID
            BasicAttackMove, // 执行函数，或者直接用lambda也可
                             // 以下是可变参数，可以填写任意数量的意图，全部展示
            new SingleAttackIntent(BasicDamage),
            new DefendIntent()
        );

        // 意图2：重击
        var heavyAttack = new MoveState(
            "HEAVY_ATTACK",
            async targets => await DamageCmd // 意图2实际执行效果，这里直接用lambda
                .Attack(HeavyDamage)
                .FromMonster(this)
                .WithAttackerFx(null, AttackSfx)
                .WithHitFx("vfx/vfx_attack_blunt")
                .Execute(null),
            new SingleAttackIntent(HeavyDamage)
        );

        // 或者你也可以创建RandomBranchState（随机意图分支）和ConditionalBranchState（条件意图分支）来实现更复杂的状态转换逻辑

        // 设置状态转换，意图1后接意图2，意图2后接意图1
        basicAttack.FollowUpState = heavyAttack;
        heavyAttack.FollowUpState = basicAttack;

        // 添加2个意图，并且初始意图设成 basicAttack
        return new MonsterMoveStateMachine([basicAttack, heavyAttack], basicAttack);
    }

    // 意图1执行实际效果
    private async Task BasicAttackMove(IReadOnlyList<Creature> targets)
    {
        // 说话
        TalkCmd.Play(L10NMonsterLookup("TEST_MONSTER_TEST_MONSTER.moves.BASIC_ATTACK.banter"), Creature, VfxColor.Blue);
        await DamageCmd
            .Attack(BasicDamage)
            .FromMonster(this)
            // .WithAttackerAnim("Attack", 0.5f) // 如果有攻击动画，可以取消注释并替换成实际动画名称和延迟
            .WithAttackerFx(null, AttackSfx) // 攻击音效
            .WithHitFx("vfx/vfx_attack_blunt") // 攻击特效
            .Execute(null);
        await CreatureCmd.GainBlock(Creature, BasicBlock, ValueProp.Move, null);
    }
}

```

然后在你指定的位置创建`tscn`场景文件。要求和人物场景类似。底部附赠一个示例场景。

> ```
> TestCharacter (NCreatureVisuals)
> ├── Visuals (Node2D) %
> ├── Bounds (Control) %
> ├── IntentPos (Marker2D) %
> ├── CenterPos (Marker2D) %
> └── TalkPos (Marker2D) %
> ```
> 
> `(NCreatureVisuals)`表示写一个继承`NCreatureVisuals`的脚本，挂载在`TestCharacter`根节点下。如果之后写的类型你在godot里找不到，就这么做。
> 
> ```csharp
> using MegaCrit.Sts2.Core.Nodes.Combat;
> namespace Test.Scripts;
> public partial class NTestCharacter : NCreatureVisuals
> {
> }
> ```
> 
> <b>其中`Visuals`，`Bounds`，`IntentPos`，`CenterPos`，`TalkPos`需要右键勾选`作为唯一名称访问`，出现`%`即可。名字不要改。</b>
> 
> `Bounds`就是你的人物hitbox的大小，如果你觉得血条太短调整一下它的大小。
> 
> * 人物显示在x轴上方。

然后创建`{modId}/localization/{Language}/monsters.json`。

```json
{
    "TEST_MONSTER_TEST_MONSTER.name": "戈多", // 怪物名字
    "TEST_MONSTER_TEST_MONSTER.moves.BASIC_ATTACK.title": "基础攻击", // 意图名字
    "TEST_MONSTER_TEST_MONSTER.moves.BASIC_ATTACK.banter": "[jitter]接下这招！[/jitter]", // 对话文本，在意图中使用了。不用删除即可。
    "TEST_MONSTER_TEST_MONSTER.moves.HEAVY_ATTACK.title": "重击"
}
```

## 遭遇

为了让你的怪物出现在一局游戏里，还需要创建一个遭遇。

### 简单遭遇

以下创建一个单怪物遭遇。

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
    // 所有可能出现的怪物
    public override IEnumerable<MonsterModel> AllPossibleMonsters => [ModelDb.Monster<TestMonster>()];

    public override RoomType RoomType => RoomType.Monster; // 这个遭遇的房间类型，这里是普通怪物

    // 不要忘了这里的model需要调用ToMutable()，表示不是标准值而是战斗中的可变数据
    protected override IReadOnlyList<(MonsterModel, string?)> GenerateMonsters() => [
        (ModelDb.Monster<TestMonster>().ToMutable(), null) // 如果不想指定怪物生成在哪个槽位，可以直接传null，系统会自动分配
    ];
}
```

![alt text](../../../../images/image29.png)

### 多怪物遭遇

以下创建一个多怪物遭遇。

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
    // 所有可能出现的怪物
    public override IEnumerable<MonsterModel> AllPossibleMonsters => [ModelDb.Monster<TestMonster>()];

    // 这个遭遇是否是弱怪池
    public override bool IsWeak => false;

    // 遭遇场景（用来指定每个怪物站哪）
    public override EncounterAssetProfile AssetProfile => new(
        EncounterScenePath: "res://Test/scenes/test_multi_encounter.tscn"
    );

    // 怪物槽位的名字
    public override IReadOnlyList<string> Slots => [
        "first", "second", "third", "fourth",
        "first2", "second2", "third2", "fourth2"
    ];

    public override RoomType RoomType => RoomType.Monster; // 这个遭遇的房间类型，这里是普通怪物

    // 如果你的场景太大，可以调整缩放。此外还可以使用 GetCameraOffset 来调整摄像机位置
    public override float GetCameraScaling() => 0.8f;

    // 生成怪物列表，这里生成8个怪物，分别放在8个槽位上
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

然后需要在你指定的路径创建场景：（使用`Marker2D`节点标注怪物在哪）

同样最下方提供示例。

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

![alt text](../../../../images/image30.png)

### 自定义场景遭遇

TODO:重载CustomEncounterBackground

### 文本

不要忘了添加文本。创建`{modId}/localization/{Language}/encounters.json`。

```json
{
    "TEST-TEST_ENCOUNTER.title": "一只戈多", // 标题
    "TEST-TEST_ENCOUNTER.loss": "{character}被[gold]{encounter}[/gold]折磨而死。", // 被击败文本
    "TEST-TEST_MULTI_ENCOUNTER.title": "很多戈多",
    "TEST-TEST_MULTI_ENCOUNTER.loss": "{character}被[gold]{encounter}[/gold]的一堆新版本淹没。"
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
