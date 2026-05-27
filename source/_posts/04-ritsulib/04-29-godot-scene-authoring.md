---
title: Godot 场景编写
date: 2026-05-25 22:03:58
permalink: docs/04-ritsulib/04-29-godot-scene-authoring/
author: alkaid616
categories:
- Basics
---
很多 RitsuLib 模板都会用到 `.tscn`：角色战斗模型、怪物模型、遭遇背景、事件布局、休息点动画、额外 UI 等。场景文件本身还是 Godot 的东西，RitsuLib 主要负责把它们接到游戏对应位置。

## 注册 C# 脚本

如果场景里挂了你的 C# 脚本，初始化时必须先注册脚本程序集：

```csharp
using System.Reflection;
using MegaCrit.Sts2.Core.Logging;
using MegaCrit.Sts2.Core.Modding;
using STS2RitsuLib;
using STS2RitsuLib.Interop;

namespace Test.Scripts;

[ModInitializer(nameof(Init))]
public static class Entry
{
    public const string ModId = "test";
    public static readonly Logger Logger = RitsuLibFramework.CreateLogger(ModId);

    public static void Init()
    {
        var assembly = Assembly.GetExecutingAssembly();
        RitsuLibFramework.EnsureGodotScriptsRegistered(assembly, Logger);
        ModTypeDiscoveryHub.RegisterModAssembly(ModId, assembly);
    }
}
```

不调用这行时，Godot 可能能加载 `.tscn`，但实例化时找不到挂载的 C# 类型。

## 通过 Profile 加载

内容模型的场景优先写在 `AssetProfile` 里：

```csharp
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

public sealed class MirrorEvent : ModEventTemplate
{
    public override EventAssetProfile AssetProfile => new(
        LayoutScenePath: "res://Test/scenes/events/mirror_layout.tscn",
        BackgroundScenePath: "res://Test/scenes/events/mirror_bg.tscn",
        VfxScenePath: "res://Test/scenes/events/mirror_vfx.tscn"
    );
}
```

怪物和遭遇也是同样思路：

```csharp
public sealed class TestMonster : ModMonsterTemplate
{
    public override MonsterAssetProfile AssetProfile => new(
        VisualsScenePath: "res://Test/scenes/monsters/test_monster.tscn"
    );
}

public sealed class TestEncounter : ModEncounterTemplate
{
    public override EncounterAssetProfile AssetProfile => new(
        ScenePath: "res://Test/scenes/encounters/test_encounter.tscn",
        BackgroundScenePath: "res://Test/scenes/encounters/test_bg.tscn"
    );
}
```

能静态指定路径时不要手动 `ResourceLoader.Load`。这样路径、回退和日志会由 RitsuLib 统一处理。

## 场景结构

不同用途的场景对节点结构有要求。具体要求看对应内容教程，但有几条通用规则：

* 场景根节点类型要和模板期望一致。角色/怪物战斗模型通常是可转换成游戏视觉节点的 `Node2D` 或带指定子节点的场景。
* 用 `%NodeName` 访问的节点需要在 Godot 里勾选唯一名称，或保持教程要求的固定名字。
* 事件、遭遇、休息点这类布局场景不要依赖编辑器路径，所有图片和子场景都应使用 `res://Test/...`。
* 如果场景会放进 pck，确认导出预设没有漏掉 `.tscn`、图片、材质、`.tres`、音频 bank 等资源。

## Factory

静态路径不够用时，再覆写模板提供的 factory。返回 `null` 表示继续走 `AssetProfile` 的普通路径。

```csharp
using Godot;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

public sealed class SeasonalEvent : ModEventTemplate
{
    public override EventAssetProfile AssetProfile => new(
        LayoutScenePath: "res://Test/scenes/events/seasonal_normal.tscn"
    );

    protected override PackedScene? TryCreateLayoutPackedScene()
    {
        if (!Entry.UseHolidaySkin)
            return null;

        return ResourceLoader.Load<PackedScene>(
            "res://Test/scenes/events/seasonal_holiday.tscn");
    }
}
```

角色或怪物视觉也可以使用类似入口：

```csharp
using Godot;
using MegaCrit.Sts2.Core.Nodes;
using STS2RitsuLib.Scaffolding.Characters;

namespace Test.Scripts;

public sealed class TestCharacter : ModCharacterTemplate<TestCardPool, TestRelicPool, TestPotionPool>
{
    protected override NCreatureVisuals? TryCreateCreatureVisuals()
    {
        if (!Entry.UseDebugVisuals)
            return null;

        return RitsuGodotNodeFactories.CreateFromScenePath<NCreatureVisuals>(
            "res://Test/scenes/debug/debug_visuals.tscn");
    }
}
```

Factory 适合“按配置换场景”“运行时生成节点树”“开发调试”这类需求。发布版本里能用固定路径表达的，就继续用固定路径。

## 代码创建节点

如果只是补一个简单节点，可以直接用 Godot API 创建：

```csharp
using Godot;

public sealed partial class NMirrorGlow : Node2D
{
    public override void _Ready()
    {
        var sprite = new Sprite2D
        {
            Texture = ResourceLoader.Load<Texture2D>("res://Test/images/vfx/glow.png"),
            Modulate = new Color(1f, 0.8f, 0.4f, 0.7f),
        };

        AddChild(sprite);
    }
}
```

但复杂布局建议仍然做成 `.tscn`。它更容易在 Godot 编辑器里调位置，也更容易让美术同伴修改。

## 检查清单

* `Entry.Init()` 已调用 `EnsureGodotScriptsRegistered`。
* 所有场景路径都是 `res://`，且打包后存在。
* 自定义脚本类是 `public`，并编进 Mod 程序集。
* 场景里没有引用本机绝对路径。
* 使用 factory 时，`null` 分支会回到正常 profile 路径。
* 修改场景结构后重新打包 pck，不要只替换 dll。
