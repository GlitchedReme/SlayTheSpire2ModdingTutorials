---
title: 添加充能球
date: 2026-04-21 00:00:00
permalink: docs/04-ritsulib/04-08-add-orb/
categories:
- Basics
---
先创建类：

```csharp
using Godot;
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Creatures;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

[RegisterOrb]
public class TestOrb : ModOrbTemplate
{
    // 被动效果数值，ModifyOrbValue表示是否吃集中等
    public override decimal PassiveVal => ModifyOrbValue(1);

    // 激发效果数值
    public override decimal EvokeVal => ModifyOrbValue(2);

    // 暗色，使用球的主体色的暗色调
    public override Color DarkenedColor => new(0.1f, 0.2f, 0.5f);

    public override OrbAssetProfile AssetProfile => new(
        // 提示文本小图标路径
        IconPath: "res://icon.svg",
        // 充能球场景路径
        VisualsScenePath: "res://Test/scenes/test_orb.tscn"
    );

    // 让你不需要手动挂脚本。复制即可。
    protected override Node2D? TryCreateOrbSprite() => RitsuGodotNodeFactories.CreateFromScenePath<Node2D>(AssetProfile.VisualsScenePath!);

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
    "TEST_ORB_TEST_ORB.description": "充能球：回合开始时抽牌。",
    "TEST_ORB_TEST_ORB.smartDescription": "[gold]被动：[/gold]回合开始时，抽[blue]{Passive}[/blue]张牌。\n[gold]激发：[/gold]抽[blue]{Evoke}[/blue]张牌。",
    "TEST_ORB_TEST_ORB.title": "戈多球"
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
