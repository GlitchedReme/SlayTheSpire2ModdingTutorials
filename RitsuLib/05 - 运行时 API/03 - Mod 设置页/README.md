RitsuLib 的 Mod 设置页用于把配置、调试开关和工具动作放进游戏内设置 UI。它只负责 UI 和绑定；配置数据本身仍然建议放在 `ModDataStore` 或你已经建立好的持久化模型里。

## 注册设置页

设置页在初始化阶段注册。下面示例把一个布尔开关、一个整数滑条和一个按钮放到同一页。

```csharp
using STS2RitsuLib;
using STS2RitsuLib.Settings;
using STS2RitsuLib.Utils.Persistence;

namespace Test.Scripts;

public sealed class TestSettings
{
    public bool Enabled { get; set; } = true;

    public int Volume { get; set; } = 80;

    public string ThemeColor { get; set; } = "#d98b3a";
}

public static class TestSettingsPage
{
    private const string DataKey = "settings";

    public static void Register()
    {
        var enabled = new ModSettingsValueBinding<TestSettings, bool>(
            Entry.ModId,
            DataKey,
            SaveScope.Global,
            static settings => settings.Enabled,
            static (settings, value) => settings.Enabled = value);

        var volume = new ModSettingsValueBinding<TestSettings, int>(
            Entry.ModId,
            DataKey,
            SaveScope.Global,
            static settings => settings.Volume,
            static (settings, value) => settings.Volume = value);

        RitsuLibFramework.RegisterModSettings(Entry.ModId, page => page
            .WithTitle(ModSettingsText.Literal("Test"))
            .WithModDisplayName(ModSettingsText.Literal("Test Mod"))
            .WithVisibleOnHostSurfaces(
                ModSettingsHostSurface.MainMenu | ModSettingsHostSurface.RunPause)
            .AddSection("general", section => section
                .WithTitle(ModSettingsText.Literal("通用"))
                .AddToggle(
                    "enabled",
                    ModSettingsText.Literal("启用"),
                    enabled)
                .AddIntSlider(
                    "volume",
                    ModSettingsText.Literal("音量"),
                    volume,
                    minValue: 0,
                    maxValue: 100,
                    step: 5,
                    valueFormatter: static value => $"{value}%")
                .AddButton(
                    "reset_volume",
                    ModSettingsText.Literal("音量"),
                    ModSettingsText.Literal("重置"),
                    host =>
                    {
                        volume.Write(80);
                        host.MarkDirty(volume);
                        host.RequestRefresh();
                    },
                    ModSettingsButtonTone.Accent)));
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

`ModSettingsValueBinding<TModel,TValue>` 会通过 `RitsuLibFramework.GetDataStore(modId)` 读写 `dataKey` 对应的模型。用户改值后，设置 UI 会在合适的时机调用 binding 的 `Save()`。

## 文本来源

设置页文本使用 `ModSettingsText`，它可以是固定字符串、`I18N`、原版 `LocString` 或运行时动态文本。

```csharp
var title = ModSettingsText.I18N(
    TestUiText.Text,
    "settings.title",
    "Test Mod");

var count = ModSettingsText.Dynamic(
    () => $"已导出 {TestExportState.Count} 张图片");

var keyword = ModSettingsText.LocString(
    "static_hover_tips",
    "TEST_HEAT.title",
    "热量");
```

推荐给正式设置页使用 `I18N`，这样设置 UI 可以跟随语言切换；开发期调试页用 `Literal` 更快。

## 常用控件

| 控件 | Builder 方法 | 绑定类型 |
| - | - | - |
| 开关 | `AddToggle` | `bool` |
| 整数滑条 | `AddIntSlider` | `int` |
| 浮点滑条 | `AddSlider` | `double` |
| 选项 | `AddChoice` | 自定义值类型 |
| 枚举选项 | `AddEnumChoice` | enum |
| 颜色 | `AddColor` | `string`，建议保存十六进制颜色 |
| 单行文本 | `AddString` | `string` |
| 多行文本 | `AddMultilineString` | `string` |
| 快捷键 | `AddKeyBinding` | `string` 或 `List<string>` |
| 按钮 | `AddButton` | 无持久化值 |
| 可编辑列表 | `AddList` | `List<T>` |
| 只读内容 | `AddHeader`、`AddParagraph`、`AddInfoCard`、`AddImage` | 无 |
| 跳转子页 | `AddSubpage` | 目标 page id |
| 自定义 Godot 控件 | `AddCustom` | 自己处理 |

选项示例：

```csharp
section.AddChoice(
    "layout",
    ModSettingsText.Literal("布局"),
    new ModSettingsValueBinding<TestSettings, string>(
        Entry.ModId,
        DataKey,
        SaveScope.Global,
        static settings => settings.Layout,
        static (settings, value) => settings.Layout = value),
    [
        new("compact", ModSettingsText.Literal("紧凑")),
        new("comfortable", ModSettingsText.Literal("舒展")),
    ],
    presentation: ModSettingsChoicePresentation.Dropdown);
```

每个 entry id 都是 UI 和剪贴板数据的一部分。发布后尽量不要重命名 `enabled`、`volume` 这类 id。

## 临时绑定和投影绑定

临时预览、不想落盘的值可以用内存绑定：

```csharp
var preview = new InMemoryModSettingsValueBinding<bool>(
    Entry.ModId,
    "preview.enabled",
    initialValue: true);
```

如果一个设置页编辑一个大对象的一部分，用 `ProjectedModSettingsValueBinding` 包一层：

```csharp
var root = new ModSettingsValueBinding<TestSettings, TestSettings>(
    Entry.ModId,
    DataKey,
    SaveScope.Global,
    static settings => settings,
    static (_, value) => value);

var volume = new ProjectedModSettingsValueBinding<TestSettings, int>(
    root,
    "volume",
    static settings => settings.Volume,
    static (settings, value) =>
    {
        settings.Volume = value;
        return settings;
    });
```

这样列表、结构化剪贴板和批量刷新更容易围绕同一个根模型组织。

## 子页面

复杂 Mod 可以拆成多个页面。根页面默认 `pageId` 是 `modId`；子页面用 `pageId` 参数注册，并调用 `AsChildOf(...)`。

```csharp
RitsuLibFramework.RegisterModSettings(Entry.ModId, page => page
    .WithTitle(ModSettingsText.Literal("高级"))
    .AsChildOf(Entry.ModId)
    .AddSection("debug", section => section
        .WithTitle(ModSettingsText.Literal("调试"))
        .AddParagraph(
            "hint",
            ModSettingsText.Literal("这些选项只建议开发期使用。"))),
    pageId: "advanced");
```

根页面里可以加一个跳转按钮：

```csharp
section.AddSubpage(
    "advanced_page",
    ModSettingsText.Literal("高级设置"),
    targetPageId: "advanced",
    buttonText: ModSettingsText.Literal(">"));
```

## 可见性和宿主界面

设置页可能从主菜单、跑局暂停或战斗暂停打开。用 host surface 控制页面或 section 在哪里可见、哪里只读：

```csharp
page
    .WithVisibleOnHostSurfaces(
        ModSettingsHostSurface.MainMenu | ModSettingsHostSurface.RunPause)
    .WithReadOnlyOnHostSurfaces(ModSettingsHostSurface.CombatPause);
```

运行时条件用 `WithVisibleWhen` 和 `WithEnabledWhen`：

```csharp
page.WithEnabledWhen(() => !TestExportState.IsExporting);
```

按钮手动修改 binding 后，如果 UI 需要马上重算文本或列表，调用 `host.RequestRefresh()`；如果你直接写了 binding，记得 `host.MarkDirty(binding)`，否则可能不会触发保存。

## 验证

* 主菜单设置中能看到你的 Mod 名称和页面标题。
* 修改开关、滑条后，关闭再打开设置仍能看到新值。
* 重启游戏或切换档案后，`SaveScope.Global` / `SaveScope.Profile` 的行为符合预期。
* 在战斗暂停、跑局暂停、主菜单三个入口检查可见性和只读规则。
* 子页面能从根页面进入，侧边栏排序稳定。
