---
title: 03-04 添加卡牌属性
date: 2026-04-02 00:00:00
permalink: docs/03-04-card-properties/
categories:
- Basics
---
## 添加新卡牌关键词

这里的关键词指的是`消耗`，`虚无`一类的卡牌属性，塔2并不需要你在卡牌描述里写这些，只需在`CanonicalKeywords`添加即可。

* 使用`CustomEnum`可以为枚举添加新的值。新建一个类：

```csharp
public class MyKeywords
{
    // 自定义枚举的名字。最终会变成{前缀}-{枚举值大写}的形式，例如TEST-UNIQUE
    [CustomEnum("UNIQUE")]
    // 放在原版卡牌描述的位置，这里是卡牌描述的前面
    [KeywordProperties(AutoKeywordPosition.Before)]
    public static CardKeyword Unique;
}
```

* 添加一个本地化文件，`{modId}/localization/{Language}/card_keywords.json`。

```json
{
    "TEST-UNIQUE.description": "卡组中只能有一张同名牌。",
    "TEST-UNIQUE.title": "唯一"
}
```

* 然后在你的卡牌类里添加这一行，或者添加keyword：

```csharp
    public override IEnumerable<CardKeyword> CanonicalKeywords => [MyKeywords.Unique];
```

![alt text](../../images/image23.png)

## 添加新动态变量

动态变量是指`伤害`，`格挡`，`抽牌数`，`获得能量数`等这种动态数值。虽然可以通过`new DynamicPower("xxx", 1)`这种形式添加，但是写一个新的类比较规范也便于扩展功能。参考`变量与描述`这章。

通过`baselib`的`WithTooltip`可以添加tooltip。<b>如果不需要添加本地化文本，就不添加这行。</b>

先创建新的类：
```csharp
using BaseLib.Extensions;
using MegaCrit.Sts2.Core.Localization.DynamicVars;

namespace Test.Scripts;

public class TestDynamicVar : DynamicVar
{
    // 在描述中用作占位符的键，推荐添加前缀避免撞车
    public const string Key = "Test-Leech";
    // 本地化键，这里设置为大写的Key，也就是"TEST-LEECH"
    public static readonly string LocKey = Key.ToUpperInvariant();

    public TestDynamicVar(decimal baseValue) : base(Key, baseValue)
    {
        this.WithTooltip(LocKey);
    }
}
```

（可选）然后添加一个新的本地化文件`{modId}/localization/{Language}/static_hover_tips.json`。

```json
{
    "TEST-LEECH.description": "吸取等量生命。",
    "TEST-LEECH.title": "汲取"
}
```

如果要使用这个变量，在卡牌类的`CanonicalVars`中添加你新建的变量即可。

```csharp
    protected override IEnumerable<DynamicVar> CanonicalVars => [
        new DamageVar(12, ValueProp.Move),
        new TestDynamicVar(3)
    ];
```

然后在卡牌的描述写上`{Test-Leech}`以使用：

```json
{
    "TEST-TEST_CARD.title": "测试卡牌",
    "TEST-TEST_CARD.description": "[gold]汲取[/gold]{Test-Leech:diff()}。\n造成{Damage:diff()}点伤害。"
}
```

`:diff()`表示这个值一旦和基础值不同，就会变红色或绿色（例如升级时增加数值，预览变成绿色）。


![alt text](../../images/image26.png)

当然如果你只是个简单的数值，这样就行：

```csharp
    protected override IEnumerable<DynamicVar> CanonicalVars => [
        new DamageVar(12, ValueProp.Move),
        new DynamicVar("Test-Leech", 1m)
        // .WithTooltip("TEST-LEECH") // 如果要加本地化
    ];
```

## 添加卡牌提示文本

指的是卡牌旁出现的提示方框，或预览卡牌。在描述里的关键词一般是添加提示文本和染色搭配，例如`易伤`，`激发`等。

仅需在卡牌类中重载`ExtraHoverTips`即可：

```csharp
[Pool(typeof(TestCardPool))]
public class TestCard : CustomCardModel
{
    // 其余省略

    // 通过HoverTipFactory添加各种提示文本
    protected override IEnumerable<IHoverTip> ExtraHoverTips => [
        HoverTipFactory.FromCard<Shiv>(),
        HoverTipFactory.FromPower<BlurPower>(),
        HoverTipFactory.FromKeyword(MyKeywords.Unique)
    ];
}
```

## 添加卡牌tag

tag是指`打击` `防御`这种。如果有打击tag会被打击木偶增伤。使用`CustomEnum`可以为枚举添加新的值。新建一个类：

```csharp
public class MyCardTags
{
    [CustomEnum]
    public static CardTag Test;
}
```

然后在卡牌类中重载`Tags`即可：

```csharp
[Pool(typeof(TestCardPool))]
public class TestCard : CustomCardModel
{
    // 其余省略

    // 添加tag
    public override IEnumerable<CardTag> Tags => [MyCardTags.Test];
}
```

如果要判断，使用`if (Card.Tags.Contains(MyCardTags.Test)) {}`即可。`Card`需要是个`CardModel`类型。