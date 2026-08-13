# Hook 执行顺序

> 本文基于游戏 0.110.1 源码。所有顺序均直接来自 `CombatManager`、`CreatureCmd`、`Hook` 等源码。

> 由AI整理和审核，如有错误请指出。

## 遍历顺序（同一钩子内，谁先被调用）

每个钩子在触发时，会遍历"所有监听者"并按固定顺序调用。理解这个顺序，才能预测同一个钩子内部多个来源的先后。

### 战斗内（ICombatState.IterateHookListeners）

按生物依次遍历，每个生物的顺序是：

1. **该生物身上的所有 Power**（`creature.Powers`，按挂载顺序）
2. 若生物是玩家：
   - 该玩家的**遗物**（跳过融化的）
   - 该玩家的**药水槽**
   - 该玩家的**充能球队列**（OrbQueue.Orbs）
   - 该玩家的**所有牌堆里的每张卡**（手牌/抽牌堆/弃牌堆/打出区/消耗区，每张卡之后跟它的 Affliction 和 Enchantment）
3. 若生物是怪物：该怪物的 **Monster 模型**
4. 遍历完后，最后附加：**全局 Modifiers** → **BadgeModels** → **MultiplayerScalingModel** → 单例以及其他

### 战斗外（IRunState.IterateHookListeners）

1. 每个玩家的**牌组所有卡**（牌组→卡+卡附魔）
2. 每个玩家的**遗物**（跳过融化）
3. 每个玩家的**药水**
4. **全局 Modifiers** → **BadgeModels** → **MultiplayerScalingModel**
5. 外部订阅者
6. **当前战斗的监听者**（若在战斗内，递归到上面的战斗内顺序）

> `Hook.IterateCombatHookListeners` 在战斗结束/正在结束时**不派发任何监听者**（除了死亡/战斗结束序列内部直接调用的钩子）。

## 一、回合流程（CombatManager.StartTurn）

### 每个生物回合开始

1. 对每个生物：`creature.BeforeTurnStart(side)` —— 记录每个 Power 的 `AmountOnTurnStart = Amount`
2. **`Hook.BeforeSideTurnStart`**
3. 对每个生物：`creature.AfterTurnStart(side)` —— 内部调用 `ClearBlock()`（通过 `Hook.ShouldClearBlock` 判断是否清空格挡）
4. 对每个生物：**`Hook.AfterBlockCleared`**
5. 对每个玩家：`SetupPlayerTurn`（见下）
6. **`Hook.AfterSideTurnStart`**
7. 对每个玩家：充能球队列 `OrbQueue.AfterTurnStart`

### SetupPlayerTurn（玩家回合设置）

1. **`Hook.ShouldPlayerResetEnergy`** 判断 → 重置能量 / 加最大能量
2. **`Hook.AfterEnergyReset`**
3. **`Hook.BeforeHandDraw`**
4. **`Hook.ModifyHandDraw`**（算出抽牌数）→ **`Hook.AfterModifyingHandDraw`**
5. 第一回合特殊处理（附魔置底、固有置顶）
6. `CardPileCmd.Draw` 抽牌（内部：`Hook.ShouldDraw` → 每次需要洗牌时 `Shuffle`：`Hook.ModifyShuffleOrder` 调整顺序 → 并入抽牌堆 → **`Hook.AfterShuffle`** → 每张抽出的卡 **`Hook.AfterCardDrawn`**）
7. **`Hook.AfterPlayerTurnStart`**

> 玩家回合还经历：`Hook.AfterAutoPrePlayPhaseEntered`（进自动出牌阶段）→ 出牌阶段 → `Hook.AfterAutoPostPlayPhaseEntered`（回合结束时自动后置阶段）。

## 二、出牌流程（CardModel.OnPlayWrapper）

1. `CardPileCmd.AddDuringManualCardPlay`（手牌→打出区）
2. **`Hook.ModifyCardPlayResultLocation`** → 对每个修改者调 `AfterModifyingCardPlayResultLocation`
3. `GeneratePlayCount`（计算打出次数，内部走 `Hook.ModifyCardPlayCount`）
4. 循环每次打出：
   - **`Hook.BeforeCardPlayed`**
   - 执行 `card.OnPlay(...)`（你的卡牌效果在这里）
   - 卡牌附魔 `Enchantment.OnPlay` → 卡牌感染 `Affliction.OnPlay`
   - **`Hook.AfterCardPlayed`**
5. 结算结果位置（进弃牌堆/消耗堆/回手等）

## 三、伤害流程（CreatureCmd.Damage）

这是最常用也最复杂的钩子链。对每个目标依次：

1. **`Hook.ModifyDamage`**（附魔先于模型）→ **`Hook.AfterModifyingDamageAmount`**
   - `ModifyDamage` 内部顺序：**附魔加算** → 遍历所有监听者 **`ModifyDamageAdditive`**（加算） → **`ModifyDamageMultiplicative`**（乘算） → **`ModifyDamageCap`**（上限，取最小值）
2. **`Hook.BeforeDamageReceived`**
3. 格挡结算 `DamageBlockInternal`（格挡吸收部分伤害）
4. **`Hook.ModifyHpLost`**（`HpLossHookPhase.BeforeOsty`，奥斯蒂转移前）→ **`Hook.AfterModifyingHpLostBeforeOsty`**
5. **`Hook.ModifyUnblockedDamageTarget`**（未格挡伤害可转移到奥斯蒂）
6. **`Hook.ModifyHpLost`**（`HpLossHookPhase.AfterOsty`，奥斯蒂转移后）→ **`Hook.AfterModifyingHpLostAfterOsty`**
7. 掉血 `LoseHpInternal`
8. 结算结果（每个 DamageResult）：
   - 破格挡时 **`Hook.AfterBlockBroken`**
   - 掉血后 **`Hook.AfterCurrentHpChanged`**
   - **`Hook.AfterDamageGiven`**（攻击者视角）
   - **若目标没死**：**`Hook.AfterDamageReceived`**；**若目标死了**：记入 killedCreatures
9. 循环结束后：**`Kill(killedCreatures)`**（见死亡流程）

> 注意 `Hook.AfterDamageReceived` 只在**目标存活**时调用；目标死亡时跳过，改走死亡流程。

## 四、死亡流程（CreatureCmd.KillWithoutCheckingWinCondition）

1. 若当前 HP > 0：先把 HP 归零（`LoseHpInternal`）+ **`Hook.AfterCurrentHpChanged`**
2. **`Hook.BeforeDeath`**
3. **`Hook.ShouldDie`** 判断是否真的死亡（可被防止，如 Fairy in a Bottle）
   - **允许死亡**：
     a. `creature.InvokeDiedEvent()`（`Died` 事件）
     b. 播放死亡动画
     c. **`Hook.AfterDeath`** ← 此时能力还在！
     d. 从战斗移除生物
     e. **`creature.RemoveAllPowersAfterDeath()`**
     f. 清理 Power
     g. 若为主敌人且队友全是次级敌人：连带击杀队友
     h. 若是玩家：清空充能球、击杀奥斯蒂（若活着）、`player.DeactivateHooks()`、`HandlePlayerDeath`（移除玩家所有牌、能量归零）
   - **死亡被防止**：
     a. **`Hook.AfterDeath`**（`wasRemovalPrevented: true`）
     b. **`Hook.AfterPreventingDeath`**
     c. 若仍处于濒死（IsDead），递归重试（最多 10 次）

## 五、Power 施加（PowerCmd.Apply）

1. **`Hook.BeforePowerAmountChanged`**
2. **`Hook.ModifyPowerAmountGiven`**（施加者视角，只在施加者存在且在场时）
3. **`Hook.ModifyPowerAmountReceived`**（受击者视角）
4. 多人缩放（`ShouldScaleInMultiplayer`）
5. `power.BeforeApplied` → `power.ApplyInternal`（真正挂上）
6. **`Hook.AfterModifyingPowerAmountGiven`** + **`Hook.AfterModifyingPowerAmountReceived`**
7. `power.AfterApplied` → **`Hook.AfterPowerAmountChanged`**

## 六、玩家回合结束（CombatManager）

分两个阶段：

### Phase One（可触发玩家选择的钩子）

1. **`Hook.AfterAutoPostPlayPhaseEntered`**（每个玩家）
2. **`Hook.BeforeSideTurnEnd`**
3. 对每个玩家 `DoTurnEnd`：
   - 充能球 `OrbQueue.BeforeTurnEnd`
   - 手牌中 `OnTurnEndInHand` 效果的卡：先消耗**虚无**卡（`Hook.ShouldEtherealTrigger` → `CardCmd.Exhaust`），再执行每张卡的 `OnTurnEndInHandWrapper`
4. **`Hook.BeforeFlush`**（每个玩家，判定是否弃牌）

### Phase Two（纯清理，不能有玩家选择）

1. 对每个玩家 `FlushPlayerHand`：
   - `Hook.ShouldFlush` 判定 → 弃牌（retain 的卡留手）→ **`Hook.AfterFlush`**
   - `player.PlayerCombatState.EndOfTurnCleanup()`
2. **`Hook.AfterSideTurnEnd`**
3. `SwitchFromPlayerToEnemySide`：**`Hook.ShouldTakeExtraTurn`** 判定额外回合 → `SwitchSides`

### 敌人回合结束（EndEnemyTurnInternal）

1. **`Hook.BeforeSideTurnEnd`**（敌人侧）
2. 每个玩家 `PlayerCombatState.EndOfTurnCleanup()`
3. **`Hook.AfterSideTurnEnd`**（敌人侧）

## 七、战斗结束（EndCombatInternal）

1. `turnState.IsInProgress = false`
2. 每个玩家 `ReviveBeforeCombatEnd`
3. **`Hook.AfterCombatEnd`**
4. 清历史、房间收尾、写回放
5. 每个玩家 `player.AfterCombatEnd()`
6. **`Hook.AfterCombatVictory`**
7. 保存进度、成就检查等

> 奖励相关：**`Hook.AfterCombatVictory`** 之后，进奖励选择时还有 **`Hook.BeforeCombatRewardOffered`**（提供奖励前）→ `Hook.ModifyRewards` 系列（修改奖励内容/概率）。
