新建类：

```csharp
public class TestPower : CustomPowerModel
{
    // 类型，Buff或Debuff
    public override PowerType Type => PowerType.Buff;
    // 叠加类型，Counter表示可叠加，Single表示不可叠加
    public override PowerStackType StackType => PowerStackType.Counter;

    // 自定义图标路径。1:1即可。原版游戏大图256x256，小图64x64。
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