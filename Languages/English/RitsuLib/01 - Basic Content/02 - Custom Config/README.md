RitsuLib provides three ways to create configuration pages: **code-based fluent building**, **reflection attribute registration**, and **schema declaration registration**.

Configuration data persistence is handled by `ModDataStore`.

## Method 1: Code-based Fluent Registration

This is the recommended approach. You need to register a DataStore first, then bind controls.

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

    // Setting binding — can be called to query and modify values
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
        // Register the DataStore
        ModDataStore.For(Entry.ModId).Register<TestSettings>(
            key: DataKey, // Persistence data ID — must not collide with others
            fileName: "settings.json", // Your data file name
            scope: SaveScope.Profile, // Profile means per-save-file independence; change to Global to share across all save files
            defaultFactory: () => new TestSettings(),
            autoCreateIfMissing: true);

        // Register the page UI
        RitsuLibFramework.RegisterModSettings(Entry.ModId, page => page
            .WithTitle(ModSettingsText.Literal("Test"))
            .WithModDisplayName(ModSettingsText.Literal("Test Mod"))
            .WithVisibleOnHostSurfaces(
                ModSettingsHostSurface.MainMenu | ModSettingsHostSurface.RunPause)
            .AddSection("general", section => section
                .WithTitle(ModSettingsText.Literal("General"))
                .AddToggle("enabled", ModSettingsText.Literal("Enabled"), EnabledBinding)
                .AddIntSlider("volume", ModSettingsText.Literal("Volume"), VolumeBinding,
                    minValue: 0, maxValue: 100, step: 5,
                    valueFormatter: static v => $"{v}%")
                .AddButton("reset", ModSettingsText.Literal("Volume"),
                    ModSettingsText.Literal("Reset"),
                    host =>
                    {
                        VolumeBinding.Write(80);
                        host.MarkDirty(VolumeBinding);
                        host.RequestRefresh();
                    },
                    ModSettingsButtonTone.Accent)
                .AddChoice("layout", ModSettingsText.Literal("Layout"),
                    new ModSettingsValueBinding<TestSettings, string>(
                        Entry.ModId, DataKey, SaveScope.Profile,
                        static s => s.Layout,
                        static (s, v) => s.Layout = v),
                    [
                        new("compact", ModSettingsText.Literal("Compact")),
                        new("comfortable", ModSettingsText.Literal("Comfortable"))
                    ],
                    presentation: ModSettingsChoicePresentation.Dropdown)));
    }
}
```

Call during initialization:

```csharp
public static void Init()
{
    TestSettingsPage.Register();
}
```

* `ModSettingsValueBinding<TModel, TValue>` — `TModel` is the data model registered in the DataStore, and `TValue` is the field type.
* Pass `modId`, `dataKey`, `scope`, and getter/setter lambdas when constructing.
* Passing `dataKey` automatically routes through DataStore queries and saves.
* Afterwards you can call `EnabledBinding.Read()` and `EnabledBinding.Write(...)` to read and modify values. Don't forget to call `EnabledBinding.Save()` to persist modified values.

```csharp
var value = EnabledBinding.Read();

EnabledBinding.Write(value);
EnabledBinding.Save();
```

### Temporary Bindings

For settings that aren't persisted, use this binding:

```csharp
var preview = new InMemoryModSettingsValueBinding<bool>(
    Entry.ModId, "preview.enabled", initialValue: true);
```

### Projected Bindings

If multiple controls edit the same large object, use a root binding to project sub-fields for unified saving and refreshing:

```csharp
var root = new ModSettingsValueBinding<TestSettings, TestSettings>(
    Entry.ModId, DataKey, SaveScope.Profile,
    static s => s, static (_, v) => v);

// Project the volume sub-setting
var volume = new ProjectedModSettingsValueBinding<TestSettings, int>(
    root, "volume",
    static s => s.Volume,
    static (s, v) => { s.Volume = v; return s; });
```

## Method 2: Reflection Registration

Mark attributes on a class and RitsuLib automatically scans fields and properties to generate the settings page. Suitable for simple cases with few fields.

```csharp
using STS2RitsuLib.Settings;

namespace Test.Scripts;

[ModSettingsPage(Entry.ModId)]
[ModSettingsSection("general", Title = "General")]
public static class TestReflectedSettings
{
    [ModSettingsToggle("enabled", "general")]
    [ModSettingsBinding(BindingSource = ModSettingsReflectionBindingSource.Global)]
    public static bool Enabled { get; set; } = true;

    [ModSettingsIntSlider("volume", "general", 0, 100, 5)]
    [ModSettingsBinding(BindingSource = ModSettingsReflectionBindingSource.Global)]
    public static int Volume { get; set; } = 80;

    [ModSettingsButton("reset", "general", ButtonText = "Reset Volume")]
    public static void ResetVolume() => Volume = 80;
}
```

```csharp
public static void Init()
{
    RitsuLibFramework.RegisterModSettingsReflectionProvider<TestReflectedSettings>();
}
```

* `[ModSettingsBinding].BindingSource` can be `Global` (global DataStore), `Profile` (per save file), or `InMemory` (no persistence, in-memory only).
* Buttons require `static` methods.

**Common Control Attributes:**

| Attribute | Control | Attribute | Control |
| --- | --- | --- | --- |
| `[ModSettingsToggle]` | Toggle | `[ModSettingsColor]` | Color |
| `[ModSettingsSlider]` | Float slider | `[ModSettingsChoice]` | Choice |
| `[ModSettingsIntSlider]` | Int slider | `[ModSettingsKeyBinding]` | Key binding |
| `[ModSettingsString]` | Single-line text | `[ModSettingsButton]` | Button |
| `[ModSettingsMultilineString]` | Multi-line text |  |  |

## Method 3: Schema Registration

Suitable for cross-framework scenarios where you don't want a hard dependency on `RitsuLib` management.

```csharp
using STS2RitsuLib.Settings;

namespace Test.Scripts;

public static class TestSchemaSettings
{
    // Approach 1: Return a JSON file path — the framework auto-reads and parses it
    public static object CreateRitsuLibSettingsSchema()
    {
        return "res://Test/settings_schema.json";
    }
    
    // Approach 2: Return a Dictionary
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
    //                         ["title"] = "General",
    //                         ["entries"] = new object[] {
    //                             new Dictionary<string, object>
    //                             {
    //                                 ["id"] = "enabled", ["type"] = "toggle",
    //                                 ["key"] = "enabled", ["label"] = "Enabled",
    //                                 ["defaultValue"] = true, ["scope"] = "global"
    //                             },
    //                             new Dictionary<string, object>
    //                             {
    //                                 ["id"] = "reset", ["type"] = "button",
    //                                 ["key"] = "reset", ["label"] = "Reset Volume"
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     };
    // }

    // Read a setting value — return the value based on the key yourself
    public static object? GetRitsuLibSettingValue(string key) => key switch
    {
        "enabled" => TestConfig.Enabled,
        _ => null
    };

    // Set a value
    public static void SetRitsuLibSettingValue(string key, object? value)
    {
        if (key == "enabled") TestConfig.Enabled = (bool)value!;
    }

    // Save settings
    public static void SaveRitsuLibSettings() => TestConfig.Save();

    // Button callback
    public static void InvokeRitsuLibSettingAction(string key)
    {
        if (key == "reset") TestConfig.Volume = 80;
    }
}
```

Register with RitsuLib:

```xml
<!-- Add AssemblyMetadata in .csproj -->
<ItemGroup>
    <!-- Disable BaseLib / ModConfig mirrored settings pages to avoid duplication -->
    <AssemblyMetadata Include="RitsuLib.ModSettingsMirror.Mod.Test.DisableSources" Value="baselib,modconfig" />
    <AssemblyMetadata Include="RitsuLib.ModSettingsInterop.ProviderType" Value="Test.Scripts.TestSchemaSettings" />
</ItemGroup>
```

### settings_schema.json

Create a JSON file at the path specified in `CreateRitsuLibSettingsSchema`.

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
                    "fallback": "Settings"
                }
            },
            "sections": [
                {
                    "id": "general",
                    "title": {
                        "locString": {
                            "table": "settings_ui",
                            "key": "TEST_SECTION_GENERAL.title",
                            "fallback": "General"
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
                                    "fallback": "Enabled"
                                }
                            },
                            "description": {
                                "i18n": {
                                    "key": "test_settings.enabled.description",
                                    "fallback": "Enable the new feature."
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
                                "fallback": "Volume"
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
                            "label": "Reset Volume",
                            "buttonText": "Reset",
                            "tone": "accent"
                        },
                        {
                            "id": "info",
                            "type": "info-card",
                            "label": "Note",
                            "body": "Changes take effect immediately; no restart required."
                        }
                    ]
                }
            ]
        }
    ]
}
```

### Localization Files

Schema text supports four formats: plain strings, `locString` (the game's built-in text tables), `i18n` (multi-language), and `langMap` (inline language mapping). The dictionary-return approach can also use these.

If you used `locString`, you need to provide the corresponding localization file: `{modId}/localization/zhs/settings_ui.json`:

```json
{
    "TEST_MOD_DISPLAY_NAME.title": "Test Mod",
    "TEST_SETTINGS_PAGE.title": "Settings",
    "TEST_SECTION_GENERAL.title": "General",
    "TEST_ENABLE_FEATURE.title": "Enabled"
}
```

**Schema entry types:** `toggle`, `slider`, `int-slider`, `choice`, `string`, `multiline-string`, `color`, `key-binding`, `button`, `header`, `paragraph`, `info-card`, `subpage`, etc.

## Localization Text

Settings page text uses `ModSettingsText`, which supports four forms:

```csharp
// Fixed string — fastest during development
ModSettingsText.Literal("Test Mod");

// Vanilla LocString text table
ModSettingsText.LocString("static_hover_tips", "TEST_HEAT.title", "Heat");

// RitsuLib's own i18n multi-language support
ModSettingsText.I18N(TestUiText.Text, "settings.title", "Test Mod");

// Runtime dynamic text
ModSettingsText.Dynamic(() => $"Exported {TestExportState.Count} images");
```

## More Features

There are also advanced features such as subpages, visibility controls, and complex data structures. Refer to `RitsuLib`'s documentation and its in-game settings as needed.
