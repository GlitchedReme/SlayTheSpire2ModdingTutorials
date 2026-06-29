---
title: Custom Targets
date: 2026-05-27 15:36:11
permalink: en/docs/04-ritsulib/04-22-5-custom-targeting/
author: alkaid616
categories:
- Basics
---
If your card has more specialized targeting conditions (e.g., requiring "only an enemy with Block", or "deal damage to all enemies currently with an attack intent"), you need to use **custom target types**.

---

## Pre-built Target Types in RitsuLib

Before writing custom registrations, RitsuLib's `CustomTargetType` class provides you with pre-configured, highly-requested target types that vanilla lacks:

- **`CustomTargetType.Anyone`**: Single target; allows you to point the targeting arrow at **any living ally or enemy**.
- **`CustomTargetType.Everyone`**: AoE target; includes all living creatures on the field.
- **`CustomTargetType.AnyAttackingEnemy`** / **`AllAttackingEnemies`**: Single / AoE target, limited to "living enemies that currently have an attack intent".
- **`CustomTargetType.AnyBlockingEnemy`** / **`AllBlockingEnemies`**: Single / AoE target, limited to "living enemies whose Block is greater than 0".
- **`CustomTargetType.AllHighestHpEnemies`** / **`AllLowestHpEnemies`**: AoE target; all living enemies with the highest / lowest current HP.
- And more...

If these happen to match your needs, skip directly to the **Resolving Targets** section for usage. No registration is required — you can **directly set your card's `TargetType` to the above values.**

---

## Registering Custom Target Types

If the pre-built types still don't meet your needs, RitsuLib provides a registration API where you simply supply the callback.

You can create a dedicated class to store the returned `TargetType` values and register them together during your mod's startup phase:

```csharp
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Creatures;
using STS2RitsuLib.Combat.CardTargeting;

namespace Test.Scripts.Cards;

public static class TestTargets
{
    // Store the registered TargetType for other cards to use
    public static TargetType WoundedEnemy { get; private set; }
    public static TargetType AllWoundedEnemies { get; private set; }

    public static void Register()
    {
        // 1. Register a [single target]: currently alive monsters with missing HP
        WoundedEnemy = CustomTargetType.RegisterSingleTargetType(
            Entry.ModId,
            "WOUNDED_ENEMY", // Unique string identifier; do not change after release
            creature => creature is { IsMonster: true, IsAlive: true } && creature.CurrentHp < creature.MaxHp
        );

        // 2. Register an [AoE target]: all currently wounded monsters on the field
        AllWoundedEnemies = CustomTargetType.RegisterMultiTargetType(
            Entry.ModId,
            "ALL_WOUNDED_ENEMIES",
            creature => creature is { IsMonster: true, IsAlive: true } && creature.CurrentHp < creature.MaxHp
        );
    }
}
```

> **Note**: The identifier string passed during registration (e.g., `"WOUNDED_ENEMY"`) must be unique within your Mod, and **absolutely must not be changed** after the mod is released. The underlying mechanism calculates and binds a deterministic enum number based on this string, which is written into the player's save file. Renaming it arbitrarily will cause issues when loading old saves because the target type for that card can no longer be matched.

Don't forget to call `TestTargets.Register()` once at your mod's initialization point (e.g., `Entry.Init()`).

---

## Resolving Targets

Regardless of whether you used vanilla target types, the pre-built RitsuLib types mentioned in section one, or custom hand-written types, you can use **`CardModelTargetingExtensions.GetTargets()`** to obtain the valid targets.

```csharp
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using STS2RitsuLib.Combat.CardTargeting;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts.Cards;

// When constructing the card, pass up your newly created custom card target type (can also be vanilla, or any other valid definition)
public sealed class StrikeWounded()
    : ModCardTemplate(1, CardType.Attack, CardRarity.Common, TestTargets.WoundedEnemy)
{
    // ... declare corresponding damage dynamic variables ...

    protected override async Task OnPlay(PlayerChoiceContext choiceContext, CardPlay cardPlay)
    {
        // Core: call this.GetTargets(cardPlay.Target)
        // This method automatically validates:
        // 1. If the card is single-target: checks whether cardPlay.Target legally passed in the selected creature and returns it as a list
        // 2. If the card is AoE: finds all valid targets on the field that match the registration rules and returns them
        
        foreach (var target in this.GetTargets(cardPlay.Target))
        {
            await DamageCmd.Attack(DynamicVars.Damage.BaseValue)
                .FromCard(this)
                .Targeting(target)
                .Execute(choiceContext);
        }
    }
}
```
