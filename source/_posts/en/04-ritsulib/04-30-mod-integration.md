---
title: Mod Interop
date: 2026-05-27 15:36:11
permalink: en/docs/04-ritsulib/04-30-mod-integration/
author: alkaid616
categories:
- Basics
---
Enables optional dependency and mod interop functionality.

## Another Mod

Suppose a mod with modid `target-mod` provides the following public API and data classes:

```csharp
namespace TargetMod.Api;

public static class PublicApi
{
    public static bool IsReady => true;
    public static int GetBonusLevel(string playerId) => 5;
    public static void GrantBadge(string badgeId) { /* Grant badge */ }
}

public static class Catalog
{
    public static Entry FindById(string id) => new Entry(id);
}

public class Entry
{
    public Entry(string id) { }
    public string DisplayName => "Target Entry";
    public int GetScore() => 10;
}
```

If you don't want a hard dependency (hard reference) in your `.csproj` on this mod's dll, but still want to call it when it is present, you can use RitsuLib's cross-Mod Interop mechanism to write a strongly-typed proxy.

## Your Mod

```csharp
using System;
using STS2RitsuLib.Interop;

namespace JustAnotherTest.Scripts;

// Pass in the ID and the full class name
[ModInterop("target-mod", "TargetMod.Api.PublicApi")]
public static class TargetModApiInterop
{
    public static bool IsReady => false;

    public static int GetBonusLevel(string playerId) => 0;

    public static void GrantBadge(string badgeId)
    {
        throw new NotSupportedException("Target mod is not loaded.");
    }
}

// If your local name differs from the target assembly's name,
// or you need to proxy an instance class (e.g., wrapping the target's Entry as this side's EntryRef),
// use [InteropTarget] to manually specify its original class name or method name:
[ModInterop("target-mod")]
public static class TargetCatalogInterop
{
    [InteropTarget("TargetMod.Api.Catalog", "FindById")]
    public static EntryRef Find(string id) => throw new NotSupportedException();

    [InteropTarget("TargetMod.Api.Entry")]
    public sealed class EntryRef : InteropClassWrapper
    {
        public EntryRef(string id)
        {
        }

        public string DisplayName => "";

        public int GetScore() => 0;
    }
}
```

Then call it at the appropriate time. Treat the case where the target is absent as a normal branch:

*Make sure you have registered the current assembly with RitsuLib during Mod initialization: `ModTypeDiscoveryHub.RegisterModAssembly(Entry.ModId, Assembly.GetExecutingAssembly());`*

```csharp
if (TargetModApiInterop.IsReady)
{
    // Call a basic static method
    var level = TargetModApiInterop.GetBonusLevel("test_player");
    if (level >= 3)
    {
        TargetModApiInterop.GrantBadge("test:veteran");
    }

    // Call a method on a wrapped object
    var entry = TargetCatalogInterop.Find("some_id");
    // Console.WriteLine(entry.DisplayName);
}
```

---

## AssemblyInterop (Calling Arbitrary CLR Assemblies)

Compared to `[ModInterop]` above, using `[AssemblyInterop]` is more recommended. The usage is exactly the same, except the target type name must include the assembly name.

```csharp
using STS2RitsuLib.Interop;

// Target type name format: Namespace.Type, AssemblyName
[AssemblyInterop("Target.Lib.Api, TargetLib")]
public static class TargetLibInterop
{
    public static bool IsReady => false;

    public static int Compute(string input) => 0;
}

// Also supports [InteropTarget] + InteropClassWrapper
[AssemblyInterop]
public static class ExternalCatalogInterop
{
    [InteropTarget("Target.Lib.Catalog, TargetLib")]
    public static RecordRef Lookup(string key) => throw new NotSupportedException();

    [InteropTarget("Target.Lib.Record, TargetLib")]
    public sealed class RecordRef : InteropClassWrapper
    {
        public RecordRef(string id) { }
        public string Name => "";
        public double GetMetric(string name) => 0;
    }
}
```

The framework automatically distinguishes: if the type name contains `,` (comma) → goes through the `AssemblyInterop` path; no comma → goes through the `ModInterop` path. So both modes can coexist in the same project without interfering with each other.
