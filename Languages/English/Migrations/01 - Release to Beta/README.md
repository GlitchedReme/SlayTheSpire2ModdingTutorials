This records some changes that may require you to update your code. Not an exhaustive list.

---

## 0.106 Beta to 0.107 Beta

### `ActModel` New Abstract Members

```csharp
public abstract int Index { get; }
public abstract bool IsDefault { get; }
public abstract bool IsUnlocked(UnlockState unlockState);
```

Any mod type inheriting from `ActModel` **must** implement these three new members, or compilation will fail.

### AbstractModel New Virtual Methods

```csharp
// Card keyword modification
public virtual bool TryModifyKeywordsInCombat(CardModel card, ISet<CardKeyword> keywords)

// Gold modification (replaces the old ShouldGainGold concept)
public virtual decimal ModifyGoldGained(Player player, decimal amount)

// Power Amount split into additive and multiplicative
public virtual decimal ModifyPowerAmountGivenAdditive(PowerModel power, Creature giver, decimal amount, Creature? target, CardModel? cardSource)
public virtual decimal ModifyPowerAmountGivenMultiplicative(PowerModel power, Creature giver, decimal amount, Creature? target, CardModel? cardSource)

// Gold modification notification
public virtual Task AfterModifyingGoldGained(Player player, decimal amount)
```

### Removed Methods

| STS2 0.106 | Replacement |
|---|---|
| `ModifyPowerAmountGiven(...)` | `ModifyPowerAmountGivenAdditive` + `ModifyPowerAmountGivenMultiplicative` |
| `ShouldGainGold(decimal, Player)` | Use `ModifyGoldGained` + check the return value |

### CardModel New Property

```csharp
public virtual string Title
```

Card models now have a direct Title property. Previously you had to look it up via LocString.

## EncounterModel Changes

New:
```csharp
public virtual float CalculateGoldProportion(CombatState combatState)
```

## 0.105 Beta to 0.106 Beta

## Variable Changes

* New enum `HpLossHookPhase` for `ModifyHpLost`.
* `ModifyDamageHookType` added `ModifyDamageHookType.Cap` for the `ModifyDamageCap` interface.

## Function Changes

### AbstractModel

Some renames and new parameters.

| 0.105 | 0.106 |
|---|---|
| `BeforeSideTurnStart(PlayerChoiceContext choiceContext, CombatSide side, ICombatState combatState)` | `BeforeSideTurnStart(PlayerChoiceContext choiceContext, CombatSide side, IReadOnlyList<Creature> participants, ICombatState combatState)` |
| `AfterSideTurnStart(CombatSide side, ICombatState combatState)` | `AfterSideTurnStart(CombatSide side, IReadOnlyList<Creature> participants, ICombatState combatState)` |
| `BeforeTurnEndVeryEarly(PlayerChoiceContext choiceContext, CombatSide side)` | `BeforeSideTurnEndVeryEarly(PlayerChoiceContext choiceContext, CombatSide side, IEnumerable<Creature> participants)` |
| `BeforeTurnEndEarly(PlayerChoiceContext choiceContext, CombatSide side)` | `BeforeSideTurnEndEarly(PlayerChoiceContext choiceContext, CombatSide side, IEnumerable<Creature> participants)` |
| `BeforeTurnEnd(PlayerChoiceContext choiceContext, CombatSide side)` | `BeforeSideTurnEnd(PlayerChoiceContext choiceContext, CombatSide side, IEnumerable<Creature> participants)` |
| `AfterTurnEnd(PlayerChoiceContext choiceContext, CombatSide side)` | `AfterSideTurnEnd(PlayerChoiceContext choiceContext, CombatSide side, IEnumerable<Creature> participants)` |
| `AfterTurnEndLate(PlayerChoiceContext choiceContext, CombatSide side)` | `AfterSideTurnEndLate(PlayerChoiceContext choiceContext, CombatSide side, IEnumerable<Creature> participants)` |
| `AfterCardChangedPiles(..., AbstractModel? source)` | `AfterCardChangedPiles(..., AbstractModel? clonedBy)` |
| `AfterCardChangedPilesLate(..., AbstractModel? source)` | `AfterCardChangedPilesLate(..., AbstractModel? clonedBy)` |

Some `ModifyHpLost` functions were merged. The new `HpLossHookPhase` enum is used instead.

The old `ModifyHpLostBeforeOsty` is now equivalent to passing `HpLossHookPhase.BeforeOsty`. AfterOsty follows the same pattern.

| 0.105 | 0.106 |
|---|---|
| `ModifyHpLostBeforeOsty(..., out IEnumerable<AbstractModel> modifiers)` | `ModifyHpLost(..., HpLossHookPhase phases, out IEnumerable<AbstractModel> modifiers)` |
| `ModifyHpLostAfterOsty(..., out IEnumerable<AbstractModel> modifiers)` | `ModifyHpLost(..., HpLossHookPhase phases, out IEnumerable<AbstractModel> modifiers)` |

### CardPileCmd

| 0.105 | 0.106 |
|---|---|
| `Task AddCurseToDeck<T>(Player owner)` | `Task<CardModel?> AddCurseToDeck<T>(Player owner)` |
| `Task AddCursesToDeck(IEnumerable<CardModel> curses, Player owner)` | `Task<IEnumerable<CardPileAddResult>> AddCursesToDeck(...)` |
| `Add(..., AbstractModel? source = null, ...)` | `Add(..., AbstractModel? clonedBy = null, ...)` |

### CardSelectCmd

New function `FromCombatPile`.

### OrbCmd

`IncreaseBaseOrbCount` renamed to `AddSlots`.

## 0.103 to 0.105 Beta

### Manifest JSON Changes

* Added `min_game_version` field. Required.
* Dependency format changed. See `Environment Setup` or Chapter 0 of either base library.

### Variable Changes

* `bool ShowsInfiniteHp` changed to `HpDisplay` enum.
* `bool IsInstanced` changed to `PowerInstanceType` enum.

### Function Changes

* Some functions now accept a `PlayerChoiceContext` parameter.
* Effect execution functions like `PowerCmd.Apply` now require a `PlayerChoiceContext`. If you don't have one in scope, pass `new ThrowingPlayerChoiceContext()`.
* `CardPileCmd.AddGeneratedCardToCombat` etc. changed the `addedByPlayer` bool parameter to `Player? creator`. Pass `null` where it was `false`, and `cardPlay.card.Owner` or `Owner` where it was `true`.
* `OnTurnEndInHand` changed from `public virtual` to `protected virtual`.
* `GetResultPileType` renamed to `GetResultPileTypeForCardPlay`. Added `GetResultPileTypeForOnTurnEndInHandEffect`.

Old `AbstractModel` had:
- `BeforePlayPhaseStart(PlayerChoiceContext choiceContext, Player player)`
- `BeforePlayPhaseStartLate(PlayerChoiceContext choiceContext, Player player)`

0.104 replaced these with:
- `AfterAutoPrePlayPhaseEnteredEarly(PlayerChoiceContext choiceContext, Player player)`
- `AfterAutoPrePlayPhaseEntered(PlayerChoiceContext choiceContext, Player player)`
- `AfterAutoPrePlayPhaseEnteredLate(PlayerChoiceContext choiceContext, Player player)`
- `AfterAutoPostPlayPhaseEntered(PlayerChoiceContext choiceContext, Player player)`

### Interface Changes

* Some parameter types changed from `CombatState` to `ICombatState`.

## 0.99 to 0.103

Mainly energy counter issues.

Structure changed from:

```
TestEnergyCounter (Control)
├── BurstBack (CPUParticles2D) %
├── Layers (Control) %
│   ├── Layer1 (TextureRect, or anything)
│   └── RotationLayers (Control) %
├── BurstFront (CPUParticles2D) %
└── Label (Label)
```

To:

```
TestEnergyCounter (Control)
├── EnergyVfxBack (NParticlesContainer) %
├── Layers (Control) %
│   ├── Layer1 (TextureRect, or anything)
│   └── RotationLayers (Control) %
├── EnergyVfxFront (NParticlesContainer) %
└── Label (Label)
```

So if you added a character in the release version, you need to add `BurstBack (CPUParticles2D) %` and `BurstFront (CPUParticles2D) %` nodes.
