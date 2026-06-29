---
title: Vanilla Game VFX
date: 2026-05-18 17:28:25
permalink: en/docs/09-07-game-builtin-vfx/
author: vitechliu
categories:
- Basics
---
## Vanilla Game VFX

If you have no assets at all and don't want to use shaders or particles, you can make the most of the game's existing VFX by combining, arranging, and modifying them.

STS2 has a rich set of built-in VFX that you can call directly through the `VfxCmd` class — no need to create your own scenes.

### Common API

```csharp
using MegaCrit.Sts2.Core.Commands;

// Play a VFX at a position (vfxContainer is usually the current combat VfxContainer, or null)
VfxCmd.PlayVfx(position, "vfx/vfx_attack_slash", vfxContainer);

// Play VFX at a target creature's center (accounts for death state)
VfxCmd.PlayOnCreatureCenter(target, "vfx/vfx_starry_impact");

// Play VFX at target position (lower level)
VfxCmd.PlayOnCreature(target, "vfx/vfx_bloody_impact");

// Play VFX at the center of a combat side (AOE effects)
VfxCmd.PlayOnSide(CombatSide.Enemy, "vfx/vfx_heavy_blunt", combatState);

// Full-screen VFX (e.g. Adrenaline effect. spawner locates the VfxContainer; can be null)
VfxCmd.PlayFullScreenInCombat("vfx/vfx_adrenaline", spawner);

// Batch play
VfxCmd.PlayOnCreatureCenters(enemies, "vfx/vfx_scratch");
```

### Built-in VFX Path Examples

```csharp
// Attack
VfxCmd.slashPath           // "vfx/vfx_attack_slash"        Slash
VfxCmd.bluntPath           // "vfx/vfx_attack_blunt"        Blunt
VfxCmd.lightningPath       // "vfx/vfx_attack_lightning"    Lightning
VfxCmd.heavyBluntPath      // "vfx/vfx_heavy_blunt"         Heavy Blunt
VfxCmd.bloodyImpactPath    // "vfx/vfx_bloody_impact"       Bloody Impact
VfxCmd.starryImpactVfx     // "vfx/vfx_starry_impact"       Starry Impact

// Skill
VfxCmd.adrenalinePath      // "vfx/vfx_adrenaline"          Adrenaline
VfxCmd.blockPath           // "vfx/vfx_block"               Block
VfxCmd.healPath            // "vfx/vfx_cross_heal"          Heal
VfxCmd.gazePath            // "vfx/vfx_gaze"                Gaze
VfxCmd.screamVfx           // "vfx/vfx_scream"              Scream

// Projectile
VfxCmd.daggerThrowPath     // "vfx/vfx_dagger_throw"        Dagger Throw
VfxCmd.chainPath           // "vfx/vfx_chain"               Chain
VfxCmd.flyingSlashPath     // "vfx/vfx_flying_slash"        Flying Slash

// Other
VfxCmd.bitePath            // "vfx/vfx_bite"                Bite
VfxCmd.rockShatterPath     // "vfx/vfx_rock_shatter"        Rock Shatter
VfxCmd.sandyImpactPath     // "vfx/vfx_sandy_impact"        Sandy Impact
VfxCmd.slimeImpactVfxPath  // "vfx/vfx_slime_impact"        Slime Impact
```

### Modifying Existing VFX

Note that VfxCmd doesn't return the VFX node:

```csharp
public static void PlayVfx(Vector2 position, string path, Control? vfxContainer) {
    if (!TestMode.IsOn)
    {
        string scenePath = SceneHelper.GetScenePath(path);
        Node2D node2D = PreloadManager.Cache.GetScene(scenePath).Instantiate<Node2D>(PackedScene.GenEditState.Disabled);
        vfxContainer?.AddChildSafely(node2D);
        node2D.GlobalPosition = position;
    }
}
```

You can write your own function that mimics this but returns the `Node2D` as the return value.

This way you can modify it — iterate through all its internal nodes (GPUParticles2D, Sprite2D, etc.) and recolor them in code, for example.

Important notes:
- When modifying VFX that have Materials, you must duplicate the Material first. Otherwise modifying one VFX affects all of them.
- When scaling VFX, particle effects won't respond to scale changes. You'll need to modify their relative position parameters instead.
