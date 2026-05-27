---
title: 常用工具类
date: 2026-05-26 00:03:16
permalink: docs/04-ritsulib/04-45-common-utilities/
author: alkaid616
categories:
- Basics
---
这一章集中列一下 RitsuLib 里可以直接给 Mod 使用的工具类。它们不是一个完整功能域，但经常能少写很多样板：加权随机、对象附加状态、SavedProperties 桥接、Godot 资源路径、文件读写、JSON patch、材质和悬停提示。

## 加权随机

`WeightedList<T>` 是一个带权重的列表，可以用原版 `Rng` 抽取，也可以不放回抽取。

```csharp
using MegaCrit.Sts2.Core.Random;
using STS2RitsuLib.Utils;

namespace Test.Scripts.Utils;

public readonly record struct RewardChoice(string Id, int Weight) : IWeightedValue;

public static class TestWeightedRewards
{
    public static string RollReward(Rng rng)
    {
        var choices = new WeightedList<RewardChoice>
        {
            new("gold", 5),
            new("card", 10),
            new("rare_relic", 1),
        };

        return choices.GetRandom(rng).Id;
    }

    public static IReadOnlyList<string> RollDraft(Rng rng)
    {
        var choices = new WeightedList<string>();
        choices.Add("attack", 8);
        choices.Add("skill", 6);
        choices.Add("power", 2);

        return
        [
            choices.GetRandom(rng, remove: true),
            choices.GetRandom(rng, remove: true),
        ];
    }
}
```

如果元素实现 `IWeightedValue`，`Add(item)` 会自动读取 `Weight`；否则默认权重是 1。权重必须大于 0，空列表上 `GetRandom` 会抛异常；不确定列表是否为空时用 `TryGetRandom`。

## 临时附加状态

`AttachedState<TKey,TValue>` 用 `ConditionalWeakTable` 把数据挂到任意引用对象上，不需要继承原版类，也不会阻止 key 被 GC。

```csharp
using MegaCrit.Sts2.Core.Entities.Creatures;
using STS2RitsuLib.Utils;

namespace Test.Scripts.Utils;

public sealed class CreatureHeatState
{
    public int Heat { get; set; }
}

public static class TestCreatureHeat
{
    private static readonly AttachedState<Creature, CreatureHeatState> Heat =
        new(() => new CreatureHeatState());

    public static void AddHeat(Creature creature, int amount)
    {
        Heat.Update(creature, state =>
        {
            state.Heat += amount;
            return state;
        });
    }

    public static bool TryGetHeat(Creature creature, out int heat)
    {
        if (Heat.TryGetValue(creature, out var state))
        {
            heat = state.Heat;
            return true;
        }

        heat = 0;
        return false;
    }
}
```

用 `TryGetValue` 做只读判断，不会创建默认值。用索引器或 `GetOrCreate` 时会创建默认状态。

## 可保存附加状态

如果目标对象会参与原版 `SavedProperties` 序列化，可以用 `SavedAttachedState<TKey,TValue>` 把附加状态写进原版保存属性。它只支持 `SavedProperties` 能表达的类型：`int`、`bool`、`string`、`ModelId`、枚举、`int[]`、枚举数组、`SerializableCard`、`SerializableCard[]` 和 `List<SerializableCard>`。

```csharp
using MegaCrit.Sts2.Core.Models;
using STS2RitsuLib.Utils;

namespace Test.Scripts.Utils;

public static class TestSavedCardFlags
{
    private static readonly SavedAttachedState<AbstractModel, bool> IsEchoCopy =
        new("test_echo_copy", defaultValueFactory: () => false);

    public static void MarkEchoCopy(AbstractModel model)
    {
        IsEchoCopy[model] = true;
    }

    public static bool IsMarked(AbstractModel model)
    {
        return IsEchoCopy.GetValueOrDefault(model, false);
    }
}
```

`name` 会注入原版 `SavedPropertiesTypeCache`，必须全局唯一。推荐带上 Mod id 前缀，发布后不要改名。复杂对象请改用 `RunSavedData` 或 `ModDataStore`，不要硬塞进 `SavedAttachedState`。

## Godot 资源路径检查

`GodotResourcePath` 用来处理 `res://`、`user://` 和 `uid://` 这类 Godot 路径。它会枚举引擎可能使用的候选路径，并按 `ResourceLoader` 的规则检查资源是否存在。

```csharp
using Godot;
using STS2RitsuLib.Utils;

namespace Test.Scripts.Utils;

public static class TestAssetLookup
{
    public static Texture2D? LoadIcon(string configuredPath)
    {
        if (!GodotResourcePath.ResourceExists(configuredPath))
        {
            Entry.Logger.Warn($"图标资源不存在：{configuredPath}");
            return null;
        }

        foreach (var path in GodotResourcePath.EnumerateCandidatePaths(configuredPath))
        {
            var texture = GD.Load<Texture2D>(path);
            if (texture != null)
                return texture;
        }

        return null;
    }
}
```

当用户或配置里可能写 `uid://...` 时，先用 `TryEnsurePath` 转成项目路径；当你只是做 fallback 判断，用 `ResourceExists` 更省事。

## 文件和 JSON 读写

`FileOperations` 包装了 Godot `FileAccess`，返回带错误信息的 result。写入默认使用临时文件和 `.backup` 轮换，读文件可以从 backup fallback。

```csharp
using System.Text.Json;
using STS2RitsuLib.Utils;

namespace Test.Scripts.Utils;

public sealed class DebugExportState
{
    public int ExportCount { get; set; }
}

public static class TestDebugExportFile
{
    private const string Path = "user://test/debug-export.json";

    public static DebugExportState Load()
    {
        var result = FileOperations.ReadJson<DebugExportState>(
            Path,
            new JsonSerializerOptions(JsonSerializerDefaults.Web),
            "TestDebugExport");

        return result.Success && result.Data != null
            ? result.Data
            : new DebugExportState();
    }

    public static bool Save(DebugExportState state)
    {
        var result = FileOperations.WriteJson(
            Path,
            state,
            new JsonSerializerOptions(JsonSerializerDefaults.Web),
            "TestDebugExport");

        return result.Success;
    }
}
```

配置和进度数据优先用 RitsuLib 的 `ModDataStore`。`FileOperations` 更适合调试导出、缓存、临时报告、玩家可手动查看的辅助文件。

## JSON DOM 工具

`STS2RitsuLib.Utils.Json` 下有 JSON Pointer、JSON Merge Patch、JSON Patch、I-JSON 验证和 canonicalize。它们适合做跨 Mod interop schema、Sidecar 配置 delta 或遥测 payload 清洗。

```csharp
using System.Text.Json.Nodes;
using STS2RitsuLib.Utils.Json;

namespace Test.Scripts.Utils;

public static class TestJsonTools
{
    public static JsonObject ApplyUserPatch(JsonObject current, JsonObject patch)
    {
        var merged = JsonMergePatch.Apply(current, patch)?.AsObject() ?? new JsonObject();
        JsonPointer.Set(merged, "/meta/source", JsonValue.Create(Entry.ModId));

        if (!JsonIJsonValidator.TryValidate(merged, out var error))
            throw new InvalidOperationException(error);

        Entry.Logger.Info(JsonCanonicalizer.Canonicalize(merged));
        return merged;
    }

    public static JsonNode? ApplyOperations(JsonNode? current)
    {
        return JsonPatch.Apply(
            current,
            [
                new JsonPatchOperation("replace", "/enabled", Value: JsonValue.Create(true)),
                new JsonPatchOperation("add", "/tags/-", Value: JsonValue.Create("test")),
            ]);
    }
}
```

Merge Patch 里属性值为 JSON null 表示删除。JSON Patch 的路径遵循 RFC 6901 pointer 规则，数组追加用 `/-`。

## 动态枚举值

少数原版 API 需要 enum，但 Mod 又需要自己的枚举成员时，可以用 `DynamicEnumValueMinter<TEnum>` 稳定铸造高位值。它只支持底层为 32 位的 enum。

```csharp
using MegaCrit.Sts2.Core.Cards;
using STS2RitsuLib.Utils;

namespace Test.Scripts.Utils;

public static class TestDynamicTags
{
    private static readonly DynamicEnumValueMinter<CardTag> Tags = new();

    public static readonly CardTag EchoCard = Tags.Mint("test:echo_card");

    public static bool IsOurDynamicTag(CardTag tag)
    {
        return Tags.IsDynamic(tag);
    }
}
```

铸造值会落在高位保留区，避免和原版低值枚举成员撞车。id 要稳定，并带上 Mod id 前缀；不同 id 如果哈希碰撞，`Mint` 会直接抛异常。

## 材质和悬停提示

`MaterialUtils` 提供几种和原版视觉管线一致的材质工厂；`HoverTipHelper` 可以在已有 hover tip set 上追加文字或卡牌预览。

```csharp
using Godot;
using MegaCrit.Sts2.Core.Models;
using STS2RitsuLib;
using STS2RitsuLib.Utils;

namespace Test.Scripts.Utils;

public static class TestUiHelpers
{
    public static ShaderMaterial CreateBlueFrameMaterial()
    {
        return MaterialUtils.CreateReplaceHueShaderMaterial(
            r: 0.25f,
            g: 0.55f,
            b: 1.0f,
            brightness: 1.1f);
    }

    public static void AddPreview(Control owner, IEnumerable<CardModel> cards)
    {
        HoverTipHelper.AddTipToOwner(owner, "Test", "这是一条额外说明。");
        HoverTipHelper.AddCardTipsToOwner(owner, cards);
    }
}
```

`HoverTipHelper` 的方法返回 `false` 表示当前 control 没有绑定活动 hover tip set，通常可以忽略；如果你在自定义控件里自己管理 hover tip，需要先按原版方式创建并绑定 hover tip set。

## 选择建议

| 工具 | 用在 |
| - | - |
| `WeightedList<T>` | 奖励、事件、候选池的加权抽取。 |
| `AttachedState<TKey,TValue>` | 只活在内存里的对象附加数据。 |
| `SavedAttachedState<TKey,TValue>` | 要进入原版 `SavedProperties` 的轻量字段。 |
| `GodotResourcePath` | 资源路径、UID 和 fallback 检查。 |
| `FileOperations` | 调试导出、缓存、辅助 JSON 文件。 |
| `JsonPointer` / `JsonPatch` / `JsonMergePatch` | schema delta、配置同步、interop payload。 |
| `DynamicEnumValueMinter<TEnum>` | 扩展原版 32 位 enum。 |
| `MaterialUtils` / `HoverTipHelper` | 复用原版视觉和 UI hover tip。 |
