---
title: Custom Card Piles
date: 2026-05-16 23:27:19
permalink: en/docs/04-ritsulib/04-20-custom-card-pile/
author: alkaid616
categories:
- Basics
---
`RitsuLib` provides a custom card pile system.

## Registering a Card Pile

Register in the initialization function (`Entry.Init`) and store the pile type as a static variable for later reference:

```csharp
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Logging;
using MegaCrit.Sts2.Core.Modding;
using STS2RitsuLib;
using STS2RitsuLib.CardPiles;

namespace Test.Scripts;

[ModInitializer(nameof(Init))]
public class Entry
{
    public const string ModId = "Test";
    public static readonly Logger Logger = RitsuLibFramework.CreateLogger(ModId);

    public static PileType VoidPile;

    public static void Init()
    {
        var registry = ModCardPileRegistry.For(ModId);
        VoidPile = registry.RegisterOwned("void_pile", new ModCardPileSpec
        {
            // Scope determines the lifecycle of the pile,
            // CombatOnly: created each combat and destroyed when combat ends
            // RunPersistent: persists across combats within the same run (memory only; requires manual save logic)
            Scope = ModCardPileScope.CombatOnly,
            // Style determines where the pile button is placed,
            // Headless: invisible
            // TopBarDeck: next to the top bar deck button
            // BottomLeft: bottom-left of combat UI (near draw pile)
            // BottomRight: bottom-right of combat UI (near exhaust pile)
            // ExtraHand: extra hand container
            Style = ModCardPileUiStyle.BottomLeft,
            // Anchor, see below
            Anchor = ModCardPileAnchor.Default,
            IconPath = "res://Test/images/void_pile.png",
            // Click to open
            OnOpen = ctx => ctx.ShowDefaultPileScreen(),
            VisibleWhen = ctx => ctx.Player != null,
        }).PileType;
    }
}
```

* `RegisterOwned` returns a `ModCardPileDefinition`, whose `.PileType` is the identifier for operating on the pile at runtime.

## Anchor (Placement)

- `Anchor` and `Style` together determine where your extra card pile is anchored. When omitted, it is equivalent to `ModCardPileAnchor.Default`.

### Option 1: Default

```csharp
// No manual coordinates; the position is determined by Style
Anchor = ModCardPileAnchor.Default,
```

### Option 2: new ModCardPileAnchor

#### Method A: Preset Position

Fill in only `Kind` and `Offset`.

```csharp
using Godot;
using STS2RitsuLib.CardPiles;

Anchor = new ModCardPileAnchor(
    // Preset slot type, see the table below
    ModCardPileAnchorKind.BottomLeftSecondary,
    // Additional offset from the calculated position; positive values are right and down
    new Vector2(0, -2)),
```

#### Method B: Custom Coordinates

`Kind` must be `Custom`, and all four parameters are required.

```csharp
Anchor = new ModCardPileAnchor(
    // Must be Custom
    ModCardPileAnchorKind.Custom,
    // Additional offset on top of CustomPosition
    Offset: new Vector2(4, 4),
    // Anchor point in the parent node's coordinate system
    CustomPosition: new Vector2(200, 150),
    // Which edge of the control the anchor aligns to, e.g. PivotCenter
    CustomAuthoringPivot: ModCardPileAnchor.PivotCenter),
```

In this mode, the top-left corner of the control within the corresponding pile's parent node (not screen position) is at `CustomPosition + Offset - nominal size * CustomAuthoringPivot`.

### Static Factories

Equivalent to `new ModCardPileAnchor(ModCardPileAnchorKind.Custom, ...)`, with `Offset` and pivot already filled in.

```csharp
Anchor = ModCardPileAnchor.AtPosition(
    // This point aligns to the control's top-left corner
    new Vector2(120, 80)),

Anchor = ModCardPileAnchor.AtCenter(
    // This point aligns to the control's center
    new Vector2(200, 150)),

Anchor = ModCardPileAnchor.AtPivot(
    // Anchor point in the parent node's coordinate system
    new Vector2(200, 150),
    // Pivot (center offset), e.g. 1,0 means top-right
    new Vector2(1f, 0f)),
```

### Anchor Kinds

Must be paired with the appropriate `Style`; mismatches may result in unexpected placement.

| Kind                    | Paired Style  | Description                                       |
| ----------------------- | ------------- | ------------------------------------------------- |
| `StyleDefault`          | Any           | Auto-layout using the Style's default rules; `Default` maps to this |
| `BottomLeftPrimary`     | `BottomLeft`  | Stacked to the right starting from the draw pile button |
| `BottomLeftSecondary`   | `BottomLeft`  | Stacked to the right starting from the discard pile button |
| `BottomRightPrimary`    | `BottomRight` | Stacked to the left starting from the exhaust pile button |
| `BottomRightSecondary`  | `BottomRight` | Stacked to the right starting from the exhaust pile button |
| `TopBarAfterDeck`       | `TopBarDeck`  | To the right of the vanilla deck button on the top bar |
| `TopBarBeforeModifiers` | `TopBarDeck`  | To the left of the daily modifier button group on the top bar |
| `ExtraHandAbove`        | `ExtraHand`   | Above the hand area, plus `Offset`                 |
| `ExtraHandBelow`        | `ExtraHand`   | Below the hand area, plus `Offset`                 |
| `Custom`                | Any           | Fully custom pixel position; does not participate in bottom-left / bottom-right auto-queuing |

## Using the Card Pile

Just like the vanilla API, you can operate on card piles via the `CardPileCmd` functions, or get a pile object using the `.GetPile` extension method.

For example, the following code uses `CardPileCmd.Add` to move a card into a custom pile and iterate over cards:

```csharp
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Players;

// Move a single card in
await CardPileCmd.Add(card, Entry.VoidPile);

// Get the player's pile object and read/write manually
var pile = Entry.VoidPile.GetPile(player);
foreach (var c in pile.Cards)
{
    Logger.Info($"Card in void pile: {c.Id}");
}

// For other operations, refer to the vanilla card APIs
```

## Localization Text

Add tooltip text shown when hovering over the pile button, or dialogue text shown when the pile is empty.

Add text in `{modId}/localization/{lang}/static_hover_tips.json`.

The ID format is `{MODID}_CARDPILE_{LOCALSTEM}`; for example, this becomes `TEST_CARDPILE_VOID_PILE`.

```json
{
  "TEST_CARDPILE_VOID_PILE.title": "Void Pile",
  "TEST_CARDPILE_VOID_PILE.description": "An area where cards are removed from combat.",
  "TEST_CARDPILE_VOID_PILE.empty": "The Void Pile is empty."
}
```
