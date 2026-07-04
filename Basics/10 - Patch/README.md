## 简介

https://harmony.pardeike.net/articles/intro.html

`Harmony`提供一种用于在运行时为 .NET 程序进行补丁、替换和装饰的方法。简单来说，可以把原版游戏代码的逻辑修改成你想要的。

## 基础

### 简单示例

以下为官方示例。例如如果原版有这么一个类：

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

在你的初始化函数里调用运行patch函数：

```csharp
using HarmonyLib; // 写在类最上方的using里

var harmony = new Harmony("com.example.patch"); // patch的ID，和别人写的不一致防撞车
harmony.PatchAll();
```

那么`Harmony`就会寻找你这个程序集里的所有patch并尝试加载。

假如你写了这么一个patch：

```csharp
// 对SomeGameClass的DoSomething函数进行修改。如果方法不可见，写字符串。
[HarmonyPatch(typeof(SomeGameClass), nameof(SomeGameClass.DoSomething))]
public class Patch01
{
    // 对该函数的开头进行修改。
    // 返回类型可以写 bool 或者 void。bool 且返回 false 时，将跳过原方法体（Postfix 仍会执行）。
    // __instance表示该方式当前的所有者，即为this。静态方法不需要此参数。
    // ___counter表示获取该类的变量（私有也可）"counter"（所有该类的字段可用三个下划线获得）。
    public static bool Prefix(SomeGameClass __instance, ref int ___counter)
    {
        if (___counter > 100)
            return false;
        ___counter = 0;
        return true;
    }

    // 对该函数的最后（如果有返回值，是每一个return的地方）进行修改。
    // __result表示返回值
    static void Postfix(ref int __result) => __result *= 2;
}
```

那么运行时就相当于把原方法改成了类似下面这样（实际逻辑并非如此，仅供演示）：

```csharp
public int DoSomething()
{
    int __result = default;

    // Harmony 插入：调用 Prefix；返回 false 则跳过原方法体
    if (!Patch01.Prefix(this, ref counter))
    {
        return Patch01.Postfix(ref __result);
    }

    // 原方法
    if (isRunning)
    {
        counter++;
    }
    __result = counter * 10;

    // Harmony 插入：每一次 return 前都会调用 Postfix
    return Patch01.Postfix(ref __result);
}
```

### 实现 Patch

注册一个patch有显式和特性自动注册两种方式。一般使用自动注册。

在一个类或方法上声明一个`[HarmonyPatch]`特性即可注册。

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

或者

```csharp
[HarmonyPatch] // 如果你是嵌套实现patch，确保从最外层的类开始，每一层都要有[HarmonyPatch]特性
class MyPatches
{
    [HarmonyPatch(typeof(SomeTypeHere), "SomeMethodName")]
    static void Postfix(/*...*/)
    {
        //...
    }
}
```

### 特性参数

`[HarmonyPatch]`特性可以传入以下参数：

- `declaringType`：即为patch目标类。
- `methodName`：目标方法的名字。推荐使用`nameof`，如果目标方法可访问的话。
- `methodType`：目标方法类型。一些类型的方法会在编译后更改名字（构造函数，getter，setter，async等）或者本身没有名字（操作符重载）。如果是这些需要添加方法类型。
- `argumentTypes`：目标方法的参数类型列表。如果目标方法有同名重载，需要指定参数类型列表确定实际修改的方法。
- `argumentVariations`：与`argumentTypes`对应的参数传递方式数组（`ArgumentType`：`Normal`、`Ref`、`Out`、`Pointer`）。

详解见下：

#### methodType

如果目标函数不是普通方法名，需用 `MethodType` 指明要 patch 哪一种。

原版：

```csharp
public class Wallet
{
    public int Gold { get; set; } // 属性，编译时方法名为 get_Gold / set_Gold

    public Wallet(int gold) => Gold = gold; // 构造函数，编译时方法名为 .ctor

    public async Task<int> FetchGoldAsync()
    {
        await Task.Delay(1); // async 方法体编译进状态机的 MoveNext，不是表面的 async方法。可通过 ILSpy 打开 IL 模式查看。
        return Gold;
    }
}
```

Patch（分别 patch 属性的 getter、构造函数，以及 async 方法）：

TODO: enumrator, generic

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

// MethodType.Async：patch 的是 <FetchGoldAsync>d__X.MoveNext
// 如果不加 Async，只 patch 表层方法
[HarmonyPatch(typeof(Wallet), nameof(Wallet.FetchGoldAsync), MethodType.Async)]
class PatchFetchGoldAsync
{
    // __instance 类型是编译器生成的状态机，不是 Wallet
    static void Prefix(object __instance)
    {
        var wallet = Traverse.Create(__instance).Field("<>4__this").GetValue<Wallet>();
        wallet.Gold += 10;
    }
}
```

#### Patch Async 方法

打开`ILSpy`，找一个`async`方法，例如打击的`OnPlay`。

```csharp
protected override async Task OnPlay(PlayerChoiceContext choiceContext, CardPlay cardPlay)
{
    ArgumentNullException.ThrowIfNull(cardPlay.Target, "cardPlay.Target");
    await DamageCmd.Attack(base.DynamicVars.Damage.BaseValue).FromCard(this, cardPlay).Targeting(cardPlay.Target)
        .WithHitFx("vfx/vfx_attack_slash")
        .Execute(choiceContext);
}
```

点击上方`C# 12.0 / VS 2022.8`那一个下拉框，选择`C# 4.0`或者之前的版本（需要在5.0之前），你会发现代码变成以下样子了：

```csharp
    // 在该类的最上方编译出来的状态机
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

    // 编译后的实际OnPlay函数效果
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

- 此时如果不加`MethodType.Async`，那么进入的是`OnPlay`函数，无法进入编译以前的逻辑。

- 如果加上`MethodType.Async`，那么进入的是`<OnPlay>d__5.MoveNext`函数。此时传入`object __instance`的类型为`<OnPlay>d__5`。可以通过反射拿到其字段，例如`<>4__this`。


#### argumentVariations

带 `ref` / `out` 的重载不能只在 `argumentTypes` 里写 `typeof(T)`，还要用 `ArgumentType` 标出传递方式。

原版：

```csharp
public class ScoreBoard
{
    public void Add(ref int delta) => delta += 10;
}
```

Patch：

```csharp
using HarmonyLib;

[HarmonyPatch(typeof(ScoreBoard), nameof(ScoreBoard.Add), [typeof(int)], [ArgumentType.Ref])]
class PatchAdd
{
    static void Prefix(ref int delta) => delta *= 2;
}
```

你可以自由组合传入参数，参考：

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

### Patch 方法参数

Patch 方法只需声明你要用到的参数，Harmony 会按**参数名**注入（Transpiler 除外，按类型匹配）。

对于如下的示例代码来说：

```csharp
public class PlayerStats
{
    public int shield;
    private int _critRate;

    public int Attack(int power) => power + shield;

    public void TakeHit(ref int damage) => damage = Math.Max(0, damage - shield);

    public static void Log(string tag, int value) { /* 原版日志 */ }

    public ref int GetShieldRef() => ref shield;

    public void Risky() => throw new InvalidOperationException("boom");
}
```

#### __instance

原方法非静态时的 `this`；patch 静态方法时不要写此参数。

```csharp
using HarmonyLib;

[HarmonyPatch(typeof(PlayerStats), nameof(PlayerStats.Attack))]
class PatchAttackInstance
{
    static void Prefix(PlayerStats __instance) => __instance.shield = Math.Max(0, __instance.shield);
}
```

#### 与原方法同名参数

类型、`ref` / `out` 须与原方法一致。

```csharp
[HarmonyPatch(typeof(PlayerStats), nameof(PlayerStats.TakeHit))]
class PatchTakeHitArg
{
    static void Prefix(ref int damage) => damage = Math.Max(0, damage);
}
```

#### __0、__1…

按**位置**对应第 0、1… 个参数，原名不方便写或想统一处理多个方法时可用。

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

访问或改写返回值；要修改须写 `ref`。Prefix 里原方法尚未执行，值为 `default`。

```csharp
[HarmonyPatch(typeof(PlayerStats), nameof(PlayerStats.Attack))]
class PatchAttackResult
{
    static void Postfix(ref int __result) => __result *= 2;
}
```

#### __resultRef

原方法返回类型为 `ref T` 时使用，用于改引用本身而非只改数值。

```csharp
[HarmonyPatch(typeof(PlayerStats), nameof(PlayerStats.GetShieldRef))]
class PatchShieldRef
{
    static void Postfix(ref RefResult<int> __resultRef) { /* 按 Harmony 文档操作 __resultRef */ }
}
```

#### ___字段名

三个下划线 + 字段名，可读写**私有字段**；要写入须 `ref`。

```csharp
[HarmonyPatch(typeof(PlayerStats), nameof(PlayerStats.Attack))]
class PatchAttackField
{
    static void Prefix(ref int ___critRate) => ___critRate = 100;
}
```

#### __args

一次拿到全部实参的 `object[]`；改元素会回写到原参数，略有开销。

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

在 **同一补丁类** 的Prefix里写入（常用 `out`），Postfix里只读，用于两次补丁间传数据。

```csharp
[HarmonyPatch(typeof(PlayerStats), nameof(PlayerStats.Attack))]
class PatchAttackState
{
    static void Prefix(out int __state, int power) => __state = power;

    static void Postfix(int __state, ref int __result) => __result += __state;
}
```

#### __originalMethod

注入当前所挂原方法的 `MethodBase`；**不能**用来调用原方法。

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

Prefix：原方法**是否将会**执行；

Postfix：原方法**是否已经**执行（被 Prefix 跳过时为 `false`）。

只读。

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
            __result = -1; // 原方法被跳过
    }
}
```

#### __exception（Finalizer）

Finalizer 用 `Exception __exception` 观察异常；方法返回类型为 `Exception` 时，返回 `null` 可吞掉异常，返回新异常可替换。

```csharp
[HarmonyPatch(typeof(PlayerStats), nameof(PlayerStats.Risky))]
class PatchRiskyFinalizer
{
    static Exception Finalizer(Exception __exception)
    {
        if (__exception is InvalidOperationException)
            return null; // 吞掉该异常
        return __exception;
    }
}
```

#### Transpiler 参数

Transpiler **按类型匹配**，不按参数名。第一个参数必须是 `IEnumerable<CodeInstruction>`，返回修改后的指令序列；可选 `MethodBase`、`ILGenerator`。

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
            yield return ins; // 原样传递，修改请看文档
    }
}
```

## Patch 方式

对于以下的示例代码来说：

```csharp
public class CombatMath
{
    public int bonus;

    public int DealDamage(int baseDamage) => baseDamage + bonus;

    public void Heal(int amount) => bonus += amount;
}
```

### Prefix

可以实现以下功能：

#### 修改原方法开头

原方法执行前改实例状态等。

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

#### 访问、修改方法参数

```csharp
[HarmonyPatch(typeof(CombatMath), nameof(CombatMath.DealDamage))]
class PatchDealPrefix
{
    static void Prefix(ref int baseDamage) => baseDamage = Math.Max(0, baseDamage);
}
```

#### 跳过原方法、改变返回值

如果返回类型是bool，`return false` 时不执行原方法体，`Postfix` 仍会执行。

此方式受patch载入顺序影响。例如mod A比B先加载并跳过，A的会执行B的则不会。

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

#### 传递状态给 Postfix

`__state` 须与 Postfix 写在同一补丁类。

```csharp
[HarmonyPatch(typeof(CombatMath), nameof(CombatMath.DealDamage))]
class PatchDealPrefix
{
    static void Prefix(out int __state, ref int baseDamage)
    {
        __state = baseDamage; // Postfix 里可读
        baseDamage *= 2;
    }

    static void Postfix(int __state, ref int __result) => __result += __state;
}
```

### Postfix

可以实现以下功能：

#### 修改 void 类型方法结尾

在原方法全部执行完后插入逻辑。

```csharp
using HarmonyLib;

[HarmonyPatch(typeof(CombatMath), nameof(CombatMath.Heal))]
class PatchHealPostfix
{
    static void Postfix(CombatMath __instance) =>
        __instance.bonus = Math.Min(__instance.bonus, 99);
}
```

#### 访问、修改返回值

对于原方法中每一个return执行对应逻辑。

```csharp
[HarmonyPatch(typeof(CombatMath), nameof(CombatMath.DealDamage))]
class PatchDealPostfix
{
    static void Postfix(ref int __result) => __result *= 2;
}
```

此外还可以与 Prefix 的 __state 配合。

### Transpiler

直接在 IL 层调用修改。更为灵活，适合执行复杂修改。

在prefix和postfix能达到你想要的效果的时候，不建议过多使用transpiler。

```csharp
using System.Collections.Generic;
using System.Reflection.Emit;
using HarmonyLib;

[HarmonyPatch(typeof(CombatMath), nameof(CombatMath.DealDamage))]
class PatchDealTranspiler
{
    static IEnumerable<CodeInstruction> Transpiler(IEnumerable<CodeInstruction> instructions)
    {
        // 遍历所有指令
        foreach (var ins in instructions)
        {
            // 找到return指令
            if (ins.opcode == OpCodes.Ret)
            {
                yield return new CodeInstruction(OpCodes.Ldc_I4_2); // 压入常数 2
                yield return new CodeInstruction(OpCodes.Mul);        // 栈顶 × 2
            }
            yield return ins; // 原指令按顺序写回
        }
    }
}
```

以上效果等同于`static void Postfix(ref int __result) => __result *= 2;`。

更复杂的请查阅`Harmony`文档。复杂定位使用 `CodeMatcher`。

### Finalizer

可观察、替换或吞掉异常。

原方法：

```csharp
public void Risky()
{
    if (bonus < 0)
        throw new InvalidOperationException("bonus is negative");
}
```

以下的patch效果：捕获后吞掉 `InvalidOperationException`让其不再报错，其它异常原样抛出。

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

把一个原版代码的逻辑拷贝到你指定的方法中。

例如有这样的原版代码：

```csharp
private int SecretScale(int value) => value * 3;
```

进行如下patch：

```csharp
using System;
using HarmonyLib;

[HarmonyPatch]
public static class CombatMathBridge
{
    [HarmonyReversePatch]
    [HarmonyPatch(typeof(CombatMath), "SecretScale")]
    // 函数签名必须按原样复制（例如非静态要加__instance，以及所有参数）
    public static int SecretScale(CombatMath __instance, int value) =>
        throw new NotImplementedException(); // 修改这里的逻辑没有意义，保持这样即可
}
```

然后调用`CombatMathBridge.SecretScale(combat, 10)`相当于调用原方法。

## 其他 Patch 工具

https://harmony.pardeike.net/articles/utilities.html

### Harmony

你创建的`Harmony`对象除了`PatchAll`还可以手动patch以及取消patch等。

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

一个方便反射访问、调用的类，同时有缓存功能更高效。可用于快速反射私有字段或方法。

```csharp
// 首先访问一个类
public static Traverse Create(Type type)
public static Traverse Create<T>()
public static Traverse CreateWithType(string name)

// 获取其类型、字段、属性、方法等
public Traverse Type(string name)
public Traverse Field(string name)
public Traverse Property(string name, object[] index = null)
public Traverse Method(string name, params object[] arguments)
public Traverse Method(string name, Type[] paramTypes, object[] arguments = null)

// 获取其值，或者调用方法
public object GetValue()
public T GetValue<T>()
public object GetValue(params object[] arguments)
public T GetValue<T>(params object[] arguments)
public override string ToString()

// 设置其值
public Traverse SetValue(object value)

// 遍历
public static void IterateFields(object source, Action<Traverse> action)
public static void IterateFields(object source, object target, Action<Traverse, Traverse> action)
public static void IterateProperties(object source, Action<Traverse> action)
public static void IterateProperties(object source, object target, Action<Traverse, Traverse> action)
```

例子：

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

`Traverse`内置了空保护，即使中间有一层没找到也会传播空。

### AccessTools

用于简化反射的辅助类。

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

当目标方法不好用特性写死（嵌套类、需要按名字筛选、一次打多个方法）时，在补丁类里写这些**辅助方法**。类上仍要有 `[HarmonyPatch]`，`PatchAll` 才会扫描到。

#### TargetMethod

```csharp
using System;
using System.Reflection;
using HarmonyLib;

[HarmonyPatch]
class MyPatch
{
    // Prepare：在本类开始 patch 之前、以及每个目标方法即将被 patch 之前调用
    // original == null：尚未指定具体方法
    // original != null：即将 patch 某个方法
    // 返回 false 可跳过本补丁类的全部 patch
    static bool Prepare(MethodBase original)
    {
        if (original is null)
            return true;

        return original.Name.Contains("SomeMethod");
    }

    // 返回值即要 patch 的唯一目标，不能为 null
    public static MethodBase TargetMethod()
    {
        var type = AccessTools.FirstInner(typeof(TheClass), t => t.Name.Contains("Stuff"));
        return AccessTools.FirstMethod(type, method => method.Name.Contains("SomeMethod"));
    }

    // 具体 patch 逻辑
    static void Prefix()
    {
        // ...
    }

    // Cleanup：每个目标 patch 完成后各调用一次，整类 patch 结束后再调用一次（此时 original 为 null）
    // 可注入 Exception ex；返回 Exception 可替换异常，返回 null 可吞掉 patch 过程中的异常
    static Exception Cleanup(MethodBase original, Exception ex)
    {
        if (ex is not null)
            FileLog.Log($"patch failed: {original?.Name} — {ex}");
        return ex;
    }
}
```

#### TargetMethods

或者一次注册多个目标：

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

多个 mod patch 同一原版方法时，可用下面注解控制相对顺序（写在 `Prefix` / `Postfix` 方法上，或写在补丁类上作用于该类全部补丁）。

对于如下的原版代码：

```csharp
public static class Foo
{
    public static string Bar() => "secret";
}
```

#### HarmonyPriority

`[HarmonyPriority(int)]`：数值越大，**越先**执行（默认 `Priority.Normal` = 400）。  
对 **Postfix 改 `__result`** 时，后执行的会覆盖先执行的，或配合下面的 `HarmonyAfter`。

```csharp
using HarmonyLib;

// 模拟 mod A
[HarmonyPatch(typeof(Foo), nameof(Foo.Bar))]
class PatchBarA
{
    [HarmonyPriority(Priority.Low)] // 200，数值小 → 更晚执行
    static void Postfix(ref string __result) => __result = "from A";
}

// 模拟 mod B
[HarmonyPatch(typeof(Foo), nameof(Foo.Bar))]
class PatchBarB
{
    [HarmonyPriority(Priority.High)] // 600，数值大 → 更早执行
    static void Postfix(ref string __result) => __result = "from B";
}

// 仅 A、B 两个 Postfix 时：先 B 后 A，最终 __result 为 "from A"
```

常用档位：`Priority.First` (800)、`High` (600)、`Normal` (400)、`Low` (200)、`Last` (0)。

#### HarmonyBefore / HarmonyAfter

使用`[HarmonyBefore(string[])]` / `[HarmonyAfter(string[])]`相对**其它 Harmony 实例的 id** 排序（即 `new Harmony("这个字符串")` 里的 id），而不是 int 优先级。

```csharp
using HarmonyLib;

// mod-a 的 Entry.Init：
// var harmony = new Harmony("mod.a");
// harmony.PatchAll();

[HarmonyPatch(typeof(Foo), nameof(Foo.Bar))]
class PatchBarModA
{
    static void Postfix(ref string __result) => __result = "from mod.a";
}

// mod-b 的 Entry.Init：
// var harmony = new Harmony("mod.b");
// harmony.PatchAll();

[HarmonyPatch(typeof(Foo), nameof(Foo.Bar))]
class PatchBarModB
{
    // 保证本 Postfix 在 id 为 "mod.a" 的 Harmony 实例所挂的 Postfix 之后执行
    // 最晚执行的 Postfix 决定 __result 最终取值
    [HarmonyAfter("mod.a")]
    static void Postfix(ref string __result) => __result = "from mod.b (last)";
}

// 若希望 mod.a 一定先于 mod.b，也可在 mod.a 侧写：
// [HarmonyBefore("mod.b")]
```

## 一些提醒

- 不要滥用 Transpiler 和bool prefix跳过代码。请保证你的patch的健壮性，不要和其他mod冲突。

- 如果使用ritsulib，可通过其patch封装系统进行补丁，具体逻辑类似。