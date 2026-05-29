## 原版

如果你只想发黄光和红光，直接在你的卡牌类里重写以下属性即可：

```csharp
    // 何时发金色光
    protected override bool ShouldGlowGoldInternal => Owner.Creature.GetPowerAmount<TestPower>() > 5;

    // 何时发红色光
    protected override bool ShouldGlowRedInternal => !Owner.Creature.HasPower<TestPower>();
```

## 任意发光

ritsulib提供发任意颜色光的能力。可以在初始化函数`Entry.Init`中注册。

```csharp
public static void Init()
{
    ModCardHandOutlineRegistry.Register<TestCard>(ModCardHandOutlineRules.Fixed( // 特定种类卡牌。可以设置为你的卡牌基类，让所有子类发光。
        card => card.Owner.Creature.CurrentHp <= 10, // 发光条件
        Colors.Purple // 发光颜色
        // 0, // （可选）优先级。更高的才会展示。
        // false // 不可打出时隐藏边框
    ));
}
```

使用`Dynamic`也可以注册动态变化的泛光：

```csharp
    ModCardHandOutlineRegistry.Register<TestCard>(ModCardHandOutlineRules.Dynamic(
        card => card.Owner.Creature.CurrentHp <= 10,
        card => card.Owner.Creature.CurrentHp <= 5 ? Colors.Red : Colors.Orange // 决定该是什么颜色
    ));
```