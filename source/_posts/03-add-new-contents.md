---
title: 03 添加新内容
date: 2026-03-09 00:00:00
permalink: docs/03-add-new-contents/
categories:
- Basics
---

如同尖塔1一样，添加一个新内容包括以下步骤：编写类、注册、写本地化文本。

## 添加新卡牌

### 代码

创建一个新的`Cards`文件夹方便管理，并创建新的`cs`文件，例如`TestCard.cs`。

```csharp
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.Localization.DynamicVars;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.ValueProps;

namespace Test.Scripts.Cards;

public class TestCard : CardModel
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

然后通过`ModHelper.AddModelToPool`注册这张卡牌。

```csharp
namespace Test.Scripts;

[ModInitializer("Init")]
public class Entry
{
    public static void Init()
    {
        // 把TestCard添加到无色牌池。你也可以加到SilentCardPool等。
        ModHelper.AddModelToPool<ColorlessCardPool, TestCard>();
    }
}
```

### 卡图

如果要添加卡图，放一张图到`images/packed/card_portraits/{Pool}/{CardId}.png`，任意尺寸都可，且不需要裁剪，官方使用的尺寸是普通卡1000x760，先古卡606x852。

![示例卡图](../../images/image10.png)

* 其中`pool`有`ironclad`,`silent`,`regrent`,`necrobinder`,`colorless`等选项。
* `CardId`是你类名的`snake_case`命名风格，例如`TestCard`即为`test_card`。
* 由于id通过类名生成，且暂时没有`basemod`，推荐给你的卡牌类名加个前缀防止和其他作者的卡牌id撞车产生问题。

### 文本

此外还需要本地化文件。创建一个`{PCKName}/localization/{Language}/cards.json`。
* `PCKName`即为你`mod_manifest.json`中填写的。
* `Language`可以写`zhs`表示简体中文。填写`{CardId}.title`（卡牌名）和`{CardId}.description`（卡牌描述）：

```json
{
    "TEST_CARD.title": "测试卡牌",
    "TEST_CARD.description": "造成{Damage:diff()}点伤害。"
}
```

编译打包`dll`和`pck`后打开游戏。如果你在对应池子中看到卡牌说明成功了。如果没有任何卡牌（或者一张在左上角的卡牌）说明出问题了。

按`~`打开控制台输入`card TEST_CARD`获得这张卡。

![示例卡牌](../../images/image11.png)

## 添加新遗物

TODO：和添加卡牌类似。

## 添加新人物

官方没有给接口，且*非常麻烦*，需要大量的资源。此处等待一个`basemod`。