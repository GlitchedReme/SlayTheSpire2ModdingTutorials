---
title: 04-06 添加新药水
date: 2026-04-21 00:00:00
permalink: docs/04-ritsulib/04-06-add-potion/
categories:
- Basics
---
> 以下示例默认已经在`Entry.Init()`中调用了`RitsuLibFramework.EnsureGodotScriptsRegistered(...)`和`ModTypeDiscoveryHub.RegisterModAssembly(...)`，否则自动注册不会生效。

首先创建类：（很多代码和卡牌类似，参考即可）

```csharp
using MegaCrit.Sts2.Core.Entities.Creatures;
using MegaCrit.Sts2.Core.Entities.Potions;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.HoverTips;
using MegaCrit.Sts2.Core.Localization.DynamicVars;
using MegaCrit.Sts2.Core.Models.Cards;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

// 注册药水。如果要写自定义池看添加人物的开头
[RegisterPotion(typeof(SharedPotionPool))]
public class TestPotion : ModPotionTemplate
{
    // 稀有度
    public override PotionRarity Rarity => PotionRarity.Common;

    // 使用方式，CombatOnly表示只能在战斗中使用。
    public override PotionUsage Usage => PotionUsage.CombatOnly;

    // 目标类型
    public override TargetType TargetType => TargetType.Self;

    // 定义动态变量
    protected override IEnumerable<DynamicVar> CanonicalVars => [new CardsVar(3)];

    // 这里显示预览卡牌灵魂。或者你也可以添加提示关键词
    protected override IEnumerable<IHoverTip> AdditionalHoverTips => [HoverTipFactory.FromCard<Soul>()];

    // 药水图片。不一定非得是png，只要最终能被Godot当成Texture读取即可。
    public override PotionAssetProfile AssetProfile => new(
        ImagePath: "res://icon.svg",
        OutlinePath: "res://icon.svg"
    );

    // 使用时的效果逻辑，这里是创造3张灵魂到手牌中。
    protected override async Task OnUse(PlayerChoiceContext choiceContext, Creature? target)
    {
        await Soul.CreateInHand(Owner, DynamicVars.Cards.IntValue, Owner.Creature.CombatState!);
    }
}
```

* `[RegisterPotion(typeof(TestPotionPool))]`会把药水自动注册到指定药水池。示例里用的是自定义角色药水池。
* 继承的是`ModPotionTemplate`。
* `CanonicalVars`、`AdditionalHoverTips`这些写法和卡牌类似。
* `AssetProfile`里的`ImagePath`和`OutlinePath`分别对应药水本体和轮廓图。

然后创建`{ModId}/localization/{Language}/potions.json`。

```json
{
    "TEST_POTION_TEST_POTION.title": "戈多药水",
    "TEST_POTION_TEST_POTION.description": "将[blue]{Cards}[/blue]张[gold]灵魂[/gold]加入你的[gold]手牌[/gold]。"
}
```

* `{Cards}`对应前面的`CardsVar(3)`。

## 最终项目参考

```text
Test
├── Scripts
│   ├── Entry.cs
│   ├── TestPotion.cs
│   └── TestPotionPool.cs
├── icon.svg
└── Test
    └── localization
        └── zhs
            └── potions.json
```
