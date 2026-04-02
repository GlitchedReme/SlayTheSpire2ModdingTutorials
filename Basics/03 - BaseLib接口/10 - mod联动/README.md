`baselib`添加了一个mod联动的功能，可实现可选依赖的功能。

## 另一个mod

假如一个modid为`test`的mod在`Entry`里这么写：

```csharp
namespace Test.Scripts;

[ModInitializer("Init")]
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

如果你不依赖这个mod的dll，无法直接调用`Register`函数。

## 你的mod

你可以新建这么一个类：

```csharp
using BaseLib.Utils.ModInterop;

namespace JustAnotherTest.Scripts;

// 第一个参数为对方的modid，第二个参数为对方的命名空间及类名
[ModInterop("test", "Test.Scripts.Entry")]
public static class TestInterop
{
    // 获得对方函数的定义。你不需要写任何内容。
    public static void Register(string id) { }

    // 获得对方字段的定义。这里使用InteropTarget，最终查找的是“TestIds”。你不需要写任何内容。
    [InteropTarget("TestIds")]
    public static List<string> Ids { get; set; }
}
```

然后在合适的时机调用即可：`TestInterop.Register("JustAnotherModId");`