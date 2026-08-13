# Hook Trigger Order

> This article was verified line-by-line against the game 0.110.1 source code. All ordering comes directly from `CombatManager`, `CreatureCmd`, `Hook` and other source files — nothing is inferred.

## Traversal Order (within one hook, who is called first)

Every time a hook fires, it traverses "all listeners" and calls them in a fixed order. Understanding this order lets you predict the sequence of multiple sources inside the same hook.

### In Combat (ICombatState.IterateHookListeners)

Traverses creatures one by one; the order per creature is:

1. **All Powers on that creature** (`creature.Powers`, in attach order)
2. If the creature is a player:
   - That player's **relics** (skipping melted ones)
   - That player's **potion slots**
   - That player's **orb queue** (OrbQueue.Orbs)
   - **Every card in all of that player's piles** (hand/draw/discard/play/exhaust, each card followed by its Affliction and Enchantment)
3. If the creature is a monster: that monster's **Monster model**
4. After traversal, appended last: **global Modifiers** → **BadgeModels** → **MultiplayerScalingModel** → singletons and others

> When a player's `IsActiveForHooks == false` (e.g. dead), the whole player is skipped.

### Outside Combat (IRunState.IterateHookListeners)

1. **All cards in each player's deck** (deck → card + card enchantment)
2. Each player's **relics** (skipping melted)
3. Each player's **potions**
4. **global Modifiers** → **BadgeModels** → **MultiplayerScalingModel**
5. External subscribers
6. **The current combat's listeners** (if in combat, recursing into the in-combat order above)

> `Hook.IterateCombatHookListeners` dispatches to **no listeners** when combat is over or ending (except hooks called directly inside the kill/death/combat-end sequence).

## 1. Turn Flow (CombatManager.StartTurn)

### Each Creature's Turn Start

1. For each creature: `creature.BeforeTurnStart(side)` — records each Power's `AmountOnTurnStart = Amount`
2. **`Hook.BeforeSideTurnStart`**
3. For each creature: `creature.AfterTurnStart(side)` — internally calls `ClearBlock()` (via `Hook.ShouldClearBlock` to decide whether to clear block)
4. For each creature: **`Hook.AfterBlockCleared`**
5. For each player: `SetupPlayerTurn` (see below)
6. **`Hook.AfterSideTurnStart`**
7. For each player: orb queue `OrbQueue.AfterTurnStart`

### SetupPlayerTurn (player turn setup)

1. **`Hook.ShouldPlayerResetEnergy`** decides → reset energy / add max energy
2. **`Hook.AfterEnergyReset`**
3. **`Hook.BeforeHandDraw`**
4. **`Hook.ModifyHandDraw`** (computes draw count) → **`Hook.AfterModifyingHandDraw`**
5. First-turn special handling (enchantments to bottom, Innate to top)
6. `CardPileCmd.Draw` (internally: `Hook.ShouldDraw` → whenever a shuffle is needed, `Shuffle`: `Hook.ModifyShuffleOrder` adjusts order → merge into draw pile → **`Hook.AfterShuffle`** → each drawn card **`Hook.AfterCardDrawn`**)
7. **`Hook.AfterPlayerTurnStart`**

> The player turn also passes through: `Hook.AfterAutoPrePlayPhaseEntered` (entering the auto-pre-play phase) → play phase → `Hook.AfterAutoPostPlayPhaseEntered` (auto-post-play phase at turn end).

## 2. Card Play Flow (CardModel.OnPlayWrapper)

1. `CardPileCmd.AddDuringManualCardPlay` (hand → play pile)
2. **`Hook.ModifyCardPlayResultLocation`** → for each modifier, call `AfterModifyingCardPlayResultLocation`
3. `GeneratePlayCount` (computes play count, internally via `Hook.ModifyCardPlayCount`)
4. Loop over each play:
   - **`Hook.BeforeCardPlayed`**
   - Execute `card.OnPlay(...)` (your card's effect here)
   - Card enchantment `Enchantment.OnPlay` → card affliction `Affliction.OnPlay`
   - **`Hook.AfterCardPlayed`**
5. Resolve the result location (to discard/exhaust/hand, etc.)

## 3. Damage Flow (CreatureCmd.Damage)

This is the most commonly used and most complex hook chain. For each target in order:

1. **`Hook.ModifyDamage`** (enchantment before models) → **`Hook.AfterModifyingDamageAmount`**
   - Inside `ModifyDamage`: **enchantment additive** → traverse all listeners **`ModifyDamageAdditive`** (additive) → **`ModifyDamageMultiplicative`** (multiplicative) → **`ModifyDamageCap`** (cap, takes the minimum)
2. **`Hook.BeforeDamageReceived`**
3. Block resolution `DamageBlockInternal` (block absorbs part of the damage)
4. **`Hook.ModifyHpLost`** (`HpLossHookPhase.BeforeOsty`, before redirect to Osty) → **`Hook.AfterModifyingHpLostBeforeOsty`**
5. **`Hook.ModifyUnblockedDamageTarget`** (unblocked damage may be redirected to Osty)
6. **`Hook.ModifyHpLost`** (`HpLossHookPhase.AfterOsty`, after redirect to Osty) → **`Hook.AfterModifyingHpLostAfterOsty`**
7. Lose HP `LoseHpInternal`
8. Resolve results (per DamageResult):
   - On block break: **`Hook.AfterBlockBroken`**
   - After HP loss: **`Hook.AfterCurrentHpChanged`**
   - **`Hook.AfterDamageGiven`** (attacker's perspective)
   - **If the target survived**: **`Hook.AfterDamageReceived`**; **if the target died**: added to killedCreatures
9. After the loop: **`Kill(killedCreatures)`** (see death flow)

> Note `Hook.AfterDamageReceived` is only called when the **target survives**; when the target dies it is skipped and the death flow runs instead.

## 4. Death Flow (CreatureCmd.KillWithoutCheckingWinCondition)

1. If current HP > 0: set HP to 0 first (`LoseHpInternal`) + **`Hook.AfterCurrentHpChanged`**
2. **`Hook.BeforeDeath`**
3. **`Hook.ShouldDie`** decides whether death really happens (can be prevented, e.g. Fairy in a Bottle)
   - **Death allowed**:
     a. `creature.InvokeDiedEvent()` (`Died` event)
     b. Play death animation
     c. **`Hook.AfterDeath`** ← powers are still present here!
     d. Remove creature from combat
     e. **`creature.RemoveAllPowersAfterDeath()`**
     f. Clean up powers
     g. If it's the primary enemy and all teammates are secondary enemies: kill teammates along with it
     h. If it's a player: clear orbs, kill the Osty (if alive), `player.DeactivateHooks()`, `HandlePlayerDeath` (remove all of the player's cards, zero energy)
   - **Death prevented**:
     a. **`Hook.AfterDeath`** (`wasRemovalPrevented: true`)
     b. **`Hook.AfterPreventingDeath`**
     c. If still near-dead (IsDead), retry recursively (up to 10 times)

> **Pitfall**: when `Hook.AfterDeath` runs, the creature's powers are still present. Logic that should not read powers after death belongs in the power's `AfterRemoved` or later.

## 5. Power Application (PowerCmd.Apply)

1. **`Hook.BeforePowerAmountChanged`**
2. **`Hook.ModifyPowerAmountGiven`** (giver's perspective, only when the giver exists and is present)
3. **`Hook.ModifyPowerAmountReceived`** (receiver's perspective)
4. Multiplayer scaling (`ShouldScaleInMultiplayer`)
5. `power.BeforeApplied` → `power.ApplyInternal` (actually attached)
6. **`Hook.AfterModifyingPowerAmountGiven`** + **`Hook.AfterModifyingPowerAmountReceived`** (notified only after attaching)
7. `power.AfterApplied` → **`Hook.AfterPowerAmountChanged`**

## 6. Player Turn End (CombatManager)

Two phases:

### Phase One (hooks that may trigger player choices)

1. **`Hook.AfterAutoPostPlayPhaseEntered`** (per player)
2. **`Hook.BeforeSideTurnEnd`**
3. Per player `DoTurnEnd`:
   - Orb queue `OrbQueue.BeforeTurnEnd`
   - Cards in hand with `OnTurnEndInHand` effects: first exhaust **Ethereal** cards (`Hook.ShouldEtherealTrigger` → `CardCmd.Exhaust`), then run each card's `OnTurnEndInHandWrapper`
4. **`Hook.BeforeFlush`** (per player, decides whether to discard)

### Phase Two (pure cleanup, no player choices allowed)

1. Per player `FlushPlayerHand`:
   - `Hook.ShouldFlush` decides → discard (retained cards stay in hand) → **`Hook.AfterFlush`**
   - `player.PlayerCombatState.EndOfTurnCleanup()`
2. **`Hook.AfterSideTurnEnd`**
3. `SwitchFromPlayerToEnemySide`: **`Hook.ShouldTakeExtraTurn`** decides extra turns → `SwitchSides`

### Enemy Turn End (EndEnemyTurnInternal)

1. **`Hook.BeforeSideTurnEnd`** (enemy side)
2. Each player `PlayerCombatState.EndOfTurnCleanup()`
3. **`Hook.AfterSideTurnEnd`** (enemy side)

## 7. Combat End (EndCombatInternal)

1. `turnState.IsInProgress = false`
2. Each player `ReviveBeforeCombatEnd`
3. **`Hook.AfterCombatEnd`**
4. Clear history, room wrap-up, write replay
5. Each player `player.AfterCombatEnd()`
6. **`Hook.AfterCombatVictory`**
7. Save progress, achievement checks, etc.

> Rewards: after **`Hook.AfterCombatVictory`**, entering the reward selection there is also **`Hook.BeforeCombatRewardOffered`** (before offering rewards) → `Hook.ModifyRewards` series (modifying reward contents/odds).
