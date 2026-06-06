## DynamicEnumValueRegistry

统一管理动态枚举的扩展逻辑确保安全。可以为已知枚举添加分支。

但是只是添加枚举，其他匹配逻辑和素材需要自己制作。

```csharp
// 之后使用这个值
static CardType Field;

// 写在初始化里，注册一个场地的卡牌类型
var enumRegistry = DynamicEnumValueRegistry<CardType>.For(ModId);
Field = enumRegistry.RegisterOwned("FIELD").Value;
```

## WeightedList

`WeightedList<T>` 是一个带权重的列表，可以用原版 `Rng` 抽取，也可以不放回抽取。

可用于抽取选项（奖励卡牌池等）。

```csharp
using MegaCrit.Sts2.Core.Random;
using STS2RitsuLib.Utils;

namespace Test.Scripts.Utils;

public readonly record struct RewardChoice(string Id, int Weight) : IWeightedValue;

public static class TestWeightedRewards
{
    public static string RollReward(Rng rng)
    {
        var choices = new WeightedList<RewardChoice>
        {
            new("gold", 5),
            new("card", 10),
            new("rare_relic", 1),
        };

        return choices.GetRandom(rng).Id;
    }

    public static IReadOnlyList<string> RollDraft(Rng rng)
    {
        var choices = new WeightedList<string>();
        choices.Add("attack", 8);
        choices.Add("skill", 6);
        choices.Add("power", 2);

        return
        [
            choices.GetRandom(rng, remove: true),
            choices.GetRandom(rng, remove: true),
        ];
    }
}
```

如果元素实现 `IWeightedValue`，`Add(item)` 会自动读取 `Weight`；否则默认权重是 1。权重必须大于 0，空列表上 `GetRandom` 会抛异常；不确定列表是否为空时用 `TryGetRandom`。

## AttachedState

`AttachedState<TKey,TValue>` 用 `ConditionalWeakTable` 把数据挂到任意引用对象上，不需要继承原版类，也不会阻止 key 被 GC。

可实现给一个类添加额外变量。

```csharp
using MegaCrit.Sts2.Core.Entities.Creatures;
using STS2RitsuLib.Utils;

namespace Test.Scripts.Utils;

public sealed class CreatureHeatState
{
    public int Heat { get; set; }
}

public static class TestCreatureHeat
{
    private static readonly AttachedState<Creature, CreatureHeatState> Heat =
        new(() => new CreatureHeatState());

    public static void AddHeat(Creature creature, int amount)
    {
        Heat.Update(creature, state =>
        {
            state.Heat += amount;
            return state;
        });
    }

    public static bool TryGetHeat(Creature creature, out int heat)
    {
        if (Heat.TryGetValue(creature, out var state))
        {
            heat = state.Heat;
            return true;
        }

        heat = 0;
        return false;
    }
}
```

用 `TryGetValue` 做只读判断，不会创建默认值。用索引器或 `GetOrCreate` 时会创建默认状态。

## SavedAttachedState

如果目标对象会参与原版 `SavedProperties` 序列化，可以用 `SavedAttachedState<TKey,TValue>` 把附加状态写进原版保存属性。它只支持 `SavedProperties` 能表达的类型：`int`、`bool`、`string`、`ModelId`、枚举、`int[]`、枚举数组、`SerializableCard`、`SerializableCard[]` 和 `List<SerializableCard>`。

```csharp
using MegaCrit.Sts2.Core.Models;
using STS2RitsuLib.Utils;

namespace Test.Scripts.Utils;

public static class TestSavedCardFlags
{
    private static readonly SavedAttachedState<AbstractModel, bool> IsEchoCopy =
        new("test_echo_copy", defaultValueFactory: () => false);

    public static void MarkEchoCopy(AbstractModel model)
    {
        IsEchoCopy[model] = true;
    }

    public static bool IsMarked(AbstractModel model)
    {
        return IsEchoCopy.GetValueOrDefault(model, false);
    }
}
```

`name` 会注入原版 `SavedPropertiesTypeCache`，必须全局唯一。推荐带上 Mod id 前缀，发布后不要改名。复杂对象请改用 `RunSavedData` 或 `ModDataStore`，不要硬塞进 `SavedAttachedState`。

## 动态枚举值

可以用 `DynamicEnumValueMinter<TEnum>` 稳定扩展枚举的高位值。它只支持底层为 32 位的 enum。

```csharp
using MegaCrit.Sts2.Core.Cards;
using STS2RitsuLib.Utils;

namespace Test.Scripts.Utils;

public static class TestDynamicTags
{
    private static readonly DynamicEnumValueMinter<CardTag> Tags = new();

    public static readonly CardTag EchoCard = Tags.Mint("test:echo_card");

    public static bool IsOurDynamicTag(CardTag tag)
    {
        return Tags.IsDynamic(tag);
    }
}
```

确保你的ID不会和别人撞车。

## MaterialUtils

| 方法名称                                       | 功能说明                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------ |
| `CreateReplaceHueShaderMaterial`           | 创建一个替换色调的着色器材质（保留原亮度和饱和度），适用于修改原版卡框等。参数为 RGB 色值和亮度。    |
| `CreateRgbShaderMaterial` *(已过时)*         | 使用原版的 HSV 着色器和给定的 RGB 参数创建着色器材质。（建议改用 `CreateReplaceHueShaderMaterial`）。|
| `CreateHsvShaderMaterial`                  | 使用原版的 HSV 着色器和给定的 H, S, V 参数创建着色器材质。                                 |
| `CreateUnmodulatedHsvShaderMaterial`       |返回一个保留原始颜色（h=0, s=1, v=1）的原版 HSV 着色器材质。用于自定义卡框。    |
| `CreateDoomBarShaderMaterial`              |创建游戏原版灾厄血条材质（自带正确的 `NoiseTexture`）。     |
| `CreateVanillaDoomBarGradientTexture`      |创建游戏原版灾厄的渐变纹理。                                               |
| `CreateVanillaDoomBarNoiseTexture`         |创建与原版灾厄血条覆盖材质匹配的 `NoiseTexture2D`。                             |

## HoverTipHelper

`HoverTipHelper` 可以在已有的悬浮提示组上追加文字或卡牌预览。

```csharp
using Godot;
using MegaCrit.Sts2.Core.Models;
using STS2RitsuLib;
using STS2RitsuLib.Utils;

HoverTipHelper.AddTipToOwner(owner, "Test", "这是一条额外说明。");
HoverTipHelper.AddCardTipsToOwner(owner, cards);
```

`HoverTipHelper` 的方法返回 `false` 表示当前没有绑定活动悬浮提示组，通常可以忽略；如果你在自定义控件里自己管理悬浮提示，需要先按原版方式创建并绑定悬浮提示组。
