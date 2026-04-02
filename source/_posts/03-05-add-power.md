---
title: 03-05 添加新能力
date: 2026-04-02 00:00:00
permalink: docs/03-05-add-power/
categories:
- Basics
---
新建类：

```csharp
public class TestPower : CustomPowerModel
{
    // 类型，Buff或Debuff
    public override PowerType Type => PowerType.Buff;
    // 叠加类型，Counter表示可叠加，Single表示不可叠加
    public override PowerStackType StackType => PowerStackType.Counter;

    // 自定义图标路径，自己指定，或者创建一个基类来统一指定图标路径
    public override string? CustomPackedIconPath => "res://test/powers/test_power.png";
    public override string? CustomBigIconPath => "res://test/powers/test_power.png";

    // 抽牌后给予玩家力量
    public override async Task AfterCardDrawn(PlayerChoiceContext choiceContext, CardModel card, bool fromHandDraw)
    {
        await PowerCmd.Apply<StrengthPower>(Owner, Amount, Owner, null);
    }
}
```

添加json，`{modId}/localization/{Language}/powers.json`。
```json
{
    "TEST-TEST_POWER.description": "每次抽牌时，获得一点[gold]力量[/gold]。",
    "TEST-TEST_POWER.smartDescription": "每次抽牌时，获得[blue]{Amount}[/blue]点[gold]力量[/gold]。", // smartDescription可以使用{Amount}来显示当前的数值
    "TEST-TEST_POWER.title": "邪火"
}
```

然后使用`PowerCmd.Apply<TestPower>(...)`给予即可。或者使用控制台`power TEST-TEST_POWER 1 0`。

![alt text](../../images/image25.png)

