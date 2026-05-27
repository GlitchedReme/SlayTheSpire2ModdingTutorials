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

## 自定义单体目标

RitsuLib 预置了一些目标类型，例如 `CustomTargetType.Anyone`、`AnyAttackingEnemy`、`AllBlockingEnemies`。如果你的条件更特殊，可以注册自己的 `TargetType`。

```csharp
using MegaCrit.Sts2.Core.Entities.Cards;
using STS2RitsuLib;

namespace Test.Scripts;

public static class TestTargets
{
    public static TargetType WoundedEnemy { get; private set; }

    public static TargetType AllWoundedEnemies { get; private set; }

    public static void Register()
    {
        WoundedEnemy = RitsuLibFramework.RegisterSingleTargetType(
            Entry.ModId,
            "WOUNDED_ENEMY",
            static creature =>
                creature is { IsMonster: true, IsAlive: true }
                && creature.CurrentHp < creature.MaxHp);

        AllWoundedEnemies = RitsuLibFramework.RegisterMultiTargetType(
            Entry.ModId,
            "ALL_WOUNDED_ENEMIES",
            static creature =>
                creature is { IsMonster: true, IsAlive: true }
                && creature.CurrentHp < creature.MaxHp);
    }
}
```

同样在初始化时调用：

```csharp
TestTargets.Register();
```

`localStem` 发布后不要改。相同 `modId + localStem` 会得到相同的动态枚举值；改掉以后旧存档和联机双方的目标类型可能对不上。

## 在卡牌里使用

单体目标和原版 `AnyEnemy` 一样，在 `cardPlay.Target` 里拿到玩家选中的生物。

```csharp
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.Localization.DynamicVars;
using MegaCrit.Sts2.Core.Models.Cards;
using MegaCrit.Sts2.Core.ValueProps;
using STS2RitsuLib.Cards.DynamicVars;
using STS2RitsuLib.Combat.CardTargeting;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

public sealed class StrikeWounded
    : ModCardTemplate(1, CardType.Attack, CardRarity.Common, TestTargets.WoundedEnemy)
{
    protected override IEnumerable<DynamicVar> CanonicalVars =>
        [new DamageVar(10, ValueProp.Move)];

    protected override async Task OnPlay(PlayerChoiceContext choiceContext, CardPlay cardPlay)
    {
        foreach (var target in this.GetTargets(cardPlay.Target))
        {
            await DamageCmd.Attack(DynamicVars.Damage.BaseValue)
                .FromCard(this)
                .Targeting(target)
                .Execute(choiceContext);
        }
    }
}
```

群体目标会显示多个目标指示器，但卡牌打出时没有单个选中目标。用 `this.GetTargets()` 解析实际目标：

```csharp
public sealed class StrikeAllWounded
    : ModCardTemplate(2, CardType.Attack, CardRarity.Uncommon, TestTargets.AllWoundedEnemies)
{
    protected override IEnumerable<DynamicVar> CanonicalVars =>
        [new DamageVar(7, ValueProp.Move)];

    protected override async Task OnPlay(PlayerChoiceContext choiceContext, CardPlay cardPlay)
    {
        foreach (var target in this.GetTargets())
        {
            await DamageCmd.Attack(DynamicVars.Damage.BaseValue)
                .FromCard(this)
                .Targeting(target)
                .Execute(choiceContext);
        }
    }
}
```

`GetTargets()` 会统一处理原版目标、自定义单体目标和自定义群体目标。这样卡牌升级、复制或自动打出时不需要自己再写一套目标分支。

## 验证

* 进游戏前日志里能看到 reward 注册，没有重复 id 报错。
* `RewardsCmd.OfferCustom` 打开的奖励界面能显示图标和描述，点击后执行 `OnSelect`。
* 战斗房间保存再读档后，自定义 reward 能从 payload 重建。
* 自定义单体目标只能点中符合谓词的生物。
* 自定义群体目标显示多个指示器，`GetTargets()` 返回的目标和屏幕上的目标一致。
* 多人测试时，所有客户端都在初始化阶段注册了同样的 reward id 和 target type stem。
