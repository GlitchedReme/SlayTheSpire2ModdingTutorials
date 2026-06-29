---
title: Mod Interop
date: 2026-05-04 13:57:41
permalink: en/docs/03-baselib/03-10-mod-integration/
categories:
- Basics
---
`BaseLib` provides a mod interop feature for optional dependency support.

## Another Mod

Suppose a mod with id `test` has this in its `Entry`:

```csharp
namespace Test.Scripts;

[ModInitializer(nameof(Init))]
public class Entry {
    public static void Init() {}

    public static List<string> TestIds = ["test1", "test2", "test3"];

    public static void Register(string id)
    {
        Log.Info($"Register called with id: {id}");
        TestIds.Add(id);
    }
}
```

Without depending on that mod's DLL, you can't directly call `Register`.

## Your Mod

Create a class like this:

```csharp
using BaseLib.Utils.ModInterop;

namespace JustAnotherTest.Scripts;

// First parameter: their mod id. Second: their namespace and class name.
[ModInterop("test", "Test.Scripts.Entry")]
public static class TestInterop
{
    // Get the definition of their function. You don't need to write any body.
    public static void Register(string id) { }

    // Get the definition of their field. InteropTarget makes it look for "TestIds". No body needed.
    [InteropTarget("TestIds")]
    public static List<string> Ids { get; set; }
}
```

Then call it when appropriate:

```csharp
if (ModManager.GetLoadedMods().Any(m => string.Equals(m.manifest?.id, "test")))
{
    TestInterop.Register("JustAnotherModId");
}
```
