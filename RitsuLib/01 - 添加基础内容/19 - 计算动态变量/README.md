`ComputedDynamicVar` 是 RitsuLib 提供的 `DynamicVar` 子类，显示值由你传入的委托在运行时计算。

普通变量（如 `IntVar`、`DamageVar`）的值是**静态**的：创建时确定，之后只有 `UpgradeValueBy`、直接改 `BaseValue` 这种显式操作才会变。但当显示值依赖**目标**、**升级状态**、**预览模式**、**战斗上下文**或者**其他变量**时，静态变量就不够用了。

原版有一个 `CalculatedVar`（公式 `base + extra * calculated`），但设计繁琐、问题不少，一般不推荐。`ComputedDynamicVar` 用委托直接算，灵活且好懂。

## 基本用法

### 最简单形式：只依赖卡牌

以下为一个基础值为3点，但是实际值还会加上目标力量层数的例子。

```csharp
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Localization.DynamicVars;
using MegaCrit.Sts2.Core.Models.Cards;
using MegaCrit.Sts2.Core.ValueProps;
using MegaCrit.Sts2.Core.Entities.Creatures;
using MegaCrit.Sts2.Core.Models.Powers;
using STS2RitsuLib.Cards.DynamicVars;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Scaffolding.Content;


namespace Test.Scripts;

[RegisterCard(typeof(TestCardPool))]
public class MyStrike() : ModCardTemplate(1, CardType.Attack, CardRarity.Common, TargetType.AnyEnemy)
{
    protected override IEnumerable<DynamicVar> CanonicalVars =>
    [
        // 显示值 = 基础值加上目标的力量层数
        ModCardVars.Computed("TestValue", 3, (card, target) => DynamicVars["TestValue"].BaseValue + (target?.GetPowerAmount<StrengthPower>() ?? 0)),
    ];

    // 升级时修改 BaseValue
    protected override void OnUpgrade()
    {
        DynamicVars["TestValue"].UpgradeValueBy(2m);
    }
}
```

然后本地化描述里直接引用变量名：

```json
{
  "MY_STRIKE.description": "造成{Damage:diff()}点伤害。获得{TestValue:diff()}点临时力量。"
}
```

参数说明：

| 参数 | 含义 |
| - | - |
| `name` | 变量键，描述里用 `{name}` 引用 |
| `baseValue` | 初始存储的基础值。**求值器不会自动返回它**，只作为后备数据存在，需要时用 `ctx.BaseValue` 或 `DynamicVars["x"].BaseValue` 读取 |
| `currentValueFactory` | 计算当前值的委托，参数是所属卡牌（可能为 `null`，比如预览规范卡牌时）以及目标 |

> **注意：** 计算变量读取基础值时要通过 `DynamicVars["xxx"].BaseValue`（上下文形式里是 `ctx.BaseValue`），不要硬编码一个常量。升级带来的数值变化请在 `OnUpgrade` 里通过 `UpgradeValueBy` 修改 `BaseValue`。这样升级高亮、`IntValue` 等依赖 `BaseValue` 的逻辑都会保持一致。

### 上下文形式

数值依赖多个来源（卡牌、目标、战斗、预览模式、其他变量）时，用上下文 factory：

```csharp
[
    // 等同于new IntVar("TestHeat", 2)
    ModCardVars.Int("TestHeat", 2),
    ModCardVars.Computed(
        "TestCtx",
        static ctx =>
        {
            var heat = ctx.GetCardIntOrDefault("TestHeat");
            var targetBonus = ctx.HasTarget && ctx.IsInCombat
                ? ResolveTargetBonus(ctx.CombatState, ctx.Target)
                : 0m;
    
            return ctx.BaseValue + heat + targetBonus;
        },
        baseValue: 6);
]
```

上下文 factory 是**第二个**参数，`baseValue` 放最后，这样不会和旧的 `(name, baseValue, card => ...)` 形式产生歧义。

> **建议：** 上下文 factory 用 `static`。动态变量会随卡牌克隆，static factory 不会意外捕获创建变量时的卡牌实例。

## ComputedDynamicVarContext 详解

上下文是 `ComputedDynamicVarContext` 类型的参数 `ctx`，实时值和预览共用同一个对象。它提供了一组带空值保护的快捷成员，避免你反复手写 `if (x != null)`。

### 求值状态

| 成员 | 含义 |
| - | - |
| `IsCurrentValue` | 正在计算当前值（非预览） |
| `IsPreview` | 正在计算预览值 |
| `IsNormalPreview` | 普通卡牌预览 |
| `IsUpgradePreview` | 升级预览（NUpgradePreview） |
| `IsMultiTargetPreview` | 多目标选择预览 |
| `ShouldRunGlobalHooks` | 预览且允许运行全局 hook（`IsPreview && RunGlobalHooks`） |

### 卡牌状态

| 成员 | 含义 |
| - | - |
| `Card` | 本次求值的有效卡牌。附魔预览期间可能和 `ModelOwner` 不同 |
| `ModelOwner` | 通过 `DynamicVar.SetOwner` 指定的模型 |
| `IsMutableCard` | 有效卡牌是可变实例（在战斗中的实际卡牌） |
| `IsCanonicalCard` | 有效卡牌是规范实例（图鉴等场景） |
| `IsUpgraded` | 卡牌已升级 |
| `IsEnchantmentPreview` | 正在做附魔预览 |

### 拥有者与作用域

| 成员 | 含义 |
| - | - |
| `Player` | 拥有可变卡牌的玩家。规范卡牌直接返回 `null`，不会触发受保护的 `Owner` getter |
| `SourceCreature` | 拥有/使用卡牌的生物（`Player?.Creature`） |
| `RunState` | 卡牌所属的一局游戏 |
| `CombatState` | 卡牌或其拥有者关联的战斗。卡牌不在战斗牌堆时回退到拥有者的战斗 |
| `CardScope` | 卡牌报告的最小作用域 |

### 所处位置

| 成员 | 含义 |
| - | - |
| `IsInRun` | 卡牌属于一局游戏（`HasRunState`） |
| `IsInCombat` | 卡牌**拥有者**当前在战斗中。即使卡牌在牌组里也可能为 `true` |
| `IsCardInCombat` | 卡牌**自身**报告战斗作用域（`Card.CombatState != null`） |

### 变量读取

| 成员 | 含义 |
| - | - |
| `TryGetCardVar(name, out var)` / `TryGetCardVar<T>(name, out var)` | 尝试从卡牌 `DynamicVars` 拿变量 |
| `GetRequiredCardVar<T>(name)` | 必须存在且类型匹配，否则抛 `KeyNotFoundException` |
| `GetCardBaseValueOrDefault(name, default)` | 读基础值，缺失返回默认值 |
| `GetCardIntOrDefault(name, default)` | 读整数值，缺失返回默认值 |
| `EvaluateCardVarOrDefault(name, default)` | 计算型变量对当前目标求值，普通变量读基础值 |

`EvaluateCardVarOrDefault` 有递归保护：如果目标变量就是当前正在求值的变量（或已在求值栈里），直接返回它的 `BaseValue`，避免无限循环。

## 预览逻辑

### 普通形式：单独的 preview factory

当预览值（卡牌预览、目标预览、升级预览）需要显示**不同于当前实际计算**的值时，传第四个参数：

（例如计算手牌数，预览时因为自己在手牌所以减一排除自己，实际打出不减）

```csharp
ModCardVars.Computed(
    "ExtraDamage",
    Damage,
    (card, target) => ResolveDamage(card, target),                    // 实时值
    (card, mode, target, runGlobalHooks) => ResolvePreviewDamage(card, mode, target)); // 预览值
```

preview factory 参数：

| 参数 | 含义 |
| - | - |
| `card` | 预览目标卡牌 |
| `mode` | `CardPreviewMode`：`None` / `Normal` / `Upgrade` / `MultiCreatureTargeting` |
| `target` | 预览目标生物，可为 `null` |
| `runGlobalHooks` | 是否运行全局 hook（如力量、易伤修正） |

省略 preview factory 时，预览会回退到 currentValueFactory。

### 上下文形式：直接用状态成员

上下文版本不需要单独的 preview delegate，在 factory 里用 `ctx.BaseValue` 配合预览状态成员即可：

```csharp
ModCardVars.Computed(
    "TestMode",
    static ctx => ctx.BaseValue + (ctx.IsPreview ? 1m : 0m),
    baseValue: 3);
```

## 伤害 / 格挡包装

如果你计算的是**伤害**或**格挡**值，并且希望预览时仍然经过原版的修正流程（力量、敏捷、易伤、脆弱、附魔），使用 `ComputedDamage` / `ComputedBlock`，而不是普通 `Computed`。

### ComputedDamage

```csharp
// 预览时会经过 Hook.ModifyDamage（力量、易伤、附魔等）
// ResolveTargetBonus是你自己实现的函数用于自定义计算，或者直接计算也可
ModCardVars.ComputedDamage(
    "ExtraDamage",
    6,
    (card, target) => DynamicVars["ExtraDamage"].BaseValue + ResolveTargetBonus(card?.CombatState, target));
```

### ComputedOstyDamage

奥斯提攻击用 `ComputedOstyDamage`，伤害预览修正会把奥斯提视为伤害来源：

```csharp
ModCardVars.ComputedOstyDamage("ExtraDamage", 7, (card, target) => ResolveOstyDamage(card, target));
```

### ComputedBlock

```csharp
// 预览时会经过 Hook.ModifyBlock（敏捷、脆弱、附魔等）
ModCardVars.ComputedBlock("ExtraBlock", 5, _ => DynamicVars["ExtraBlock"].BaseValue);
```

### 自定义伤害来源 / 格挡接收者

`ComputedDamage` 支持自定义 dealer，`ComputedBlock` 支持自定义 receiver（不一定是卡牌拥有者）：

```csharp
ModCardVars.ComputedDamage(
    "ExtraDamage",
    6,
    (card, target) => ResolveDamage(card, target),
    card => card.Owner.Osty,  // 伤害来源设为奥斯提
    ValueProp.Move);

ModCardVars.ComputedBlock(
    "ExtraBlock",
    5,
    (card, target) => ResolveBlock(card, target),
    card => card.Owner.Osty); // 格挡接收者设为奥斯提
```

### 上下文版本

上下文版本不需要额外 preview delegate，预览修正规则一致：

```csharp
ModCardVars.ComputedDamage(
    "ExtraDamage",
    static ctx => ctx.BaseValue + ResolveBonus(ctx.Player, ctx.Target),
    baseValue: 6);

ModCardVars.ComputedBlock(
    "ExtraBlock",
    static ctx => ctx.BaseValue + (ctx.HasSourceCreature ? 1m : 0m),
    baseValue: 5);
```

如果数值**不应该**经过伤害或格挡 hook，继续用普通 `Computed`。

## 能量 / 辉星 / 能力图标数量

描述里需要渲染成图标数量时，用对应的图标变量辅助方法，配合 formatter 使用：

```csharp
ModCardVars.ComputedEnergy("EnergyGain", 1, card => ResolveEnergyGain(card)),
ModCardVars.ComputedStars("StarGain", 1, card => ResolveStarGain(card)),
ModCardVars.ComputedPower<StrengthPower>("StrengthPower", 2, card => ResolveStrength(card)),
```

本地化：

```json
{
  "MY_CARD.description": "获得{EnergyGain:energyIcons()}。\n获得{StarGain:starIcons()}。\n获得{StrengthPower:diff()}点力量。"
}
```

| 方法 | 说明 |
| - | - |
| `ComputedEnergy` | 能量图标数量，兼容 `energyIcons` formatter |
| `ComputedStars` | 辉星图标数量，兼容 `starIcons` formatter |
| `ComputedPower<T>` | 能力层数，保留类型化的 `PowerVar<T>` 形状。**默认不跑**能力层数修正 hook |
| `ComputedPowerAmountGiven<T>` | 能力层数，预览会走和原版 `PowerVar<T>` 相同的路径（`Hook.ModifyPowerAmountGiven`） |

`ComputedPower<T>` 和 `ComputedPowerAmountGiven<T>` 都支持具名重载、目标感知和上下文形式，例如：

```csharp
// 上下文版本的能力层数
ModCardVars.ComputedPower<StrengthPower>(
    "StrengthCtx",
    static ctx => ctx.BaseValue + ResolveStrengthBonus(ctx),
    baseValue: 2);

// 预览走 Hook.ModifyPowerAmountGiven
ModCardVars.ComputedPowerAmountGiven<WeakPower>(
    "WeakPower",
    2,
    (card, target) => ResolveWeakAmount(card, target));
```

## 读取计算值

### 从本卡读取

打出逻辑里用扩展方法读取。`EvaluateValueOrDefault` 是统一的读取入口：计算型变量对目标求值，普通变量读 `BaseValue`，缺失时返回默认值：

```csharp
using MegaCrit.Sts2.Core.Localization.DynamicVars;
using STS2RitsuLib.Cards.DynamicVars;

// 计算型变量：对目标求值，缺失返回默认值
// 对普通变量则读 BaseValue，行为与 GetValueOrDefault 一致
decimal ctxValue = DynamicVars.EvaluateValueOrDefault("TestCtx");
decimal targetValue = DynamicVars.EvaluateValueOrDefault("TestTarget", target: cardPlay.Target);
decimal energy = DynamicVars.EvaluateValueOrDefault("EnergyGain");
decimal stars = DynamicVars.EvaluateValueOrDefault("StarGain");
decimal power = DynamicVars.EvaluateValueOrDefault("StrengthPower");
```

它内部用 `IComputedDynamicVar` 接口判断，所以 `Computed`、`ComputedEnergy`、`ComputedStars`、`ComputedPower<T>` 等所有计算变量子类型都能正确处理。

### 其他常用读取

| 扩展方法 | 行为 |
| - | - |
| `EvaluateValueOrDefault(key, default, target)` | 计算型变量求值，普通变量读基础值，缺失返回默认值 |
| `GetIntOrDefault(key, default)` | 整数值，缺失返回默认值 |
| `GetValueOrDefault(key, default)` | 基础值，缺失返回默认值 |
| `HasPositiveValue(key)` | 基础值是否大于 0 |
| `TryGet<T>(key, out var)` | 强类型尝试读取 |
| `GetRequired<T>(key)` | 缺失或类型不匹配抛异常 |

`...OrDefault` / `Try...` 不会因缺失抛异常；`GetRequired` 会抛出带具体信息的异常。

## 完整示例

把上面所有内容串成一张完整的卡：

```csharp
using MegaCrit.Sts2.Core.Combat;
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Creatures;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.Localization.DynamicVars;
using MegaCrit.Sts2.Core.Models.Cards;
using MegaCrit.Sts2.Core.Models.Powers;
using MegaCrit.Sts2.Core.ValueProps;
using STS2RitsuLib.Cards.DynamicVars;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

[RegisterCard(typeof(TestCardPool))]
public class TestComputedVarCard() : ModCardTemplate(1, CardType.Attack, CardRarity.Uncommon, TargetType.AnyEnemy)
{
    private static decimal ResolveTargetBonus(ICombatState? combatState, Creature? target)
    {
        return target is { } && combatState is { } ? 1m : 0m;
    }

    protected override IEnumerable<DynamicVar> CanonicalVars =>
    [
        // 基础：显示值 = BaseValue（升级变化在 OnUpgrade 里改 BaseValue）
        ModCardVars.Computed("TestValue", 3, _ => DynamicVars["TestValue"].BaseValue),

        // 目标感知
        ModCardVars.Computed(
            "TestTarget",
            4,
            (card, target) => DynamicVars["TestTarget"].BaseValue + (target != null ? 1 : 0)),

        // 上下文
        ModCardVars.Computed(
            "TestCtx",
            static ctx =>
            {
                var heat = ctx.GetCardIntOrDefault("TestHeat");
                var targetBonus = ctx.HasTarget && ctx.IsInCombat
                    ? ResolveTargetBonus(ctx.CombatState, ctx.Target)
                    : 0m;
                return ctx.BaseValue + heat + targetBonus;
            },
            baseValue: 6),

        // 上下文读取另一个计算变量的结果（防递归）
        ModCardVars.Computed(
            "TestCtxEval",
            static ctx => ctx.EvaluateCardVarOrDefault("TestCtx", 0m) + 1m,
            baseValue: 0),

        // 被 TestCtx 读取的普通变量
        ModCardVars.Int("TestHeat", 2),

        // 伤害包装：预览经过 Hook.ModifyDamage
        ModCardVars.ComputedDamage(
            "ExtraDamage",
            6,
            (card, target) => DynamicVars["ExtraDamage"].BaseValue + ResolveTargetBonus(card?.CombatState, target)),

        // 伤害 + 独立 preview base factory
        ModCardVars.ComputedDamage(
            "ExtraDamagePreview",
            6,
            (card, target) => DynamicVars["ExtraDamagePreview"].BaseValue,
            (card, mode, target, runGlobalHooks) => DynamicVars["ExtraDamagePreview"].BaseValue + 2m),

        // 奥斯提伤害
        ModCardVars.ComputedOstyDamage("OstyDamage", 7, (card, target) => DynamicVars["OstyDamage"].BaseValue),

        // 格挡包装：预览经过 Hook.ModifyBlock
        ModCardVars.ComputedBlock("ExtraBlock", 5, _ => DynamicVars["ExtraBlock"].BaseValue),

        // 上下文版本的格挡 / 能量
        ModCardVars.ComputedBlock(
            "BlockCtx",
            static ctx => ctx.BaseValue + (ctx.HasSourceCreature ? 1m : 0m),
            baseValue: 5),
        ModCardVars.ComputedEnergy(
            "EnergyCtx",
            static ctx => ctx.BaseValue + (ctx.IsPreview ? 1m : 0m),
            baseValue: 1),

        // 能量 / 星星 / 能力图标
        ModCardVars.ComputedEnergy("EnergyGain", 1, _ => DynamicVars["EnergyGain"].BaseValue),
        ModCardVars.ComputedStars("StarGain", 1, _ => DynamicVars["StarGain"].BaseValue),
        ModCardVars.ComputedPower<StrengthPower>("StrengthPower", 2, _ => DynamicVars["StrengthPower"].BaseValue),
        ModCardVars.ComputedPowerAmountGiven<WeakPower>(
            "WeakPower",
            2,
            (card, target) => DynamicVars["WeakPower"].BaseValue),
        ModCardVars.ComputedPower<StrengthPower>(
            "StrengthCtx",
            static ctx => ctx.BaseValue + ResolveStrengthBonus(ctx),
            baseValue: 2),

        // tooltip
        ModCardVars.Computed("TestTooltip", 3, _ => DynamicVars["TestTooltip"].BaseValue)
            .WithSharedTooltip("MY_MOD_HEAT"),
    ];

    private static decimal ResolveStrengthBonus(ComputedDynamicVarContext ctx)
    {
        return ctx.HasSourceCreature ? 1m : 0m;
    }

    // 打出时的效果逻辑
    protected override async Task OnPlay(PlayerChoiceContext choiceContext, CardPlay cardPlay)
    {
        // 读取计算值
        var ctxValue = DynamicVars.EvaluateValueOrDefault("TestCtx");
        var ctxEvalValue = DynamicVars.EvaluateValueOrDefault("TestCtxEval");
        var targetValue = DynamicVars.EvaluateValueOrDefault("TestTarget", target: cardPlay.Target);
        var energy = DynamicVars.EvaluateValueOrDefault("EnergyGain");
        var stars = DynamicVars.EvaluateValueOrDefault("StarGain");
        var power = DynamicVars.EvaluateValueOrDefault("StrengthPower");
        var any = DynamicVars.EvaluateValueOrDefault("ExtraDamage", target: cardPlay.Target);
        var fallback = DynamicVars.GetIntOrDefault("NotExists", defaultValue: 42);
        var hasHeat = DynamicVars.HasPositiveValue("TestHeat");

        // 用计算出的数值执行效果
        await DamageCmd.Attack(any)
            .FromCard(this, cardPlay)
            .Targeting(cardPlay.Target!)
            .Execute(choiceContext);
    }

    // 升级后的效果逻辑
    protected override void OnUpgrade()
    {
        DynamicVars["TestValue"].UpgradeValueBy(1m);
        DynamicVars["TestHeat"].UpgradeValueBy(1m);
        DynamicVars["ExtraDamage"].UpgradeValueBy(3m);
    }
}
```