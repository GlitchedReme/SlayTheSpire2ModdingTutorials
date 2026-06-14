> 以下示例默认已经在`Entry.Init()`中调用了`ModTypeDiscoveryHub.RegisterModAssembly(...)`，否则自动注册不会生效。

组件（ModelCapability）是 RitsuLib 提供的通用附加行为系统，可以挂载到任意 `AbstractModel`（卡牌、遗物、药水、能力、怪物、角色等）上，实现模块化的功能注入。

类似塔1的cardmodifier，或者塔2的附魔（但是可以存在多个且不只限于卡牌）。

## 代码

假设你想实现一个"每次抽到这张牌时获得 1 点力量"的效果：

```csharp
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.Logging;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Models.Cards;
using MegaCrit.Sts2.Core.Models.Powers;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Models.Capabilities;

namespace Test.Scripts.Capabilities;

[RegisterModelCapability]
public class DrawPowerCapability : CardCapability
{
    protected override void OnAttach(CardModel model)
    {
        Log.Info("组件被挂载");
    }

    protected override void OnDetach(CardModel model)
    {
        Log.Info("组件被卸载");
    }

    public override async Task AfterCardDrawn(
        PlayerChoiceContext choiceContext,
        CardModel card,
        bool fromHandDraw)
    {
        if (Owner != null && card == Owner)
            await PowerCmd.Apply<StrengthPower>(choiceContext, Owner.Owner.Creature, 1, Owner.Owner.Creature, null);
    }
}
```

- `[RegisterModelCapability]` 会自动注册这个组件，组件 id 为 `{MODID}_MODEL_CAPABILITY_{类名的大写SNAKE_CASE}`。
- 组件本质也是一个 `AbstractModel`。
- `Owner` 指向挂载的模型实例（这里是 `CardModel`）。
- `CardCapability` 是专为卡牌准备的组件基类，也有其他内容的基类。

然后在卡牌上附加组件：

```csharp
[RegisterCard(typeof(ColorlessCardPool))]
public class TestCard : ModCardTemplate
{
    // ... 基础实现 ...

    protected override async Task OnPlay(PlayerChoiceContext choiceContext, CardPlay cardPlay)
    {
        this.GetOrCreateCapability<DrawPowerCapability>(); // 挂载组件
        await DamageCmd.Attack(DynamicVars.Damage.BaseValue)
            .FromCard(this)
            .Targeting(cardPlay.Target!)
            .Execute(choiceContext);
    }
}
```

- `this.GetOrCreateCapability<DrawPowerCapability>()` 将组件附着到卡牌上，自动触发 `OnAttach`。

## 注册

### 自动注册

用 `[RegisterModelCapability]` attribute 标记类，`ModTypeDiscoveryHub` 会自动注册：

```csharp
[RegisterModelCapability]
public class MyCardCapability : CardCapability { ... }
```

### 手动注册

在 `Entry.Init()` 中：

```csharp
// 通过 ContentRegistry
var content = RitsuLibFramework.GetContentRegistry(ModId);
content.RegisterModelCapability<MyCardCapability>();

// 或静态方法
RitsuLibFramework.RegisterModelCapability<MyCardCapability>(ModId);
```

## 基类一览

RitsuLib 针对不同 model 类型提供了现成的基类：

| 基类                                    | 绑定 owner 类型      | 说明                                                                             |
| --------------------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `CardCapability`                        | `CardModel`          | 卡牌组件，额外暴露 `OnOwnerCardUpgraded`、`OnOwnerCardDowngraded` 等卡牌专属钩子 |
| `CardPlayCapability`                    | `CardModel`          | 卡牌打出组件，自动比对 `cardPlay.Card` 与 `Owner`，只处理自己所属牌的打出        |
| `OneShotCardPlayCapability`             | `CardModel`          | 打出一次后自动移除自身                                                           |
| `OrbCapability`                         | `OrbModel`           | 充能球组件，含 `OnOwnerOrbPassiveTriggered`、`OnOwnerOrbEvoked` 等               |
| `RelicCapability`、`PotionCapability`等 | -                    | 遗物、药水、能力、怪物等也有相应的组件                                           |
| `CharacterCapability`                   | `CharacterModel`     | 角色组件（不接收原版 hook）                                                      |
| `OwnerHookCapability<TModel>`           | 任意 `AbstractModel` | 通用 hook 基类，需要手动指定 owner 类型                                          |
| `UntilCombatEndCapability<TModel>`      | 任意                 | 战斗结束后自动移除自身                                                           |
| `TurnLimitedCapability<TModel>`         | 任意                 | 计数回合后自动移除自身，剩余回合数自动持久化                                     |

如果你想要其他自己指定类型才能挂载的组件，直接继承 `ModelCapability` 或 `ModelCapability<TModel>` 即可。

## 贡献者接口

组件可以实现以下接口，向 owner 注入额外内容。

以 `ICardDescriptionContributor` 为例，实现在卡牌描述底部追加一段文字：

```csharp
using MegaCrit.Sts2.Core.Combat;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Creatures;
using MegaCrit.Sts2.Core.Localization;
using MegaCrit.Sts2.Core.Models.Cards;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Models.Capabilities;

namespace Test.Scripts.Capabilities;

[RegisterModelCapability]
public class HealOnExhaustCapability : CardCapability,
    ICardDescriptionContributor
{
    protected override IEnumerable<DynamicVar> CanonicalVars => [
        new DynamicVar("HealAmount", 2)
    ];

    public IEnumerable<CardDescriptionFragment> GetDescriptionFragments(
        CardDescriptionContext context) =>
    [
        // 在描述底部追加一行 "消耗时回复 2 点生命。"
        new CardDescriptionFragment(
            new LocString("cards", $"{Id.Entry}.exhaustHealDescription"),
            CardDescriptionFragmentPlacement.AfterBase
        )
    ]
}
```

locstring可以自己指定在哪个本地化表写词条。如果你使用`cards`，则本地化文件 `{modId}/localization/{Language}/cards.json` 中需要对应条目：

```json
{
  "TEST_MODELCAPABILITY_HEAL_ON_EXHAUST_CAPABILITY.exhaustHealDescription": "被[gold]消耗[/gold]时，回复[blue]{HealAmount}[/blue]点生命。"
}
```

根据目标分为三类：

### 通用模型接口（任意 owner）

| 接口                          | 作用                                      | 方法                                          |
| ----------------------------- | ----------------------------------------- | --------------------------------------------- |
| `IModelDynamicVarContributor` | 为 owner 的文本提供动态变量               | `GetDynamicVars(AbstractModel)`               |
| `IModelHoverTipContributor`   | 为 owner 添加悬停提示                     | `GetHoverTips(AbstractModel)`                 |
| `IModelAssetPathContributor`  | 声明 owner 需要的资源路径（阻止打包裁剪） | `GetAssetPaths(ModelAssetPathContext)`        |
| `IModelRightClickCapability`  | 处理右键交互                              | `OnRightClick(ModRightClickExecutionContext)` |

### 卡牌组件专用接口

| 接口                                | 作用                                 |
| ----------------------------------- | ------------------------------------ |
| `ICardDescriptionContributor`       | 贡献卡牌描述片段                     |
| `ICardHoverTipContributor`          | 贡献卡牌悬停提示                     |
| `ICardGlowContributor`              | 控制卡牌是否显示金色／红色发光       |
| `ICardPropertyContributor`          | 覆盖卡牌类型、稀有度、目标类型、标签 |
| `ICardPlayStateContributor`         | 控制卡牌可否打出、手牌回合结束效果   |
| `ICardPlayResultContributor`        | 自定义卡牌打出后进入的牌堆           |
| `ICardTransformCarryOverCapability` | 卡牌转化时将自身携带到结果牌         |

### 充能球组件专用接口

| 接口                                 | 作用                         |
| ------------------------------------ | ---------------------------- |
| `IOrbValueDisplayContributor`        | 覆盖被动／激发数值标签的显示 |
| `IOrbHoverTipDescriptionContributor` | 贡献充能球悬停说明片段       |

## 运行时操作

> 组件继承自 `AbstractModel`，**禁止使用 `new`**创建。必须通过注册表或框架 API 创建，例如通过`ModelCapabilityRegistry.GetCapabilityId`和`ModelCapabilityRegistry.Create`。

```csharp
// 获取组件集合（返回 ModelCapabilitySet）
var caps = model.Capabilities();

// 获取指定类型的第一个组件（不存在返回 null）
var cap = model.Capability<DrawPowerCapability>();

// 是否有某种类型的组件
if (model.TryGetCapability<DrawPowerCapability>(out var existing)) { ... }

// 存在则返回，不存在则通过注册表创建并挂载（最常用）
model.GetOrCreateCapability<DrawPowerCapability>();

// 设置卡牌升级时挂载
model.GetOrCreateUpgradeCapability<DrawPowerCapability>();

// 移除组件
var removedCap = model.RemoveCapability<DrawPowerCapability>();

// 应用已有组件（触发合并）
model.ApplyCapability(removedCap);

// 添加组件层数
model.AddCapability(existingCap);

// 减除组件层数
model.SubtractCapability(existingCap);

// 在指定组件之前/之后插入
caps.InsertBefore<SomeOtherCapability>(myCap);
caps.InsertAfter<SomeOtherCapability>(myCap);

// 批量应用
caps.ApplyRange([cap1, cap2, cap3]);
```

## 默认能力

如果你希望某种 model 天生就带某些组件，可以在 Entry 阶段配置默认能力：

```csharp
// 所有 TestRelic 实例创建时自动附加 ChargingRelicCapability
content.ConfigureDefaultModelCapabilities<TestRelic>(
    "charge-on-play", // modifier id（同 mod 内唯一）
    (relic, caps) => caps.Add<ChargingRelicCapability>()
);
```

## 持久化保存

需要在存档里保存数据时，在组件中覆写 `SaveAdditionalState` 与 `LoadAdditionalState` ：

```csharp
[RegisterModelCapability]
public class ChargeCounterCapability : CardCapability
{
    public int Charge { get; private set; }

    // 保存时存入数据
    protected override JsonNode? SaveAdditionalState()
    {
        return JsonSerializer.SerializeToNode(new ChargeData { Charge = Charge });
    }

    // 加载时取出数据
    protected override void LoadAdditionalState(JsonNode? state, int schemaVersion)
    {
        var data = state?.Deserialize<ChargeData>();
        if (data != null) Charge = data.Charge;
    }
}

public class ChargeData
{
    public int Charge { get; set; }
}
```

也可用 `StatefulModelCapability<TState>` 或 `StatefulModelCapability<TModel, TState>` 自动序列化，看场合选用。

## 合并行为

需要控制组件叠加时的行为，实现 `IModelCapabilityMergeHandler`：

```csharp
[RegisterModelCapability]
public class StackableBuffCapability : CardCapability, IModelCapabilityMergeHandler
{
    protected override IEnumerable<DynamicVar> CanonicalVars => [
        new CardsVar(3)
    ];

    // 以下实现同类相加效果。
    // 当然不限于同类，传入的incoming是任意将被应用的组件，你可以自行判断，例如直接return true让所有其他组件无法挂载
    public bool TryMergeWith(IModelCapability incoming, ApplyModelCapabilityOptions options, out IModelCapability? merged)
    {
        if (incoming is StackableBuffCapability other)
        {
            DynamicVars.Cards.BaseValue += other.DynamicVars.Cards.BaseValue;
            merged = this;
            return true;
        }
        merged = null;
        return false;
    }

    // 同类相减
    public bool TrySubtractiveMergeWith(IModelCapability incoming, ApplyModelCapabilityOptions options, out IModelCapability? merged)
    {
        if (incoming is StackableBuffCapability other)
        {
            DynamicVars.Cards.BaseValue -= other.DynamicVars.Cards.BaseValue;
            merged = DynamicVars.Cards.BaseValue <= 0 ? null : this; // 归零时移除自身
            return true;
        }
        merged = null;
        return false;
    }
}
```

**只有 `AddCapability` / `SubtractCapability` / `ApplyCapability` 会走合并流程**：

```csharp
// ✅ 叠加：每次 Add 都触发合并
var cap = ModelCapabilityRegistry.Create<DrawPowerCapability>();
cap.DynamicVars.Cards.BaseValue = 3;
this.AddCapability(cap); // 叠加。使用SubtractCapability移除层数

// ❌ 不会叠加：GetOrCreate 只创建一次
this.GetOrCreateCapability<StackableBuffCapability>();
```
