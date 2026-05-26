> 以下文章由AI编写，之后将会修正迁移，如有错误请提出。

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
