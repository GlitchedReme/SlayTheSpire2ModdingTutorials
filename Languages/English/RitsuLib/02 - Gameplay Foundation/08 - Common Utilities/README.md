## DynamicEnumValueRegistry

Unified management of dynamic enum extension logic to ensure safety. You can add branches for known enums.

However, it only adds enum values; matching logic and assets need to be created by you.

```csharp
// Use this value afterwards
static CardType Field;

// Write in initialization to register a "Field" card type
var enumRegistry = DynamicEnumValueRegistry<CardType>.For(ModId);
Field = enumRegistry.RegisterOwned("FIELD").Value;
```

## WeightedList

`WeightedList<T>` is a weighted list that can be drawn from using the vanilla `Rng`, with or without replacement.

Can be used for drawing options (reward card pools, etc.).

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

If an element implements `IWeightedValue`, `Add(item)` will automatically read `Weight`; otherwise the default weight is 1. Weights must be greater than 0. Calling `GetRandom` on an empty list will throw an exception; use `TryGetRandom` when the list may be empty.

## AttachedState

`AttachedState<TKey,TValue>` uses `ConditionalWeakTable` to attach data to any reference object without requiring inheritance from vanilla classes and without preventing the key from being GC'd.

This allows adding extra variables to a class.

```csharp
using MegaCrit.Sts2.Core.Entities.Creatures;
using STS2RitsuLib.Utils;

namespace Test.Scripts.Utils;

private static readonly AttachedState<Creature, int> Heat = new(() => 0);

var heat = Heat[creature]; // get value

Heat[creature] = 5; // set value
```

Use `TryGetValue` for read-only checks; it will not create a default value. Using the indexer or `GetOrCreate` will create the default state.

## SavedAttachedState

If the target object participates in vanilla `SavedProperties` serialization, you can use `SavedAttachedState<TKey,TValue>` to write attached state into vanilla save properties. It only supports types expressible by `SavedProperties`: `int`, `bool`, `string`, `ModelId`, enums, `int[]`, enum arrays, `SerializableCard`, `SerializableCard[]`, and `List<SerializableCard>`.

```csharp
using MegaCrit.Sts2.Core.Models;
using STS2RitsuLib.Utils;

namespace Test.Scripts.Utils;

private static readonly SavedAttachedState<AbstractModel, bool> IsEchoCopy = new("test_echo_copy", defaultValueFactory: () => false);

public static void MarkEchoCopy(AbstractModel model)
{
    IsEchoCopy[model] = true;
}

public static bool IsMarked(AbstractModel model)
{
    return IsEchoCopy.GetValueOrDefault(model, false);
}
```

## Dynamic Enum Values

Use `DynamicEnumValueMinter<TEnum>` to stably extend high-bit values of an enum. It only supports enums with a 32-bit underlying type.

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

Ensure your ID does not collide with others.

## MaterialUtils

| Method Name                               | Description                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------ |
| `CreateReplaceHueShaderMaterial`           | Creates a hue-replacement shader material (preserving original lightness and saturation), suitable for modifying vanilla card frames, etc. Parameters: RGB color value and lightness. |
| `CreateRgbShaderMaterial` *(deprecated)*    | Creates a shader material using the vanilla HSV shader and given RGB parameters. (Use `CreateReplaceHueShaderMaterial` instead.) |
| `CreateHsvShaderMaterial`                  | Creates a shader material using the vanilla HSV shader and given H, S, V parameters. |
| `CreateUnmodulatedHsvShaderMaterial`       | Returns a vanilla HSV shader material that preserves the original color (h=0, s=1, v=1). Used for custom card frames. |
| `CreateDoomBarShaderMaterial`              | Creates the game's vanilla Doom health bar material (with the correct `NoiseTexture`). |
| `CreateVanillaDoomBarGradientTexture`      | Creates the game's vanilla Doom gradient texture. |
| `CreateVanillaDoomBarNoiseTexture`         | Creates a `NoiseTexture2D` matching the vanilla Doom health bar overlay material. |

## HoverTipHelper

`HoverTipHelper` can append text or card previews to an existing hover tip group.

```csharp
using Godot;
using MegaCrit.Sts2.Core.Models;
using STS2RitsuLib;
using STS2RitsuLib.Utils;

HoverTipHelper.AddTipToOwner(owner, "Test", "This is an additional note.");
HoverTipHelper.AddCardTipsToOwner(owner, cards);
```

Methods of `HoverTipHelper` return `false` if no active hover tip group is currently bound, which can usually be ignored. If you are managing hover tips yourself in a custom control, you need to create and bind a hover tip group the vanilla way first.
