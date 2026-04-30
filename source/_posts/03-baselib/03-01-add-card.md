---
title: 添加卡牌
date: 2026-04-02 00:00:00
permalink: docs/03-baselib/03-01-add-card/
categories:
- Basics
---
## 代码

创建一个新的`Cards`文件夹方便管理，并创建新的`cs`文件，例如`TestCard.cs`。

```csharp
using BaseLib.Abstracts;
using BaseLib.Utils;
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.Localization.DynamicVars;
using MegaCrit.Sts2.Core.Models.CardPools;
using MegaCrit.Sts2.Core.ValueProps;

namespace Test.Scripts.Cards;

// 注册卡牌。如果要写自定义池看添加人物的开头
[Pool(typeof(ColorlessCardPool))]
public class TestCard : CustomCardModel
{
    // 基础耗能
    private const int energyCost = 1;
    // 卡牌类型
    private const CardType type = CardType.Attack;
    // 卡牌稀有度
    private const CardRarity rarity = CardRarity.Common;
    // 目标类型（AnyEnemy表示任意敌人）
    private const TargetType targetType = TargetType.AnyEnemy;
    // 是否在卡牌图鉴中显示
    private const bool shouldShowInCardLibrary = true;

    // 卡牌的基础属性（例如这里是12点伤害）
    protected override IEnumerable<DynamicVar> CanonicalVars => [new DamageVar(12, ValueProp.Move)];

    public TestCard() : base(energyCost, type, rarity, targetType, shouldShowInCardLibrary)
    {
    }

    // 打出时的效果逻辑
    protected override async Task OnPlay(PlayerChoiceContext choiceContext, CardPlay cardPlay)
    {
        await DamageCmd.Attack(DynamicVars.Damage.BaseValue) // 造成伤害，数值来源于卡牌的基础伤害属性
            .FromCard(this) // 伤害来源于这张卡牌
            .Targeting(cardPlay.Target) // 伤害目标是玩家选择的目标
            .Execute(choiceContext);
    }

    // 升级后的效果逻辑
    protected override void OnUpgrade()
    {
        DynamicVars.Damage.UpgradeValueBy(4); // 升级后增加4点伤害
    }
}
```

* `CanonicalVars`翻译是“规范值”，指卡牌的基础数值。添加一个`DamageVar`意为指定卡牌的基础伤害是多少，例如这里是`12`。

* `ValueProp`表示数值的属性，例如`ValueProp.Move`表示是通过卡牌造成的伤害/格挡，`ValueProp.Unpowered`表示不受修正影响（如力量等），`ValueProp.Unblockable`表示伤害不可被格挡，`ValueProp.SkipHurtAnim`表示跳过受伤动画。这是一个bitflag类型的枚举，你可以进行组合，例如`ValueProp.Unblockable | ValueProp.Unpowered`，不可被格挡也不受修正影响。

* 尖塔2使用了`async`和`await`来控制效果逻辑顺序执行，比如选择一张牌时就一直`await`不让后续代码执行，和尖塔1的`action`类似的生态位。此处的`OnPlay`中写了一个造成单体伤害的指令。

* 想做什么样的卡牌，看原版代码哪张有类似的效果，参考即可。

* 添加一个`Pool`的attribute，并指定要添加的颜色卡池，然后会自动注册。

* 继承`CustomCardModel`而不是`CardModel`。

* <b>注意</b>：通过`baselib`添加卡牌，其id会变成`{命名空间第一段大写}-{原卡牌id}`，例如`namespace Test.Scripts;`取`TEST`，原始卡牌id为`TEST-CARD`，是`TestCard`的大写snake-case，最后变成`TEST-TEST_CARD`。

## 卡图

可以通过在卡牌类中添加一个表达式属性来添加卡牌，这样的话可以任意指定位置：`public override string PortraitPath => $"res://{modid}/images/cards/{GetType().Name}.png";`，
如果这样，那么路径就是`test/images/cards/TestCard.png`。当然按你的喜好组织资源路径也可。

`modId`即为你`{modId}.json`中填写的。<b>不是你的根目录，而是一个新文件夹。</b>


卡图任意尺寸都可，且不需要裁剪，官方使用的尺寸是普通卡250x190，先古卡250x351。

```csharp
public class TestCard : TestCardModel
{
    private const int energyCost = 1;
    private const CardType type = CardType.Attack;
    private const CardRarity rarity = CardRarity.Common;
    private const TargetType targetType = TargetType.AnyEnemy;
    private const bool shouldShowInCardLibrary = true;

    protected override IEnumerable<DynamicVar> CanonicalVars => [new DamageVar(12, ValueProp.Move)];

    // 添加这一行，指定卡牌立绘路径，这里是test/images/cards/TestCard.png
    public override string PortraitPath => $"res://test/images/cards/{nameof(TestCard)}.png";

    public TestCard() : base(energyCost, type, rarity, targetType, shouldShowInCardLibrary)
    {
    }
}
```

![示例卡图](../../images/image10.png)

你也可以通过新增一个`abstract`类，避免每张卡都写一遍卡图路径，并且方便管理一些自定义功能。

```csharp
public abstract class TestCardModel : CustomCardModel
{
    public override string PortraitPath => $"res://test/images/cards/{GetType().Name}.png";

    public TestCardModel(int energyCost, CardType type, CardRarity rarity, TargetType targetType, bool shouldShowInCardLibrary) : base(energyCost, type, rarity, targetType, shouldShowInCardLibrary)
    {
    }
}

public class TestCard : TestCardModel {}
```

## 文本

此外还需要本地化文件。创建一个`{modId}/localization/{Language}/cards.json`。
* `modId`即为你`{modId}.json`中填写的。<b>不是你的根目录，而是一个新文件夹。</b>
* `Language`可以写`zhs`表示简体中文。填写`{CardId}.title`（卡牌名）和`{CardId}.description`（卡牌描述）：

```json
{
    "TEST-TEST_CARD.title": "测试卡牌",
    "TEST-TEST_CARD.description": "造成{Damage:diff()}点伤害。"
}
```

* `{Damage:diff()}`对应前面的`DamageVar`。

编译打包`dll`和`pck`后打开游戏。如果你在对应池子中看到卡牌说明成功了。如果没有任何卡牌（或者一张在左上角的卡牌）说明出问题了。

按`~`打开控制台输入`card TEST-TEST_CARD`获得这张卡。

![示例卡牌](../../images/image11.png)

## 最终项目参考

如果报错，回头看看。最终项目结构参考：

```
Test (你的项目文件夹)
├── Scripts (你的脚本文件夹，随意)
│   ├── TestCard.cs
│   └── Entry.cs
└── Test (不要忘了这一层文件夹，是你的modid)
    ├── images
    │   └── cards
    │       └── TestCard.png
    └── localization
        └── zhs
            └── cards.json
```
