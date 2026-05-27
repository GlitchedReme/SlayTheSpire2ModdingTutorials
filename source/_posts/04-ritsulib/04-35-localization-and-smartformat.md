---
title: 本地化与 SmartFormat
date: 2026-05-25 22:56:04
permalink: docs/04-ritsulib/04-35-localization-and-smartformat/
author: alkaid616
categories:
- Basics
---
RitsuLib 里有两套文本入口：

* 游戏内容文本继续写进原版 `LocTable`，例如 `cards`、`relics`、`events`、`card_keywords`。
* Mod 自己的 UI、设置页和调试面板，用 RitsuLib 的 `I18N` 小字典。

不要把卡牌描述、遗物描述迁到 `I18N`。这些内容已经由游戏的 `LocString` 管线解析，放在对应表里才能正常参与关键词、动态变量和语言切换。

## 内容本地化 key

RitsuLib 注册的内容会使用稳定公开 Entry 作为本地化 stem。比如一张 owned 卡牌的 Entry 是：

```text
TEST_CARD_MEASURED_STRIKE
```

`cards/zhs.json`：

```json
{
  "TEST_CARD_MEASURED_STRIKE.title": "精准打击",
  "TEST_CARD_MEASURED_STRIKE.description": "造成 {Damage} 点伤害。"
}
```

常用表：

| 类型 | 表 | 常用 key |
| - | - | - |
| 卡牌 | `cards` | `{ENTRY}.title`、`{ENTRY}.description`、`{ENTRY}.selectionScreenPrompt` |
| 遗物 | `relics` | `{ENTRY}.title`、`{ENTRY}.description`、`{ENTRY}.flavor` |
| 药水 | `potions` | `{ENTRY}.title`、`{ENTRY}.description` |
| 能力 | `powers` | `{ENTRY}.title`、`{ENTRY}.description` |
| 角色 | `characters` | `{ENTRY}.title`、代词、解锁文本、卡牌修饰文本 |
| Act | `acts` | `{ENTRY}.title` |
| 遭遇 | `encounters` | `{ENTRY}.title`、`{ENTRY}.loss`、`{ENTRY}.customRewardDescription` |
| 事件 | `events` | `{ENTRY}.pages.<PAGE>.description`、`{ENTRY}.pages.<PAGE>.options.<OPTION>` |
| 先古事件 | `ancients` | 事件页面 key 加 `talk` 对话 key |
| 时间线时代 | `epochs` | `{ID}.title`、`{ID}.description`、`{ID}.unlockInfo`、`{ID}.unlockText` |
| 关键词 | `card_keywords` / `static_hover_tips` | `{ID}.title`、`{ID}.description` |

语言文件名使用游戏语言代码，例如 `zhs.json`、`eng.json`、`jpn.json`。

## 创建 I18N

`I18N` 适合你自己的 UI 文案。比如设置页、调试浮窗、导出工具提示。

```csharp
using STS2RitsuLib;
using STS2RitsuLib.Utils;

namespace Test.Scripts;

public static class TestUiText
{
    public static readonly I18N Text = RitsuLibFramework.CreateModLocalization(
        modId: Entry.ModId,
        instanceName: "test-ui",
        pckFolders: ["res://Test/localization/ui"]);

    public static string Get(string key, string fallback)
    {
        return Text.Get(key, fallback);
    }
}
```

`res://Test/localization/ui/zhs.json`：

```json
{
  "settings.title": "测试 Mod",
  "settings.enabled": "启用",
  "toast.saved": "设置已保存。"
}
```

读取：

```csharp
var title = TestUiText.Get("settings.title", "Test Mod");
```

如果不传 `fileSystemFolders`，`CreateModLocalization` 会默认把文件系统路径指向当前账号的 `mod_data/{modId}/localization`。发布在 PCK 里的文本建议显式传 `pckFolders`。

## 桥接成 LocString 表

有些游戏 API 要求 `LocString`，但你的文本确实来自 `I18N`。这时把 `I18N` 注册成虚拟表：

```csharp
using MegaCrit.Sts2.Core.Localization;
using STS2RitsuLib;

var uiText = RitsuLibFramework.CreateModLocalization(
    Entry.ModId,
    "test-ui",
    pckFolders: ["res://Test/localization/ui"]);

RitsuLibFramework.RegisterI18NLocTableBridge(
    Entry.ModId,
    uiText,
    stem: "UI");

var tableId = RitsuLibFramework.GetI18NLocTableId(Entry.ModId, "UI");
var locTitle = new LocString(tableId, "settings.title");
```

虚拟表 id 遵循 `MODID_I18N_STEM`，例如 `TEST_I18N_UI`。同一个 stem 重复注册默认会失败；开发期要替换可以传 `replaceExisting: true`。

## 注册 SmartFormat formatter

当原版 `LocString` 占位符需要一个可复用格式化规则时，注册 SmartFormat formatter。

```csharp
using SmartFormat.Core.Extensions;
using STS2RitsuLib;

namespace Test.Scripts;

public sealed class TestPercentFormatter : IFormatter
{
    public string Name { get; set; } = "test_percent";

    public bool CanAutoDetect { get; set; }

    public bool TryEvaluateFormat(IFormattingInfo info)
    {
        if (info.CurrentValue is not int value)
            return false;

        info.Write($"{value}%");
        return true;
    }
}
```

显式注册：

```csharp
RitsuLibFramework.GetSmartFormatRegistry(Entry.ModId)
    .Register<TestPercentFormatter>();
```

或放进内容包：

```csharp
RitsuLibFramework.CreateContentPack(Entry.ModId)
    .SmartFormatter<TestPercentFormatter>()
    .Apply();
```

如果项目使用自动注册：

```csharp
using SmartFormat.Core.Extensions;
using STS2RitsuLib.Interop.AutoRegistration;

namespace Test.Scripts;

[RegisterSmartFormatter]
public sealed class TestPercentFormatter : IFormatter
{
    public string Name { get; set; } = "test_percent";

    public bool CanAutoDetect { get; set; }

    public bool TryEvaluateFormat(IFormattingInfo info)
    {
        if (info.CurrentValue is not int value)
            return false;

        info.Write($"{value}%");
        return true;
    }
}
```

注册后就可以在会经过游戏 SmartFormat 的文本里使用你的 formatter。示例：

```json
{
  "TEST_CARD_PRECISION.description": "本回合暴击率为 {CritChance:test_percent}。"
}
```

`CritChance` 仍然要由模型的 dynamic var、上下文或其它 SmartFormat source 提供。

## 注册 SmartFormat source

source 用来提供新的选择器来源。它比 formatter 更容易影响全局解析，建议只在你需要一组跨内容复用的上下文值时使用。

```csharp
using SmartFormat.Core.Extensions;
using STS2RitsuLib.Interop.AutoRegistration;

namespace Test.Scripts;

[RegisterSmartFormatSource]
public sealed class TestConstantSource : ISource
{
    public bool TryEvaluateSelector(ISelectorInfo info)
    {
        if (info.SelectorText != "testModName")
            return false;

        info.Result = "Test";
        return true;
    }
}
```

也可以显式注册：

```csharp
RitsuLibFramework.GetSmartFormatRegistry(Entry.ModId)
    .RegisterSource<TestConstantSource>();
```

source 会先于 formatter 注入。多个 Mod 注册扩展时，RitsuLib 会按所属 Mod、`Order` 和类型名做稳定排序；formatter 的 `Name` 不能和已经存在的 formatter 重名。

## 选择建议

| 需求 | 推荐入口 |
| - | - |
| 卡牌、遗物、事件、能力等内容文本 | 原版 loc 表 |
| 设置页、调试 UI、toast 文案 | `I18N` |
| 某个 API 必须收 `LocString`，文本又来自你的 JSON | `RegisterI18NLocTableBridge` |
| 一个占位符只是卡牌数值 | `DynamicVar` |
| 一个格式化规则要在多处复用 | `IFormatter` |
| 要给 SmartFormat 增加新的选择器来源 | `ISource` |

## 验证

* 切换语言后，游戏内容文本和 `I18N` 文本都能刷新到对应语言。
* `I18N.Get(key, fallback)` 在缺 key 时返回 fallback，不在 UI 上显示空字符串。
* 虚拟表 id 能用 `GetI18NLocTableId` 得到，`new LocString(tableId, key)` 能解析文本。
* SmartFormat formatter 注册后，日志里没有 “formatter name is already registered”。
* 占位符缺失时，先检查 dynamic var/source 是否提供了对应名称，再检查本地化 JSON 拼写。
