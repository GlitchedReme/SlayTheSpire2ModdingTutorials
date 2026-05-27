`RitsuLib`在`Harmony`之上封装了一层Patch系统，统一了补丁声明、注册和失败处理。

原始的`Harmony`patch方式仍然可用，如果你要维护中大型项目建议使用该系统。

仅讲解`RitsuLib`的Patch系统怎么用，其他请参考基础patch教程。

## 基本流程

在 `Entry.Init` 中创建 patcher 并注册补丁：

```csharp
using MegaCrit.Sts2.Core.Logging;
using MegaCrit.Sts2.Core.Modding;
using STS2RitsuLib;
using STS2RitsuLib.Patching.Core;
using STS2RitsuLib.Patching.Models;

namespace Test.Scripts;

public class LogReleaseGamePatch : IPatchMethod
{
    // patch的ID，取得不一样防撞车
    public static string PatchId => "test_log_release_game";

    // 补丁用途说明
    public static string Description => "Print IsReleaseGame";

    // 重要性。失败是否崩溃，false即为不会导致游戏报错。
    public static bool IsCritical => false;

    // 要改的原版方法
    public static ModPatchTarget[] GetTargets() =>
        [new(typeof(NGame), nameof(NGame.IsReleaseGame))];

    // 可用Prefix, Postfix, Transpiler等
    public static void Postfix(ref bool __result)
    {
        Entry.Logger.Info($"NGame.IsReleaseGame = {__result}");
    }
}
```

```csharp
[ModInitializer(nameof(Init))]
public class Entry
{
    public const string ModId = "test";
    public static readonly Logger Logger = RitsuLibFramework.CreateLogger(ModId);

    public static void Init()
    {
        // patcher分组
        var patcher = RitsuLibFramework.CreatePatcher(ModId, "core-patches");
        patcher.RegisterPatch<LogReleaseGamePatch>();
        // patcher.RegisterPatches<MyPatchSet>(); // 批量登记补丁，见下

        // 登记完统一打补丁
        if (!patcher.PatchAll())
            throw new InvalidOperationException("Critical patches failed.");
    }
}
```

* 每个逻辑区域建议使用一个 patcher。
* 先注册完所有补丁，最后统一调用一次 `PatchAll()`。

## 分组注册

一个类型统一注册多个补丁：

```csharp
using STS2RitsuLib.Patching.Core;
using STS2RitsuLib.Patching.Models;

namespace Test.Scripts;

public sealed class MyPatchSet : IModPatches
{
    public static void AddTo(ModPatcher patcher)
    {
        patcher.RegisterPatch<ExamplePatch>();
        patcher.RegisterPatch<LogReleaseGamePatch>();
    }
}
```

注册方式：`patcher.RegisterPatches<MyPatchSet>();`

## 忽略缺失目标

有的方法只在特定游戏版本里才有，可以用 `ignoreIfMissing` 避免找不到方法时报错：

```csharp
public static ModPatchTarget[] GetTargets()
{
    // 方法不存在则跳过
    return [new(typeof(NGame), "SomeOptionalMethod", ignoreIfMissing: true)];
}
```

## 一个补丁作用多个目标

```csharp
public static ModPatchTarget[] GetTargets()
{
    return [
        new(typeof(TypeA), nameof(TypeA.Method1)),
        new(typeof(TypeB), nameof(TypeB.Method2))
    ];
}
```

## 动态补丁

当目标需要运行时发现时，使用 `DynamicPatchBuilder`：

```csharp
using HarmonyLib;
using MegaCrit.Sts2.Core.Nodes;
using STS2RitsuLib.Patching.Builders;

// 动态补丁名前缀
var builder = new DynamicPatchBuilder("my_dynamic")
    .AddMethod(
        targetType: typeof(NGame),
        methodName: nameof(NGame.IsReleaseGame),
        postfix: DynamicPatchBuilder.FromMethod(typeof(MyRuntimePatch), nameof(MyRuntimePatch.Postfix)),
        isCritical: false, // 失败是否要回滚
        description: "Dynamic Patch"); // 补丁用途说明

// 关键失败是否回滚
patcher.ApplyDynamic(builder, rollbackOnCriticalFailure: false);
```