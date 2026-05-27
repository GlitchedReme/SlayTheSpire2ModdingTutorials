`RitsuLib`提供了一套运行时热键注册系统，支持多绑定、重绑定、修饰键，且支持在输入框或开发者控制台打开时自动不触发。

## 使用方式

```csharp
using MegaCrit.Sts2.Core.Logging;
using MegaCrit.Sts2.Core.Modding;
using STS2RitsuLib;
using STS2RitsuLib.RuntimeInput;

namespace Test.Scripts;

[ModInitializer(nameof(Init))]
public class Entry
{
    public const string ModId = "Test";
    public static readonly Logger Logger = RitsuLibFramework.CreateLogger(ModId);

    // 存设句柄供未来按需解绑
    private static IRuntimeHotkeyHandle? _reloadHotkey;

    public static void Init()
    {
        _reloadHotkey = RuntimeHotkeyService.Register(
            // 支持组合修饰键的字符串，格式请对比稍后的列表
            "Ctrl+Shift+R",
            // 或者使用数组，任一键按下都会触发，重复绑定会自动去重
            // ["F5", "Ctrl+Shift+R"],
            // 按下时执行的逻辑
            () => Logger.Info("热键已触发！"),
            new RuntimeHotkeyOptions
            {
                // 稳定 id，便于查找与保存配置
                Id = "my_mod_reload",
                // 设置界面显示名，可直接写字符串
                DisplayName = "重新加载配置",
                // 功能说明
                Description = "重新加载 Mod 配置文件。",
                // 热键分组名
                Category = "My Mod",
                // 触发后标记输入已处理（让其他需要输入的不生效），默认 false
                // MarkInputHandled = true,
                // 输入框聚焦时不触发，默认 true
                // SuppressWhenTextInputFocused = true,
                // 开发者控制台打开时不触发，默认 true
                // SuppressWhenDevConsoleVisible = true,
            });

        // 如果要注销
        // _reloadHotkey?.Unregister();
    }
}
```

### 运行时改键

```csharp
if (_reloadHotkey?.TryRebind(
    // 新绑定字符串
    "Ctrl+Alt+R",
    out var normalized) == true)
{
    // normalized 为规范化后的字符串，可写入配置
    Logger.Info($"已重绑定为 {normalized}");
}
```

### 查询已注册热键

```csharp
foreach (var info in RuntimeHotkeyService.GetRegisteredHotkeyDetails())
{
    Logger.Info($"{info.Id}: {string.Join(" / ", info.CurrentBindings)}");
}
```

### 绑定字符串格式

写法：`[修饰键+][修饰键+]主键`，`+` 连接，不区分大小写。

| 修饰键  | 说明                 |
| ------- | -------------------- |
| `Ctrl`  | 控制键               |
| `Alt`   | Alt 键               |
| `Shift` | Shift 键             |
| `Meta`  | Win / Command 等元键 |

示例：

- `F5`
- `Ctrl+S`
- `Ctrl+Shift+R`
- `Alt+F4`
