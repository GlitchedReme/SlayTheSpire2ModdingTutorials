> 该功能处于测试阶段，如有问题请提出

次级资源（SecondaryResource）是一套类似`星辉`的**第二套战斗资源系统**。你可以用它制作需要额外费用或额外资源管理的卡牌、遗物和能力。

## 注册资源

每个资源需要先注册定义，之后才能在战斗中使用。在初始化函数中注册。

我们可以建一个新的类来管理，同时也可以直接放在你的主类里。只要保证在初始化中调用即可。

```csharp
using STS2RitsuLib;
using STS2RitsuLib.Combat.SecondaryResources;

public static class ModResources
{
    public static SecondaryResourceDefinition ManaDefinition { get; private set; } = null!;
    public static SecondaryResourceDefinition RageDefinition { get; private set; } = null!;
    public static string ManaId { get; private set; } = string.Empty;
    public static string RageId { get; private set; } = string.Empty;

    public static void Register()
    {
        var registry = RitsuLibFramework.GetSecondaryResourceRegistry(Entry.ModId);

        ManaDefinition = registry.Register("mana", new SecondaryResourceDefinition(
            defaultAmount: 0,
            baseMaxAmount: 3,
            turnStartPolicy: SecondaryResourceTurnStartPolicy.AddMaxToCurrent,
            persistencePolicy: SecondaryResourcePersistencePolicy.Run,
            smallIconPath: "res://Test/images/resources/mana_small.png",
            largeIconPath: "res://Test/images/resources/mana_large.png"
        ));
        ManaId = ManaDefinition.Id;

        RageDefinition = registry.Register("rage", new SecondaryResourceDefinition(
            defaultAmount: 0,
            baseMaxAmount: null,
            turnStartPolicy: SecondaryResourceTurnStartPolicy.Clear,
            persistencePolicy: SecondaryResourcePersistencePolicy.Combat,
            smallIconPath: "res://Test/images/resources/rage_small.png",
            largeIconPath: "res://Test/images/resources/rage_large.png"
        ));
        RageId = RageDefinition.Id;
    }
}
```

**然后不要忘记在你的 `Entry.Init` 中调用。**

* `Register` 的第一个参数 `"mana"` 是本地 ID，返回格式为 `TEST_SECONDARY_RESOURCE_MANA`（`{MODID}_{TYPE}_{LOCALID}`）。

`turnStartPolicy`是回合开始时的自动行为，包括以下类型：

| 策略 | 效果 |
|------|------|
| `None` | 什么都不做 |
| `ResetToMax` | 将当前数量回满到上限 |
| `AddMaxToCurrent` | 将上限数值加到当前数量上（如蓄能） |
| `Clear` | 清零 |

`persistencePolicy`是存档持久化范围，包括：

| 策略 | 效果 |
|------|------|
| `None` | 不存档，仅运行时存在 |
| `Combat` | 在当前战斗内恢复 |
| `Run` | 跨战斗持久化（整局有效） |

## 修改资源数量

使用 `SecondaryResourceCmd` 静态类操作资源：

```csharp
using STS2RitsuLib.Combat.SecondaryResources;

// 读取当前数量
int currentMana = SecondaryResourceCmd.Get(player, ModResources.ManaId);

// 读取当前上限（无上限的资源返回 null）
int? maxMana = SecondaryResourceCmd.GetMax(player, ModResources.ManaId);

// 获得 2 点法力（会经过 Gain Hook 修正）
await SecondaryResourceCmd.Gain(player, ModResources.ManaId, 2);

// 失去 1 点法力
await SecondaryResourceCmd.Lose(player, ModResources.ManaId, 1);

// 直接设为 5 点
await SecondaryResourceCmd.Set(player, ModResources.ManaId, 5);

// 消耗 3 点法力（会经过 Spend Hook，不足不会扣除且返回 false）
bool success = await SecondaryResourceCmd.Spend(player, ModResources.ManaId, 3);

// 重置为默认值（toMax: true 则重置到上限）
await SecondaryResourceCmd.Reset(player, ModResources.ManaId, toMax: true);
```

## 给卡牌添加次级资源费用

卡牌的费用通过 `SecondaryCosts()` 扩展方法附加到 `CardModel` 上，在构造函数中设置：

```csharp
using STS2RitsuLib.Combat.SecondaryResources;

public class TestManaCard : ModCardTemplate
{
    public TestManaCard()
    {
        // 固定费用：打出此牌需要消耗 2 点法力
        this.SecondaryCosts().Set(ModResources.ManaId, 2);
    }
}
```

### 设置费用消耗

X 费用：

```csharp
this.SecondaryCosts().Set(ModResources.ManaId, SecondaryResourceCost.X());       // 消耗所有法力
this.SecondaryCosts().Set(ModResources.ManaId, SecondaryResourceCost.X(2));      // 消耗所有法力，X 数值乘以 2
```

`Set` 的第三个参数 `duration` 可以给卡牌设置**临时的**次级资源消耗，到期自动清除：

```csharp
this.SecondaryCosts().Set(ModResources.ManaId, 1, SecondaryResourceCostDuration.ThisTurn);    // 仅本回合，消耗1点法力
this.SecondaryCosts().Set(ModResources.RageId, 2, SecondaryResourceCostDuration.ThisCombat);  // 仅本场战斗，消耗1点法力
this.SecondaryCosts().Set(ModResources.ManaId, 1, SecondaryResourceCostDuration.UntilPlayed); // 消耗1点法力，打出后清除
```

如需手动清理到期费用，可使用扩展方法：

```csharp
card.ClearSecondaryCostsThisTurn();       // 回合结束时框架自动调用，一般无需手动写
card.ClearSecondaryCostsUntilPlayed();    // 打出后框架自动调用
```

免费打出或者移除费用消耗：

```csharp
this.SecondaryCosts().Set(ModResources.ManaId, SecondaryResourceCost.Free, SecondaryResourceCostDuration.UntilPlayed);  // 免费打出一次
this.SecondaryCosts().Clear(ModResources.ManaId);  // 完全移除该资源的费用，不再显示
```

### 获取 X 的效果数值

如果费用设为 X（消耗全部），需要在卡牌的 `OnPlay` 中获取实际生效的数值：

```csharp
using STS2RitsuLib.Combat.SecondaryResources;

protected override async Task OnPlay(PlayerChoiceContext choiceContext, CardPlay cardPlay)
{
    // 获取 X 费用的效果数值（当前持有量 × XMultiplier，并经过 Hook 修正后）
    int effectValue = cardPlay.SecondaryResources().Value(ModResources.ManaId);

    // 检查是否为 X 费用
    bool wasX = cardPlay.SecondaryResources().CostsX(ModResources.ManaId);

    // 获取实际消耗量
    int spent = cardPlay.SecondaryResources().Spent(ModResources.ManaId);
}
```

## Hook 系统

在遗物、能力或角色上实现 `ISecondaryResourceHookListener` 接口来修改资源行为。**所有钩子都有默认实现，只需重写你需要的方法。**

```csharp
using STS2RitsuLib.Combat.SecondaryResources;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

[RegisterRelic(typeof(SharedRelicPool))]
public class ManaRelic : ModRelicTemplate, ISecondaryResourceHookListener
{
    public override RelicRarity Rarity => RelicRarity.Boss;

    public override RelicAssetProfile AssetProfile => new(
        IconPath: "res://Test/images/relics/ManaRelic.png",
        IconOutlinePath: "res://Test/images/relics/ManaRelic.png",
        BigIconPath: "res://Test/images/relics/ManaRelic.png"
    );

    // 增加法力上限 +2
    public decimal ModifyMaxSecondaryResource(SecondaryResourceMaxContext context, decimal amount)
    {
        if (context.Definition.Id == ModResources.ManaId)
            return amount + 2;
        return amount;
    }

    // 获得法力时额外 +1
    public decimal ModifySecondaryResourceGain(SecondaryResourceContext context, decimal amount)
    {
        if (context.Definition.Id == ModResources.ManaId)
            return amount + 1;
        return amount;
    }

    // 法力变化时，如果归零则失去生命
    public async Task AfterSecondaryResourceChanged(SecondaryResourceChangeContext context)
    {
        if (context.Definition.Id != ModResources.ManaId || context.NewAmount > 0)
            return;

        await context.Player.LoseHp(2, context.Player);
    }
}
```

钩子通过 `context.Definition.Id` 判断是哪个资源，和 `ModResources.ManaId` 比较即可。

接口提供的全部钩子：

| 钩子 | 用途 |
|------|------|
| `ModifySecondaryResourceGain` | 修正获得数量 |
| `ModifyMaxSecondaryResource` | 修正上限 |
| `ModifySecondaryResourceCost` | 修正卡牌固定费用（不含 X 部分） |
| `ModifySecondaryResourceXValue` | 修正 X 费用值 |
| `ShouldGainSecondaryResource` | 阻止资源获得（返回 `false` 则不获得） |
| `ShouldSpendSecondaryResource` | 阻止资源消耗（返回 `false` 则不消耗） |
| `ShouldResetSecondaryResource` | 阻止回合重置（返回 `false` 则不重置） |
| `AfterSecondaryResourceChanged` | 数量变化后回调 |
| `AfterSecondaryResourceSpent` | 资源被消耗后回调 |
| `AfterSecondaryResourceReset` | 资源被重置后回调 |

## 战斗 UI

可以通过`RegisterCombatUi`和`RegisterCardUi`注册次级资源的战斗界面元素。

ritsulib内置封装好的能量盘和卡牌费用展示的组件，例如`NSecondaryResourceCounter`和`NSecondaryResourceCardCostUi`。

如果你想要自定义的ui，请创建并返回自己的，并自行绑定数值和玩家。

以下使用内置的UI：

```csharp
using Godot;
using MegaCrit.Sts2.Core.Nodes.Combat;
using MegaCrit.Sts2.Core.Nodes.Cards;
using STS2RitsuLib.Combat.SecondaryResources;

// 在 ModResources.Register() 中追加：

// 战斗计数器。使用的图标就是你注册时提供的图标
registry.RegisterCombatUi(
    "mana_combat_counter",
    parent =>
    {
        var row = NSecondaryResourceCounter.Create(ManaDefinition, new SecondaryResourceCounterStyle
        {
            FontSize = 32,
            PositiveColor = Colors.Cyan,
            FormatAmount = (amount, max) => amount.ToString(),
            IconStyle = SecondaryResourceIconStyle.Default with
            {
                Size = new Vector2(80, 80),
                HoverTip = SecondaryResourceHoverTipStyle.Default,
            },
        });
        // 自由指定位置。例如这里我们找到能量计数器的位置，放在它旁边
        var energyCounter = parent.GetNode<Control>("%EnergyCounterContainer");
        row.Position = energyCounter.Position + new Vector2(120, -120);
        return row;
    },
    ctx => ctx.Node.Bind(ctx.Player)
);

// 卡牌面上的次级资源费用显示。使用的图标就是你注册时提供的图标
registry.RegisterCardUi(
    "mana_card_ui",
    parent =>
    {
        var ui = NSecondaryResourceCardCostUi.Create(ManaId, new SecondaryResourceCardCostUiStyle
        {
            IconSize = new Vector2(48, 48),
            FontSize = 24,
        });
        // 自由指定位置。例如这里我们找到能量图标的位置，放在它旁边
        var energyIcon = parent.GetNode<TextureRect>("%EnergyIcon");
        ui.Position = energyIcon.Position + new Vector2(0, 80);
        return ui;
    },
    ctx => ctx.Node.Refresh(ctx)
);

// 限定仅对特定角色始终显示
// registry.AlwaysShowInCombatUiForCharacter<Ironclad>(ManaDefinition.LocalId);
// 永远显示（不受角色限制）
registry.AlwaysShowInCombatUi(ManaDefinition.LocalId);

```

* `RegisterCombatUi` 基于 `NodeAttachment` 系统自动挂载（详见"节点附加"教程）。
* `SecondaryResourceCounterStyle` 等style可自由配置喜欢的风格。

## 本地化

次级资源的悬浮提示默认读取 `static_hover_tips` 表。`SecondaryResourceDefinition`定义中的 `locTable` 参数可指定自定义本地化表。

```json
{
    "TEST_SECONDARY_RESOURCE_MANA.title": "法力",
    "TEST_SECONDARY_RESOURCE_MANA.description": "每回合开始时获得数值。跨战斗保留。",
    "TEST_SECONDARY_RESOURCE_RAGE.title": "怒气",
    "TEST_SECONDARY_RESOURCE_RAGE.description": "每回合开始时清零。打出攻击牌可获得怒气。"
}
```

如果没有提供 `titleKey` / `descriptionKey`，框架会按 `{resourceId}.title` 和 `{resourceId}.description` 自动推导 key。

## 在卡牌文本中显示图标

```csharp
using STS2RitsuLib.Combat.SecondaryResources;

// 在 CanonicalVars 中设置变量
protected override IEnumerable<DynamicVar> CanonicalVars => [
    SecondaryResourceVars.For("Mana", ModResources.ManaId, 2)
];

// 本地化文本：
// "消耗 {Mana:secondaryResourceIcons()} 点法力。"
// 或者 {Mana} 使用数字
```