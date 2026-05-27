`RitsuLib` 提供了 `RunSavedData` 和 `PlayerRunSavedData` 来帮助你极简地实现局内数据持久化，同时还自带了**开局大厅暂存**和**多人联机同步**的支持。

---

## 定义数据结构

首先，我们需要建一个用来装数据的类。
根据数据的作用范围，分为两种情况：
- **全局共享** (`RunSavedData<T>`)：全队共用的数据。比如这局游戏的难度、总计击杀精英数量。
- **按玩家独立** (`PlayerRunSavedData<T>`)：每个玩家分开算的数据。比如联机时，一号玩家选了什么卡牌包，二号玩家选了什么卡牌包。

```csharp
namespace Test.Scripts.RunData;

// 全局共享
public sealed class ChallengeRunState
{
    public string? ChallengeId { get; set; }
    public int ElitesKilled { get; set; }
    public bool HardMode { get; set; }
}

// 属于单个玩家数据
public sealed class PlayerRunState
{
    public string? LoadoutId { get; set; }
    public int DraftRerolls { get; set; }
}
```

---

## 注册数据槽位

为了方便后面到处调用，我们可以把注册返回的句柄存成静态变量。

```csharp
using MegaCrit.Sts2.Core.Modding;
using STS2RitsuLib;
using STS2RitsuLib.RunData;

namespace Test.Scripts.RunData;

[ModInitializer(nameof(Init))]
public static class Entry
{
    public const string ModId = "test";
    // 全局数据句柄
    public static RunSavedData<ChallengeRunState> Challenge = null!;
    // 玩家数据句柄
    public static PlayerRunSavedData<PlayerRunState> Player = null!;

    public static void Init()
    {
        using (RitsuLibFramework.BeginModDataRegistration(ModId))
        {
            var store = RitsuLibFramework.GetRunSavedDataStore(ModId);

            // 注册全局共享的配置
            Challenge = store.Register(
                key: "challenge",
                defaultFactory: () => new ChallengeRunState(),
                options: new RunSavedDataOptions
                {
                    WritePolicy = RunSavedDataWritePolicy.WhenNonDefault,
                    SyncLobbyOnChange = true, // 允许在大厅修改时同步给队友
                });

            // 注册按玩家独立的配置
            Player = store.RegisterPerPlayer(
                key: "player",
                defaultFactory: () => new PlayerRunState(),
                options: new RunSavedDataOptions
                {
                    WritePolicy = RunSavedDataWritePolicy.WhenSet,
                    SyncLobbyOnChange = true, // 允许在大厅修改时同步给队友
                });
        }
    }
}
```

> **提示**：`key` 是游戏存档中识别这块数据的唯一标识符。模组发布并有人游玩后，**绝对不要修改被注册的 `key`**，否则老玩家的这部分存档会丢失。（如果你需要给数据加新内容，直接去刚写的 C# 类里加新属性即可。）

---

## 在游戏中读取和修改数据

进入游戏后，我们就可以通过刚刚存下的静态句柄，随时对数据进行读写了。你只需要传入当前的 `RunState`。

### 访问全局共享数据
```csharp
using MegaCrit.Sts2.Core.Runs;
// 假设我们在一个卡牌效果里，方法里能拿到 runState
RunState runState = ...;

// 读取
var challengeData = TestRunData.Challenge.Get(runState);
if (challengeData.HardMode)
{
    // 触发困难模式特效...
}

// 修改
TestRunData.Challenge.Modify(runState, data => 
{
    data.ElitesKilled += 1; // 增加精英击杀数
});
```
`Modify` 是非常推荐的做法。它不仅可以让你用闭包直接修改数据，还会**自动打上“已修改”标记**，向引擎宣告这部分数据需要保存到硬盘。

### 访问玩家独立数据
按玩家独立的数据提取起来同样简单，唯一的区别是你需要额外告诉它“查的是哪个玩家”（通过玩家本身的实例，或者网络ID `netId`）。

```csharp
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Runs;

Player player = ...;

// 读取当前玩家的数据
var playerData = TestRunData.Player.Get(player);
int currentRerolls = playerData.DraftRerolls;

// 修改当前玩家的数据
TestRunData.Player.Modify(player, data =>
{
    data.DraftRerolls -= 1;
});

// 你也可以通过 RunState + NetId 操作其他玩家的数据
ulong teammateNetId = ...;
TestRunData.Player.Modify(runState, teammateNetId, data => 
{
    data.LoadoutId = "shared_loadout";
});
```

共享槽位只接受主机 net id 的贡献。客户端如果需要提交自己的选择，应写 `PlayerRunSavedData<T>`，并用本机 `lobby.NetService.NetId` 作为玩家 key。主机开始跑局时提交权威快照，之后所有玩家通过跑局存档和重连恢复同一份数据。

---

## 大厅暂存数据

这部分是在跑局刚开始建立前用到的。许多时候，我们需要玩家在**大厅界面**（比如选人、选挑战选项时）更改自己想要的局内数据。

在没有正式“开始游戏”前，`RunState` 其实还没建立，因此我们没法直接调用 `Get(runState)`。RitsuLib 提供了一个开局准备暂存区（Lobby Scope）。

```csharp
using MegaCrit.Sts2.Core.Multiplayer.Game.Lobby;

namespace Test.Scripts.RunData;

public static class TestLobbyRunData
{
    // 在大厅界面切换全局挑战
    public static void SelectChallenge(StartRunLobby lobby, string challengeId, bool hardMode)
    {
        TestRunData.Challenge.Lobby.Modify(lobby, data =>
        {
            data.ChallengeId = challengeId;
            data.HardMode = hardMode;
        });
    }

    // 在大厅界面切换玩家初始包
    public static void SelectLocalLoadout(StartRunLobby lobby, string loadoutId)
    {
        // NetService.NetId 是你当前的本地网络ID
        TestRunData.Player.Lobby.Modify(lobby, lobby.NetService.NetId, data =>
        {
            data.LoadoutId = loadoutId;
        });
    }
}
```

前面注册槽位时，我们传入了 `SyncLobbyOnChange = true`。这意味着只要你在这里调用了 `Lobby.Modify`，RitsuLib 就会自动帮你把这个数据的改动**同步给主机和队友**。

## 监听提交时机

通过订阅事件管线可监听：`RunSavedDataLobbyStagingEvent` 用来驱动大厅 UI 预览，`RunSavedDataPreparingEvent` 用来在 run snapshot 导出前补齐最终值。

```csharp
RitsuLibFramework.SubscribeLifecycle<RunSavedDataLobbyStagingEvent>(evt =>
{
    if (evt.IsHost && evt.Reason == RunSavedDataLobbyStagingReason.ContributionMerged)
        Entry.Logger.Info("大厅跑局数据已合并，可以刷新预览。");
});

RitsuLibFramework.SubscribeLifecycle<RunSavedDataPreparingEvent>(evt =>
{
    TestRunData.Challenge.Modify(evt.RunState, data =>
    {
        data.ChallengeId ??= "standard";
    });
});
```

`RunSavedDataLobbyStagingReason` 常见值如下：

| 值 | 何时出现 |
| - | - |
| `ContributionMerged` | 主机合并了本地或远端玩家贡献。 |
| `PlayerJoined` | 新玩家进入大厅，RitsuLib 给 session 补玩家槽。 |
| `Manual` | 你调用了 `RunSavedDataLobby.NotifyStagingChanged(lobby)`。 |
| `Committing` | 主机即将构建新开局快照。 |

## 选择写入策略

| 策略 | 适合场景 |
| - | - |
| `WhenSet` | 默认选择。只有通过 `Set` 或 `Modify` 显式改过的值才写入。 |
| `WhenNonDefault` | 默认对象可以被反复读取，但只有和默认值不同才进存档。适合挑战开关、计数器。 |
| `AlwaysWhenRegistered` | 只要槽位能解析就写入。适合每局都必须带 schema 的控制数据。 |

`WhenNonDefault` 会把当前值和 `defaultFactory` 创建的新对象序列化后比较，所以默认工厂要稳定，不要放随机数、时间戳或运行时对象引用。

## 给槽位加迁移

如果你迫不得已要修改数据的结构，需要设置结构迁移，将数据从旧版本迁往新版本。

`RunSavedDataOptions.SchemaVersion` 写进每个槽位。旧版本读入时，RitsuLib 会按 `IMigration.FromVersion` 找迁移，直到升级到当前版本。

```csharp
using System.Text.Json.Nodes;
using STS2RitsuLib.Utils.Persistence.Migration;

namespace Test.Scripts.RunData;

public sealed class ChallengeV1ToV2Migration : IMigration
{
    public int FromVersion => 1;
    public int ToVersion => 2;

    public bool Migrate(JsonObject data)
    {
        if (data["data"] is not JsonObject payload)
            return false;

        payload["hardMode"] ??= false;
        return true;
    }
}
```

注册时挂到同一个槽位：

```csharp
Challenge = store.Register(
    key: "challenge",
    defaultFactory: () => new ChallengeRunState(),
    options: new RunSavedDataOptions
    {
        SchemaVersion = 2,
        WritePolicy = RunSavedDataWritePolicy.WhenNonDefault,
        SyncLobbyOnChange = true,
        Migrations = new[] { new ChallengeV1ToV2Migration() },
    });
```