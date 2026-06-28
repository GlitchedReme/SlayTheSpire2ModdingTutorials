
## Particle Effects (GPUParticles2D)

`GPUParticles2D` is Godot 4's high-performance particle system. Combined with `ParticleProcessMaterial`, it can create explosions, smoke, sparks, and more.

You can manually draw simple round, square, or star-shaped transparent PNG images, then hand them to AI to design a simple particle effect.

When designing effects, if you're not sure what to provide, let AI ask you questions. For example, if you ask AI to design a rain effect with the particle system, it will ask you for raindrop assets.

### Basic Particle Scene Structure

Example: smoke dissipation effect:

```tscn
[node name="vfx_poof" type="GPUParticles2D"]
rotation = 3.14159
amount = 1
texture = ExtResource("2_62oo3")          ; Particle texture
lifetime = 0.75
one_shot = true                           ; Play once only
fixed_fps = 60
local_coords = true
process_material = SubResource("ParticleProcessMaterial_o3l8p")
```

**Key properties**:

| Property | Purpose | Typical values |
|------|------|--------|
| `one_shot` | Stop after playing once | `true` |
| `amount` | Particle count | 1 ~ 100 |
| `lifetime` | Particle lifetime | 0.1 ~ 3.0 |
| `emitting` | Whether currently emitting | `false` on init, set to `true` when playing |
| `explosiveness` | Burst factor (0~1) | `1.0` = emit all instantly |
| `fixed_fps` | Fixed frame rate | 60 |

#### ParticleProcessMaterial Configuration

```tscn
[sub_resource type="ParticleProcessMaterial" id="ParticleProcessMaterial_o3l8p"]
particle_flag_align_y = true
particle_flag_disable_z = true
direction = Vector3(0, 1, 0)              ; Emit upward
spread = 0.0                              ; No spread
initial_velocity_min = 500.0
initial_velocity_max = 500.0
gravity = Vector3(0, 0, 0)                ; No gravity
damping_min = 0.5                         ; Drag deceleration
scale_min = 0.75
scale_max = 0.75
scale_curve = SubResource("CurveXYZTexture_a1fhn")  ; Scale change curve
alpha_curve = SubResource("CurveTexture_kk5o2")     ; Alpha fade-out curve
```

**Common particle parameters**:

- **Emission shape**: `emission_shape = 6` + `emission_ring_radius` for ring-shaped emission
- **Velocity control**: `initial_velocity` + `radial_accel` + `tangential_accel`
- **Turbulence**: `turbulence_enabled = true` + `turbulence_noise_strength`
- **Color ramp**: `color_ramp` for color changes over the particle's lifetime

#### Triggering Particles In-Game (using VFXUtil from 3-3)

```csharp
// Instantiate and manually trigger
VFXUtil.PlaySimple("res://YourMod/scenes/vfx/burst.tscn", _targetPosition);
```
