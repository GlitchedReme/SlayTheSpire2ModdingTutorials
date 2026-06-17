## 游戏本体特效
如果你完全没有任何素材，也不想使用Shader/粒子完成特效，就只能最大化利用游戏现有的特效，排列组合修改来实现你的效果。

STS2 内置了丰富的 VFX，通过 `VfxCmd` 类可以直接调用，无需自己制作场景。

### 常用 API

```csharp
using MegaCrit.Sts2.Core.Commands;

// 在指定位置播放特效（vfxContainer 通常传当前战斗的 VfxContainer，或 null）
VfxCmd.PlayVfx(position, "vfx/vfx_attack_slash", vfxContainer);

// 在目标生物中心播放（考虑是否死亡）
VfxCmd.PlayOnCreatureCenter(target, "vfx/vfx_starry_impact");

// 在目标位置播放（更底层）
VfxCmd.PlayOnCreature(target, "vfx/vfx_bloody_impact");

// 在战斗一侧中心播放（AOE 效果）
VfxCmd.PlayOnSide(CombatSide.Enemy, "vfx/vfx_heavy_blunt", combatState);

// 全屏播放（如肾上腺素效果，spawner 用于定位 VfxContainer，可传 null）
VfxCmd.PlayFullScreenInCombat("vfx/vfx_adrenaline", spawner);

// 批量播放
VfxCmd.PlayOnCreatureCenters(enemies, "vfx/vfx_scratch");
```

### 内置特效路径样例

```csharp
// 攻击类
VfxCmd.slashPath           // "vfx/vfx_attack_slash"        斩击
VfxCmd.bluntPath           // "vfx/vfx_attack_blunt"        钝击
VfxCmd.lightningPath       // "vfx/vfx_attack_lightning"    闪电
VfxCmd.heavyBluntPath      // "vfx/vfx_heavy_blunt"         重击
VfxCmd.bloodyImpactPath    // "vfx/vfx_bloody_impact"       血腥冲击
VfxCmd.starryImpactVfx     // "vfx/vfx_starry_impact"       星辰冲击

// 技能类
VfxCmd.adrenalinePath      // "vfx/vfx_adrenaline"          肾上腺素
VfxCmd.blockPath           // "vfx/vfx_block"               格挡
VfxCmd.healPath            // "vfx/vfx_cross_heal"          治疗
VfxCmd.gazePath            // "vfx/vfx_gaze"                凝视
VfxCmd.screamVfx           // "vfx/vfx_scream"              尖叫

// 投掷类
VfxCmd.daggerThrowPath     // "vfx/vfx_dagger_throw"        飞刀
VfxCmd.chainPath           // "vfx/vfx_chain"               锁链
VfxCmd.flyingSlashPath     // "vfx/vfx_flying_slash"        飞行斩击

// 其他
VfxCmd.bitePath            // "vfx/vfx_bite"                撕咬
VfxCmd.rockShatterPath     // "vfx/vfx_rock_shatter"        岩石碎裂
VfxCmd.sandyImpactPath     // "vfx/vfx_sandy_impact"        沙土冲击
VfxCmd.slimeImpactVfxPath  // "vfx/vfx_slime_impact"        黏液冲击
```

### 修改现有特效

注意到VfxCmd并没有返回现有的特效节点

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

我们可以自己写一个函数，仿照它，并把 `Node2D` 作为函数返回值

这样的话，我们就可以对其进行修改。比如说，遍历其内部所有的相关节点(GPUParticles2D, Sprite2D)，对其用代码来上色等。

注意事项：
- 修改含有Material的特效时需要复制Material，不然修改一个特效会影响所有的特效
- 对特效大小进行调整时，粒子特效不会生效，需要修改其相对位置参数
