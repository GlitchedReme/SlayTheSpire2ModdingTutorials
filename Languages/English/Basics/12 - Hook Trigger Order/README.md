# Hook Trigger Order

> This article is based on the game **0.111** source code. All ordering comes directly from `CombatManager`, `CreatureCmd`, `CardModel`, `PowerCmd`, `Hook`, `CombatState`, `RunState` and other source files.

> Organized and reviewed by AI. Please point out any errors.

## Traversal Order (within one hook, who is called first)

Every time a hook fires, it traverses "all listeners" and calls them in a fixed order. Understanding this order lets you predict the sequence of multiple sources inside the same hook.

### In Combat (`ICombatState.IterateHookListeners`)

Traverses all allies first, then all enemies. For each creature, in order:

1. **All Powers on that creature** (`creature.Powers`, in attach order).
2. If the creature is a player (and `IsActiveForHooks`):
   - That player's **relics** (skipping melted ones, `IsMelted`).
   - That player's **potion slots** (`PotionSlots`, skipping empty slots).
   - That player's **orb queue** (`OrbQueue.Orbs`).
   - **Every card in all of that player's piles** (`AllPiles`: hand, draw, discard, play, exhaust, etc.), each card immediately followed by its `Affliction` and `Enchantment` (only added when non-null).
3. If the creature is a monster: that monster's **Monster model**.

After all creatures are traversed, appended last:

4. **Global Modifiers** → **BadgeModels** → **MultiplayerScalingModel** (the multiplayer scaling model, nullable).

### Outside Combat (`IRunState.IterateHookListeners(childCombatState)`)

1. **All cards in each player's deck** (`Deck.Cards`, each card followed by its `Enchantment`; deck cards do not carry `Affliction`).
2. **Only when not in combat (`childCombatState == null`)** are these appended:
   - Each player's **relics** (skipping melted).
   - Each player's **potions**.
   - **Global Modifiers** → **BadgeModels** → **MultiplayerScalingModel**.
3. **External subscribers** (`ModHelper.IterateAllRunStateSubscribers`).
4. If in combat (`childCombatState != null`): recurse into the in-combat order above.

> In combat, RunState does not re-add relics/potions/Modifiers, because the in-combat iterator already covers them — it walks creatures and brings them along. The RunState level only appends them once, outside combat.

> `RunState.IterateHookListeners` also filters with `Contains(model)`, allowing only `RelicModel`/`PotionModel`/`CardModel`/`EnchantmentModel`/`AchievementModel`/`BadgeModel`/`ModifierModel`/`MultiplayerScalingModel` through.

### The `Hook.IterateCombatHookListeners` guard

Most combat hooks do not call `combatState.IterateHookListeners()` directly; they go through the `Hook.IterateCombatHookListeners` guard: when `CombatManager.IsOverOrEnding && !IsStarting` (combat is over or ending), it **returns empty and dispatches to no listeners**.

- The check is evaluated **once**, when enumeration begins — not re-checked per listener. A dispatch that begins while combat is live therefore runs every listener, even if one of them ends combat partway through. Combat teardown is deferred to the next safe point (`CheckWinCondition`), so state stays intact for the rest of the dispatch.
- `IsStarting` exemption: during combat setup `IsInProgress` is still false (so `IsOverOrEnding` is true), but hooks like the initial shuffle (`ModifyShuffleOrder` with `isInitialShuffle`) must still reach listeners.

A few hooks **intentionally bypass the guard** and call `combatState.IterateHookListeners()` directly, because they are part of the kill/death/combat-end sequence itself and returning empty would break that sequence. Each such hook documents the reason in its own summary, including: `AfterBlockBroken`, `AfterCardPlayed`, `AfterCreatureAddedToCombat`, `AfterDamageGiven`, `AfterDiedToDoom`, `AfterDeath`, `ShouldCreatureBeRemovedFromCombatAfterDeath`, etc.

## 1. Combat Start (`CombatManager.StartCombatInternal`)

1. For each creature, `AfterCreatureAdded`: `creature.AfterAddedToRoom()`; if it is an enemy and the current side is Player, `RollMove`.
2. `IsInProgress = true`, `IsStarting = false`.
3. `Hook.BeforeCombatStart` (including `BeforeCombatStartLate`, two passes).
4. `CombatBegan` event, banner, FTUE, etc.
5. Enter `StartTurn` (see below).

## 2. Turn Start (`CombatManager.StartTurn`)

For each creature whose turn is starting, in order:

1. `creature.BeforeTurnStart(side)` — records each Power's `AmountOnTurnStart = Amount`.
2. `Hook.BeforeSideTurnStart`.
3. For each creature, `creature.AfterTurnStart(side)`:
   - If it is a player and `TurnNumber == 1` (first turn), skip clearing block.
   - Otherwise `ClearBlock()`: internally `Hook.ShouldClearBlock`; if cleared, `Block = 0`; if prevented, `Hook.AfterPreventingBlockClear`.
4. For each creature, `Hook.AfterBlockCleared` (a separate traversal loop, fired unconditionally).
5. For each player, `SetupPlayerTurn` (see below, launched in parallel).
6. `Hook.AfterSideTurnStart`.
7. For each player: orb queue `OrbQueue.AfterTurnStart`.
8. `RunAutoPrePlayPhase`: `CheckForEmptyHand` → `Hook.AfterAutoPrePlayPhaseEntered` (including `AfterAutoPrePlayPhaseEnteredEarly`, `AfterAutoPrePlayPhaseEnteredLate`, three passes) → enter the play phase (`Phase = Play`).

### SetupPlayerTurn (player turn setup)

1. `Hook.ShouldPlayerResetEnergy` decides → `ResetEnergy` (reset energy) / `AddMaxEnergyToCurrent` (add max energy).
2. `Hook.AfterEnergyReset` (including `AfterEnergyResetLate`, two passes).
3. `Hook.BeforeHandDraw` (including `BeforeHandDrawLate`, two passes).
4. `Hook.ModifyHandDraw` (default 5, computes draw count) → `Hook.AfterModifyingHandDraw`.
5. First-turn special handling: cards with `Enchantment.ShouldStartAtBottomOfDrawPile` go to the bottom → `Innate` keyword cards go to the top → adjust `handDraw` accordingly.
6. `CardPileCmd.Draw` draws cards:
   - `Hook.ShouldDraw` check (when prevented, `Hook.AfterPreventingDraw` and stop).
   - Before each draw in the loop: `ShuffleIfNecessary` (shuffles when the draw pile is empty).
   - Shuffle `Shuffle`: merge discard + draw piles → `StableShuffle` → `Hook.ModifyShuffleOrder` → merge into draw pile → `Hook.AfterShuffle`.
   - Each drawn card triggers `Hook.AfterCardDrawn` (including `AfterCardDrawnEarly`, two passes).
7. `Hook.AfterPlayerTurnStart` (including `AfterPlayerTurnStartEarly`, `AfterPlayerTurnStartLate`, three passes).

## 3. Card Play Flow (`CardModel.OnPlayWrapper`)

1. `CardPileCmd.AddDuringManualCardPlay` (hand → play pile); auto-play uses `Add(Play)`.
2. `Hook.ModifyCardPlayResultLocation` (based on `GetResultLocationForCardPlay`, decides where the card ends up after playing) → for each modifier, call `AfterModifyingCardPlayResultLocation`.
3. `GeneratePlayCount` (computes play count, internally via `Hook.ModifyCardPlayCount`).
4. Loop over each play (breaks when combat ends, `IsOverOrEnding`):
   - Power cards: `PlayPowerCardFlyVfx`; repeated plays: `AnimMultiCardPlay`.
   - `Hook.BeforeCardPlayed`.
   - `History.CardPlayStarted`.
   - Execute `card.OnPlay(...)` (your card's effect here).
   - Card enchantment `Enchantment.OnPlay` → card affliction `Affliction.OnPlay`.
   - `History.CardPlayFinished`.
   - `Hook.AfterCardPlayed` (bypasses the guard, iterates directly; including `AfterCardPlayedLate`, two passes).
5. Resolve the result location: to another player via `GiveToAnotherPlayer` / `RemoveFromCombat` (Limbo) / `Exhaust` / `Add` (discard).
6. `CheckForEmptyHand`.

> `GetResultLocationForCardPlay` is a new overridable extension point in 0.111: the default rule is repeated/power cards → Limbo (None); `ExhaustOnNextPlay` or cards with the `Exhaust` keyword → exhaust pile; otherwise → discard pile.

## 4. Damage Flow (`CreatureCmd.Damage`)

This is the most commonly used and most complex hook chain. For each target, in order:

1. `Hook.ModifyDamage` → `Hook.AfterModifyingDamageAmount`.
   - Inside `ModifyDamage`: first apply the card enchantment's `EnchantDamageAdditive` (additive) and `EnchantDamageMultiplicative` (multiplicative) → then enter `ModifyDamageInternal`, which traverses all listeners (via `runState.IterateHookListeners(combatState)`; in combat this includes RunState-level listeners and **does not go through** the `IterateCombatHookListeners` guard) in order: `ModifyDamageAdditive` (additive) → `ModifyDamageMultiplicative` (multiplicative) → `ModifyDamageCap` (cap, takes the minimum).
2. `Hook.BeforeDamageReceived`.
3. Block resolution `DamageBlockInternal` (block absorbs part of the damage).
4. `Hook.ModifyHpLost` (`HpLossHookPhase.BeforeOsty`, before the Osty redirect) → `Hook.AfterModifyingHpLostBeforeOsty`.
5. `Hook.ModifyUnblockedDamageTarget` (unblocked damage may be redirected to Osty).
6. `Hook.ModifyHpLost` (`HpLossHookPhase.AfterOsty`, after the Osty redirect) → `Hook.AfterModifyingHpLostAfterOsty`.
7. `LoseHpInternal` (lose HP).
8. If damage was redirected to another target (`unblockedDamageTarget != originalTarget`), the original target's overflow damage runs once more: `ModifyHpLost(AfterOsty)` → `AfterModifyingHpLostAfterOsty` → `LoseHpInternal`.
9. Resolve each `DamageResult`:
   - On block break: `Hook.AfterBlockBroken` (bypasses the guard).
   - After HP loss: `Hook.AfterCurrentHpChanged` (only when `UnblockedDamage > 0`).
   - `Hook.AfterDamageGiven` (attacker's perspective, bypasses the guard).
   - **If the target survived**: `Hook.AfterDamageReceived` (including `AfterDamageReceivedLate`, two passes); **if the target died**: added to `killedCreatures`.
10. After the loop: `Kill(killedCreatures)` (see death flow).

> `Hook.AfterDamageReceived` is only called when the **target survives**; when the target dies it is skipped and the death flow runs instead.

## 5. Death Flow (`CreatureCmd.KillWithoutCheckingWinCondition`)

1. If current HP > 0: set HP to 0 first (`LoseHpInternal`) + `Hook.AfterCurrentHpChanged`.
2. `Hook.BeforeDeath`.
3. `Hook.ShouldDie` decides whether death really happens (can be prevented, e.g. Fairy in a Bottle):
   - **Death allowed**:
     a. `creature.InvokeDiedEvent()` (`Died` event).
     b. `Hook.ShouldCreatureBeRemovedFromCombatAfterDeath` (bypasses the guard) decides whether to remove from combat.
     c. Play death animation.
     d. `Hook.AfterDeath` (`wasRemovalPrevented: false`) — powers are still present at this point.
     e. Remove the creature from combat (`RemoveCreature`).
     f. `creature.RemoveAllPowersAfterDeath()` → each removed Power calls `AfterRemoved`.
     g. If it is the primary enemy and all teammates are secondary enemies: `Kill(teammates)` along with it.
     h. If it is a player: clear orbs, kill Osty (if alive), `player.DeactivateHooks()`, `HandlePlayerDeath`.
   - **Death prevented**:
     a. `Hook.AfterDeath` (`wasRemovalPrevented: true`).
     b. `Hook.AfterPreventingDeath`.
     c. If still near-dead (`IsDead`), retry recursively (up to 10 times; exceeding that throws an exception).

## 6. Power Application (`PowerCmd.Apply`)

1. `Hook.BeforePowerAmountChanged`.
2. `Hook.ModifyPowerAmountGiven` (giver's perspective, only when the giver exists and is present).
3. `Hook.ModifyPowerAmountReceived` (receiver's perspective).
4. Multiplayer scaling: only in effect when `Players.Count > 1` and the target is a primary/secondary enemy and `power.ShouldScaleInMultiplayer`.
5. `power.BeforeApplied` → `power.ApplyInternal` (actually attached).
6. `Hook.AfterModifyingPowerAmountGiven` + `Hook.AfterModifyingPowerAmountReceived`.
7. `power.AfterApplied` → `Hook.AfterPowerAmountChanged`.

## 7. Player Turn End (`CombatManager`)

Two phases:

### Phase One (hooks that may trigger player choices)

1. Per player `Hook.AfterAutoPostPlayPhaseEntered` (parallel, each player gets its own choice context).
2. `Hook.BeforeSideTurnEnd`.
3. Per player `DoTurnEnd`:
   - Orb queue `OrbQueue.BeforeTurnEnd`.
   - Classify cards in hand: cards with turn-end effects (`HasTurnEndInHandEffect`) go into `turnEndCards`; `Ethereal` keyword cards that pass `Hook.ShouldEtherealTrigger` go into a to-exhaust list.
   - First exhaust **Ethereal** cards (`CardCmd.Exhaust`, `causedByEthereal: true`).
   - `DoTurnEndCards`: turn-end effect cards fly into the play pile one by one with staggered delays → `OnTurnEndInHandWrapper` resolves the effect → fly to the result pile (non-Ethereal to discard, Ethereal to exhaust).
4. Per player `Hook.BeforeFlush` (including `BeforeFlushLate`, decides whether to discard).

### Phase Two (pure cleanup, no player choices allowed)

1. Per player `FlushPlayerHand`:
   - `Hook.ShouldFlush` decides → discard (cards with `ShouldRetainThisTurn` stay in hand) → `Hook.AfterFlush`.
   - `player.PlayerCombatState.EndOfTurnCleanup()`.
2. `Hook.AfterSideTurnEnd`.
3. `SwitchFromPlayerToEnemySide`: per player `Hook.ShouldTakeExtraTurn` decides extra turns → `SwitchSides` → for each extra-turn player `Hook.AfterTakingExtraTurn`.

### Enemy Turn End (`EndEnemyTurnInternal`)

1. `Hook.BeforeSideTurnEnd` (enemy side).
2. Each player `PlayerCombatState.EndOfTurnCleanup()`.
3. `Hook.AfterSideTurnEnd` (enemy side).

## 8. Combat End (`EndCombatInternal`)

1. `turnState.IsInProgress = false`.
2. Each player `ReviveBeforeCombatEnd`.
3. `Hook.AfterCombatEnd`.
4. Clear history (`History.Clear`), room wrap-up (`room.OnCombatEnded`), write replay.
5. Each player `player.AfterCombatEnd()`.
6. `Hook.AfterCombatVictory` (including `AfterCombatVictoryEarly`, two passes).
7. Save progress, achievement checks, etc.

## 9. Entering a Room (non-combat flow)

> Room entry is dispatched centrally by `RunManager.EnterRoomInternal`. `BeforeRoomEntered` fires on **normal entry** (via `EnterRoom` from the map, or `EnterRoomWithoutExitingCurrentRoom` for sub-rooms), as long as the target room is not a `MapRoom` (the map screen itself). It is only skipped when **restoring the room stack** (`isRestoringRoomStackBase = true`, e.g. returning to a parent event room after combat).

1. `State.PushRoom(room)`.
2. (When not a MapRoom and external effects are needed) `Hook.BeforeRoomEntered`.
3. `room.Enter` (each room type fires `Hook.AfterRoomEntered` at the end of `EnterInternal`).
4. Per room type, `EnterInternal` differs:

   | Room type | Main flow on entry |
   | --------- | ------------------ |
   | **Combat room** | add players → generate monsters → preload assets → `SetUpCombat` → `Hook.AfterRoomEntered` → `AfterCombatRoomLoaded` → combat starts |
   | **Treasure room** | preload assets → create node → `Hook.AfterRoomEntered` → `BeginRelicPicking` (start relic pickup) |
   | **Rest site** | preload assets → show options → `Hook.AfterRoomEntered` |
   | **Shop** | generate inventory → preload assets → create node → `Hook.AfterRoomEntered` |
   | **Event room** | `Hook.AfterRoomEntered` |

> `AfterRoomEntered` is the generic hook that fires after entering any room, suitable for listening to "entered a certain room type".

### Entering a new Act / Generating the map

- `Hook.ModifyGeneratedMap`: modifies map structure when generating a **new map** (via `State.Act.CreateMap`).
- `Hook.ModifyGeneratedMapLate`: modifies map structure when loading a **saved map** (`SavedActMap`). The two are mutually exclusive: new maps only run the former, saved maps only the latter.
- `Hook.AfterMapGenerated`: after map generation completes.
- `Hook.AfterActEntered`: after entering a new Act (fires after the map and rooms are ready).

## 10. Rewards & Loot

1. After combat victory, `CombatRoom.OfferRoomEndRewards`: for each player, `RewardsCmd.GenerateForRoomEnd` generates a reward set.
2. `RewardsSet.GenerateWithoutOffering`:
   - Each `Reward.Populate()` (fill reward contents).
   - `Hook.ModifyRewards` (modify reward contents/add/remove).
   - Newly added rewards are populated again.
   - `Hook.AfterModifyingRewards`.
3. For each reward set `Hook.BeforeCombatRewardOffered` (before offering to the player) → `reward.Offer()`.
4. When the player picks a reward, `Reward.Take` → `Hook.AfterRewardTaken`.

### Card reward options

- When `CardReward` / `CardFactory` generates card reward options: `Hook.TryModifyCardRewardOptions` (first) → `TryModifyCardRewardOptionsLate` (second) → `Hook.AfterModifyingCardRewardOptions`.
- The modifiers are mostly relics (e.g. the various Eggs, WingCharm, etc.), used to change the rarity/type of reward cards.

## 11. Other Common Scenarios

### Gaining gold

`PlayerCmd` fires `Hook.AfterGoldGained` after adding gold; if modification is involved there is also `Hook.ModifyGoldGained` / `Hook.AfterModifyingGoldGained`.

### Shop purchase

`MerchantEntry` / `MerchantCardRemovalEntry` fires `Hook.AfterItemPurchased` after completing a purchase.

### Obtaining a relic

`RelicCmd.Obtain`: add to relic inventory → remove from the grab bag → record floor → call `relic.AfterObtained()` (a direct model method call with no dedicated `Hook` wrapper, so listening to relic acquisition requires overriding `RelicModel.AfterObtained`).

### Using a potion

`PotionModel.OnUseWrapper`:
1. `RemoveBeforeUse`.
2. `Hook.BeforePotionUsed`.
3. Throw VFX.
4. `OnUse` (the potion effect, via `BranchingPlayerChoiceContext`).
5. `History.PotionUsed`.
6. `Hook.AfterPotionUsed`.
7. `CheckForEmptyHand`.

### Rest site

- **Heal**: `HealRestSiteOption` / `MendRestSiteOption` fires `Hook.AfterRestSiteHeal` after completing (`Mend` passes `isMimicked: false`).
- **Smith**: `SmithRestSiteOption` fires `Hook.AfterRestSiteSmith` after completing.

### Orbs

- Channel: `Hook.AfterOrbChanneled`.
- Evoke: `Hook.AfterOrbEvoked`.
- Passive trigger count modification: `Hook.ModifyOrbPassiveTriggerCount` → `Hook.AfterModifyingOrbPassiveTriggerCount`.

### Block

- Before gaining block `Hook.BeforeBlockGained` → compute modification `Hook.ModifyBlock` → `Hook.AfterModifyingBlockAmount` → after actually gained `Hook.AfterBlockGained`.

### Forging gold

`Hook.AfterForge` (fires after forging).

### Card pile changes

- After a card changes piles `Hook.AfterCardChangedPiles` (including `AfterCardChangedPilesLate`, two passes).
- After a card is exhausted `Hook.AfterCardExhausted`.
- After a card is discarded `Hook.AfterCardDiscarded`.
- After a card enters combat `Hook.AfterCardEnteredCombat`; generated for combat `Hook.AfterCardGeneratedForCombat`.
- Before a card is removed `Hook.BeforeCardRemoved`.

### Creatures

- A creature added to combat `Hook.AfterCreatureAddedToCombat` (bypasses the guard).
- Osty revived `Hook.AfterOstyRevived`.

### Attacks

- Before an attack starts `Hook.BeforeAttack`.
- After an attack ends `Hook.AfterAttack`.
