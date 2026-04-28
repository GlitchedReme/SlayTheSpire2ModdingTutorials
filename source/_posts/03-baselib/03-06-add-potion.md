---
title: 03-06 添加新药水
date: 2026-04-02 00:00:00
permalink: docs/03-baselib/03-06-add-potion/
categories:
- Basics
---
首先创建类：（很多代码和卡牌类似，参考即可）

```csharp
using BaseLib.Abstracts;
using BaseLib.Utils;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Creatures;
using MegaCrit.Sts2.Core.Entities.Potions;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.HoverTips;
using MegaCrit.Sts2.Core.Localization.DynamicVars;
using MegaCrit.Sts2.Core.Models.Cards;

namespace Test.Scripts;

// 注册药水。如果要写自定义池看添加人物的开头
[Pool(typeof(TestPotionPool))]
public class TestPotion : CustomPotionModel
{
    // 稀有度
    public override PotionRarity Rarity => PotionRarity.Common;

    // 使用方式，CombatOnly表示只能在战斗中使用。
    public override PotionUsage Usage => PotionUsage.CombatOnly;

    // 目标类型
    public override TargetType TargetType => TargetType.Self;

    // 定义动态变量
    protected override IEnumerable<DynamicVar> CanonicalVars => [new CardsVar(3)];

    // 这里显示预览卡牌灵魂。或者你可以添加提示关键词
    public override IEnumerable<IHoverTip> ExtraHoverTips => [HoverTipFactory.FromCard<Soul>()];

    // 药水图片。不一定svg，只要最终能变成Texture的格式就行。
    public override string? CustomPackedImagePath => "res://icon.svg";
    public override string? CustomPackedOutlinePath => "res://icon.svg";

    // 打出时的效果逻辑，这里是创造3张灵魂到手牌中。
    protected override async Task OnUse(PlayerChoiceContext choiceContext, Creature? target)
    {
        // 这里的DynamicVars.Cards.IntValue就是我们在CanonicalVars中定义的CardsVar的数值，也就是3。
        await Soul.CreateInHand(Owner, DynamicVars.Cards.IntValue, Owner.Creature.CombatState!);
    }
}
```

然后创建`{modId}/localization/{Language}/potions.json`。

```json
{
    "TEST-TEST_POTION.title": "戈多药水",
    "TEST-TEST_POTION.description": "将[blue]{Cards}[/blue]张[gold]灵魂[/gold]加入你的[gold]手牌[/gold]。"
}
```
