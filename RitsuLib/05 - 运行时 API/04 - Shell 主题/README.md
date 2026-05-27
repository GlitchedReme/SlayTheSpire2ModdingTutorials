RitsuLib 的 Shell 主题负责设置页、运行时面板、Toast 等 UI 的颜色、字体、间距和控件默认样式。普通 Mod 不需要替换整套主题；多数情况下只要读取当前主题 token，让自己的自定义控件跟随玩家选择即可。

## 读取当前主题

`RitsuShellTheme.Current` 是当前主题的快照。优先使用类型化 token，只有访问自定义路径时再用点分路径。

```csharp
using Godot;
using STS2RitsuLib.Ui.Shell.Theme;

public static class TestThemeTokens
{
    public static Color PanelBackground => RitsuShellTheme.Current.Surface.Content;

    public static Color PrimaryText => RitsuShellTheme.Current.Text.LabelPrimary;

    public static Color WarningAccent()
    {
        var theme = RitsuShellTheme.Current;
        return theme.TryGetColor("components.toast.levels.warning.accent", out var color)
            ? color
            : theme.Color.Divider;
    }
}
```

`GetColor(...)` 在缺 token 时会返回洋红色，适合开发期暴露错误；正式 UI 推荐用 `TryGetColor(...)`、`TryGetNumber(...)` 自己准备回退。

## 自定义控件跟随主题

Godot 控件不会自动知道你的业务节点应该怎样用 token。自定义设置页、运行时覆盖层或工具面板里，订阅 `RitsuShellThemeRuntime.ThemeChanged`，在主题变化后重新套样式。

```csharp
using Godot;
using STS2RitsuLib.Ui.Shell;
using STS2RitsuLib.Ui.Shell.Theme;

namespace Test.Scripts.UI;

public sealed partial class TestExportPanel : PanelContainer
{
    private Label? _title;

    public override void _Ready()
    {
        _title = GetNodeOrNull<Label>("Margin/VBox/Title");
        ApplyShellTheme();
        RitsuShellThemeRuntime.ThemeChanged += ApplyShellTheme;
    }

    public override void _ExitTree()
    {
        RitsuShellThemeRuntime.ThemeChanged -= ApplyShellTheme;
    }

    private void ApplyShellTheme()
    {
        var theme = RitsuShellTheme.Current;
        AddThemeStyleboxOverride(
            "panel",
            RitsuShellPanelStyles.CreateFramedSurface(
                theme.Surface.Content,
                theme.Metric.Radius.Overlay));

        if (_title != null)
        {
            _title.AddThemeColorOverride("font_color", theme.Text.LabelPrimary);
            _title.AddThemeFontOverride("font", theme.Font.BodyBold);
            _title.AddThemeFontSizeOverride("font_size", theme.Metric.FontSize.OverlayTitle);
        }
    }
}
```

订阅事件的节点一定要在 `_ExitTree()` 解绑。否则面板销毁后，下一次切换主题仍可能回调到无效节点。

## 注册 Mod 自己的 token

当你的多个自定义控件需要共享同一批 token，可以给主题系统注册默认 token。默认值会先进入主题快照，玩家或主题文件仍然可以覆盖它们。

```csharp
using System.Text.Json;
using STS2RitsuLib.Ui.Shell.Theme;

namespace Test.Scripts.UI;

public static class TestShellTheme
{
    private static readonly JsonDocument Defaults = JsonDocument.Parse("""
    {
      "extensions": {
        "test": {
          "exportAccent": { "$value": "#8AD8FF", "$type": "color" }
        }
      },
      "components": {
        "testExportPanel": {
          "bg": { "$value": "{semantic.color.surface.content}", "$type": "color" },
          "border": { "$value": "{semantic.color.palette.divider}", "$type": "color" }
        }
      }
    }
    """);

    public static void Register()
    {
        RitsuShellThemeRuntime.RegisterModTokens(
            Entry.ModId,
            Defaults.RootElement,
            _ => TestOverlay.RefreshAllThemes());
    }

    public static void Unregister()
    {
        RitsuShellThemeRuntime.UnregisterModTokens(Entry.ModId);
    }
}
```

`JsonElement` 引用的是 `JsonDocument` 内存，所以示例把 `JsonDocument` 保存在静态字段里。不要在 `using var doc = JsonDocument.Parse(...)` 之后把 `doc.RootElement` 注册进去。

读取扩展 blob 时，用 Mod ID 取回自己的 `extensions.<modId>`：

```csharp
var theme = RitsuShellTheme.Current;
if (theme.TryGetExtension(Entry.ModId, out var extension) &&
    extension.TryGetProperty("exportAccent", out var accent))
{
    Entry.Logger.Info($"主题扩展 token: {accent}");
}
```

## 切换与重载主题

主题文件位于 RitsuLib 的全局 Shell 主题目录。开发调试时可以打开目录、修改 JSON 后强制重载目录缓存。

```csharp
using STS2RitsuLib.Ui.Shell;
using STS2RitsuLib.Ui.Shell.Theme;

if (RitsuShellThemePaths.TryEnsureShellThemesDirectory(out var themeDir))
{
    Entry.Logger.Info($"Shell theme directory: {themeDir}");
}

RitsuShellThemeRuntime.ApplyThemeId("default");
RitsuShellThemeRuntime.ReapplyActiveTheme(forceReloadCatalog: true);
```

正式 Mod 通常不要替玩家自动切换全局主题。更常见的做法是提供“打开主题目录”“重新加载主题”这样的调试按钮。

## Toast 反馈

短提示用 `RitsuToastService`。它会自动挂到游戏节点，颜色和动效跟随 Shell 主题。

```csharp
using Godot;
using STS2RitsuLib.Ui.Toast;

RitsuToastService.ShowInfo("设置已保存。", "Test");
RitsuToastService.ShowWarning("可选资源缺失。", "Test");
RitsuToastService.ShowError("初始化失败。", "Test");

var icon = ResourceLoader.Load<Texture2D>("res://Test/images/ui/export.png");
RitsuToastService.Show(new RitsuToastRequest(
    body: "PNG 导出完成。",
    title: "Test",
    image: icon,
    level: RitsuToastLevel.Info,
    durationSeconds: 5,
    onClick: OpenExportFolder,
    animationOverride: RitsuToastAnimationPreset.FadeScale));
```

需要一直显示到玩家点击时，设置 `IsPersistent = true`：

```csharp
RitsuToastService.Show(new RitsuToastRequest(
    body: "调试会话正在记录网络包。",
    title: "Test",
    level: RitsuToastLevel.Warning)
{
    IsPersistent = true,
});
```

## 验证

* 切换主题后，自定义 Panel、Label、按钮颜色能立即刷新。
* 主题 JSON 缺少自定义 token 时，正式 UI 有自己的回退色，不出现洋红色块。
* 关闭再打开设置页，事件订阅没有重复触发。
* Toast 能在主菜单和跑局中显示，点击回调只执行一次。
* 开发期修改主题 JSON 后，调用 `ReapplyActiveTheme(true)` 能看到新值。
