---
title: WorldEnvironment & Global Lighting
date: 2026-05-18 17:28:25
permalink: en/docs/09-05-world-environment/
author: vitechliu
categories:
- Basics
---
## WorldEnvironment Global Environment Node

From the Godot docs:

> The WorldEnvironment node controls the default environment properties for the entire scene — post-processing effects, lighting, and background settings.
> 
> **WorldEnvironment** is used to configure the default [Environment](https://docs.godotengine.org/en/4.x/classes/class_environment.html#class-environment) for a scene.
> 
> Parameters defined in **WorldEnvironment** can be overridden by an [Environment](https://docs.godotengine.org/en/4.x/classes/class_environment.html#class-environment) resource set on the current [Camera3D](https://docs.godotengine.org/en/4.x/classes/class_camera3d.html#class-camera3d). Only one **WorldEnvironment** can be instantiated per scene at a time.
> 
> **WorldEnvironment** lets you specify default lighting parameters (e.g. ambient lighting), various post-processing effects (e.g. SSAO, DOF, tone mapping), and how the background is drawn (e.g. solid color, skybox). These are typically added to improve the scene's realism and color balance.

In `NGame.Instance.ActivateWorldEnvironment()`, you can get the game's WorldEnvironment node.

Call it at the right moment to adjust the entire game's brightness, exposure, contrast, and other properties.

For example, if you're making a nuclear explosion effect, you could raise `TonemapExposure` during the blast, using a Tween for smooth interpolation.

Be careful: overexposure can harm the experience, cause light pollution, and pose a photosensitive epilepsy risk. Use with restraint.

Here's a simple utility:

```csharp
using Godot;
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Nodes;

/// <summary>
/// Full-screen VFX utility class, built on NGame's WorldEnvironment node.
/// Supports dynamic adjustment of glow/bloom, saturation, brightness, contrast, exposure, and other post-processing effects.
/// </summary>
public static class WorldEnvironmentUtil
{
    private static WorldEnvironment? _cachedEnv;

    public const bool ENABLE_EXPOSURE = true;

    /// <summary>
    /// Get the currently active WorldEnvironment node.
    /// Automatically calls NGame.Instance.ActivateWorldEnvironment() if not active.
    /// </summary>
    public static WorldEnvironment? GetOrActivateEnvironment()
    {
        if (_cachedEnv != null && GodotObject.IsInstanceValid(_cachedEnv))
        {
            return _cachedEnv;
        }

        if (NGame.Instance == null)
        {
            return null;
        }

        _cachedEnv = NGame.Instance.ActivateWorldEnvironment();
        return _cachedEnv;
    }

    /// <summary>
    /// Deactivate the WorldEnvironment node.
    /// </summary>
    public static void DeactivateEnvironment()
    {
        if (NGame.Instance == null)
        {
            Entry.Logger.Warn("NGame.Instance is null, cannot deactivate WorldEnvironment.");
            return;
        }

        NGame.Instance.DeactivateWorldEnvironment();
        _cachedEnv = null;
    }

    /// <summary>
    /// Set glow (Bloom) intensity. Environment must have Glow enabled to see the effect.
    /// </summary>
    /// <param name="intensity">Glow intensity, default 0.8, recommended range 0~3</param>
    public static void SetGlowIntensity(float intensity)
    {
        var env = GetOrActivateEnvironment();
        if (env == null) return;

        env.Environment.GlowIntensity = intensity;
    }

    /// <summary>
    /// Set exposure (Tonemap Exposure).
    /// </summary>
    public static void SetExposure(float exposure)
    {
        var env = GetOrActivateEnvironment();
        if (env == null) return;

        env.Environment.TonemapExposure = exposure;
    }

    /// <summary>
    /// Set brightness (Adjustment Brightness).
    /// </summary>
    public static void SetBrightness(float brightness)
    {
        var env = GetOrActivateEnvironment();
        if (env == null) return;

        env.Environment.AdjustmentBrightness = brightness;
    }

    /// <summary>
    /// Set contrast (Adjustment Contrast).
    /// </summary>
    public static void SetContrast(float contrast)
    {
        var env = GetOrActivateEnvironment();
        if (env == null) return;

        env.Environment.AdjustmentContrast = contrast;
    }


    /// <summary>
    /// Set saturation (Adjustment Saturation).
    /// </summary>
    public static void SetSaturation(float saturation)
    {
        var env = GetOrActivateEnvironment();
        if (env == null) return;

        env.Environment.AdjustmentSaturation = saturation;
    }
    
    /// <summary>
    /// Reset all adjustment parameters to defaults (exposure 1, brightness 1, contrast 1, saturation 1, glow intensity 0.8).
    /// Does not automatically DeactivateEnvironment. Call that manually if needed.
    /// </summary>
    public static void ResetToDefaults()
    {
        var env = GetOrActivateEnvironment();
        if (env == null) return;

        env.Environment.TonemapExposure = 1f;
        env.Environment.AdjustmentBrightness = 1f;
        env.Environment.AdjustmentContrast = 1f;
        env.Environment.AdjustmentSaturation = 1f;
        env.Environment.GlowIntensity = 0.8f;
    }
}

```
