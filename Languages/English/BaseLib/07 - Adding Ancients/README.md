Start by creating the class:

```csharp
using BaseLib.Abstracts;
using BaseLib.Extensions;
using BaseLib.Utils;
using Godot;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Models.Relics;

namespace Test.Scripts;

public class TestAncient : CustomAncientModel
{
    // Option button color
    public override Color ButtonColor => new(0.12f, 0.2f, 0.8f, 0.5f);
    // Dialogue box color
    public override Color DialogueColor => new(0.12f, 0.2f, 0.8f);

    // Appearance condition. This only appears in Act 2.
    public override bool IsValidForAct(ActModel act) => act.ActNumber() == 2;
    // Custom scene path
    public override string? CustomScenePath => "res://test/scenes/test_ancient.tscn";
    // Custom map icon and outline paths
    public override string? CustomMapIconPath => "res://icon.svg";
    public override string? CustomMapIconOutlinePath => "res://icon.svg";
    // Run history icon paths
    public override string? CustomRunHistoryIconPath => "res://icon.svg";
    public override string? CustomRunHistoryIconOutlinePath => "res://icon.svg";

    // Generate options. Each option has its own pool.
    protected override OptionPools MakeOptionPools { get; } = new OptionPools(
        MakePool(
            AncientOption<Akabeko>(),
            AncientOption<Anchor>()
        ),
        MakePool(
            AncientOption<LizardTail>(),
            AncientOption<ArcaneScroll>()
        ),
        MakePool(
            AncientOption<YummyCookie>(weight: 2), // Weight — higher means more likely
            AncientOption<WingCharm>()
        )
    );
}
```

Then create `{modId}/localization/{Language}/ancients.json`. If it already exists, add to it.

The ID format is `{namespace first segment uppercase}-{class name in UPPER_SNAKE_CASE}`. See the `Ancient Dialogues` chapter for writing rules.

```json
{
  "TEST-TEST_ANCIENT.title": "Godo",
  "TEST-TEST_ANCIENT.epithet": "The Waiter",
  "TEST-TEST_ANCIENT.talk.firstVisitEver.0-0.ancient": "...Someone pushed the door open.\nDon't rush. Sit. Time moves slowly here — slowly enough for you to remember what you're actually waiting for.",
  "TEST-TEST_ANCIENT.talk.ANY.0-0r.ancient": "No need to say your name. The line is too long. Names step on each other.",
  "TEST-TEST_ANCIENT.talk.ANY.1-0r.ancient": "You're back? The door was unlocked. I never left. We just... are still here.",
  "TEST-TEST_ANCIENT.talk.IRONCLAD.0-0.ancient": "Warrior, your fire is too bright. Want to leave it by the door before you come in and wait?",
  "TEST-TEST_ANCIENT.talk.IRONCLAD.1-0r.ancient": "You're still here. Good. Anger can wait too — when it's tired, it sits down.",
  "TEST-TEST_ANCIENT.talk.IRONCLAD.2-0.ancient": "If you must go... take this. It's not a gift — it's a voucher for \"come back next time.\"",
  "TEST-TEST_ANCIENT.talk.IRONCLAD.2-0.next": "Continue",
  "TEST-TEST_ANCIENT.talk.IRONCLAD.2-1.char": "...I'll take it. But I'm still hurrying.",
  "TEST-TEST_ANCIENT.talk.IRONCLAD.2-1.next": "Continue",
  "TEST-TEST_ANCIENT.talk.IRONCLAD.2-2.ancient": "Good. The one thing someone in a hurry needs most: knowing they'll come back to a certain door.",
  "TEST-TEST_ANCIENT.talk.SILENT.0-0.ancient": "Hunter, I won't ask where you come from. As long as you don't speak, we'll consider it settled.",
  "TEST-TEST_ANCIENT.talk.SILENT.1-0r.ancient": "...Still here.",
  "TEST-TEST_ANCIENT.talk.SILENT.2-0.ancient": "Silence is expensive. If you can afford it, I'll save this chair for you.",
  "TEST-TEST_ANCIENT.talk.SILENT.2-0.next": "Continue",
  "TEST-TEST_ANCIENT.talk.SILENT.2-1.char": "......",
  "TEST-TEST_ANCIENT.talk.SILENT.2-1.next": "Continue",
  "TEST-TEST_ANCIENT.talk.SILENT.2-2.ancient": "Good. The loudest sound is often saying nothing at all.",
  "TEST-TEST_ANCIENT.talk.DEFECT.0-0.ancient": "Construct... the ticking is steady. Like a clock. Clocks understand waiting best.",
  "TEST-TEST_ANCIENT.talk.DEFECT.1-0r.ancient": "<steady beeping>",
  "TEST-TEST_ANCIENT.talk.DEFECT.2-0.ancient": "If you're looking for the answer to \"being fixed\"... first learn to hold the question suspended. Suspended, it won't shatter.",
  "TEST-TEST_ANCIENT.talk.DEFECT.2-0.next": "Continue",
  "TEST-TEST_ANCIENT.talk.DEFECT.2-1.char": "[i][font_size=22]<hesitant beeping>[/font_size][/i]",
  "TEST-TEST_ANCIENT.talk.DEFECT.2-1.next": "Continue",
  "TEST-TEST_ANCIENT.talk.DEFECT.2-2.ancient": "Go. Take your rhythm with you — don't let it hurry you. Let it keep you company while you wait.",
  "TEST-TEST_ANCIENT.talk.NECROBINDER.0-0.ancient": "Lady, revenge also waits in line. Care to take a number?",
  "TEST-TEST_ANCIENT.talk.NECROBINDER.1-0r.ancient": "Your number hasn't been called yet. Don't rush. Hatred kept long enough — its edge only sharpens.",
  "TEST-TEST_ANCIENT.talk.NECROBINDER.2-0.ancient": "If you must see blood... at least don't let it splash on what hasn't arrived yet.",
  "TEST-TEST_ANCIENT.talk.NECROBINDER.2-0.next": "Continue",
  "TEST-TEST_ANCIENT.talk.NECROBINDER.2-1.char": "...I'll wait. Until the moment of reckoning.",
  "TEST-TEST_ANCIENT.talk.NECROBINDER.2-1.next": "Continue",
  "TEST-TEST_ANCIENT.talk.NECROBINDER.2-2.ancient": "That's right. Waiting isn't weakness. It's sharpening the blade to strike only once.",
  "TEST-TEST_ANCIENT.talk.REGENT.0-0.ancient": "Your Highness, the throne can be impatient — but tea tastes better after it cools a little.",
  "TEST-TEST_ANCIENT.talk.REGENT.1-0r.ancient": "Welcome back, Your Highness. Today's wait costs the same as yesterday's — but you can afford it.",
  "TEST-TEST_ANCIENT.talk.REGENT.2-0.ancient": "If you would command me... I have only one command in return: sit. Wait.",
  "TEST-TEST_ANCIENT.talk.REGENT.2-0.next": "Continue",
  "TEST-TEST_ANCIENT.talk.REGENT.2-1.char": "...I can wait. But my subjects cannot wait too long!",
  "TEST-TEST_ANCIENT.talk.REGENT.2-1.next": "Continue",
  "TEST-TEST_ANCIENT.talk.REGENT.2-2.ancient": "Subjects wait for results. The throne waits for the right moment. If you want both, you must learn to wait for both."
}
```

![alt text](../../images/image27.png)

Example scene `test_ancient.tscn`:
```
[gd_scene load_steps=5 format=3 uid="uid://4i1v2d2h07n5"]

[ext_resource type="Texture2D" uid="uid://ddxmxgyyfy8mn" path="res://icon.svg" id="1_xjdov"]

[sub_resource type="Shader" id="Shader_8eo3w"]
code = "shader_type canvas_item;

group_uniforms Colors;
uniform vec4 color_a : source_color = vec4(0.18, 0.22, 0.38, 1.0);
uniform vec4 color_b : source_color = vec4(0.42, 0.28, 0.38, 1.0);
uniform vec4 color_c : source_color = vec4(0.12, 0.32, 0.36, 1.0);

group_uniforms Timing;
uniform float cycle_seconds : hint_range(4.0, 120.0, 0.5) = 22.0;
uniform float phase_offset : hint_range(0.0, 6.283, 0.01) = 1.57;

group_uniforms Layout;
uniform float vertical_mix : hint_range(0.0, 1.0, 0.01) = 0.22;

void fragment() {
	float t = TIME / max(cycle_seconds, 0.001);
	float w_ab = sin(t * TAU) * 0.5 + 0.5;
	float w_c = sin(t * TAU + phase_offset) * 0.5 + 0.5;
	vec3 rgb = mix(color_a.rgb, color_b.rgb, w_ab);
	rgb = mix(rgb, color_c.rgb, w_c);

	float v = clamp(UV.y, 0.0, 1.0);
	vec3 top_bias = mix(rgb, color_a.rgb, (1.0 - v) * vertical_mix);
	vec3 bot_bias = mix(top_bias, color_b.rgb, v * vertical_mix);
	rgb = bot_bias;

	vec4 tex = texture(TEXTURE, UV);
	vec4 out_c = vec4(rgb, color_a.a * tex.a) * tex * COLOR;
	COLOR = out_c;
}
"

[sub_resource type="ShaderMaterial" id="ShaderMaterial_n064g"]
shader = SubResource("Shader_8eo3w")
shader_parameter/color_a = Color(0.18, 0.22, 0.38, 1)
shader_parameter/color_b = Color(0.42, 0.28, 0.38, 1)
shader_parameter/color_c = Color(0.12, 0.32, 0.36, 1)
shader_parameter/cycle_seconds = 22.0
shader_parameter/phase_offset = 1.57
shader_parameter/vertical_mix = 0.22

[sub_resource type="Gradient" id="Gradient_wmiru"]
offsets = PackedFloat32Array(0, 0.258845, 1)
colors = PackedColorArray(0.847059, 0.803922, 0.301961, 0, 1, 1, 1, 1, 0.780392, 0.65098, 0.403922, 0)

[node name="TestAncient" type="Control"]
layout_mode = 3
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
grow_horizontal = 2
grow_vertical = 2
metadata/_edit_group_ = true
metadata/_edit_lock_ = true

[node name="TimeColorBackground" type="ColorRect" parent="."]
material = SubResource("ShaderMaterial_n064g")
layout_mode = 1
offset_left = -329.0
offset_top = -49.0
offset_right = 2253.0
offset_bottom = 1172.0

[node name="stars" type="CPUParticles2D" parent="."]
position = Vector2(925, 626)
scale = Vector2(1.01, 1.01)
amount = 300
lifetime = 3.0
preprocess = 5.0
local_coords = true
emission_shape = 3
emission_rect_extents = Vector2(1500, 1000)
gravity = Vector2(0, -10)
scale_amount_min = 5.0
scale_amount_max = 10.0
color = Color(0.878431, 0.498039, 0.392157, 0.611765)
color_ramp = SubResource("Gradient_wmiru")

[node name="TextureRect" type="TextureRect" parent="."]
layout_mode = 1
offset_left = 694.0
offset_top = 165.0
offset_right = 1044.0
offset_bottom = 515.0
texture = ExtResource("1_xjdov")

```
