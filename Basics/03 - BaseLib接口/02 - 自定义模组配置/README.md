* 要使用此功能，需要先放一张图片到`{modId}\mod_image.png`作为mod图标，尺寸任意，否则会由于报错不显示配置。
* 添加一个继承`SimpleModConfig`（或者是`ModConfig`如果你想要更复杂的设置）的类，在其中添加`public static bool`变量。支持`bool`，`double`，`enum`，`int`，`string`。
* 在初始化函数调用`ModConfigRegistry.Register`。字符串写你的`modId`。

```csharp
[ModInitializer("Init")]
public class Entry
{
    public static void Init()
    {
        ModConfigRegistry.Register("test", new ModConfig());
    }
}

public class ModConfig : SimpleModConfig
{
    public static bool Test1 { get; set; } = true;
    public static bool Test2 { get; set; } = false;
    public static bool Test3 { get; set; } = true;
}
```

![示例配置](../../../images/image12.png)

更多请参考`baselib`的`BaseLibConfig`类。