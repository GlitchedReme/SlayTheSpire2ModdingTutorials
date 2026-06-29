可以使用 RitsuLib 提供的 `ModCustomReward` 基类来实现自定义奖励。

---

## 1. 注册奖励类型

每个自定义奖励都需要一个 `RewardType` 标识。`RewardType` 是可兼容原版的枚举。

在 `Entry.Init()` 中注册：（或者在自己创建的管理类，不要忘了注册即可）

```csharp
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Logging;
using MegaCrit.Sts2.Core.Modding;
using MegaCrit.Sts2.Core.Rewards;
using MegaCrit.Sts2.Core.Saves.Runs;
using STS2RitsuLib;
using STS2RitsuLib.Combat.Rewards;

namespace MyMod.Scripts;

[ModInitializer(nameof(Init))]
public static class Entry
{
    public const string ModId = "MyMod";
    public static readonly Logger Logger = RitsuLibFramework.CreateLogger(ModId);

    // 把分配到的 RewardType 存为静态字段，方便后续引用
    public static RewardType TokenRewardType;

    public static void Init()
    {
        // 注册一个无需保存的奖励：读档时直接新建一个新实例
        TokenRewardType = ModRewardRegistry.For(ModId)
            .RegisterOwned(
                // 奖励ID，最终生成 MYMOD_REWARD_TOKEN
                "token",
                // 工厂函数，读档时保存的奖励重建为运行时对象
                (save, player, json) => new MyTokenReward(player))
            .RewardType;
    }
}
```

---

## 2. 编写奖励类

新建一个类继承 `ModCustomReward`：

```csharp
using System.Threading.Tasks;
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Rewards;
using STS2RitsuLib.Combat.Rewards;

namespace MyMod.Scripts.Rewards;

public class MyTokenReward : ModCustomReward
{
    // 必须保留的构造函数；把所属玩家传给底层的 Reward 基类
    public MyTokenReward(Player player) : base(player) { }

    // 【必须】使用你注册得到的 RewardType
    public override RewardType ModRewardType => Entry.TokenRewardType;

    // 【可选】图标资源路径。如果返回null就只显示空白容器
    protected override string? RewardIconPath => "res://MyMod/images/rewards/token.png";

    // 【可选】描述文本所在的 LocTable 文件名（默认 gameplay_ui）
    // protected override string DescriptionLocTable => "gameplay_ui";

    // 【可选】描述 Key；不写默认会用注册时分配的 ID（这里是 MYMOD_REWARD_TOKEN）
    // protected override string DescriptionLocKey => "MYMOD_REWARD_TOKEN";

    // 【必须实现】标记奖励内容已被玩家查看过（例如卡牌或药水）。
    public override void MarkContentAsSeen()
    {
    }

    // 【必须实现】玩家点击这个奖励时执行的实际效果
    protected override async Task<bool> OnSelect()
    {
        // 例如：给玩家 25 金币
        await PlayerCmd.GainGold(25, Player);

        // true：领取成功，UI 把这个选项消除
        // false：领取被取消（例如玩家在二次确认界面取消），按钮保留
        return true;
    }
}
```

### 本地化文本

在 `{modId}/localization/{lang}/gameplay_ui.json` 添加：

```json
{
    "MYMOD_REWARD_TOKEN": "获得 25 金币"
}
```

---

## 3. 把奖励发放给玩家

例如在卡牌效果里这么写：（如果你在遗物或者其他，只要找到 `CombatState` 即可，例如 `Owner.CombatState` ）

```csharp
using MegaCrit.Sts2.Core.Rooms;

if (CombatState.RunState.CurrentRoom is CombatRoom combatRoom)
{
    combatRoom.AddExtraReward(player, new MyTokenReward(player));
}
```

如果你是在原版遗物的 `OnGetRewards`（或类似回调）里追加，则直接：

```csharp
rewards.Add(new MyTokenReward(Owner));
```

---

## 数据存档（带 Payload 的奖励）

如果你的奖励包含**动态生成的状态**（例如随机金币数、随机选中的卡牌 ID），为了保证玩家在结算界面按 ESC 退出再读档进来时奖励不会被刷新或丢失，必须把这些状态写入存档。

`ModCustomReward` 提供了便捷重载：

### 1. 定义 Payload 与 JSON 上下文

```csharp
using System.Text.Json.Serialization;

namespace MyMod.Scripts.Rewards;

public readonly record struct TokenPayload(int TokenCount);

[JsonSerializable(typeof(TokenPayload))]
internal sealed partial class MyJsonContext : JsonSerializerContext;
```

### 2. 注册时传入 JSON 协定与带 Payload 的工厂

```csharp
TokenRewardType = ModRewardRegistry.For(ModId)
    .RegisterOwned<TokenPayload>(
        "token",
        MyJsonContext.Default.TokenPayload,
        // 此处的 payload 已被 RitsuLib 解码；payload 为 null 时说明旧档没有数据
        (save, player, payload) => new MyTokenReward(player, payload?.TokenCount ?? 0))
    .RewardType;
```

### 3. 在奖励类里序列化 Payload

```csharp
public class MyTokenReward : ModCustomReward
{
    private readonly int _tokenCount;

    public MyTokenReward(Player player, int count) : base(player)
    {
        _tokenCount = count;
    }

    public override RewardType ModRewardType => Entry.TokenRewardType;

    // 把奖励特有状态序列化为 JSON 字符串挂载到存档
    public override string? ToModRewardJson()
    {
        return System.Text.Json.JsonSerializer.Serialize(
            new TokenPayload(_tokenCount),
            MyJsonContext.Default.TokenPayload);
    }

    protected override async Task<bool> OnSelect()
    {
        await PlayerCmd.GainGold(_tokenCount, Player);
        return true;
    }
}
```

> Payload 中只能放 JSON 可序列化的数据（`int`、`string`、`record struct` 组合等）。不要塞 Godot 节点或图片等对象。

如果你已经在用 `ToSerializable<TPayload>(payload, jsonTypeInfo)` 重载，可以省掉手写 `ToModRewardJson`，但要在 `ToSerializable` 重写里返回 `base.ToSerializable<TPayload>(...)`。两种写法二选一即可。

---

## 联机同步的规则

> *（奖励集合中“选了哪个奖励”由原版引擎自动网络同步；但奖励自身造成的副作用必须在所有客户端确定性执行，否则你需要自己显式同步。）*

- 例如当队伍领取奖励时，A 玩家点击了 `MyTokenReward`，原版会把“点击收取”的事件广播给所有人，每个客户端都会执行一次你的 `OnSelect()`。
- 但是！如果你在 `OnSelect()` 里包含**随机数检定**或**只在本地存在的资源**，不同客户端的结果可能不一致，导致断连或状态分裂。

所以确保你的 `OnSelect()` 中执行的逻辑：
1. **严格确定**：用 `RunState.Rng` 等所有客户端共享的随机序列，或所有计算因子两边完全对等。
2. **走原版同步**：直接派发已被开发组封装好的网络指令，例如 `PlayerCmd.GainGold`、`PlayerCmd.GainRelic` 等。
