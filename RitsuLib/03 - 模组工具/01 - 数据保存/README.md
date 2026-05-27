## 挂载对象的局内保存（SavedAttachedState）

如果你想给卡牌、遗物等对象添加一个会随存档保存的状态，可以使用`SavedAttachedState<TOwner, TValue>`。

下面以遗物为例：每回合开始时记录经过的回合数，并把这个数值显示在遗物描述里的`{GameTurns}`中。

```csharp
using Godot;
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Entities.Relics;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.Localization.DynamicVars;
using MegaCrit.Sts2.Core.Models.RelicPools;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Scaffolding.Content;
using STS2RitsuLib.Utils;

namespace Test.Scripts;

[RegisterRelic(typeof(SharedRelicPool))]
// [RegisterCharacterStarterRelic(typeof(TestCharacter))]
public class TestRelic : ModRelicTemplate
{
    // 加上这行
    public static readonly SavedAttachedState<TestRelic, int> GameTurns = new("GameTurns", _ => 0);

    public override RelicRarity Rarity => RelicRarity.Common;

    protected override IEnumerable<DynamicVar> CanonicalVars => [
        new CardsVar(1),
        new DynamicVar("GameTurns", GameTurns[this])
    ];

    public override RelicAssetProfile AssetProfile => new(
        IconPath: $"res://Test/images/relics/{Id.Entry.ToLowerInvariant()}.png",
        IconOutlinePath: $"res://Test/images/relics/{Id.Entry.ToLowerInvariant()}.png",
        BigIconPath: $"res://Test/images/relics/{Id.Entry.ToLowerInvariant()}.png"
    );

    public override async Task AfterPlayerTurnStart(PlayerChoiceContext choiceContext, Player player)
    {
        // 每回合开始时，修改GameTurns的值，并改变遗物描述中{GameTurns}的值为GameTurns的值
        GameTurns[this]++;
        DynamicVars["GameTurns"].BaseValue = GameTurns[this];
        await CardPileCmd.Draw(choiceContext, DynamicVars.Cards.IntValue, player);
    }
}
```

`SavedAttachedState<TestRelic, int>`表示给`TestRelic`附加一个`int`类型的可保存状态。

```csharp
public static readonly SavedAttachedState<TestRelic, int> GameTurns = new("GameTurns", _ => 0);
```

* 第一个参数`"GameTurns"`是保存用的状态名，同一个对象类型里不要重复。

* 第二个参数`_ => 0`是默认值构造，读档时没有这个值就会使用`0`。

* 使用`GameTurns[this]`读取或修改当前遗物实例上的状态。

如果这个值需要显示在描述里，记得同时添加`DynamicVar`：

```csharp
protected override IEnumerable<DynamicVar> CanonicalVars => [
    new CardsVar(1),
    new DynamicVar("GameTurns", GameTurns[this])
];
```

本地化文本示例：

```json
{
  "TEST_RELIC_TEST_RELIC.title": "测试遗物",
  "TEST_RELIC_TEST_RELIC.description": "每回合开始时，抽[blue]{Cards}[/blue]张牌。\n已经历过[blue]{GameTurns}[/blue]回合了。",
  "TEST_RELIC_TEST_RELIC.flavor": "觉得很眼熟？"
}
```

这样`GameTurns`就会在局内保存和读取，不需要你自己额外写序列化逻辑。

## 全局的局内保存（RunSavedData）

`RunSavedData`可用于一局游戏全局的数据保存，也包括联机模式下每个玩家单独的数据。请查看对应章节（`RitsuLib/02 - 玩法基底/09 - 局内数据`）。

## 跨局的数据持久化（ModDataStore）

要想实现**一直存在的跨局数据**（例如：解锁进度、击杀统计、你的 Mod 的独立设置面板参数），你需要使用更底层的存储方案：`ModDataStore`。

`RitsuLib` 的这一套持久化架构提供全自动的文件读写和分发处理，支持按存档槽位隔离、或者全存档通用配置。

### 定义与注册你的数据

与保存局内数据类似，你需要编写一个极其简单的 C# 类用作序列化载体。并在内容最初始化阶段告诉系统有这份数据的存在。

```csharp
using STS2RitsuLib;
using STS2RitsuLib.Data;
using STS2RitsuLib.Modding;

namespace Test.Scripts.Data;

// 定义我们要保存的数据结构
public sealed class ModProgressData
{
    public int GlobalMonstersKilled { get; set; } = 0;
    public bool HasUnlockedSecret { get; set; } = false;
}

// 放在初始化函数中
using (RitsuLibFramework.BeginModDataRegistration(Entry.ModId))
{
    var store = RitsuLibFramework.GetDataStore(Entry.ModId);

    // 向磁盘注册一项数据
    store.Register<ModProgressData>(
        key: "mod_progress",               // ID键值，一旦确定不要轻易改动
        fileName: "test_mod_progress.json", // 决定它在硬盘里的名字
        scope: SaveScope.Global,           // 这是一份通用的全局数据
        defaultFactory: () => new ModProgressData(), // 首次创建的默认值
        autoCreateIfMissing: true          // 是否在玩家第一次挂载 Mod 后自动帮他在硬盘里生成文件
    );
}
```

RitsuLib 将“数据存储的范围”划分为两种常用级别：
- **全局生效 (`SaveScope.Global`)**：所有存档槽位互通共用。适合存 Mod 独立的“游戏选项/设置”、快捷键绑定、玩家在你的 Mod 里的通用全局成就等。
- **当前存档槽位生效 (`SaveScope.Profile`)**：只针对游戏主界面选中的特定存档位 (Profile) 独立。在存档 A 里解锁的东西，如果换到新建的存档 B 就没有了。非常适合存储当前玩家游玩你的新角色的经验值进度、特定于某个存档的卡牌解锁状态。

### 读写档位数据

当游戏已经加载好时，可以拿取和存入这些数据。

**读取数据：**
```csharp
var store = RitsuLibFramework.GetDataStore(Entry.ModId);

// 提取我们在前面用 "mod_progress" 这个 Key 注册时的数据
var progress = store.Get<ModProgressData>("mod_progress");

if (progress.HasUnlockedSecret)
{
    // ...让特定卡牌生成
}
```

**更新与写入数据：** 如果你需要修改它，并在硬盘中保存好防止丢失：

```csharp
var store = RitsuLibFramework.GetDataStore(Entry.ModId);

// 使用内置的 Modify 闭包函数进行修改，它能确保状态的线程一致性
store.Modify<ModProgressData>("mod_progress", data => 
{
    data.GlobalMonstersKilled += 1;
    if (data.GlobalMonstersKilled > 1000)
    {
        data.HasUnlockedSecret = true;
    }
});

// 你必须手动调用，否则不会保存。
store.Save("mod_progress");
```

> ⚠️ **你必须显式调用 `.Save("your_key")` 它才会被安全地写入物理磁盘**。可以在多次修改才进行一次 `.Save()` 写入操作。

**查询数据是否存在：**

```csharp
var store = RitsuLibFramework.GetDataStore(Entry.ModId);
if (!store.HasExistingData("mod_progress"))
{
    Entry.Logger.Info("没有生成过我的数据。");
    // 执行给予见面礼物等初始化逻辑...
}
```