RitsuLib 提供三种方式创建配置页面：**代码流式构建**、**反射属性注册**、**Schema 声明注册**。配置数据的持久化由 `ModDataStore` 承担。

## 方法一：代码流式注册

这是推荐方式，需要先注册 DataStore 再绑定控件。

```csharp
using STS2RitsuLib;
using STS2RitsuLib.Data;
using STS2RitsuLib.Settings;
using STS2RitsuLib.Utils.Persistence;

namespace Test.Scripts;

public sealed class TestSettings
{
    public bool Enabled { get; set; } = true;
    public int Volume { get; set; } = 80;
    public string Layout { get; set; } = "compact";
}

public static class TestSettingsPage
{
    private const string DataKey = "settings";

    // 设置绑定，可调用来查询值和改动
    private static readonly ModSettingsValueBinding<TestSettings, bool> EnabledBinding = new(
        Entry.ModId, DataKey, SaveScope.Profile,
        static s => s.Enabled,
        static (s, v) => s.Enabled = v);

    private static readonly ModSettingsValueBinding<TestSettings, int> VolumeBinding = new(
        Entry.ModId, DataKey, SaveScope.Profile,
        static s => s.Volume,
        static (s, v) => s.Volume = v);

    public static void Register()
    {
        // 注册 DataStore
        ModDataStore.For(Entry.ModId).Register<TestSettings>(
            key: DataKey, // 持久化数据ID，需要和别人防撞
            fileName: "settings.json", // 你的数据文件名
            scope: SaveScope.Profile, // Profile 表示每个存档独立，可改成 Global 表示所有存档共享
            defaultFactory: () => new TestSettings(),
            autoCreateIfMissing: true);

        // 注册页面UI
        RitsuLibFramework.RegisterModSettings(Entry.ModId, page => page
            .WithTitle(ModSettingsText.Literal("Test"))
            .WithModDisplayName(ModSettingsText.Literal("Test Mod"))
            .WithVisibleOnHostSurfaces(
                ModSettingsHostSurface.MainMenu | ModSettingsHostSurface.RunPause)
            .AddSection("general", section => section
                .WithTitle(ModSettingsText.Literal("通用"))
                .AddToggle("enabled", ModSettingsText.Literal("启用"), EnabledBinding)
                .AddIntSlider("volume", ModSettingsText.Literal("音量"), VolumeBinding,
                    minValue: 0, maxValue: 100, step: 5,
                    valueFormatter: static v => $"{v}%")
                .AddButton("reset", ModSettingsText.Literal("音量"),
                    ModSettingsText.Literal("重置"),
                    host =>
                    {
                        VolumeBinding.Write(80);
                        host.MarkDirty(VolumeBinding);
                        host.RequestRefresh();
                    },
                    ModSettingsButtonTone.Accent)
                .AddChoice("layout", ModSettingsText.Literal("布局"),
                    new ModSettingsValueBinding<TestSettings, string>(
                        Entry.ModId, DataKey, SaveScope.Profile,
                        static s => s.Layout,
                        static (s, v) => s.Layout = v),
                    [
                        new("compact", ModSettingsText.Literal("紧凑")),
                        new("comfortable", ModSettingsText.Literal("舒展"))
                    ],
                    presentation: ModSettingsChoicePresentation.Dropdown)));
    }
}
```

初始化时调用：

```csharp
public static void Init()
{
    TestSettingsPage.Register();
}
```

* `ModSettingsValueBinding<TModel, TValue>` — `TModel` 是 DataStore 中注册的数据模型，`TValue` 是字段类型。
* 构造时传入 `modId`、`dataKey`、`scope` 以及 getter/setter lambda。
* 传入 `dataKey` 自动走 DataStore查询和保存。
* 之后可以通过调用 `EnabledBinding.Read()` 和 `EnabledBinding.Write(...)` 来读取和修改值。不要忘了调用 `EnabledBinding.Save()` 保存修改后的值。

```csharp
var value = EnabledBinding.Read();

EnabledBinding.Write(value);
EnabledBinding.Save();
```

### 临时绑定

如果不是持久化保存的设置项，用这个绑定：

```csharp
var preview = new InMemoryModSettingsValueBinding<bool>(
    Entry.ModId, "preview.enabled", initialValue: true);
```

### 投影绑定

如果多个控件编辑同一个大对象，用一个根绑定投影出子字段，方便统一保存和刷新：

```csharp
var root = new ModSettingsValueBinding<TestSettings, TestSettings>(
    Entry.ModId, DataKey, SaveScope.Profile,
    static s => s, static (_, v) => v);

// 投影出来volume的子设置项
var volume = new ProjectedModSettingsValueBinding<TestSettings, int>(
    root, "volume",
    static s => s.Volume,
    static (s, v) => { s.Volume = v; return s; });
```

## 方法二：反射注册

在类上标记 attribute，RitsuLib 自动扫描字段和属性生成设置页。适合简单、字段少的场合。

```csharp
using STS2RitsuLib.Settings;

namespace Test.Scripts;

[ModSettingsPage(Entry.ModId)]
[ModSettingsSection("general", Title = "通用")]
public static class TestReflectedSettings
{
    [ModSettingsToggle("enabled", "general")]
    [ModSettingsBinding(BindingSource = ModSettingsReflectionBindingSource.Global)]
    public static bool Enabled { get; set; } = true;

    [ModSettingsIntSlider("volume", "general", MinValue = 0, MaxValue = 100, Step = 5)]
    [ModSettingsBinding(BindingSource = ModSettingsReflectionBindingSource.Global)]
    public static int Volume { get; set; } = 80;

    [ModSettingsButton("reset", "general", ButtonLabel = "重置音量")]
    public static void ResetVolume() => Volume = 80;
}
```

```csharp
public static void Init()
{
    RitsuLibFramework.RegisterModSettingsReflectionProvider<TestReflectedSettings>();
}
```

* `[ModSettingsBinding].BindingSource` 可选 `Global`（全局 DataStore）、`Profile`（分存档）、`InMemory`（不保存只存于内存）。
* 按钮需要 `static` 方法。

**常用控件 Attribute：**

| Attribute | 控件 | Attribute | 控件 |
| --- | --- | --- | --- |
| `[ModSettingsToggle]` | 开关 | `[ModSettingsColor]` | 颜色 |
| `[ModSettingsSlider]` | 浮点滑条 | `[ModSettingsChoice]` | 选项 |
| `[ModSettingsIntSlider]` | 整数滑条 | `[ModSettingsKeyBinding]` | 快捷键 |
| `[ModSettingsString]` | 单行文本 | `[ModSettingsButton]` | 按钮 |
| `[ModSettingsMultilineString]` | 多行文本 |  |  |

## 方法三：Schema 注册

适合不想强制依赖 `RitsuLib` 管理的跨框架场景。

```csharp
using STS2RitsuLib.Settings;

namespace Test.Scripts;

public static class TestSchemaSettings
{
    // 方式一：返回 JSON 文件路径，框架会自动读取并解析
    public static object CreateRitsuLibSettingsSchema()
    {
        return "res://Test/settings_schema.json";
    }
    
    // 方式二：返回 Dictionary 字典
    // public static object CreateRitsuLibSettingsSchema()
    // {
    //     return new Dictionary<string, object>
    //     {
    //         ["modId"] = Entry.ModId,
    //         ["pages"] = new[] {
    //             new Dictionary<string, object>
    //             {
    //                 ["pageId"] = "main",
    //                 ["title"] = "Test Mod",
    //                 ["sections"] = new[] {
    //                     new Dictionary<string, object>
    //                     {
    //                         ["id"] = "general",
    //                         ["title"] = "通用",
    //                         ["entries"] = new object[] {
    //                             new Dictionary<string, object>
    //                             {
    //                                 ["id"] = "enabled", ["type"] = "toggle",
    //                                 ["key"] = "enabled", ["label"] = "启用",
    //                                 ["defaultValue"] = true, ["scope"] = "global"
    //                             },
    //                             new Dictionary<string, object>
    //                             {
    //                                 ["id"] = "reset", ["type"] = "button",
    //                                 ["key"] = "reset", ["label"] = "重置音量"
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     };
    // }

    // 读取设置项的值，自行根据key返回值
    public static object? GetRitsuLibSettingValue(string key) => key switch
    {
        "enabled" => TestConfig.Enabled,
        _ => null
    };

    // 设置值
    public static void SetRitsuLibSettingValue(string key, object? value)
    {
        if (key == "enabled") TestConfig.Enabled = (bool)value!;
    }

    // 保存设置项
    public static void SaveRitsuLibSettings() => TestConfig.Save();

    // 按钮回调
    public static void InvokeRitsuLibSettingAction(string key)
    {
        if (key == "reset") TestConfig.Volume = 80;
    }
}
```

注册到 RitsuLib：

```xml
<!-- .csproj 中添加 AssemblyMetadata -->
<ItemGroup>
    <!-- 禁用 BaseLib / ModConfig 的镜像设置页，避免重复 -->
    <AssemblyMetadata Include="RitsuLib.ModSettingsMirror.Mod.Test.DisableSources" Value="baselib,modconfig" />
    <AssemblyMetadata Include="RitsuLib.ModSettingsInterop.ProviderType" Value="Test.Scripts.TestSchemaSettings" />
</ItemGroup>
```

### settings_schema.json

在你 `CreateRitsuLibSettingsSchema` 中指定的路径位置创建一个json文件。

```json
{
    "$schema": "https://raw.githubusercontent.com/BAKAOLC/STS2-RitsuLib/main/schemas/mod-settings/runtime-interop/v1/schema.json",
    "modId": "Test",
    "modDisplayName": {
        "locString": {
            "table": "settings_ui",
            "key": "TEST_MOD_DISPLAY_NAME.title",
            "fallback": "Test Mod"
        }
    },
    "pages": [
        {
            "pageId": "main",
            "title": {
                "locString": {
                    "table": "settings_ui",
                    "key": "TEST_SETTINGS_PAGE.title",
                    "fallback": "设置"
                }
            },
            "sections": [
                {
                    "id": "general",
                    "title": {
                        "locString": {
                            "table": "settings_ui",
                            "key": "TEST_SECTION_GENERAL.title",
                            "fallback": "通用"
                        }
                    },
                    "entries": [
                        {
                            "id": "enabled",
                            "type": "toggle",
                            "key": "enabled",
                            "label": {
                                "locString": {
                                    "table": "settings_ui",
                                    "key": "TEST_ENABLE_FEATURE.title",
                                    "fallback": "启用"
                                }
                            },
                            "description": {
                                "i18n": {
                                    "key": "test_settings.enabled.description",
                                    "fallback": "启用心功能。"
                                }
                            },
                            "defaultValue": true,
                            "scope": "profile"
                        },
                        {
                            "id": "volume",
                            "type": "int-slider",
                            "key": "volume",
                            "label": {
                                "langMap": {
                                    "zhs": "音量",
                                    "en": "Volume"
                                },
                                "fallback": "音量"
                            },
                            "min": 0,
                            "max": 100,
                            "step": 5,
                            "defaultValue": 80,
                            "scope": "profile"
                        },
                        {
                            "id": "reset",
                            "type": "button",
                            "key": "reset",
                            "label": "重置音量",
                            "buttonText": "重置",
                            "tone": "accent"
                        },
                        {
                            "id": "info",
                            "type": "info-card",
                            "label": "说明",
                            "body": "修改后即时生效，无需重启。"
                        }
                    ]
                }
            ]
        }
    ]
}
```

### 本地化文件

Schema 文本支持四种写法：纯字符串、`locString`（游戏内置文本表）、`i18n`（多语言）、`langMap`（内联语言映射）。返回字典的写法也可以使用。

如果你用了 `locString`，需要提供对应的本地化文件。`{modId}/localization/zhs/settings_ui.json`：

```json
{
    "TEST_MOD_DISPLAY_NAME.title": "Test Mod",
    "TEST_SETTINGS_PAGE.title": "设置",
    "TEST_SECTION_GENERAL.title": "通用",
    "TEST_ENABLE_FEATURE.title": "启用"
}
```

**Schema entry type：** `toggle`、`slider`、`int-slider`、`choice`、`string`、`multiline-string`、`color`、`key-binding`、`button`、`header`、`paragraph`、`info-card`、`subpage` 等。

## 本地化文本

设置页文本用 `ModSettingsText`，支持四种形式：

```csharp
// 固定字符串，开发期最快
ModSettingsText.Literal("Test Mod");

// 原版 LocString 文本表
ModSettingsText.LocString("static_hover_tips", "TEST_HEAT.title", "热量");

// 支持ritsulib自己的多语言的 i18n
ModSettingsText.I18N(TestUiText.Text, "settings.title", "Test Mod");

// 运行时动态文本
ModSettingsText.Dynamic(() => $"已导出 {TestExportState.Count} 张图片");
```

## 更多功能

此外还有子页面、可见性、复杂数据结构等高级功能，如有需要自行查看 `RitsuLib` 的文档和其游戏中的设置。