> The examples below assume you have already enabled `RitsuLib`'s auto-registration in `Entry.Init()`, otherwise attributes like `[RegisterCharacter]` won't take effect (see Chapter 0).

## Character card pool

Refer to the Adding Characters chapter:

`TestCardPool.cs`:
```csharp
using Godot;
using STS2RitsuLib.Scaffolding.Content;
using STS2RitsuLib.Utils;

namespace Test.Scripts;

public class TestCardPool : TypeListCardPoolModel
{
    // Pool ID. Must be unique to avoid collisions.
    public override string Title => "test";
    public override string EnergyColorName => "test";

    // Energy icon used in descriptions. Size 24x24.
    public override string? TextEnergyIconPath => "res://Test/images/energy_test.png";
    // Energy icon for tooltips and the top-left corner of cards. Size 74x74.
    public override string? BigEnergyIconPath => "res://Test/images/energy_test_big.png";

    // Pool theme color.
    public override Color DeckEntryCardColor => new(0.5f, 0.5f, 1f);
    // Energy counter text outline color
    public override Color EnergyOutlineColor => new(0.5f, 0.5f, 1f);
    // If you want to recolor the vanilla card frame, add these two lines
    private static readonly Material? _poolFrameMaterial = MaterialUtils.CreateRgbShaderMaterial(0.5f, 0.5f, 1f);
    // If using a custom card frame, replace the above line with this
    // private static readonly Material? _poolFrameMaterial = MaterialUtils.CreateUnmodulatedHsvShaderMaterial();
    public override Material? PoolFrameMaterial => _poolFrameMaterial;

    // Whether the pool is colorless. For example, event and status pools are colorless.
    public override bool IsColorless => false;
}
```

The `PoolFrameMaterial` applies to all cards registered in this pool, unless a card specifies its own `FrameMaterial`.

Then write it in the character's generics:

```csharp
public class TestCharacter : ModCharacterTemplate<TestCardPool, TestRelicPool, TestPotionPool>
```

## Shared card pool

Add a `[RegisterSharedCardPool]` attribute to the card pool class.

```csharp
[RegisterSharedCardPool]
public class MultiClassSharedPool : TypeListCardPoolModel
{
}
```

This method does not appear in the compendium by default. If you want it to appear in the compendium, write this in your initialization function `Entry.Init`:

```csharp
    ModContentRegistry.For(ModId)
        .RegisterCardLibraryCompendiumSharedPoolFilter<MultiClassSharedPool>(
            "reme_multiclass_shared_pool", // ID
            "res://icon.svg" // icon path
            // null // sort order (optional)
        );
```

If you want to display extra text when hovering over the icon in the compendium, write in `{modId}/localization/{Language}/card_library.json`:

The ID format is `{ModId}_POOLFILTER_{ID}`, where `ID` is the uppercase form of the ID we just wrote in code.

```json
{
    "REME_MOD_POOLFILTER_REME_MULTICLASS_SHARED_POOL": "Multi-class shared pool."
}
```
