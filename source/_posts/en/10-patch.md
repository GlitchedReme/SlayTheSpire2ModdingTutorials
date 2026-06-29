---
title: Patch
date: 2026-05-17 18:40:53
permalink: en/docs/10-patch/
categories:
- Basics
---
## Overview

https://harmony.pardeike.net/articles/intro.html

`Harmony` provides a way to patch, replace, and decorate .NET programs at runtime. In short, it lets you change vanilla game code logic to do what you want.

## Basics

### Simple Example

Official example. Suppose the vanilla game has this class:

```csharp
public class SomeGameClass
{
    public bool isRunning;
    public int counter;

    public int DoSomething()
    {
        if (isRunning)
        {
            counter++;
        }
        return counter * 10;
    }
}
```

In your init function, call the patching code:

```csharp
using HarmonyLib; // add this using at the top of the file

var harmony = new Harmony("com.example.patch"); // patch ID — make it unique to avoid collisions
harmony.PatchAll();
```

`Harmony` then scans your assembly for all patches and tries to load them.

If you write a patch like this:

```csharp
// Modify SomeGameClass.DoSomething. If the method is not accessible, use a string.
[HarmonyPatch(typeof(SomeGameClass), nameof(SomeGameClass.DoSomething))]
public class Patch01
{
    // Modify the beginning of the method.
    // Return type can be bool or void. Returning false from a bool skips the original method body (Postfix still runs).
    // __instance is the current owner of the method (i.e. 'this'). Omit for static methods.
    // ___counter accesses the class field "counter" (private fields work too — use three underscores for any field).
    public static bool Prefix(SomeGameClass __instance, ref int ___counter)
    {
        if (___counter > 100)
            return false;
        ___counter = 0;
        return true;
    }

    // Modify the end of the method (every return point if there are multiple).
    // __result is the return value.
    static void Postfix(ref int __result) => __result *= 2;
}
```

At runtime, the original method effectively becomes something like this (conceptual — actual mechanics differ):

```csharp
public int DoSomething()
{
    int __result = default;

    // Harmony inserts: call Prefix; return false to skip the original body
    if (!Patch01.Prefix(this, ref counter))
    {
        return Patch01.Postfix(ref __result);
    }

    // Original method
    if (isRunning)
    {
        counter++;
    }
    __result = counter * 10;

    // Harmony inserts: Postfix is called before every return
    return Patch01.Postfix(ref __result);
}
```

### Implementing a Patch

Patches can be registered explicitly or via attributes (auto-registration). Attribute-based is the usual approach.

Declare `[HarmonyPatch]` on a class or method to register it.

```csharp
[HarmonyPatch(typeof(SomeTypeHere), "SomeMethodName")]
class MyPatches
{
    static void Postfix(/*...*/)
    {
        //...
    }
}
```

Or:

```csharp
[HarmonyPatch] // For nested patch implementations, every level from the outermost class must have [HarmonyPatch]
class MyPatches
{
    [HarmonyPatch(typeof(SomeTypeHere), "SomeMethodName")]
    static void Postfix(/*...*/)
    {
        //...
    }
}
```

### Attribute Parameters

`[HarmonyPatch]` accepts these parameters:

- `declaringType`: The target class to patch.
- `methodName`: The target method name. Prefer `nameof` if the method is accessible.
- `methodType`: The target method type. Some method types get renamed after compilation (constructors, getters, setters, async methods, etc.) or have no name (operator overloads). These require specifying the method type.
- `argumentTypes`: List of parameter types for the target method. Required when there are overloads with the same name.
- `argumentVariations`: Array of `ArgumentType` values (`Normal`, `Ref`, `Out`, `Pointer`) corresponding to `argumentTypes`.

Details below:

#### methodType

If the target isn't a regular method, use `MethodType` to specify what kind.

Original:

```csharp
public class Wallet
{
    public int Gold { get; set; } // Property — compiled as get_Gold / set_Gold

    public Wallet(int gold) => Gold = gold; // Constructor — compiled as .ctor

    public async Task<int> FetchGoldAsync()
    {
        await Task.Delay(1); // async method body compiles into the state machine's MoveNext, not the surface async method. View in ILSpy by switching to IL mode.
        return Gold;
    }
}
```

Patch (property getter, constructor, and async method):

TODO: enumerator, generic

```csharp
using HarmonyLib;
using System.Threading.Tasks;

[HarmonyPatch(typeof(Wallet), nameof(Wallet.Gold), MethodType.Getter)]
class PatchGoldGetter
{
    static void Postfix(ref int __result) => __result = 999;
}

[HarmonyPatch(typeof(Wallet), MethodType.Constructor, [typeof(int)])]
class PatchWalletCtor
{
    static void Postfix(Wallet __instance) => __instance.Gold = 0;
}

// MethodType.Async: patches <FetchGoldAsync>d__X.MoveNext
// Without Async, only the surface method is patched
[HarmonyPatch(typeof(Wallet), nameof(Wallet.FetchGoldAsync), MethodType.Async)]
class PatchFetchGoldAsync
{
    // __instance type is the compiler-generated state machine, not Wallet
    static void Prefix(object __instance)
    {
        var wallet = Traverse.Create(__instance).Field("<>4__this").GetValue<Wallet>();
        wallet.Gold += 10;
    }
}
```

#### Patching Async Methods

Open `ILSpy` and find an `async` method, e.g. Strike's `OnPlay`.

```csharp
protected override async Task OnPlay(PlayerChoiceContext choiceContext, CardPlay cardPlay)
{
    ArgumentNullException.ThrowIfNull(cardPlay.Target, "cardPlay.Target");
    await DamageCmd.Attack(base.DynamicVars.Damage.BaseValue).FromCard(this).Targeting(cardPlay.Target)
        .WithHitFx("vfx/vfx_attack_slash")
        .Execute(choiceContext);
}
```

Click the dropdown that says `C# 12.0 / VS 2022.8` and switch to `C# 4.0` or earlier (before 5.0). The code changes to:

```csharp
    // Compiler-generated state machine at the top of the class
    [StructLayout(LayoutKind.Auto)]
	[CompilerGenerated]
	private struct <OnPlay>d__5 : IAsyncStateMachine
	{
		public int <>1__state;

		public AsyncTaskMethodBuilder <>t__builder;

		[Nullable(0)]
		public CardPlay cardPlay;

		[Nullable(0)]
		public StrikeIronclad <>4__this;

		[Nullable(0)]
		public PlayerChoiceContext choiceContext;

		[Nullable(new byte[] { 0, 1 })]
		private TaskAwaiter<AttackCommand> <>u__1;

		private void MoveNext()
		{
            // ...
		}

		void IAsyncStateMachine.MoveNext()
		{
			//ILSpy generated this explicit interface implementation from .override directive in MoveNext
			this.MoveNext();
		}

        // ...
	}

    // What the compiled OnPlay method actually looks like
	[AsyncStateMachine(typeof(<OnPlay>d__5))]
	protected override Task OnPlay(PlayerChoiceContext choiceContext, CardPlay cardPlay)
	{
		<OnPlay>d__5 stateMachine = default(<OnPlay>d__5);
		stateMachine.<>t__builder = AsyncTaskMethodBuilder.Create();
		stateMachine.<>4__this = this;
		stateMachine.choiceContext = choiceContext;
		stateMachine.cardPlay = cardPlay;
		stateMachine.<>1__state = -1;
		stateMachine.<>t__builder.Start(ref stateMachine);
		return stateMachine.<>t__builder.Task;
	}
```

- Without `MethodType.Async`, you enter the `OnPlay` function and can't reach the pre-compilation logic.
- With `MethodType.Async`, you enter `<OnPlay>d__5.MoveNext`. The `object __instance` parameter is of type `<OnPlay>d__5`. Use reflection to access its fields, e.g. `<>4__this`.


#### argumentVariations

Overloads with `ref` / `out` require more than just `typeof(T)` in `argumentTypes` — you also need `ArgumentType` to mark the passing convention.

Original:

```csharp
public class ScoreBoard
{
    public void Add(ref int delta) => delta += 10;
}
```

Patch:

```csharp
using HarmonyLib;

[HarmonyPatch(typeof(ScoreBoard), nameof(ScoreBoard.Add), [typeof(int)], [ArgumentType.Ref])]
class PatchAdd
{
    static void Prefix(ref int delta) => delta *= 2;
}
```

You can freely combine parameters. Reference:

```csharp
[HarmonyPatch(Type, string)]
[HarmonyPatch(Type declaringType, Type[] argumentTypes)]
[HarmonyPatch(Type declaringType, string methodName)]
[HarmonyPatch(Type declaringType, string methodName, params Type[] argumentTypes)]
[HarmonyPatch(Type declaringType, string methodName, Type[] argumentTypes, ArgumentType[] argumentVariations)]
[HarmonyPatch(Type declaringType, MethodType methodType)]
[HarmonyPatch(Type declaringType, MethodType methodType, params Type[] argumentTypes)]
[HarmonyPatch(Type declaringType, MethodType methodType, Type[] argumentTypes, ArgumentType[] argumentVariations)]
[HarmonyPatch(string methodName, Type[] argumentTypes, ArgumentType[] argumentVariations)]
[HarmonyPatch(string methodName, MethodType methodType)]
[HarmonyPatch(MethodType methodType, params Type[] argumentTypes)]
[HarmonyPatch(MethodType methodType, Type[] argumentTypes, ArgumentType[] argumentVariations)]
```

### Patch Method Parameters

Only declare the parameters you need. Harmony injects them by **parameter name** (except Transpiler, which matches by type).

For the following example code:

```csharp
public class PlayerStats
{
    public int shield;
    private int _critRate;

    public int Attack(int power) => power + shield;

    public void TakeHit(ref int damage) => damage = Math.Max(0, damage - shield);

    public static void Log(string tag, int value) { /* vanilla logging */ }

    public ref int GetShieldRef() => ref shield;

    public void Risky() => throw new InvalidOperationException("boom");
}
```

#### __instance

The `this` reference when the original method is non-static. Omit for static methods.

```csharp
using HarmonyLib;

[HarmonyPatch(typeof(PlayerStats), nameof(PlayerStats.Attack))]
class PatchAttackInstance
{
    static void Prefix(PlayerStats __instance) => __instance.shield = Math.Max(0, __instance.shield);
}
```

#### Parameters with Original Names

Type and `ref` / `out` must match the original method exactly.

```csharp
[HarmonyPatch(typeof(PlayerStats), nameof(PlayerStats.TakeHit))]
class PatchTakeHitArg
{
    static void Prefix(ref int damage) => damage = Math.Max(0, damage);
}
```

#### __0, __1…

Match parameters by **position**: 0th, 1st… Useful when the original name is inconvenient or you want to handle multiple methods uniformly.

```csharp
[HarmonyPatch(typeof(PlayerStats), nameof(PlayerStats.Log))]
class PatchLogByIndex
{
    static void Prefix(ref string __0, ref int __1)
    {
        __0 = $"[mod]{__0}";
        __1 *= 2;
    }
}
```

#### __result

Access or rewrite the return value. Use `ref` to modify it. In a Prefix, its value is `default` since the original hasn't run yet.

```csharp
[HarmonyPatch(typeof(PlayerStats), nameof(PlayerStats.Attack))]
class PatchAttackResult
{
    static void Postfix(ref int __result) => __result *= 2;
}
```

#### __resultRef

Use when the original method returns `ref T`. Changes the reference itself, not just the value.

```csharp
[HarmonyPatch(typeof(PlayerStats), nameof(PlayerStats.GetShieldRef))]
class PatchShieldRef
{
    static void Postfix(ref RefResult<int> __resultRef) { /* see Harmony docs for operations on __resultRef */ }
}
```

#### ___fieldName

Three underscores + field name. Reads and writes **private fields**. Use `ref` to write.

```csharp
[HarmonyPatch(typeof(PlayerStats), nameof(PlayerStats.Attack))]
class PatchAttackField
{
    static void Prefix(ref int ___critRate) => ___critRate = 100;
}
```

#### __args

An `object[]` of all arguments. Modifying elements writes back to the original parameters. Slight overhead.

```csharp
[HarmonyPatch(typeof(PlayerStats), nameof(PlayerStats.Log))]
class PatchLogArgs
{
    static void Prefix(object[] __args)
    {
        __args[0] = $"[mod]{__args[0]}";
        __args[1] = (int)__args[1]! + 1;
    }
}
```

#### __state

Write in Prefix (often via `out`), read in Postfix, for passing data between the two within the **same patch class**.

```csharp
[HarmonyPatch(typeof(PlayerStats), nameof(PlayerStats.Attack))]
class PatchAttackState
{
    static void Prefix(out int __state, int power) => __state = power;

    static void Postfix(int __state, ref int __result) => __result += __state;
}
```

#### __originalMethod

Injects the `MethodBase` of the currently patched original method. **Cannot** be used to call the original method.

```csharp
using System.Reflection;

[HarmonyPatch(typeof(PlayerStats), nameof(PlayerStats.Attack))]
class PatchAttackMeta
{
    static void Prefix(MethodBase __originalMethod) =>
        Log.Info($"patching {__originalMethod.Name}");
}
```

#### __runOriginal

Prefix: whether the original method **will** run.
Postfix: whether the original method **did** run (false if Prefix skipped it).

Read-only.

```csharp
[HarmonyPatch(typeof(PlayerStats), nameof(PlayerStats.Attack))]
class PatchAttackRunFlag
{
    static bool Prefix(ref int __result, int power)
    {
        if (power <= 0)
        {
            __result = 0;
            return false;
        }
        return true;
    }

    static void Postfix(bool __runOriginal, ref int __result)
    {
        if (!__runOriginal)
            __result = -1; // original was skipped
    }
}
```

#### __exception (Finalizer)

Finalizer can observe exceptions via `Exception __exception`. If the Finalizer's return type is `Exception`, returning `null` swallows the exception, returning a new one replaces it.

```csharp
[HarmonyPatch(typeof(PlayerStats), nameof(PlayerStats.Risky))]
class PatchRiskyFinalizer
{
    static Exception Finalizer(Exception __exception)
    {
        if (__exception is InvalidOperationException)
            return null; // swallow this exception
        return __exception;
    }
}
```

#### Transpiler Parameters

Transpiler matches by **type**, not by name. The first parameter must be `IEnumerable<CodeInstruction>`. Returns the modified instruction sequence. Optional: `MethodBase`, `ILGenerator`.

```csharp
using System.Collections.Generic;
using System.Reflection;
using System.Reflection.Emit;
using HarmonyLib;

[HarmonyPatch(typeof(PlayerStats), nameof(PlayerStats.Attack))]
class PatchAttackTranspiler
{
    static IEnumerable<CodeInstruction> Transpiler(
        IEnumerable<CodeInstruction> instructions,
        MethodBase __originalMethod)
    {
        foreach (var ins in instructions)
            yield return ins; // pass-through; see docs for actual modifications
    }
}
```

## Patch Types

For the following example code:

```csharp
public class CombatMath
{
    public int bonus;

    public int DealDamage(int baseDamage) => baseDamage + bonus;

    public void Heal(int amount) => bonus += amount;
}
```

### Prefix

Can do the following:

#### Modify the Start of the Original Method

Change instance state before the original runs.

```csharp
using HarmonyLib;

[HarmonyPatch(typeof(CombatMath), nameof(CombatMath.DealDamage))]
class PatchDealPrefix
{
    static void Prefix(CombatMath __instance)
    {
        if (__instance.bonus < 0)
            __instance.bonus = 0;
    }
}
```

#### Access and Modify Method Parameters

```csharp
[HarmonyPatch(typeof(CombatMath), nameof(CombatMath.DealDamage))]
class PatchDealPrefix
{
    static void Prefix(ref int baseDamage) => baseDamage = Math.Max(0, baseDamage);
}
```

#### Skip the Original Method and Set the Return Value

If returning `bool`, `return false` skips the original method body. Postfix still runs.

This is affected by patch load order. If mod A loads before B and skips, A's runs but B's doesn't.

```csharp
[HarmonyPatch(typeof(CombatMath), nameof(CombatMath.DealDamage))]
class PatchDealPrefix
{
    static bool Prefix(ref int __result, int baseDamage)
    {
        if (baseDamage <= 0)
        {
            __result = 0;
            return false;
        }
        return true;
    }
}
```

#### Pass State to Postfix

`__state` must be in the same patch class as the Postfix.

```csharp
[HarmonyPatch(typeof(CombatMath), nameof(CombatMath.DealDamage))]
class PatchDealPrefix
{
    static void Prefix(out int __state, ref int baseDamage)
    {
        __state = baseDamage; // readable in Postfix
        baseDamage *= 2;
    }

    static void Postfix(int __state, ref int __result) => __result += __state;
}
```

### Postfix

Can do the following:

#### Modify the End of a void Method

Insert logic after the original method fully executes.

```csharp
using HarmonyLib;

[HarmonyPatch(typeof(CombatMath), nameof(CombatMath.Heal))]
class PatchHealPostfix
{
    static void Postfix(CombatMath __instance) =>
        __instance.bonus = Math.Min(__instance.bonus, 99);
}
```

#### Access and Modify the Return Value

Runs the logic for every `return` in the original method.

```csharp
[HarmonyPatch(typeof(CombatMath), nameof(CombatMath.DealDamage))]
class PatchDealPostfix
{
    static void Postfix(ref int __result) => __result *= 2;
}
```

Also works with Prefix's `__state`.

### Transpiler

Modifies code at the IL level. More flexible, suited for complex changes.

Don't overuse Transpiler when Prefix and Postfix can achieve the same result.

```csharp
using System.Collections.Generic;
using System.Reflection.Emit;
using HarmonyLib;

[HarmonyPatch(typeof(CombatMath), nameof(CombatMath.DealDamage))]
class PatchDealTranspiler
{
    static IEnumerable<CodeInstruction> Transpiler(IEnumerable<CodeInstruction> instructions)
    {
        // Iterate all instructions
        foreach (var ins in instructions)
        {
            // Find the return instruction
            if (ins.opcode == OpCodes.Ret)
            {
                yield return new CodeInstruction(OpCodes.Ldc_I4_2); // push constant 2
                yield return new CodeInstruction(OpCodes.Mul);        // multiply top of stack by 2
            }
            yield return ins; // emit original instruction in order
        }
    }
}
```

The above is equivalent to `static void Postfix(ref int __result) => __result *= 2;`.

For more complex cases, consult the `Harmony` docs. Use `CodeMatcher` for sophisticated instruction matching.

### Finalizer

Can observe, replace, or swallow exceptions.

Original:

```csharp
public void Risky()
{
    if (bonus < 0)
        throw new InvalidOperationException("bonus is negative");
}
```

This patch catches and swallows `InvalidOperationException` so it no longer throws. Other exceptions pass through.

```csharp
using HarmonyLib;

[HarmonyPatch(typeof(CombatMath), nameof(CombatMath.Risky))]
class PatchRiskyFinalizer
{
    static Exception Finalizer(Exception __exception)
    {
        if (__exception is InvalidOperationException)
            return null;
        return __exception;
    }
}
```

### Reverse Patch

Copies a piece of vanilla logic into a method you define.

Suppose this vanilla code exists:

```csharp
private int SecretScale(int value) => value * 3;
```

Patch it like this:

```csharp
using System;
using HarmonyLib;

[HarmonyPatch]
public static class CombatMathBridge
{
    [HarmonyReversePatch]
    [HarmonyPatch(typeof(CombatMath), "SecretScale")]
    // The signature must exactly match the original (e.g. add __instance for non-static, and all parameters)
    public static int SecretScale(CombatMath __instance, int value) =>
        throw new NotImplementedException(); // modifying the logic here is pointless; keep it as-is
}
```

Now calling `CombatMathBridge.SecretScale(combat, 10)` is equivalent to calling the original method.

## Other Patch Tools

https://harmony.pardeike.net/articles/utilities.html

### Harmony

The `Harmony` object you create can do more than `PatchAll` — manual patching, unpatching, etc.

```csharp
var original = typeof(TheClass).GetMethod("TheMethod");
var prefix = typeof(MyPatchClass1).GetMethod("SomeMethod");
var postfix = typeof(MyPatchClass2).GetMethod("SomeMethod");

harmony.Patch(original, new HarmonyMethod(prefix), new HarmonyMethod(postfix));


var harmony = new Harmony("my.harmony.id");
harmony.UnpatchAll();

var original = typeof(TheClass).GetMethod("TheMethod");
harmony.Unpatch(original, HarmonyPatchType.Prefix);
harmony.Unpatch(original, HarmonyPatchType.Prefix, "their.harmony.id");
```

### Traverse

A convenience class for reflective access and invocation, with caching for efficiency. Quick way to read/write private fields or call private methods.

```csharp
// First, access a type
public static Traverse Create(Type type)
public static Traverse Create<T>()
public static Traverse CreateWithType(string name)

// Get its type, fields, properties, methods, etc.
public Traverse Type(string name)
public Traverse Field(string name)
public Traverse Property(string name, object[] index = null)
public Traverse Method(string name, params object[] arguments)
public Traverse Method(string name, Type[] paramTypes, object[] arguments = null)

// Get a value, or invoke a method
public object GetValue()
public T GetValue<T>()
public object GetValue(params object[] arguments)
public T GetValue<T>(params object[] arguments)
public override string ToString()

// Set a value
public Traverse SetValue(object value)

// Iterate
public static void IterateFields(object source, Action<Traverse> action)
public static void IterateFields(object source, object target, Action<Traverse, Traverse> action)
public static void IterateProperties(object source, Action<Traverse> action)
public static void IterateProperties(object source, object target, Action<Traverse, Traverse> action)
```

Example:

```csharp
class Foo
{
    struct Bar
    {
        static string secret = "hello";

        public string ModifiedSecret() => secret.ToUpper();
    }

    Bar MyBar
    {
        get
        {
            return new Bar();
        }
    }

    public string GetSecret() => MyBar.ModifiedSecret();

    Foo()
    {
    }

    static Foo MakeFoo() => new();
}

void Test()
{
    var foo = Traverse.Create<Foo>().Method("MakeFoo").GetValue<Foo>();
    Traverse.Create(foo).Property("MyBar").Field("secret").SetValue("world");
    Console.WriteLine(foo.GetSecret()); // outputs WORLD
}
```

`Traverse` has built-in null safety — if any level in the chain fails to find something, it propagates null.

### AccessTools

Helper class that simplifies reflection.

```csharp
public static Type TypeByName(string name)
public static FieldInfo Field(Type type, string name)
public static PropertyInfo Property(Type type, string name)
public static MethodInfo Method(Type type, string name, Type[] parameters = null, Type[] generics = null)
public static ConstructorInfo Constructor(Type type, Type[] parameters = null)
public static Type Inner(Type type, string name)
public static Type FirstInner(Type type, Func<Type, bool> predicate)
```

### TargetMethod

When the target method can't be cleanly specified via attributes (nested classes, name-based filtering, patching multiple methods at once), write these **helper methods** in your patch class. The class must still have `[HarmonyPatch]` for `PatchAll` to discover it.

#### TargetMethod

```csharp
using System;
using System.Reflection;
using HarmonyLib;

[HarmonyPatch]
class MyPatch
{
    // Prepare: called before this class starts patching, and before each target method is about to be patched
    // original == null: no specific method yet
    // original != null: about to patch a method
    // Return false to skip all patches in this class
    static bool Prepare(MethodBase original)
    {
        if (original is null)
            return true;

        return original.Name.Contains("SomeMethod");
    }

    // The return value is the single target to patch. Must not be null.
    public static MethodBase TargetMethod()
    {
        var type = AccessTools.FirstInner(typeof(TheClass), t => t.Name.Contains("Stuff"));
        return AccessTools.FirstMethod(type, method => method.Name.Contains("SomeMethod"));
    }

    // The actual patch logic
    static void Prefix()
    {
        // ...
    }

    // Cleanup: called once after each target is patched, then once more after the entire class finishes (original is null at that point)
    // Can accept Exception ex; returning an Exception replaces it, returning null swallows exceptions during patching
    static Exception Cleanup(MethodBase original, Exception ex)
    {
        if (ex is not null)
            FileLog.Log($"patch failed: {original?.Name} — {ex}");
        return ex;
    }
}
```

#### TargetMethods

Or register multiple targets at once:

```csharp
using System.Collections.Generic;
using System.Reflection;
using HarmonyLib;

[HarmonyPatch]
class MyPatchMany
{
    static bool Prepare(MethodBase original)
    {
        if (original is null)
            return true;
        return original.DeclaringType == typeof(Foo) || original.DeclaringType == typeof(Bar);
    }

    public static IEnumerable<MethodBase> TargetMethods()
    {
        yield return AccessTools.Method(typeof(Foo), nameof(Foo.Method1));
        yield return AccessTools.Method(typeof(Bar), nameof(Bar.Method2));
    }

    static void Prefix(MethodBase __originalMethod)
    {
        FileLog.Log($"patched: {__originalMethod.DeclaringType?.Name}.{__originalMethod.Name}");
    }

    static void Cleanup(MethodBase original, Exception ex)
    {
        if (original is null && ex is null)
            FileLog.Log("MyPatchMany: all targets patched.");
    }
}
```

### HarmonyPriority

When multiple mods patch the same vanilla method, use these annotations to control relative ordering (place on the `Prefix` / `Postfix` method, or on the patch class to apply to all its patches).

For the following vanilla code:

```csharp
public static class Foo
{
    public static string Bar() => "secret";
}
```

#### HarmonyPriority

`[HarmonyPriority(int)]`: higher values execute **earlier** (default `Priority.Normal` = 400).  
When Postfix patches modify `__result`, the last one to run wins. Or use `HarmonyAfter` below.

```csharp
using HarmonyLib;

// Simulating mod A
[HarmonyPatch(typeof(Foo), nameof(Foo.Bar))]
class PatchBarA
{
    [HarmonyPriority(Priority.Low)] // 200 — smaller number → runs later
    static void Postfix(ref string __result) => __result = "from A";
}

// Simulating mod B
[HarmonyPatch(typeof(Foo), nameof(Foo.Bar))]
class PatchBarB
{
    [HarmonyPriority(Priority.High)] // 600 — larger number → runs earlier
    static void Postfix(ref string __result) => __result = "from B";
}

// With only A and B's Postfix patches: B runs first, then A. Final __result is "from A"
```

Common levels: `Priority.First` (800), `High` (600), `Normal` (400), `Low` (200), `Last` (0).

#### HarmonyBefore / HarmonyAfter

Use `[HarmonyBefore(string[])]` / `[HarmonyAfter(string[])]` to order relative to **other Harmony instance IDs** (the string passed to `new Harmony("this string")`), instead of integer priority.

```csharp
using HarmonyLib;

// mod-a's Entry.Init:
// var harmony = new Harmony("mod.a");
// harmony.PatchAll();

[HarmonyPatch(typeof(Foo), nameof(Foo.Bar))]
class PatchBarModA
{
    static void Postfix(ref string __result) => __result = "from mod.a";
}

// mod-b's Entry.Init:
// var harmony = new Harmony("mod.b");
// harmony.PatchAll();

[HarmonyPatch(typeof(Foo), nameof(Foo.Bar))]
class PatchBarModB
{
    // Ensure this Postfix runs after the Postfix from the Harmony instance with id "mod.a"
    // The last Postfix to run determines __result's final value
    [HarmonyAfter("mod.a")]
    static void Postfix(ref string __result) => __result = "from mod.b (last)";
}

// To ensure mod.a always runs before mod.b, you could also put this on mod.a's side:
// [HarmonyBefore("mod.b")]
```

## Reminders

- Don't overuse Transpiler or bool-prefix-skipping. Make your patches robust and avoid conflicts with other mods.

- If using ritsuLib, you can patch through its wrapped patch system. The logic is similar.
