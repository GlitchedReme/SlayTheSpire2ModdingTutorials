---
title: 04-04 添加卡牌属性
date: 2026-04-21 00:00:00
permalink: docs/04-ritsulib/04-04-card-properties/
categories:
- Basics
---
## 添加新卡牌关键词

这里的关键词指的是`消耗`，`虚无`一类的卡牌属性。`RitsuLib`没有`customenum`，但是统一管理。

* 新建一个类：

```csharp
[RegisterOwnedCardKeyword(nameof(Unique), IconPath = "res://icon.svg", CardDescriptionPlacement = ModKeywordCardDescriptionPlacement.BeforeCardDescription)]
// [RegisterOwnedCardKeyword(nameof(Unique2), IconPath = "res://icon.svg")] // 如果要加更多关键词，添加特性
public class MyKeywords
{
    public static readonly string Unique = ModContentRegistry.GetQualifiedKeywordId(Entry.ModId, nameof(Unique));
    // public static readonly string Unique2 = ModContentRegistry.GetQualifiedKeywordId(Entry.ModId, nameof(Unique2));
}
```

* `CardDescriptionPlacement`代表这个关键词的描述加在卡牌的位置。`BeforeCardDescription`表示在描述之前。默认不显示。

* `IconPath`和`CardDescriptionPlacement`都是可选的。

* 添加一个本地化文件，`{modId}/localization/{Language}/card_keywords.json`。使用的键是`TEST_KEYWORD_{id大写}`。

```json
{
    "TEST_KEYWORD_UNIQUE.description": "卡组中只能有一张同名牌。",
    "TEST_KEYWORD_UNIQUE.title": "唯一"
}
```

* 然后在你的卡牌类里添加这一行添加自定义keyword：

```csharp
    protected override IEnumerable<string> RegisteredKeywordIds => [MyKeywords.Unique];
```

判断是否有：`card.HasModKeyword(MyKeywords.Unique)`

![alt text](../../images/image23.png)

## 添加新动态变量

动态变量是指`伤害`，`格挡`，`抽牌数`，`获得能量数`等这种动态数值。虽然可以通过`new DynamicPower("xxx", 1)`这种形式添加，但是写一个新的类比较规范也便于扩展功能。参考`变量与描述`这章。

通过`ritsulib`的`WithSharedTooltip`可以添加tooltip。<b>如果不需要添加本地化文本，就不添加这行。</b>

如果你只是个简单的数值，这样就行：

```csharp
    protected override IEnumerable<DynamicVar> CanonicalVars => [
        new DamageVar(12, ValueProp.Move),
        ModCardVars.Int("Leech", 3)
        //.WithSharedTooltip("TEST_LEECH") // 如果要加本地化
    ];
```

（可选）然后添加一个新的本地化文件`{modId}/localization/{Language}/static_hover_tips.json`。

```json
{
    "TEST_LEECH.description": "吸取等量生命。",
    "TEST_LEECH.title": "汲取"
}
```

然后在卡牌的描述写上`{Leech}`以使用：

```json
{
    "TEST_CARD_TEST_CARD.title": "测试卡牌",
    "TEST_CARD_TEST_CARD.description": "[gold]汲取[/gold]{Leech:diff()}。\n造成{Damage:diff()}点伤害。"
}
```

`:diff()`表示这个值一旦和基础值不同，就会变红色或绿色（例如升级时增加数值，预览变成绿色）。


![alt text](../../images/image26.png)


## 添加卡牌提示文本

指的是卡牌旁出现的提示方框，或预览卡牌。在描述里的关键词一般是添加提示文本和染色搭配，例如`易伤`，`激发`等。

和塔1不同，关键词提示是通过描述染色（`[gold]易伤[/gold]`）然后添加卡牌提示文本实现的。

例如，你给卡牌加上`消耗`就会自动给你加它的提示文本。但是如果你的卡牌没有`消耗`但是描述中是`“消耗一张牌”`，就通过这种方式添加提示文本。

仅需在卡牌类中重载`AdditionalHoverTips`即可：

```csharp
[RegisterCard(typeof(TestCardPool))]
public class TestCard : ModCardTemplate
{
    // 其余省略

    // 通过HoverTipFactory添加各种提示文本
    protected override IEnumerable<IHoverTip> AdditionalHoverTips => [
        HoverTipFactory.FromCard<Shiv>(),
        HoverTipFactory.FromPower<TestPower>(),
        HoverTipFactory.FromKeyword(CardKeyword.Exhaust),
        // ModKeywordRegistry.CreateHoverTip(MyKeywords.Unique), // 自定义关键词
    ];
}
```

## 添加卡牌tag

`ritsulib`暂时不支持添加自定义的卡牌tag。也许暂时可以用keyword替代。
