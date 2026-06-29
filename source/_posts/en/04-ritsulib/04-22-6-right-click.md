---
title: Right Click Interaction
date: 2026-05-30 11:11:07
permalink: en/docs/04-ritsulib/04-22-6-right-click/
categories:
- Basics
---
`RitsuLib` provides a right-click interaction system that supports right-clicking cards, relics, powers, and potions, with automatic handling of multiplayer sync, controller compatibility, and priority scheduling.

> The examples below assume `ModTypeDiscoveryHub.RegisterModAssembly(...)` has already been called in `Entry.Init()`, otherwise auto-registration will not take effect.

## Method 1: Model Implements Interface

If you want to bind right-click behavior directly to the model itself (e.g., a card or relic), have the model implement the corresponding interface:

| Model | Interface |
| - | - |
| Card | `IModRightClickableCard` |
| Relic | `IModRightClickableRelic` |
| Power | `IModRightClickablePower` |
| Potion | `IModRightClickablePotion` |

```csharp
using MegaCrit.Sts2.Core.Entities.Powers;
using MegaCrit.Sts2.Core.Models;
using STS2RitsuLib.Interactions.RightClick;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

[RegisterPower]
public sealed class TestInfoPower
    : ModPowerTemplate, IModRightClickablePower
{
    public override PowerType Type => PowerType.Buff;

    public override PowerStackType StackType => PowerStackType.Counter;

    public override PowerAssetProfile AssetProfile => new(
        IconPath: "res://Test/images/powers/test_info.png",
        BigIconPath: "res://Test/images/powers/test_info_big.png");

    // Optional: local pre-check; returning false prevents this right-click from firing
    public bool CanHandleRightClickLocal(ModRightClickContext context)
    {
        return Amount > 0;
    }

    // Right-click execution (executes synchronously on all clients in multiplayer)
    public async Task OnRightClick(ModRightClickExecutionContext context)
    {
        // Do whatever you want, e.g., show a Toast
        RitsuToastService.ShowInfo($"Current stacks: {Amount}");
    }
}
```

`CanHandleRightClickLocal` has a default implementation returning `true`, so it is not required to override.

## Method 2: Registration Binding

If you don't want to modify the model class, or want to register right-click behavior for models of the same type or models you don't have editing access to, use `ModRightClickRegistry.Register<TModel>`. The return value is `IDisposable`; after disposing, the binding is automatically deregistered.

```csharp
using MegaCrit.Sts2.Core.Models;
using STS2RitsuLib.Interactions.RightClick;

namespace Test.Scripts;

[ModInitializer(nameof(Init))]
public class Entry
{
    private static IDisposable? _examineBinding;

    public static void Init()
    {
        _examineBinding = ModRightClickRegistry.Register<CardModel>(
            ModId,
            "examine", // ID, prevents collisions
            canHandle: ctx =>
            {
                // Local pre-check: only applies to Strike cards
                return ctx.Model is CardModel card
                    && card.Tags.Contains(CardTag.Strike);
            },
            execute: async ctx =>
            {
                // Execute (multiplayer sync)
            },
            priority: 0); // Priority; higher values trigger first
    }

    // How to cancel
    public static void Unregister()
    {
        _examineBinding?.Dispose();
    }
}
```

Multiple bindings can be attached to the same model; they execute in priority order. If a binding's `canHandle` returns `false`, that binding is skipped.

## Method 3: Register Handler

If you want to bind to custom classes, implement `IModRightClickHandler` and register with `Register`.

```csharp
using MegaCrit.Sts2.Core.Models;
using STS2RitsuLib.Interactions.RightClick;

namespace Test.Scripts;

public sealed class TestGlobalHandler : IModRightClickHandler
{
    public int Priority => 100; // Default 0; higher values execute first

    public bool TryHandle(ModRightClickContext context)
    {
        // Show a tip when right-clicking any relic
        if (context.Model is RelicModel relic)
        {
            RitsuToastService.ShowInfo($"Relic: {relic.DisplayName}");
            return true; // Consume the event; do not pass it on
        }

        return false; // Not handled; pass to the next handler
    }
}

// Register in Entry.Init
ModRightClickRegistry.Register(new TestGlobalHandler());
```

Handlers run before model bindings, executing in descending `Priority` order. Returning `true` consumes the event, and the model binding flow will not proceed.

## Context Parameters

The local handling phase of right-click interaction passes trigger information via `ModRightClickContext`:

```csharp
public readonly record struct ModRightClickContext(
    Player Player,
    AbstractModel Model,
    ModRightClickTrigger Trigger);
```

| Parameter | Type | Description |
| - | - | - |
| `Player` | `Player` | The local player entity that initiated the right-click, resolved via `LocalContext.GetMe(...)` |
| `Model` | `AbstractModel` | The game model that was right-clicked; at runtime may be `CardModel` / `RelicModel` / `PowerModel` / `PotionModel` (all inherit from `AbstractModel`) |
| `Trigger` | `ModRightClickTrigger` | Trigger metadata, including `IsController` (whether triggered by a controller) and `Metadata` (reserved custom data) |

> The sync execution phase uses `ModRightClickExecutionContext`, which adds two more fields: `PlayerChoiceContext` and `Action`.
