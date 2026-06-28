
## Frame Animation Sequences

Frame animation is the most basic VFX form: import multiple **transparent** PNG image sequences into Godot, compose them into an `AnimatedSprite2D` animation, and instantiate/play them in-game.

![fx_frame_6.png](../../../images/fx_frame_6.png)

The advantage of frame animation is that it's common and simple — many downloadable and exported effects are in sequence frame format.
The downside is poor performance; you'll need to scale down and optimize. See the optimization section for details.

### 1. Import Sequence Images

Place PNG sequence images in your mod's resource directory, e.g.:

```
YourMod/images/effect_1/fn0001.png
YourMod/images/effect_1/fn0002.png
...
```

### 2. Create the Scene File (.tscn)

In the Godot editor, create a new scene with a `Node2D` root node and add an `AnimatedSprite2D` child node.

Try to create scenes manually through the Godot (Megadot) editor. AI-generated scenes can have various reference errors.

![fx_frame_1.png](../../../images/fx_frame_1.png)

Select the AnimatedSprite2D node, then in the inspector panel on the right, create a new SpriteFrames.
![fx_frame_2.png](../../../images/fx_frame_2.png)

Click on this SpriteFrames to open the animation sequence frame editor. Click "Add Frames from File" and import your sequence frames in order.
![fx_frame_3.png](../../../images/fx_frame_3.png)

After import, you'll see the sequence frame chart below. Common buttons are labeled — adjust your effect as needed.
![fx_frame_4.png](../../../images/fx_frame_4.png)

Example scene script reference (AI-generated):

```tscn
[gd_scene load_steps=5 format=3 uid="uid://5p6c4m60db7a"]

[ext_resource type="Texture2D" path="res://RegentFX/frames/guiding_star/fn0001.png" id="1_t3dcf"]
[ext_resource type="Texture2D" path="res://RegentFX/frames/guiding_star/fn0002.png" id="2_fuxtp"]

[sub_resource type="SpriteFrames" id="SpriteFrames_pwecx"]
animations = [{
"frames": [{
"duration": 1.0,
"texture": ExtResource("1_t3dcf")
}, {
"duration": 1.0,
"texture": ExtResource("2_fuxtp")
}],
"loop": true,
"name": &"default",
"speed": 5.0
}]

[node name="SampleEffect" type="Node2D"]

[node name="AnimatedSprite2D" type="AnimatedSprite2D" parent="."]
sprite_frames = SubResource("SpriteFrames_pwecx")

```

### 3. Attach a C# Script to Control the Animation

In the game, particle animations are usually played and destroyed via scripts. However, AnimatedSprite2D has auto-play, so if you don't need features like delayed playback, you don't need a playback script.

But you do need a destroy script. If your effect is a one-shot (e.g. a hit effect) rather than a looping permanent effect, it needs to auto-destroy after playback.

Attach a custom script to AnimatedSprite2D. If you don't want to add a script to every scene, you can also destroy effects via the VFXUtil custom method in Chapter 3-3.

```csharp
using Godot;

public partial class Effect : AnimatedSprite2D {
    public override void _Ready() {
    // Auto-delete after animation finishes
        AnimationFinished += QueueFree;
    }
}
```


### 4. Other Tips

- Sometimes your imported frame images are too large in resolution and cause noticeable stuttering in-game. You can scale them down via import settings.
  ![fx_frame_5.png](../../../images/fx_frame_5.png)
  Batch-select your images. In the import settings at the top left, choose a lower resolution — e.g. if the original is 1080p, scale to 720/540.
