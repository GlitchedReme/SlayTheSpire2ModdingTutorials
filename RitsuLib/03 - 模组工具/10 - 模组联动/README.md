可实现可选依赖、模组联动的功能。

## 另一个mod

假如一个 modid 为 `target-mod` 的 mod 提供了如下公开的 API 和数据类：

```csharp
namespace TargetMod.Api;

public static class PublicApi
{
    public static bool IsReady => true;
    public static int GetBonusLevel(string playerId) => 5;
    public static void GrantBadge(string badgeId) { /* 授权徽章 */ }
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

如果你不想在 `.csproj` 里强依赖（硬引用）这个 mod 的 dll，但又希望在它存在时调用它，可以使用 RitsuLib 的跨 Mod Interop 机制编写强类型代理。

## 你的mod

```csharp
using System;
using STS2RitsuLib.Interop;

namespace JustAnotherTest.Scripts;

// 填入ID和完整类名
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

// 如果你本地起的名字和目标部分里的不一样，
// 或者你需要代理一个实例类（比如把对面的 Entry 包装成这边的 EntryRef），
// 就可以用 [InteropTarget] 手动指定一下它原本的类名或方法名：
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

然后在合适的时机调用即可。把目标不存在的情况当作正常分支进行处理：

*确保在 Mod 初始化阶段已向 RitsuLib 注册当前程序集`ModTypeDiscoveryHub.RegisterModAssembly(Entry.ModId, Assembly.GetExecutingAssembly());`*

```csharp
if (TargetModApiInterop.IsReady)
{
    // 调用基本静态方法
    var level = TargetModApiInterop.GetBonusLevel("test_player");
    if (level >= 3)
    {
        TargetModApiInterop.GrantBadge("test:veteran");
    }

    // 调用包装对象的方法
    var entry = TargetCatalogInterop.Find("some_id");
    // Console.WriteLine(entry.DisplayName);
}
```

---

## AssemblyInterop（调用任意CLR程序集）

比起上面 `[ModInterop]`更推荐用 `[AssemblyInterop]`，用法完全一样，只是填的目标类型名要带程序集名。

```csharp
using STS2RitsuLib.Interop;

// 目标类型名格式：命名空间.类型, 程序集名
[AssemblyInterop("Target.Lib.Api, TargetLib")]
public static class TargetLibInterop
{
    public static bool IsReady => false;

    public static int Compute(string input) => 0;
}

// 同样支持 [InteropTarget] + InteropClassWrapper
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

框架自动区分：类型名里含 `,`（逗号）→ 走 `AssemblyInterop` 路径；不含逗号 → 走 `ModInterop` 路径。所以两种模式可以共存在同一个项目里，互不干扰。