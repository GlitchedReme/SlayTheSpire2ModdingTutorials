---
title: 添加充能球
date: 2026-04-02 00:00:00
permalink: docs/03-baselib/03-08-add-orb/
categories:
- Basics
---
先创建类：

```csharp
using BaseLib.Abstracts;
using Godot;
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Creatures;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;

namespace Test.Scripts;

public class TestOrb : CustomOrbModel
{
    // 被动效果数值，ModifyOrbValue表示是否吃集中等
    public override decimal PassiveVal => ModifyOrbValue(1);

    // 激发效果数值
    public override decimal EvokeVal => ModifyOrbValue(2);

    // 暗色，使用球的主体色的暗色调
    public override Color DarkenedColor => new(0.1f, 0.2f, 0.5f);

    // 不出现在随机球池中
    // public override bool IncludeInRandomPool => false;

    // 提示图标路径
    public override string? CustomIconPath => "res://icon.svg";
    // 球的场景的路径。如果你使用这个，你必须要有一个名称为SpineSkeleton并且是SpineSprite类型的节点
    // public override string? CustomSpritePath => "res://test/scenes/test_orb.tscn";

    // 可以继承这个并自行搭建场景，只需父节点是Node2D即可。这样就没有上述限制。代码上优先使用这个
    public override Node2D? CreateCustomSprite()
    {
        return PreloadManager.Cache.GetScene("res://test/scenes/test_orb.tscn").Instantiate<Node2D>();
    }

    // 回合开始时触发被动
    public override async Task AfterTurnStartOrbTrigger(PlayerChoiceContext choiceContext)
    {
        await Passive(choiceContext, null);
    }

    // 触发被动
    public override async Task Passive(PlayerChoiceContext choiceContext, Creature? target)
    {
        Trigger();
        await CardPileCmd.Draw(choiceContext, PassiveVal, Owner);
    }

    // 触发激发，返回受影响的角色
    public override async Task<IEnumerable<Creature>> Evoke(PlayerChoiceContext playerChoiceContext)
    {
        PlayEvokeSfx();
        await CardPileCmd.Draw(playerChoiceContext, EvokeVal, Owner);
        return [Owner.Creature];
    }
}
```

然后创建`{modId}/localization/{Language}/orbs.json`。

```json
{
    "TEST-TEST_ORB.description": "充能球：回合开始时抽牌。",
    "TEST-TEST_ORB.smartDescription": "[gold]被动：[/gold]回合开始时，抽[blue]{Passive}[/blue]张牌。\n[gold]激发：[/gold]抽[blue]{Evoke}[/blue]张牌。",
    "TEST-TEST_ORB.title": "戈多球"
}
```

使用`await OrbCmd.Channel<TestOrb>(choiceContext, cardPlay.Card.Owner)`以生成。

![alt text](../../images/image28.png)

`test_orb.tscn`:

```
[gd_scene load_steps=2 format=3 uid="uid://megsnq8c4cxc"]

[ext_resource type="Texture2D" uid="uid://ddxmxgyyfy8mn" path="res://icon.svg" id="1_voa3m"]

[node name="TestOrb" type="Node2D"]

[node name="Icon" type="Sprite2D" parent="."]
texture = ExtResource("1_voa3m")

```
