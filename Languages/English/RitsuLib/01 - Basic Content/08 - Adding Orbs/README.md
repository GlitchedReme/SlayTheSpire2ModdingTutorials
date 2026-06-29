First, create the class:

```csharp
using Godot;
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Creatures;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Scaffolding.Content;
using STS2RitsuLib.Scaffolding.Godot;

namespace Test.Scripts;

[RegisterOrb]
public class TestOrb : ModOrbTemplate
{
    // Passive effect value. ModifyOrbValue indicates whether it's affected by Focus etc.
    public override decimal PassiveVal => ModifyOrbValue(1);

    // Evoke effect value
    public override decimal EvokeVal => ModifyOrbValue(2);

    // Darkened color — use a darker shade of the orb's main color
    public override Color DarkenedColor => new(0.1f, 0.2f, 0.5f);

    // For images, any format supported by Godot works — e.g. png, jpg, svg, etc.
    public override OrbAssetProfile AssetProfile => new(
        // Tooltip small icon path
        IconPath: "res://icon.svg",
        // Orb scene path
        VisualsScenePath: "res://Test/scenes/test_orb.tscn"
    );

    // Saves you from manually attaching scripts. Just copy this.
    protected override Node2D? TryCreateOrbSprite() => RitsuGodotNodeFactories.CreateFromScenePath<Node2D>(AssetProfile.VisualsScenePath!);

    // Trigger passive at turn start
    public override async Task AfterTurnStartOrbTrigger(PlayerChoiceContext choiceContext)
    {
        await Passive(choiceContext, null);
    }

    // Trigger passive
    public override async Task Passive(PlayerChoiceContext choiceContext, Creature? target)
    {
        Trigger();
        await CardPileCmd.Draw(choiceContext, PassiveVal, Owner);
    }

    // Trigger evoke — returns affected creatures
    public override async Task<IEnumerable<Creature>> Evoke(PlayerChoiceContext playerChoiceContext)
    {
        PlayEvokeSfx();
        await CardPileCmd.Draw(playerChoiceContext, EvokeVal, Owner);
        return [Owner.Creature];
    }
}
```

Then create `{modId}/localization/{Language}/orbs.json`.

```json
{
    "TEST_ORB_TEST_ORB.description": "Orb: Draw a card at the start of your turn.",
    "TEST_ORB_TEST_ORB.smartDescription": "[gold]Passive:[/gold] At the start of your turn, draw [blue]{Passive}[/blue] card(s).\n[gold]Evoke:[/gold] Draw [blue]{Evoke}[/blue] card(s).",
    "TEST_ORB_TEST_ORB.title": "Godo Orb"
}
```

Use `await OrbCmd.Channel<TestOrb>(choiceContext, cardPlay.Card.Owner)` to channel it.

![alt text](../../../images/image28.webp)

`test_orb.tscn`:

```
[gd_scene load_steps=2 format=3 uid="uid://megsnq8c4cxc"]

[ext_resource type="Texture2D" uid="uid://ddxmxgyyfy8mn" path="res://icon.svg" id="1_voa3m"]

[node name="TestOrb" type="Node2D"]

[node name="Icon" type="Sprite2D" parent="."]
texture = ExtResource("1_voa3m")

```
