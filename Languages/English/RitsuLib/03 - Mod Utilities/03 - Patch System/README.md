`RitsuLib` wraps a Patch system on top of `Harmony`, unifying patch declaration, registration, and failure handling.

The original `Harmony` patch approach is still available; using this system is recommended for medium-to-large projects.

This only covers how to use RitsuLib's Patch system; for other details, refer to basic patch tutorials.

## Basic Flow

Create a patcher in `Entry.Init` and register patches:

```csharp
using MegaCrit.Sts2.Core.Logging;
using MegaCrit.Sts2.Core.Nodes;
using STS2RitsuLib.Patching.Models;

namespace Test.Scripts;

public class LogReleaseGamePatch : IPatchMethod
{
    // Patch ID; make it unique to avoid collisions
    public static string PatchId => "test_log_release_game";

    // Description of the patch's purpose
    public static string Description => "Print IsReleaseGame";

    // Criticality. Whether failure causes a crash; false means it will not cause a game error.
    public static bool IsCritical => false;

    // The vanilla method to modify
    public static ModPatchTarget[] GetTargets() =>
        [new(typeof(NGame), nameof(NGame.IsReleaseGame))];

    // Prefix, Postfix, Transpiler etc. can be used
    public static void Postfix(ref bool __result)
    {
        Entry.Logger.Info($"NGame.IsReleaseGame = {__result}");
    }
}
```

```csharp
using MegaCrit.Sts2.Core.Logging;
using MegaCrit.Sts2.Core.Modding;
using STS2RitsuLib;
using STS2RitsuLib.Patching.Core; // RegisterPatch<T> and other extension methods are in this namespace

namespace Test.Scripts;

[ModInitializer(nameof(Init))]
public class Entry
{
    public const string ModId = "test";
    public static readonly Logger Logger = RitsuLibFramework.CreateLogger(ModId);

    public static void Init()
    {
        // Patcher grouping
        var patcher = RitsuLibFramework.CreatePatcher(ModId, "core-patches");
        patcher.RegisterPatch<LogReleaseGamePatch>();
        // patcher.RegisterPatches<MyPatchSet>(); // Batch-register patches, see below

        // After registration, apply all patches at once
        if (!patcher.PatchAll())
            throw new InvalidOperationException("Critical patches failed.");
    }
}
```

* It is recommended to use one patcher per logical area.
* Register all patches first, then call `PatchAll()` once at the end.

## Grouped Registration

Register multiple patches from a single type:

```csharp
using STS2RitsuLib.Patching.Core; // ModPatcher + RegisterPatch<T> extension methods
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

Registration: `patcher.RegisterPatches<MyPatchSet>();` (also requires `using STS2RitsuLib.Patching.Core;`)

## Ignoring Missing Targets

Some methods only exist in specific game versions; use `ignoreIfMissing` to avoid errors when a method is not found:

```csharp
public static ModPatchTarget[] GetTargets()
{
    // Skip if the method does not exist
    return [new(typeof(NGame), "SomeOptionalMethod", ignoreIfMissing: true)];
}
```

## One Patch for Multiple Targets

```csharp
public static ModPatchTarget[] GetTargets()
{
    return [
        new(typeof(TypeA), nameof(TypeA.Method1)),
        new(typeof(TypeB), nameof(TypeB.Method2))
    ];
}
```

## Dynamic Patches

When the target needs to be discovered at runtime, use `DynamicPatchBuilder`:

```csharp
using HarmonyLib;
using MegaCrit.Sts2.Core.Nodes;
using STS2RitsuLib.Patching.Builders;

// Dynamic patch name prefix
var builder = new DynamicPatchBuilder("my_dynamic")
    .AddMethod(
        targetType: typeof(NGame),
        methodName: nameof(NGame.IsReleaseGame),
        postfix: DynamicPatchBuilder.FromMethod(typeof(MyRuntimePatch), nameof(MyRuntimePatch.Postfix)),
        isCritical: false, // Whether failure should rollback
        description: "Dynamic Patch"); // Description of the patch's purpose

// Whether to rollback on critical failure
patcher.ApplyDynamic(builder, rollbackOnCriticalFailure: false);
```
