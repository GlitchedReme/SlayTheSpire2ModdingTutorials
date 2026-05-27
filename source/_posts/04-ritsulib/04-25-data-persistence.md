---
title: 数据持久化
date: 2026-05-16 23:27:19
permalink: docs/04-ritsulib/04-25-data-persistence/
author: alkaid616
categories:
- Basics
---
> 以下文章由AI编写，之后将会修正迁移，如有错误请提出。

`RitsuLib`提供了一套结构化的数据持久化层，支持作用域存储、档位切换、备份回退以及数据迁移。

`SavedAttachedState` 已经在 [数据保存](../01%20-%20数据保存/README.md) 介绍过，这里介绍更通用的 `ModDataStore` 持久化方案。

## 注册数据

定义数据类，在 `Entry.Init` 中注册：

```csharp
using MegaCrit.Sts2.Core.Logging;
using MegaCrit.Sts2.Core.Modding;
using STS2RitsuLib;
using STS2RitsuLib.Data;
using STS2RitsuLib.Utils.Persistence;

namespace Test.Scripts;

public sealed class CounterData
{
    public int Value { get; set; }
}

[ModInitializer(nameof(Init))]
public class Entry
{
    public const string ModId = "test";
    public static readonly Logger Logger = RitsuLibFramework.CreateLogger(ModId);

    public static void Init()
    {
        using (RitsuLibFramework.BeginModDataRegistration(ModId))
        {
            var store = RitsuLibFramework.GetDataStore(ModId);

            store.Register<CounterData>(
                key: "counter",
                fileName: "counter.json",
                scope: SaveScope.Profile,
                defaultFactory: () => new CounterData(),
                autoCreateIfMissing: true);
        }

        RitsuLibFramework.SubscribeLifecycle<ProfileDataReadyEvent>(_ =>
        {
            var store = RitsuLibFramework.GetDataStore(ModId);
            store.Modify<CounterData>("counter", data => data.Value += 1);
            store.Save("counter");
            Logger.Info($"counter.Value = {store.Get<CounterData>("counter").Value}");
        });
    }
}
```

* `key`：在 store 内部查找该条目的键。
* `fileName`：写入磁盘时使用的文件名。
* `scope`：`Global` 或 `Profile`（另有 `RunSidecar` 等高级作用域，见源码）。
* `defaultFactory`：没有文件或需要恢复时使用的默认值。
* `autoCreateIfMissing`：文件不存在时是否立即写出默认文件。

## Global与Profile作用域

* `Global`：所有档位共享。适合 Mod 设置、机器级缓存。
* `Profile`：按游戏档位隔离。适合解锁、进度等玩家数据。

## 读取与写入

在档位数据就绪后（例如 `ProfileDataReadyEvent` 回调中）读写：

```csharp
var store = RitsuLibFramework.GetDataStore(ModId);

// 读取
var counter = store.Get<CounterData>("counter");

// 修改
store.Modify<CounterData>("counter", data =>
{
    data.Value += 1;
});

// 保存
store.Save("counter");
```

* `Get<T>` 返回的是当前注册条目的活动对象。
* 保存默认是显式的。

## 判断是否已有存档数据

```csharp
if (store.HasExistingData("counter"))
{
    // 磁盘上已经存在旧数据
}
```

常用于区分「首次初始化」和「读取旧存档」两种启动路径。

## 档位切换

档位作用域的数据会自动感知档位切换。RitsuLib 会先把旧档位数据保存回旧档位路径，再从新档位路径重新加载。Mod 不需要手写重绑定逻辑。

## 数据迁移

`Register<T>` 支持同时传入迁移配置与迁移步骤：

```csharp
using STS2RitsuLib.Utils.Persistence.Migration;
using System.Text.Json.Nodes;

// 在 BeginModDataRegistration 作用域内：
store.Register<MyData>(
    key: "settings",
    fileName: "settings.json",
    scope: SaveScope.Global,
    defaultFactory: () => new MyData(),
    migrationConfig: new ModDataMigrationConfig
    {
        CurrentDataVersion = 2,
        MinimumSupportedDataVersion = 1,
    },
    migrations:
    [
        new SettingsV1ToV2Migration(),
    ]);
```

```csharp
public sealed class SettingsV1ToV2Migration : IMigration
{
    public int FromVersion => 1;
    public int ToVersion => 2;

    public bool Migrate(JsonObject data)
    {
        // 将 v1 字段改写为 v2 结构
        return true;
    }
}
```

* 没有 migration config 时，直接反序列化。
* 有 config 时，框架会先读取 schema version 字段，migration 按版本顺序执行。
* 成功迁移后的数据会回写成新格式。

## 备份与恢复

持久化层会尽量采用保守策略：主文件读取失败时尝试备份回退，损坏文件可能被重命名为 `.corrupt`，恢复失败则回退为默认值。
