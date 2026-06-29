---
title: Card Hand Glow
date: 2026-05-08 12:58:19
permalink: en/docs/04-ritsulib/04-19-hand-outline/
categories:
- Basics
---
## Vanilla

If you only want yellow and red glow, simply override the following properties in your card class:

```csharp
    // When to glow gold
    protected override bool ShouldGlowGoldInternal => Owner.Creature.GetPowerAmount<TestPower>() > 5;

    // When to glow red
    protected override bool ShouldGlowRedInternal => !Owner.Creature.HasPower<TestPower>();
```

## Arbitrary Glow Colors

RitsuLib provides the ability to emit glow of any color. Register in the initialization function `Entry.Init`.

```csharp
public static void Init()
{
    ModCardHandOutlineRegistry.Register<TestCard>(ModCardHandOutlineRules.Fixed( // Specific card type. Can be set to your card base class so all subclasses glow.
        card => card.Owner.Creature.CurrentHp <= 10, // Glow condition
        Colors.Purple // Glow color
        // 0, // (Optional) Priority. Only the highest priority glow is shown.
        // false // Hide border when the card is unplayable
    ));
}
```

Use `Dynamic` to register glow that changes dynamically:

```csharp
    ModCardHandOutlineRegistry.Register<TestCard>(ModCardHandOutlineRules.Dynamic(
        card => card.Owner.Creature.CurrentHp <= 10,
        card => card.Owner.Creature.CurrentHp <= 5 ? Colors.Red : Colors.Orange // Determines what color it should be
    ));
```
