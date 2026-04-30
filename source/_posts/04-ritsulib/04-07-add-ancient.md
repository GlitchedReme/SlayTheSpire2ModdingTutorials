---
title: 添加先古之民
date: 2026-04-21 00:00:00
permalink: docs/04-ritsulib/04-07-add-ancient/
categories:
- Basics
---
首先创建类：

```csharp
using Godot;
using MegaCrit.Sts2.Core.Events;
using MegaCrit.Sts2.Core.Models.Relics;
using MegaCrit.Sts2.Core.Runs;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Scaffolding.Content;
using STS2RitsuLib.Utils;

namespace Test.Scripts;

[RegisterActAncient(typeof(Glory))] // 指定只有荣耀这章生成
// [RegisterSharedAncient] // 如果需要自定义生成条件，可以注册成通用再重载isAllowed
public class TestAncient : ModAncientEventTemplate
{
    // 选项按钮颜色
    public override Color ButtonColor => new(0.12f, 0.2f, 0.8f, 0.5f);
    // 对话框颜色
    public override Color DialogueColor => new(0.12f, 0.2f, 0.8f);

    // 自定义场景的路径
    public override EventAssetProfile AssetProfile => new(
        BackgroundScenePath: "res://Test/scenes/test_ancient.tscn"
    );

    // 自定义地图图标和轮廓的路径
    public override AncientEventPresentationAssetProfile AncientPresentationAssetProfile => new(
        MapIconPath: "res://icon.svg",
        MapIconOutlinePath: "res://icon.svg",
        RunHistoryIconPath: "res://icon.svg",
        RunHistoryIconOutlinePath: "res://icon.svg"
    );

    // 固定池一和二
    private IReadOnlyList<EventOption> Pool1 => [
            CreateModRelicOption<Akabeko>(),
            CreateModRelicOption<Anchor>(),
        ];
    private IReadOnlyList<EventOption> Pool2 => [
            CreateModRelicOption<LizardTail>(),
            CreateModRelicOption<ArcaneScroll>(),
        ];

    // 带权重池三。权重越大越有机会生成。当然你也可以写自定义的列表生成函数
    private WeightedList<EventOption> Pool3 => new()
    {
        { CreateModRelicOption<YummyCookie>(), 2 },
        { CreateModRelicOption<WingCharm>(), 1 }
    };

    // 所有可能的选项
    public override IEnumerable<EventOption> AllPossibleOptions => [.. Pool1, .. Pool2, .. Pool3];

    // 生成选项
    protected override IReadOnlyList<EventOption> GenerateInitialOptions()
    {
        return
        [
            Rng.NextItem(Pool1)!,
            Rng.NextItem(Pool2)!,
            Pool3.GetRandom(Rng),
        ];
    }

    // 出现条件。这里是只能在第二幕出现（索引为1）
    // public override bool IsAllowed(IRunState runState)
    // {
    //     return runState.CurrentActIndex == 1;
    // }
}
```

然后创建`{modId}/localization/{Language}/ancients.json`。已经有的话继续添加内容即可。

此处id为`{modId}_ANCIENT_{类名的大写SNAKE_CASE}`。编写规则参考`先古对话`一章。

```json
{
  "TEST_ANCIENT_TEST_ANCIENT.title": "戈多",
  "TEST_ANCIENT_TEST_ANCIENT.epithet": "等待者",
  "TEST_ANCIENT_TEST_ANCIENT.talk.firstVisitEver.0-0.ancient": "……有人推开了这扇门。\n别急。坐。时间在这里走得很慢，慢到够你想起自己究竟在等什么。",
  "TEST_ANCIENT_TEST_ANCIENT.talk.ANY.0-0r.ancient": "不必报名字。排队的人太多，名字会互相踩到。",
  "TEST_ANCIENT_TEST_ANCIENT.talk.ANY.1-0r.ancient": "你又来了？门没锁。我也没走。我们只是……还在。",
  "TEST_ANCIENT_TEST_ANCIENT.talk.IRONCLAD.0-0.ancient": "战士，你的火太亮。要不要先把它搁在门边，再进来等？",
  "TEST_ANCIENT_TEST_ANCIENT.talk.IRONCLAD.1-0r.ancient": "你还在。很好。愤怒也可以等——等累了，就会坐下。",
  "TEST_ANCIENT_TEST_ANCIENT.talk.IRONCLAD.2-0.ancient": "你若一定要走……带上这个。不是礼物，是“下次还来”的凭证。",
  "TEST_ANCIENT_TEST_ANCIENT.talk.IRONCLAD.2-0.next": "继续",
  "TEST_ANCIENT_TEST_ANCIENT.talk.IRONCLAD.2-1.char": "……我收下。但我仍会赶路。",
  "TEST_ANCIENT_TEST_ANCIENT.talk.IRONCLAD.2-1.next": "继续",
  "TEST_ANCIENT_TEST_ANCIENT.talk.IRONCLAD.2-2.ancient": "很好。赶路的人最需要一种东西：知道自己还会回到某个门口。",
  "TEST_ANCIENT_TEST_ANCIENT.talk.SILENT.0-0.ancient": "猎手，我不问你来历。你只要不说话，我们就算谈妥了。",
  "TEST_ANCIENT_TEST_ANCIENT.talk.SILENT.1-0r.ancient": "……还在。",
  "TEST_ANCIENT_TEST_ANCIENT.talk.SILENT.2-0.ancient": "沉默很贵。你付得起，我就替你留着这把椅子。",
  "TEST_ANCIENT_TEST_ANCIENT.talk.SILENT.2-0.next": "继续",
  "TEST_ANCIENT_TEST_ANCIENT.talk.SILENT.2-1.char": "……",
  "TEST_ANCIENT_TEST_ANCIENT.talk.SILENT.2-1.next": "继续",
  "TEST_ANCIENT_TEST_ANCIENT.talk.SILENT.2-2.ancient": "很好。最响的声音，往往是什么都不说。",
  "TEST_ANCIENT_TEST_ANCIENT.talk.DEFECT.0-0.ancient": "构装体……滴答声很均匀。像钟。钟最懂等待。",
  "TEST_ANCIENT_TEST_ANCIENT.talk.DEFECT.1-0r.ancient": "<平稳的嘀嘀声>",
  "TEST_ANCIENT_TEST_ANCIENT.talk.DEFECT.2-0.ancient": "你若在找“被修好”的答案……先学会把问题悬着。悬着，就不会碎。",
  "TEST_ANCIENT_TEST_ANCIENT.talk.DEFECT.2-0.next": "继续",
  "TEST_ANCIENT_TEST_ANCIENT.talk.DEFECT.2-1.char": "[i][font_size=22]<迟疑的嘀嘀声>[/font_size][/i]",
  "TEST_ANCIENT_TEST_ANCIENT.talk.DEFECT.2-1.next": "继续",
  "TEST_ANCIENT_TEST_ANCIENT.talk.DEFECT.2-2.ancient": "去吧。带着你的节拍走——别让它催你，让它陪你等。",
  "TEST_ANCIENT_TEST_ANCIENT.talk.NECROBINDER.0-0.ancient": "女士，复仇也会排队。你要不要领个号？",
  "TEST_ANCIENT_TEST_ANCIENT.talk.NECROBINDER.1-0r.ancient": "号还没叫到你。别急。恨意放得越久，刃口越利。",
  "TEST_ANCIENT_TEST_ANCIENT.talk.NECROBINDER.2-0.ancient": "你若一定要见血……至少别让血溅到“还没来”的东西上。",
  "TEST_ANCIENT_TEST_ANCIENT.talk.NECROBINDER.2-0.next": "继续",
  "TEST_ANCIENT_TEST_ANCIENT.talk.NECROBINDER.2-1.char": "……我会等。等到该清算的那一刻。",
  "TEST_ANCIENT_TEST_ANCIENT.talk.NECROBINDER.2-1.next": "继续",
  "TEST_ANCIENT_TEST_ANCIENT.talk.NECROBINDER.2-2.ancient": "那就对了。等待不是软弱，是把刀磨到只挥一次。",
  "TEST_ANCIENT_TEST_ANCIENT.talk.REGENT.0-0.ancient": "殿下，王位可以急，但茶要凉一会儿才好喝。",
  "TEST_ANCIENT_TEST_ANCIENT.talk.REGENT.1-0r.ancient": "欢迎回来，殿下。今天的等待和昨天一样贵——但您付得起。",
  "TEST_ANCIENT_TEST_ANCIENT.talk.REGENT.2-0.ancient": "若您要命令我……我只有一个命令回敬：坐下。等。",
  "TEST_ANCIENT_TEST_ANCIENT.talk.REGENT.2-0.next": "继续",
  "TEST_ANCIENT_TEST_ANCIENT.talk.REGENT.2-1.char": "……本王可以等。但臣民不能等太久！",
  "TEST_ANCIENT_TEST_ANCIENT.talk.REGENT.2-1.next": "继续",
  "TEST_ANCIENT_TEST_ANCIENT.talk.REGENT.2-2.ancient": "臣民等的是结果，而王座等的是时机。您两样都想要，就得学两样都等。"
}
```

![alt text](../../images/image27.png)

场景示例`test_ancient.tscn`：
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
