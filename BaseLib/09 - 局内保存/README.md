## SavedProperty

在卡牌、遗物、附魔、Modifier（每日挑战效果）的`Model`的属性中中添加带`SavedProperty`的属性即可保存。

```csharp
[Pool(typeof(SharedRelicPool))]
public class TestRelic : CustomRelicModel
{
    // 这个属性会被保存。建议添加前缀id防止撞车。
    // 设置不同的SerializationCondition来控制属性的保存条件，例如这里使用默认值AlwaysSave表示无论属性值是什么都保存。
    [SavedProperty]
    public int Test_GameTurns { get; set; } = 0;

    // 添加新的动态变量
    protected override IEnumerable<DynamicVar> CanonicalVars => [new CardsVar(1), new DynamicVar("GameTurns", Test_GameTurns)];

    public override async Task AfterPlayerTurnStart(PlayerChoiceContext choiceContext, Player player)
    {
        // 每回合开始时，修改Test_GameTurns的值，并改变卡牌描述中{GameTurns}的值为Test_GameTurns的值
        Test_GameTurns++;
        DynamicVars["GameTurns"].BaseValue = Test_GameTurns;
        await CardPileCmd.Draw(choiceContext, DynamicVars.Cards.IntValue, player);
    }
}
```

```json
{
  "TEST-TEST_RELIC.title": "测试遗物",
  "TEST-TEST_RELIC.description": "每回合开始时，抽[blue]{Cards}[/blue]张牌。\n已经历过[blue]{GameTurns}[/blue]回合了。",
  "TEST-TEST_RELIC.flavor": "觉得很眼熟？"
}
```

## SavedSpireField

使用一个静态变量`SavedSpireField<TType, TVal>`可以为一个类添加可保存的新的变量。这种方式不需要你对类有编辑能力，例如可往所有遗物里加个变量。

* `TType`目前只能是卡牌、遗物、附魔、Modifier（每日挑战效果）。

* `TVal`只能是可支持的类，见最下方。

正常添加即可：

```csharp
[Pool(typeof(TestRelicPool))]
public class TestRelic : CustomRelicModel
{
    public override RelicRarity Rarity => RelicRarity.Common;

    protected override IEnumerable<DynamicVar> CanonicalVars => [new CardsVar(1)];

    // 为TestRelic类型加一个int类型的变量。第一个参数是默认值构造。第二个参数是保存id，尽量独特以防撞车。
    public static SavedSpireField<TestRelic, int> GameTurnsField = new(() => 0, "Test_GameTurns");

    public override async Task AfterPlayerTurnStart(PlayerChoiceContext choiceContext, Player player)
    {
        // 每回合开始时，修改GameTurns的值
        // 使用Set设置，使用Get获取。或者使用GameTurnsField[this]获取也可以。
        GameTurnsField.Set(this, GameTurnsField.Get(this) + 1);
        await CardPileCmd.Draw(choiceContext, DynamicVars.Cards.IntValue, player);
    }
}
```

支持的类：

```csharp
    protected static readonly HashSet<Type> SupportedTypes =
    [
        typeof(int),
        typeof(bool),
        typeof(string),
        typeof(ModelId),
        typeof(int[]),
        typeof(SerializableCard),
        typeof(SerializableCard[]),
        typeof(List<SerializableCard>),
    ];
    
    protected static bool IsTypeSupported(Type t) =>
        SupportedTypes.Contains(t) || t.IsEnum || (t.IsArray && t.GetElementType()!.IsEnum);
```

此外你也可以使用`SpireField<TType, TVal>`为一个类添加新的变量，无法保存。