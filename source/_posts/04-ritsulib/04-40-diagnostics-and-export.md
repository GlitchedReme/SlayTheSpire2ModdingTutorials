---
title: 诊断与导出
date: 2026-05-25 23:23:52
permalink: docs/04-ritsulib/04-40-diagnostics-and-export/
author: alkaid616
categories:
- Basics
---
RitsuLib 的诊断功能分两类：一类是 Mod 可以直接调用的 PNG 导出和控制台补全 API；另一类是 RitsuLib 设置页里的自检包、Harmony 补丁报告等排障工具。前者适合做开发按钮，后者适合让玩家或测试者导出日志给你。

## 导出卡牌 PNG

卡牌导出会用真实 `NCard` 节点渲染已注册的 `CardModel`，不需要当前跑局或玩家。建议在主菜单或设置页按钮中触发。

```csharp
using STS2RitsuLib;
using STS2RitsuLib.Diagnostics.CardExport;
using STS2RitsuLib.Ui.Toast;

namespace Test.Scripts.Tools;

public static class TestCardExport
{
    public static void ExportCards()
    {
        if (!CardPngExporter.TryValidateExportEnvironment(out var error))
        {
            RitsuToastService.ShowWarning(error, "Test 导出");
            return;
        }

        RitsuLibFramework.BeginCardPngExport(new CardPngExportRequest
        {
            OutputDirectory = "user://test_exports/cards",
            Scale = 2f,
            CaptureMode = CardPngExportCaptureMode.CardWithHoverTipsPanel,
            IncludeUpgradedVariants = true,
            IdFilterSubstring = "TEST_",
            MaxBaseCards = 0,
            IncludeCardsHiddenFromLibrary = true,
        });
    }
}
```

常用字段：

| 字段 | 作用 |
| - | - |
| `OutputDirectory` | 绝对路径、`user://` 或 `res://` 输出目录 |
| `Scale` | 输出倍率，`2f` 适合高分辨率预览 |
| `CaptureMode` | `CardOnly` 或带右侧 hover 面板的 `CardWithHoverTipsPanel` |
| `IncludeUpgradedVariants` | 为可升级卡牌额外导出 `_upgraded` |
| `IdFilterSubstring` | 只导出 entry id 包含该片段的卡牌 |
| `IncludeCardsHiddenFromLibrary` | 是否包含不会出现在卡牌库里的卡牌 |

导出过程会在画面外创建临时节点和 `SubViewport`。不要在模组初始化阶段调用；等游戏主循环和资源加载完成后再触发。

## 导出图鉴详情 PNG

图鉴详情导出用于遗物查看弹窗和药水实验室聚焦视图，适合做 Wiki、发布页或测试对比素材。

```csharp
using STS2RitsuLib;
using STS2RitsuLib.Diagnostics.CompendiumExport;

public static void ExportCompendiumDetails()
{
    RitsuLibFramework.BeginCompendiumDetailPngExport(new CompendiumPngExportRequest
    {
        OutputDirectory = "user://test_exports/compendium",
        Scale = 1.5,
        IdFilterSubstring = "TEST_",
        Relics = true,
        Potions = true,
        IncludeRelicHoverTips = true,
    });
}
```

如果只想导出默认集合，可以用：

```csharp
RitsuLibFramework.BeginCompendiumDetailPngExport(
    CompendiumPngExportRequest.CreateDefault("user://test_exports/compendium"));
```

导出的图鉴内容不走玩家存档和解锁门控，而是使用“已见、已解锁”的展示形态；这正适合开发期检查模型和本地化，但不要把它当作玩家实际解锁状态。

## RitsuLib 自检包与补丁报告

RitsuLib 设置页里有两组诊断工具：

| 工具 | 入口 | 输出 |
| - | - | - |
| Self-check | RitsuLib 设置页，或控制台 `ritsulib selfcheck run` | zip，包含自检报告、Harmony dump、日志副本 |
| Harmony patch dump | RitsuLib 设置页 | 文本报告，列出已补丁方法、Prefix/Postfix/Transpiler/Finalizer |

控制台命令：

```text
ritsulib selfcheck run
ritsulib selfcheck open-output
```

这些工具读取 RitsuLib 自己的设置项，例如输出路径和“首次进入主菜单时自动导出”。它们不是给普通 Mod 调用的 public API；当你需要让测试者反馈兼容问题时，建议写在 issue 模板里，让他们先在 RitsuLib 设置页配置输出目录，再运行 self-check。

## 控制台补全增强

`DevConsoleAutocomplete` 可以让控制台候选项更好用：支持本地化标题匹配、显示本地化标签、RitsuLib owned id 尾部简写、去重，以及自定义卡牌堆名候选。

```csharp
using STS2RitsuLib.Diagnostics.DevConsole;

namespace Test.Scripts.Tools;

public static class TestConsoleAutocomplete
{
    public static void Register()
    {
        DevConsoleAutocomplete.Register(
            "test_export_card",
            argumentIndex: 0,
            DevConsoleAutocompleteEnhancements.RitsuLibModEntryId);

        DevConsoleAutocomplete.Register(
            "test_move_card",
            argumentIndex: 1,
            DevConsoleAutocompleteEnhancements.PileName,
            DevConsoleAutocompleteContextPredicates.IsSecondArgument);
    }
}
```

如果你的命令有更复杂的参数结构，用 `DevConsoleAutocompleteBinding`：

```csharp
using System;
using STS2RitsuLib.Diagnostics.DevConsole;

DevConsoleAutocomplete.Register(new DevConsoleAutocompleteBinding
{
    CommandName = "test_debug",
    ArgumentIndex = 2,
    Enhancements = DevConsoleAutocompleteEnhancements.ModelEntryId,
    AppliesWhen = context =>
        context.CompletedArgs.Count >= 2 &&
        context.CompletedArgs[0].Equals("card", StringComparison.OrdinalIgnoreCase),
});
```

这些增强会作用在命令原本返回的候选列表上。也就是说，你的命令仍然需要按原版控制台方式提供基础候选；RitsuLib 负责把匹配、标签和去重做得更友好。

## 把警告当作发布信号

发布前至少检查一次 Godot 日志。下面这些 RitsuLib 警告应视为需要处理的信号：

| 区域 | 常见原因 |
| - | - |
| 内容注册 | 注册太晚、重复 ID、冻结后仍写注册表 |
| 资源路径 | Profile 指向不存在的贴图、场景、音频或字体 |
| 本地化 | 游戏表或 `I18N` 来源缺 key |
| 解锁与时间线 | 规则引用不存在的 epoch、角色或内容 |
| 补丁 | 必要目标方法缺失，或 patch 类没有 Harmony 方法 |
| 导出 | 主菜单未加载、测试模式、输出路径无效 |

角色资源警告、必要 patch 失败、模型 ID 冲突都不建议带进发布包。

## 验证

* 主菜单打开后，卡牌 PNG 导出能生成基础卡和升级卡，输出目录路径符合预期。
* `CardWithHoverTipsPanel` 能显示文字 hover 和引用卡牌 hover；隐藏卡牌筛选符合 `IncludeCardsHiddenFromLibrary`。
* 图鉴详情导出的遗物、药水不会受当前存档解锁状态影响。
* `ritsulib selfcheck run` 能生成 zip；`ritsulib selfcheck open-output` 能打开输出目录。
* 给自定义控制台命令注册补全后，输入本地化标题或 owned id 尾部片段都能命中候选。
