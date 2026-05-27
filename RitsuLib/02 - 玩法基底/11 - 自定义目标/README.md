如果你的卡牌拥有更特殊的瞄准条件（比如要求“只能指定一个有护甲的敌人”，或者“对所有当前拥有攻击意图的怪物造成伤害”），我们就需要使用**自定义目标类型**了。

`RitsuLib` 的目标扩展系统不仅让你能极简地定制自己专属的箭头捕捉逻辑，还提供了一套全方位兼容单体与群体选取的遍历扩展。

---

## RitsuLib 预置的目标类型

在手写注册前，RitsuLib 的 `CustomTargetType` 类为你预先配备好了原版没有，但呼声极高的常用目标类型：

- **`CustomTargetType.Anyone`**: 单体目标，允许你把指向箭头指在**任意存活的友方或敌方**。
- **`CustomTargetType.Everyone`**: 群体目标，包含场上所有存活的生物。
- **`CustomTargetType.AnyAttackingEnemy`** / **`AllAttackingEnemies`**: 单体 / 群体目标，限定为“当前拥有攻击意图的存活敌人”。
- **`CustomTargetType.AnyBlockingEnemy`** / **`AllBlockingEnemies`**: 单体 / 群体目标，限定为“当前护甲大于0的存活敌人”。
- **`CustomTargetType.AllHighestHpEnemies`** / **`AllLowestHpEnemies`**: 群体目标，当前血量并列最高 / 最低的所有存活敌人。
- 等等...

如果这些恰好符合你的需求，直接看`结算目标`一节如何使用即可，不需要做任何注册动作，你可以**直接将卡牌中的 `TargetType` 填为上述值。**

---

## 注册自定义目标类型

若预置类型仍未能满足，RitsuLib 为你提供了注册的 API，只要你提供回调即可。

可以单独建一个类来存储返回的 `TargetType`，然后将它们在你的模组启动阶段进行一并注册：

```csharp
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Creatures;
using STS2RitsuLib.Combat.CardTargeting;

namespace Test.Scripts.Cards;

public static class TestTargets
{
    // 将注册得到的 TargetType 存下来，方便其他卡牌调用
    public static TargetType WoundedEnemy { get; private set; }
    public static TargetType AllWoundedEnemies { get; private set; }

    public static void Register()
    {
        // 1. 注册一个【单体目标】：目前带有受损伤血的存活怪物
        WoundedEnemy = CustomTargetType.RegisterSingleTargetType(
            Entry.ModId,
            "WOUNDED_ENEMY", // 独立的字符标识，发布后不要更改
            creature => creature is { IsMonster: true, IsAlive: true } && creature.CurrentHp < creature.MaxHp
        );

        // 2. 注册一个【群体目标】：目前全场所有的受损怪物
        AllWoundedEnemies = CustomTargetType.RegisterMultiTargetType(
            Entry.ModId,
            "ALL_WOUNDED_ENEMIES",
            creature => creature is { IsMonster: true, IsAlive: true } && creature.CurrentHp < creature.MaxHp
        );
    }
}
```

> **注意**：注册时传入的标识字符串（例如 `"WOUNDED_ENEMY"`） 必须在你的 Mod 中保持唯一，且模组一旦发布后**绝对不要去修改它**。底层机制会根据这个字符计算与绑定一个确定性的枚举数字写入玩家存档，随意改名会让旧存档读挡时由于匹配不到此卡类型的目标导致问题。

之后别忘了在你的模块初始化点（例如 `Entry.Init()`）调用一次 `TestTargets.Register()`。

---

## 结算目标

不管你使用了原生自带的目标类型、上述第一点提到的 RitsuLib 预置类型、还是手写的自定义类型，你都可以用 **`CardModelTargetingExtensions.GetTargets()`** 来获得合法的目标。

```csharp
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using STS2RitsuLib.Combat.CardTargeting;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts.Cards;

// 构建牌时向上传递自己刚刚建好的自定义卡牌目标类型 (也可以是原版的，或其它任意合法定义)
public sealed class StrikeWounded()
    : ModCardTemplate(1, CardType.Attack, CardRarity.Common, TestTargets.WoundedEnemy)
{
    // ... 声明对应的伤害动态变量 ...

    protected override async Task OnPlay(PlayerChoiceContext choiceContext, CardPlay cardPlay)
    {
        // 核心：调用 this.GetTargets(cardPlay.Target)
        // 这个方法会自动校验：
        // 1. 若卡牌是单体目标：判断 cardPlay.Target 有没有合法传入被选中的那只怪并转为列表给出
        // 2. 若卡牌是群体目标：根据注册规则找出全场所有亮起预定圈圈范围的合法目标返回
        
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