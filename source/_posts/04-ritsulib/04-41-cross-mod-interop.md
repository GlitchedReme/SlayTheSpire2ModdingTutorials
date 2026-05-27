---
title: 跨 Mod Interop
date: 2026-05-25 23:33:32
permalink: docs/04-ritsulib/04-41-cross-mod-interop/
author: alkaid616
categories:
- Basics
---
RitsuLib 的跨 Mod Interop 用来处理两类问题：一个 Mod 想在目标 Mod 存在时调用它的公开 API；或者一个运行时提供方想把自己的设置、数据交给 RitsuLib 的设置页和持久化系统托管。前者用 `[ModInterop]` 强类型代理，后者用 runtime provider schema。

## 强类型可选依赖代理

当你不想在 `.csproj` 里引用目标 Mod DLL，但又希望目标 Mod 存在时调用它，可以写一个 stub 类。RitsuLib 会在 Mod 加载后的 type discovery 阶段，把这个类的 public 静态成员改写成对目标 Mod 程序集的调用。

```csharp
using System;
using STS2RitsuLib.Interop;

namespace Test.Scripts.Interop;

[ModInterop("example.target-mod", "TargetMod.Api.PublicApi")]
public static class TargetModApi
{
    public static bool IsReady => false;

    public static int GetBonusLevel(string playerId) => 0;

    public static void GrantBadge(string badgeId)
    {
        throw new NotSupportedException("Target mod is not loaded.");
    }
}
```

调用时把“目标不存在”的情况当作正常分支处理：

```csharp
if (TargetModApi.IsReady)
{
    var level = TargetModApi.GetBonusLevel("test");
    if (level >= 3)
        TargetModApi.GrantBadge("test:veteran");
}
```

`[ModInterop]` 的第一个参数是目标 Mod 的 manifest id；第二个参数是目标类型全名。目标 Mod 没有加载时，stub 不会被改写，所以属性和方法会执行你写的默认实现。

## 成员名和类型覆盖

远端成员名和本地 stub 不一致时，用 `[InteropTarget]` 覆盖。实例对象可以用 `InteropClassWrapper` 包一层，构造函数和实例方法也会被改写到远端类型上。

```csharp
using System;
using STS2RitsuLib.Interop;

namespace Test.Scripts.Interop;

[ModInterop("example.target-mod")]
public static class TargetCatalogInterop
{
    [InteropTarget("TargetMod.Api.Catalog", "FindById")]
    public static EntryRef Find(string id) => throw new NotSupportedException();

    [InteropTarget("TargetMod.Api.Entry")]
    public sealed class EntryRef : InteropClassWrapper
    {
        public EntryRef(string id)
        {
        }

        public string DisplayName => "";

        public int GetScore() => 0;
    }
}
```

类型和成员匹配按 CLR 签名进行。能保持一致的参数类型就保持一致；如果你确实不想引用远端类型，少量参数可以写成 `object`，RitsuLib 会在调用时尝试转换到目标参数类型。

## 注册当前程序集

`[ModInterop]` 依赖 RitsuLib 的 type discovery。普通 RitsuLib Mod 初始化时已经建议注册程序集；如果你的 Mod 还没有这样做，需要补上：

```csharp
using System.Reflection;
using STS2RitsuLib.Interop;

public static void Init()
{
    ModTypeDiscoveryHub.RegisterModAssembly(
        Entry.ModId,
        Assembly.GetExecutingAssembly());
}
```

这个注册只告诉 RitsuLib“扫描我的程序集”。它不会声明对目标 Mod 的硬依赖；是否把目标 Mod 写进 `{modid}.json` 的 `dependencies`，取决于你是否允许目标不存在。

## 运行时 ModData provider

如果另一个系统只愿意通过静态方法暴露数据，但你想让 RitsuLib 负责保存、迁移或 profile 切换同步，可以注册 ModData runtime interop provider。

```csharp
using System.Collections.Generic;
using STS2RitsuLib;

namespace Test.Scripts.Interop;

public static class TestModDataInteropProvider
{
    private static readonly Dictionary<string, object?> Values = new();

    public static string CreateRitsuLibModDataSchema()
    {
        return """
        {
          "modId": "test",
          "entries": [
            {
              "key": "shared",
              "fileName": "shared.json",
              "scope": "profile",
              "autoCreateIfMissing": true
            }
          ]
        }
        """;
    }

    public static object? GetRitsuLibModDataValue(string key)
    {
        return Values.TryGetValue(key, out var value) ? value : null;
    }

    public static void SetRitsuLibModDataValue(string key, object? value)
    {
        Values[key] = value;
    }
}
```

初始化时注册：

```csharp
ModDataRuntimeInterop.RegisterProviderTypeAndTryRegister<TestModDataInteropProvider>();
ModDataRuntimeInterop.EnsureProfileSwitchSyncHook();
```

schema 可以直接返回 JSON 字符串，也可以返回文件路径或字典对象。最小 entry 需要 `key` 和 `fileName`；`scope` 支持 `global`、`profile`、`inMemory`。如果需要更细的 JSON DOM 同步，可额外实现 `GetRitsuLibModDataJson`、`SetRitsuLibModDataJson`、`GetRitsuLibModDataNode`、`SetRitsuLibModDataNode`、merge patch 或 JSON patch 方法。

## 运行时设置页 mirror

设置页 mirror 让一个 provider 用 JSON schema 描述设置 UI，RitsuLib 再通过静态 getter/setter 读写值。

```csharp
using System.Collections.Generic;
using STS2RitsuLib.Settings;

namespace Test.Scripts.Interop;

public static class TestSettingsInteropProvider
{
    private static readonly Dictionary<string, object?> Values = new()
    {
        ["enabled"] = true,
        ["volume"] = 70,
    };

    public static string CreateRitsuLibSettingsSchema()
    {
        return """
        {
          "modId": "test",
          "modDisplayName": "Test",
          "pages": [
            {
              "pageId": "interop",
              "title": "Interop 设置",
              "sections": [
                {
                  "id": "general",
                  "title": "通用",
                  "entries": [
                    {
                      "id": "enabled",
                      "type": "toggle",
                      "label": "启用",
                      "defaultValue": true
                    },
                    {
                      "id": "volume",
                      "type": "int-slider",
                      "label": "音量",
                      "min": 0,
                      "max": 100,
                      "step": 5,
                      "defaultValue": 70
                    },
                    {
                      "id": "reset",
                      "type": "button",
                      "key": "reset",
                      "label": "重置",
                      "buttonText": "执行",
                      "tone": "accent"
                    }
                  ]
                }
              ]
            }
          ]
        }
        """;
    }

    public static object? GetRitsuLibSettingValue(string key)
    {
        return Values.TryGetValue(key, out var value) ? value : null;
    }

    public static void SetRitsuLibSettingValue(string key, object? value)
    {
        Values[key] = value;
    }

    public static void InvokeRitsuLibSettingAction(string key)
    {
        if (key != "reset")
            return;
        Values["enabled"] = true;
        Values["volume"] = 70;
    }

    public static void SaveRitsuLibSettings()
    {
        Entry.Logger.Info("设置已由 RitsuLib mirror 保存。");
    }
}
```

注册：

```csharp
ModSettingsRuntimeReflectionInteropMirror
    .RegisterProviderTypeAndTryRegister<TestSettingsInteropProvider>();
```

设置页 schema 支持 `header`、`paragraph`、`toggle`、`slider`、`int-slider`、`choice`、`string`、`multiline-string`、`color`、`key-binding`、`info-card`、`runtime-hotkey-summary`、`subpage`、`button`。复杂选项可以用 `visibleWhenMethod`、`optionsMethod` 和 `InvokeRitsuLibSettingAction` 继续扩展。

## 自动发现 provider

如果 provider 不方便在初始化时显式注册，也可以用程序集 metadata 让 RitsuLib 自动发现：

```csharp
using System.Reflection;

[assembly: AssemblyMetadata(
    "RitsuLib.ModDataInterop.ProviderType",
    "Test.Scripts.Interop.TestModDataInteropProvider")]

[assembly: AssemblyMetadata(
    "RitsuLib.ModSettingsInterop.ProviderType",
    "Test.Scripts.Interop.TestSettingsInteropProvider")]
```

显式注册更容易调试；metadata 更适合只暴露给 RitsuLib 扫描、调用方不想写初始化代码的桥接层。

## 验证

* 目标 Mod 不存在时，`[ModInterop]` stub 的默认实现不会让你的 Mod 初始化失败。
* 目标 Mod 存在时，日志中能看到 `[ModInterop] Generated interop ...`，方法和属性返回远端真实值。
* 运行时 ModData provider 注册后，对应 `fileName` 会按 `scope` 出现在 RitsuLib 的 ModDataStore 中。
* profile 切换前调用过 `EnsureProfileSwitchSyncHook()`，provider 数据能写回 profile 存档。
* 设置页 mirror 能出现在 RitsuLib 设置 UI 中，修改控件后 provider 的 `SetRitsuLibSettingValue` 和 `SaveRitsuLibSettings` 被调用。
