# Hook 执行顺序

> 本文基于游戏 **0.111** 源码。所有顺序均直接来自 `CombatManager`、`CreatureCmd`、`CardModel`、`PowerCmd`、`Hook`、`CombatState`、`RunState` 等源码。

> 由 AI 整理和审核，如有错误请指出。

## 遍历顺序（同一钩子内，谁先被调用）

每个钩子在触发时，会遍历"所有监听者"并按固定顺序调用。理解这个顺序，才能预测同一个钩子内部多个来源的先后。

### 战斗内（`ICombatState.IterateHookListeners`）

先遍历所有友方生物，再遍历所有敌方生物。对每个生物依次：

1. **该生物身上的所有 Power**（`creature.Powers`，按挂载顺序）。
2. 若生物是玩家（且 `IsActiveForHooks`）：
   - 该玩家的**遗物**（跳过融化的 `IsMelted`）。
   - 该玩家的**药水栏位**（`PotionSlots`，跳过空位）。
   - 该玩家的**充能球队列**（`OrbQueue.Orbs`）。
   - 该玩家**所有牌堆里的每张卡**（`AllPiles`：手牌、抽牌堆、弃牌堆、打出区、消耗区等），每张卡之后紧跟它的 `Affliction` 和 `Enchantment`（非空才加）。
3. 若生物是怪物：该怪物的 **Monster 模型**。

所有生物遍历完后，最后追加：

4. **全局 Modifiers** → **BadgeModels** → **MultiplayerScalingModel**（多人缩放模型，可空）。

### 战斗外（`IRunState.IterateHookListeners(childCombatState)`）

1. 每个玩家的**牌组所有卡**（`Deck.Cards`，卡之后跟其 `Enchantment`；牌组卡不含 `Affliction`）。
2. **仅当不在战斗内（`childCombatState == null`）时**，才追加：
   - 每个玩家的**遗物**（跳过融化）。
   - 每个玩家的**药水**。
   - **全局 Modifiers** → **BadgeModels** → **MultiplayerScalingModel**。
3. **外部订阅者**（`ModHelper.IterateAllRunStateSubscribers`）。
4. 若在战斗内（`childCombatState != null`）：递归到上面的"战斗内顺序"。

> 战斗中 RunState 不重复加遗物/药水/Modifiers，因为这些已经被战斗内迭代器覆盖——战斗内迭代器遍历生物时已经把它们带进来了。RunState 级别只在战斗外才追加一次。

> `RunState.IterateHookListeners` 还会用 `Contains(model)` 过滤，只允许 `RelicModel`/`PotionModel`/`CardModel`/`EnchantmentModel`/`AchievementModel`/`BadgeModel`/`ModifierModel`/`MultiplayerScalingModel` 通过。

### `Hook.IterateCombatHookListeners` 的守卫

大多数战斗钩子不直接用 `combatState.IterateHookListeners()`，而是走 `Hook.IterateCombatHookListeners` 守卫：当 `CombatManager.IsOverOrEnding && !IsStarting` 时（战斗结束或正在结束时），**直接返回空，不派发任何监听者**。

- 检查只在枚举开始时评估**一次**，不会逐监听者重判。一次派发开始时战斗还在，就会跑完全部监听者，即便中途某个监听者结束了战斗。战斗清理会延迟到下一个安全点（`CheckWinCondition`），状态在此期间保持完整。
- `IsStarting` 豁免：战斗设置期间 `IsInProgress` 仍为 false（所以 `IsOverOrEnding` 为 true），但初始洗牌（`ModifyShuffleOrder` 且 `isInitialShuffle`）等钩子必须能触达监听者。

少数钩子**故意绕过守卫**，直接用 `combatState.IterateHookListeners()`，因为它们本身属于击杀/死亡/战斗结束序列，返回空会破坏该序列。每个这类钩子的文档注释都写明了原因，包括：`AfterBlockBroken`、`AfterCardPlayed`、`AfterCreatureAddedToCombat`、`AfterDamageGiven`、`AfterDiedToDoom`、`AfterDeath`、`ShouldCreatureBeRemovedFromCombatAfterDeath` 等。

## 一、战斗开始（`CombatManager.StartCombatInternal`）

1. 对每个生物 `AfterCreatureAdded`：`creature.AfterAddedToRoom()`，敌方若当前是玩家侧则 `RollMove`。
2. `IsInProgress = true`、`IsStarting = false`。
3. `Hook.BeforeCombatStart`（含 `BeforeCombatStartLate`，两轮遍历）。
4. `CombatBegan` 事件、横幅、FTUE 等。
5. 进入 `StartTurn`（见下）。

## 二、回合开始（`CombatManager.StartTurn`）

对每个回合开始的生物依次：

1. `creature.BeforeTurnStart(side)` —— 记录每个 Power 的 `AmountOnTurnStart = Amount`。
2. `Hook.BeforeSideTurnStart`。
3. 对每个生物 `creature.AfterTurnStart(side)`：
   - 若是玩家且 `TurnNumber == 1`（首回合），跳过清格挡。
   - 否则 `ClearBlock()`：内部走 `Hook.ShouldClearBlock`，清空则 `Block = 0`；被阻止则 `Hook.AfterPreventingBlockClear`。
4. 对每个生物 `Hook.AfterBlockCleared`（独立的遍历循环，无条件触发）。
5. 对每个玩家 `SetupPlayerTurn`（见下，并行启动）。
6. `Hook.AfterSideTurnStart`。
7. 对每个玩家：充能球队列 `OrbQueue.AfterTurnStart`。
8. `RunAutoPrePlayPhase`：`CheckForEmptyHand` → `Hook.AfterAutoPrePlayPhaseEntered`（含 `AfterAutoPrePlayPhaseEnteredEarly`、`AfterAutoPrePlayPhaseEnteredLate`，三轮）→ 进入出牌阶段（`Phase = Play`）。

### SetupPlayerTurn（玩家回合设置）

1. `Hook.ShouldPlayerResetEnergy` 判断 → `ResetEnergy`（重置能量）/ `AddMaxEnergyToCurrent`（加最大能量）。
2. `Hook.AfterEnergyReset`（含 `AfterEnergyResetLate`，两轮）。
3. `Hook.BeforeHandDraw`（含 `BeforeHandDrawLate`，两轮）。
4. `Hook.ModifyHandDraw`（默认 5，算出抽牌数）→ `Hook.AfterModifyingHandDraw`。
5. 第一回合特殊处理：`Enchantment.ShouldStartAtBottomOfDrawPile` 的卡置底 → `Innate` 关键词卡置顶 → 据此调整 `handDraw`。
6. `CardPileCmd.Draw` 抽牌：
   - `Hook.ShouldDraw` 判断（被阻止时 `Hook.AfterPreventingDraw` 并结束）。
   - 循环每次抽牌前：`ShuffleIfNecessary`（抽牌堆空时洗牌）。
   - 洗牌 `Shuffle`：合并弃牌堆+抽牌堆 → `StableShuffle` → `Hook.ModifyShuffleOrder` → 并入抽牌堆 → `Hook.AfterShuffle`。
   - 每张抽出的卡 `Hook.AfterCardDrawn`（含 `AfterCardDrawnEarly`，两轮）。
7. `Hook.AfterPlayerTurnStart`（含 `AfterPlayerTurnStartEarly`、`AfterPlayerTurnStartLate`，三轮）。

## 三、出牌流程（`CardModel.OnPlayWrapper`）

1. `CardPileCmd.AddDuringManualCardPlay`（手牌 → 打出区）；自动出牌走 `Add(Play)`。
2. `Hook.ModifyCardPlayResultLocation`（基于 `GetResultLocationForCardPlay`，决定卡牌打出后的去向）→ 对每个修改者调 `AfterModifyingCardPlayResultLocation`。
3. `GeneratePlayCount`（计算打出次数，内部走 `Hook.ModifyCardPlayCount`）。
4. 循环每次打出（战斗结束 `IsOverOrEnding` 时 break）：
   - 能力牌 `PlayPowerCardFlyVfx`；重复打出 `AnimMultiCardPlay`。
   - `Hook.BeforeCardPlayed`。
   - `History.CardPlayStarted`。
   - 执行 `card.OnPlay(...)`（你的卡牌效果在这里）。
   - 卡牌附魔 `Enchantment.OnPlay` → 卡牌感染 `Affliction.OnPlay`。
   - `History.CardPlayFinished`。
   - `Hook.AfterCardPlayed`（绕过守卫，直接遍历；含 `AfterCardPlayedLate`，两轮）。
5. 结算结果位置：给其他玩家 `GiveToAnotherPlayer` / `RemoveFromCombat`（Limbo）/ `Exhaust` / `Add`（弃牌堆）。
6. `CheckForEmptyHand`。

> `GetResultLocationForCardPlay` 是 0.111 新增的可覆写扩展点：默认规则为重复/能力牌 → Limbo（None）；`ExhaustOnNextPlay` 或带 `Exhaust` 关键词 → 消耗堆；否则 → 弃牌堆。

## 四、伤害流程（`CreatureCmd.Damage`）

这是最常用也最复杂的钩子链。对每个目标依次：

1. `Hook.ModifyDamage` → `Hook.AfterModifyingDamageAmount`。
   - `ModifyDamage` 内部顺序：先对卡牌附魔应用 `EnchantDamageAdditive`（加算）和 `EnchantDamageMultiplicative`（乘算）→ 再进入 `ModifyDamageInternal`，遍历所有监听者（走 `runState.IterateHookListeners(combatState)`，战斗内会带上 RunState 级监听者，且**不经过** `IterateCombatHookListeners` 守卫）依次：`ModifyDamageAdditive`（加算）→ `ModifyDamageMultiplicative`（乘算）→ `ModifyDamageCap`（上限，取最小值）。
2. `Hook.BeforeDamageReceived`。
3. 格挡结算 `DamageBlockInternal`（格挡吸收部分伤害）。
4. `Hook.ModifyHpLost`（`HpLossHookPhase.BeforeOsty`，奥斯提转移前）→ `Hook.AfterModifyingHpLostBeforeOsty`。
5. `Hook.ModifyUnblockedDamageTarget`（未格挡伤害可转移到奥斯提）。
6. `Hook.ModifyHpLost`（`HpLossHookPhase.AfterOsty`，奥斯提转移后）→ `Hook.AfterModifyingHpLostAfterOsty`。
7. `LoseHpInternal`（掉血）。
8. 若伤害被转移到其他目标（`unblockedDamageTarget != originalTarget`），对原目标的溢出伤害再走一次：`ModifyHpLost(AfterOsty)` → `AfterModifyingHpLostAfterOsty` → `LoseHpInternal`。
9. 结算每个 `DamageResult`：
   - 破格挡时 `Hook.AfterBlockBroken`（绕过守卫）。
   - 掉血后 `Hook.AfterCurrentHpChanged`（仅 `UnblockedDamage > 0`）。
   - `Hook.AfterDamageGiven`（攻击者视角，绕过守卫）。
   - **若目标没死**：`Hook.AfterDamageReceived`（含 `AfterDamageReceivedLate`，两轮）；**若目标死了**：记入 `killedCreatures`。
10. 循环结束后：`Kill(killedCreatures)`（见死亡流程）。

> `Hook.AfterDamageReceived` 只在**目标存活**时调用；目标死亡时跳过，改走死亡流程。

## 五、死亡流程（`CreatureCmd.KillWithoutCheckingWinCondition`）

1. 若当前 HP > 0：先把 HP 归零（`LoseHpInternal`）+ `Hook.AfterCurrentHpChanged`。
2. `Hook.BeforeDeath`。
3. `Hook.ShouldDie` 判断是否真的死亡（可被防止，如 Fairy in a Bottle）：
   - **允许死亡**：
     a. `creature.InvokeDiedEvent()`（`Died` 事件）。
     b. `Hook.ShouldCreatureBeRemovedFromCombatAfterDeath`（绕过守卫）判断是否从战斗移除。
     c. 播放死亡动画。
     d. `Hook.AfterDeath`（`wasRemovalPrevented: false`）—— 此时能力还在。
     e. 从战斗移除生物（`RemoveCreature`）。
     f. `creature.RemoveAllPowersAfterDeath()` → 每个被移除的 Power 调 `AfterRemoved`。
     g. 若为主敌人且队友全是次级敌人：连带 `Kill(teammates)`。
     h. 若是玩家：清空充能球、击杀奥斯提（若活着）、`player.DeactivateHooks()`、`HandlePlayerDeath`。
   - **死亡被防止**：
     a. `Hook.AfterDeath`（`wasRemovalPrevented: true`）。
     b. `Hook.AfterPreventingDeath`。
     c. 若仍处于濒死（`IsDead`），递归重试（最多 10 次，超过抛异常）。

## 六、Power 施加（`PowerCmd.Apply`）

1. `Hook.BeforePowerAmountChanged`。
2. `Hook.ModifyPowerAmountGiven`（施加者视角，只在施加者存在且在场时）。
3. `Hook.ModifyPowerAmountReceived`（受击者视角）。
4. 多人缩放：仅当 `Players.Count > 1` 且目标是主/次级敌人、且 `power.ShouldScaleInMultiplayer` 时生效。
5. `power.BeforeApplied` → `power.ApplyInternal`（真正挂上）。
6. `Hook.AfterModifyingPowerAmountGiven` + `Hook.AfterModifyingPowerAmountReceived`。
7. `power.AfterApplied` → `Hook.AfterPowerAmountChanged`。

## 七、玩家回合结束（`CombatManager`）

分两个阶段：

### Phase One（可触发玩家选择的钩子）

1. 对每个玩家 `Hook.AfterAutoPostPlayPhaseEntered`（并行，每个玩家独立 choice context）。
2. `Hook.BeforeSideTurnEnd`。
3. 对每个玩家 `DoTurnEnd`：
   - 充能球 `OrbQueue.BeforeTurnEnd`。
   - 手牌分类：带回合结束效果的卡（`HasTurnEndInHandEffect`）入 `turnEndCards`；`Ethereal` 关键词且 `Hook.ShouldEtherealTrigger` 的卡入待消耗列表。
   - 先消耗**虚无**卡（`CardCmd.Exhaust`，`causedByEthereal: true`）。
   - `DoTurnEndCards`：回合结束效果卡以交错延迟依次飞入打出牌堆 → `OnTurnEndInHandWrapper` 解析效果 → 飞到结果牌堆（非 Ethereal 进弃牌堆，Ethereal 进消耗堆）。
4. 对每个玩家 `Hook.BeforeFlush`（含 `BeforeFlushLate`，判定是否弃牌）。

### Phase Two（纯清理，不能有玩家选择）

1. 对每个玩家 `FlushPlayerHand`：
   - `Hook.ShouldFlush` 判定 → 弃牌（`ShouldRetainThisTurn` 的卡留手）→ `Hook.AfterFlush`。
   - `player.PlayerCombatState.EndOfTurnCleanup()`。
2. `Hook.AfterSideTurnEnd`。
3. `SwitchFromPlayerToEnemySide`：对每个玩家 `Hook.ShouldTakeExtraTurn` 判定额外回合 → `SwitchSides` → 对每个额外回合玩家 `Hook.AfterTakingExtraTurn`。

### 敌人回合结束（`EndEnemyTurnInternal`）

1. `Hook.BeforeSideTurnEnd`（敌人侧）。
2. 每个玩家 `PlayerCombatState.EndOfTurnCleanup()`。
3. `Hook.AfterSideTurnEnd`（敌人侧）。

## 八、战斗结束（`EndCombatInternal`）

1. `turnState.IsInProgress = false`。
2. 每个玩家 `ReviveBeforeCombatEnd`。
3. `Hook.AfterCombatEnd`。
4. 清历史（`History.Clear`）、房间收尾（`room.OnCombatEnded`）、写回放。
5. 每个玩家 `player.AfterCombatEnd()`。
6. `Hook.AfterCombatVictory`（含 `AfterCombatVictoryEarly`，两轮）。
7. 保存进度、成就检查等。

## 九、进入房间（非战斗流程）

> 进入房间由 `RunManager.EnterRoomInternal` 统一调度。`BeforeRoomEntered` 在**正常进入**（从地图走 `EnterRoom`、或子房间走 `EnterRoomWithoutExitingCurrentRoom`）时都会触发，只要目标房间不是 `MapRoom`（地图界面本身）。只有在**恢复房间栈**（`isRestoringRoomStackBase = true`，如战斗结束返回父事件房）时才跳过 `BeforeRoomEntered`。

1. `State.PushRoom(room)`。
2. （非 MapRoom 且需要外部效果时）`Hook.BeforeRoomEntered`。
3. `room.Enter`（各房间类型在 `EnterInternal` 末尾统一触发 `Hook.AfterRoomEntered`）。
4. 各房间类型 `EnterInternal` 内部差异：

   | 房间类型 | 进入时主要流程 |
   | -------- | -------------- |
   | **战斗房** | 加玩家 → 生成怪物 → 预加载资产 → `SetUpCombat` → `Hook.AfterRoomEntered` → `AfterCombatRoomLoaded` → 战斗开始 |
   | **宝箱房** | 预加载资产 → 创建节点 → `Hook.AfterRoomEntered` → `BeginRelicPicking`（开始拾取遗物） |
   | **休息点** | 预加载资产 → 显示选项 → `Hook.AfterRoomEntered` |
   | **商店** | 生成库存 → 预加载资产 → 创建节点 → `Hook.AfterRoomEntered` |
   | **事件房** | `Hook.AfterRoomEntered` |

> `AfterRoomEntered` 是所有房间进入后都会触发的通用钩子，适合做"进入某类房间"的监听。

### 进入新 Act / 生成地图

- `Hook.ModifyGeneratedMap`：生成**新地图**时修改地图结构（走 `State.Act.CreateMap`）。
- `Hook.ModifyGeneratedMapLate`：加载**存档地图**（`SavedActMap`）时修改地图结构。两者互斥：新地图只走前者，存档地图只走后者。
- `Hook.AfterMapGenerated`：地图生成完成后。
- `Hook.AfterActEntered`：进入新 Act 后（在地图/房间都就绪之后触发）。

## 十、奖励与战利品

1. 战斗胜利后 `CombatRoom.OfferRoomEndRewards`：对每个玩家 `RewardsCmd.GenerateForRoomEnd` 生成奖励集。
2. `RewardsSet.GenerateWithoutOffering`：
   - 每个 `Reward.Populate()`（填充奖励内容）。
   - `Hook.ModifyRewards`（修改奖励内容/增删）。
   - 新增的奖励再次 `Populate`。
   - `Hook.AfterModifyingRewards`。
3. 对每个奖励集 `Hook.BeforeCombatRewardOffered`（提供奖励给玩家前）→ `reward.Offer()`。
4. 玩家选择奖励时 `Reward.Take` → `Hook.AfterRewardTaken`。

### 卡牌奖励选项

- `CardReward` / `CardFactory` 生成卡牌奖励选项时：`Hook.TryModifyCardRewardOptions`（先）→ `TryModifyCardRewardOptionsLate`（后）→ `Hook.AfterModifyingCardRewardOptions`。
- 修改者多是遗物（如各种 Egg、WingCharm 等），用于改变奖励卡牌的稀有度/类型。

## 十一、其他常用场景

### 获得金币

`PlayerCmd` 加金币后触发 `Hook.AfterGoldGained`；若涉及修改则还有 `Hook.ModifyGoldGained` / `Hook.AfterModifyingGoldGained`。

### 商店购买

`MerchantEntry` / `MerchantCardRemovalEntry` 完成购买后触发 `Hook.AfterItemPurchased`。

### 获得遗物

`RelicCmd.Obtain`：加入遗物栏 → 移出抓包 → 记录楼层 → 调 `relic.AfterObtained()`（直接调用模型方法，无独立 `Hook` 包装，所以新增遗物的监听需要覆写 `RelicModel.AfterObtained`）。

### 使用药水

`PotionModel.OnUseWrapper`：
1. `RemoveBeforeUse`。
2. `Hook.BeforePotionUsed`。
3. 投掷 VFX。
4. `OnUse`（药水效果，走 `BranchingPlayerChoiceContext`）。
5. `History.PotionUsed`。
6. `Hook.AfterPotionUsed`。
7. `CheckForEmptyHand`。

### 休息点

- **治疗**：`HealRestSiteOption` / `MendRestSiteOption` 完成后触发 `Hook.AfterRestSiteHeal`（`Mend` 传 `isMimicked: false`）。
- **锻造**：`SmithRestSiteOption` 完成后触发 `Hook.AfterRestSiteSmith`。

### 充能球

- 引导：`Hook.AfterOrbChanneled`。
- 唤出：`Hook.AfterOrbEvoked`。
- 被动触发次数修改：`Hook.ModifyOrbPassiveTriggerCount` → `Hook.AfterModifyingOrbPassiveTriggerCount`。

### 格挡

- 获得格挡前 `Hook.BeforeBlockGained` → 计算修改量 `Hook.ModifyBlock` → `Hook.AfterModifyingBlockAmount` → 真正获得后 `Hook.AfterBlockGained`。

### 金币锻造

`Hook.AfterForge`（锻造后触发）。

### 卡牌牌堆变动

- 卡牌换堆后 `Hook.AfterCardChangedPiles`（含 `AfterCardChangedPilesLate`，两轮）。
- 卡牌消耗后 `Hook.AfterCardExhausted`。
- 卡牌弃置后 `Hook.AfterCardDiscarded`。
- 卡牌进入战斗 `Hook.AfterCardEnteredCombat`；为战斗生成 `Hook.AfterCardGeneratedForCombat`。
- 卡牌移除前 `Hook.BeforeCardRemoved`。

### 生物

- 生物加入战斗 `Hook.AfterCreatureAddedToCombat`（绕过守卫）。
- 奥斯提复活 `Hook.AfterOstyRevived`。

### 攻击

- 攻击发起前 `Hook.BeforeAttack`。
- 攻击结束后 `Hook.AfterAttack`。
