---
title: Runtime Hotkeys
date: 2026-05-16 23:27:19
permalink: en/docs/04-ritsulib/04-26-runtime-hotkey/
author: alkaid616
categories:
- Basics
---
`RitsuLib` provides a runtime hotkey registration system that supports multiple bindings, rebinding, modifier keys, and automatic suppression when a text input or developer console is focused.

## Usage

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

    // Store the handle for future unbinding
    private static IRuntimeHotkeyHandle? _reloadHotkey;

    public static void Init()
    {
        _reloadHotkey = RuntimeHotkeyService.Register(
            // A string supporting combined modifier keys; see the table below for format
            "Ctrl+Shift+R",
            // Or use an array; pressing any key triggers it; duplicate bindings are automatically deduplicated
            // ["F5", "Ctrl+Shift+R"],
            // Logic to execute on press
            () => Logger.Info("Hotkey triggered!"),
            new RuntimeHotkeyOptions
            {
                // Stable id, easy to find and persist config
                Id = "my_mod_reload",
                // Display name for the settings screen; can be a plain string
                DisplayName = "Reload Configuration",
                // Feature description
                Description = "Reload the Mod configuration file.",
                // Hotkey group name
                Category = "My Mod",
                // After triggering, mark input as handled (preventing other input handlers from acting), default false
                // MarkInputHandled = true,
                // Don't trigger when a text input is focused, default true
                // SuppressWhenTextInputFocused = true,
                // Don't trigger when the developer console is open, default true
                // SuppressWhenDevConsoleVisible = true,
            });

        // To unregister
        // _reloadHotkey?.Unregister();
    }
}
```

### Runtime Rebind

```csharp
if (_reloadHotkey?.TryRebind(
    // New binding string
    "Ctrl+Alt+R",
    out var normalized) == true)
{
    // normalized is the canonical string, which can be written to config
    Logger.Info($"Rebound to {normalized}");
}
```

### Query Registered Hotkeys

```csharp
foreach (var info in RuntimeHotkeyService.GetRegisteredHotkeyDetails())
{
    Logger.Info($"{info.Id}: {string.Join(" / ", info.CurrentBindings)}");
}
```

### Binding String Format

Format: `[Modifier+][Modifier+]MainKey`, joined by `+`, case-insensitive.

| Modifier | Description          |
| -------- | -------------------- |
| `Ctrl`   | Control key          |
| `Alt`    | Alt key              |
| `Shift`  | Shift key            |
| `Meta`   | Win / Command meta key |

Examples:

- `F5`
- `Ctrl+S`
- `Ctrl+Shift+R`
- `Alt+F4`
