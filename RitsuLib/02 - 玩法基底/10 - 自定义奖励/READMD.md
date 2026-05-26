> 以下文章由AI编写，之后将会修正迁移，如有错误请提出。

这一章补两个战斗奖励相关的进阶入口：自定义奖励和自定义目标类型。

自定义奖励解决“奖励屏幕上出现一个新按钮，点了以后执行自己的逻辑”；自定义目标类型解决“卡牌只能选择某类生物，或一次影响某一组生物”。

## 注册奖励类型

先注册一个属于自己 Mod 的 reward id。推荐在 `Entry.Init()` 里调用，和内容注册放在同一阶段。

```csharp
using System.Text.Json.Serialization;
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Rewards;
using MegaCrit.Sts2.Core.Saves.Runs;
using STS2RitsuLib.Combat.Rewards;

namespace Test.Scripts;

public readonly record struct TestGoldRewardPayload(int Gold);

[JsonSerializable(typeof(TestGoldRewardPayload))]
public sealed partial class TestRewardJsonContext : JsonSerializerContext
{
}

public sealed class TestGoldReward(Player player, int gold = 25) : ModCustomReward(player)
{
    private readonly int _gold = gold;

    public static ModRewardDefinition Definition { get; private set; } = null!;

    public static void Register()
    {
        Definition = ModRewardRegistry.For(Entry.ModId)
            .RegisterOwned<TestGoldRewardPayload>(
                "TEST_GOLD",
                TestRewardJsonContext.Default.TestGoldRewardPayload,
                static (save, player, payload) =>
                    new TestGoldReward(player, payload?.Gold ?? 25));
    }

    public override RewardType ModRewardType => Definition.RewardType;

    protected override string DescriptionLocTable => "test_ui";

    protected override string DescriptionLocKey => "reward.test_gold";

    protected override string? RewardIconPath =>
        "res://Test/images/rewards/test_gold.png";

    protected override async Task<bool> OnSelect()
    {
        await PlayerCmd.GainGold(_gold, Player);
        return true;
    }

    public override string? ToModRewardJson()
    {
        return System.Text.Json.JsonSerializer.Serialize(
            new TestGoldRewardPayload(_gold),
            TestRewardJsonContext.Default.TestGoldRewardPayload);
    }

    public override void MarkContentAsSeen()
    {
    }
}
```

初始化时注册：

```csharp
public static void Init()
{
    var assembly = Assembly.GetExecutingAssembly();
    RitsuLibFramework.EnsureGodotScriptsRegistered(assembly, Logger);
    ModTypeDiscoveryHub.RegisterModAssembly(ModId, assembly);

    TestGoldReward.Register();
}
```

`RegisterOwned` 会生成类似 `TEST_REWARD_TEST_GOLD` 的稳定 reward id，并把它映射到一个确定的动态 `RewardType`。读档时 RitsuLib 会先用你传入的 `JsonTypeInfo` 解析 payload，再调用 factory 重建奖励。

如果奖励没有额外状态，可以不用泛型 overload：

```csharp
ModRewardRegistry.For(Entry.ModId)
    .RegisterOwned("TEST_SWITCH", static (save, player, json) =>
        new TestSwitchReward(player));
```

## 显示奖励

RitsuLib 负责让自定义 reward 能被序列化、读回和显示图标；“什么时候把它放进奖励列表”仍由你的玩法决定。最简单的验证方式是使用原版 `RewardsCmd.OfferCustom`：

```csharp
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Rewards;

namespace Test.Scripts;

public static class TestRewardDebug
{
    public static Task Offer(Player player)
    {
        List<Reward> rewards =
        [
            new TestGoldReward(player, 25),
        ];

        return RewardsCmd.OfferCustom(player, rewards);
    }
}
```

正式内容里可以在事件、休息点选项、特殊房间、遭遇结算 patch 等位置把 `TestGoldReward` 加入奖励集合。多人模式下，奖励“选了哪个”由原版同步，但奖励自己的副作用仍要保持确定性，或用联机通信显式同步。

## 本地化与资源

`ModCustomReward.Description` 默认会读取 `DescriptionLocTable` 和 `DescriptionLocKey`：

```json
{
  "test_ui": {
    "reward.test_gold": "获得金币。"
  }
}
```

奖励图标使用 Godot 资源路径：

```text
Test
├── images
│   └── rewards
│       └── test_gold.png
└── localization
    └── zhs
        └── ui.json
```

`ToModRewardJson()` 返回的是 Mod 自己的 sideband 数据。它会随战斗房间奖励一起保存，读档后再交给注册时的 factory。不要把玩家对象、Godot 节点或运行时引用塞进 payload，只保存可重建的数字、字符串、模型 id。

## 监听领取

如果只想在任意奖励被领取后做额外逻辑，用生命周期事件，不需要 patch 奖励按钮。

```csharp
using STS2RitsuLib;

namespace Test.Scripts;

public static class TestRewardHooks
{
    public static void Register()
    {
        RitsuLibFramework.SubscribeLifecycle<RewardTakenEvent>(OnRewardTaken);
    }

    private static void OnRewardTaken(RewardTakenEvent e)
    {
        if (e.Reward is not TestGoldReward)
            return;

        Entry.Logger.Info("玩家领取了 TestGoldReward。");
    }
}
```
