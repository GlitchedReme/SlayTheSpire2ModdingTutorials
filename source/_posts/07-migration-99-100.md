---
title: 正式版 至 测试版
date: 2026-03-27 12:27:58
permalink: docs/07-migration-99-100/
categories:
- Basics
---
此处记录一些可能会导致你修改代码的更改，并不是所有修改。

---

# 0.111 至 0.113

## 1. Hooks（钩子系统）

### `Hooks/Hook.cs`

| API | 111 | 113 | 说明 |
|---|---|---|---|
| `AfterDeath` | `(IRunState, ICombatState?, Creature, bool wasRemovalPrevented, float deathAnimLength)` | `(IRunState, ICombatState?, Creature, CardModel? source, bool wasRemovalPrevented, float deathAnimLength)` | 🔴 插入 `source` |
| `ShouldTakeExtraTurn` | `(ICombatState, Player)` → `bool` | `(ICombatState, Player, out AbstractModel? source)` → `bool` | 🔴 返回触发模型 |
| `AfterTakingExtraTurn` | `(ICombatState, Player)` | `(ICombatState, Player, AbstractModel source)` | 🔴 尾加参数 |
| `ModifyUnblockedDamageTarget` | `(ICombatState, Creature, decimal, ValueProp, Creature?)` → `Creature` | `(ICombatState?, Creature, decimal, ValueProp, Creature?)` → `Creature` | 🔴 combatState 可空 |
| `AfterArrowShot` | — | `(ICombatState, Player, ArrowSlot?, PlayerChoiceContext, CardModel?)` | 🟢 Fool 箭矢 |
| `AfterArrowImpaled` | — | `(ICombatState, ImpaledPower, ArrowSlot, PlayerChoiceContext, CardModel?)` | 🟢 |
| `AfterArrowDislodged` | — | `(ICombatState, ImpaledPower, ArrowSlot, PlayerChoiceContext, CardModel?)` | 🟢 |
| `ModifyPreBlockDamageTarget` | — | `(ICombatState?, Creature, decimal, ValueProp, Creature?)` → `Creature?` | 🟢 格挡结算前改目标 |
| `TryReplaceDefaultRoomRewards` | — | `(IRunState, Player, List<Reward>, AbstractRoom)` → `bool` | 🟢 替换默认奖励 |
| `ModifyExtraRestSiteMendText` | — | `(IRunState, Player, IReadOnlyList<LocString>)` → `IReadOnlyList<LocString>` | 🟢 休息治疗附加文本 |

### `Hooks/HpLossHookPhase.cs`（⚠️ 枚举位值变化）

| 成员 | 111 | 113 | 说明 |
|---|---|---|---|
| `BeforeWuppy` | — | `1` | 🟢 新增（Wuppy 拦截阶段，在 Osty 之前） |
| `BeforeOsty` | `1` | `2` | 🔴 **位值改变**，按整数存/传的代码会错 |
| `AfterOsty` | `2` | `4` | 🔴 **位值改变** |
| `All` | `3` | `6` | 🔴 **位值改变**（不再包含 BeforeWuppy 位） |

## 2. 模型基类（Models）

### `Models/AbstractModel.cs`

| API | 111 | 113 | 说明 |
|---|---|---|---|
| `AfterDeath` | `(PlayerChoiceContext, Creature, bool wasRemovalPrevented, float deathAnimLength)` | `(PlayerChoiceContext, Creature, CardModel? source, bool wasRemovalPrevented, float deathAnimLength)` | 🔴 所有 override 必改 |
| `AfterArrowShot` | — | `virtual Task (Player, ArrowSlot?, PlayerChoiceContext, CardModel?)` | 🟢 |
| `AfterArrowImpaled` | — | `virtual Task (ImpaledPower, ArrowSlot, PlayerChoiceContext, CardModel?)` | 🟢 |
| `AfterArrowDislodged` | — | `virtual Task (ImpaledPower, ArrowSlot, PlayerChoiceContext, CardModel?)` | 🟢 |
| `ModifyDamageMultiplicativeLate` | — | `virtual decimal (Creature?, decimal, ValueProp, Creature?, CardModel?, CardPlay?)` | 🟢 乘算后置修正 |
| `ModifyPreBlockDamageTarget` | — | `virtual Creature? (Creature, Creature?, decimal, ValueProp, Creature?)` | 🟢 |
| `ShouldTakeExtraTurnEarly` | — | `virtual bool (Player)` | 🟢 早于 `ShouldTakeExtraTurn` |
| `TryReplaceDefaultRoomRewards` | — | `virtual bool (Player, List<Reward>, AbstractRoom)` | 🟢 |
| `ModifyExtraRestSiteMendText` | — | `virtual IReadOnlyList<LocString> (Player, IReadOnlyList<LocString>)` | 🟢 |

### `Models/CardModel.cs`

| API | 111 | 113 | 说明 |
|---|---|---|---|
| 变形回调 | `virtual void AfterTransformedFrom()` + `virtual void AfterTransformedTo()` | `virtual void AfterThisWasTransformedFrom(CardModel)` + `void AfterThisWasTransformedInto(CardModel)`（经 `protected virtual AfterThisWasTransformedIntoInternal`） | 🔴 改名/拆分 |
| `BigPortrait` | — | `Texture2D` | 🟢 |
| `ExtraReplayThisTurn` | — | `int` | 🟢 计入 EnchantPlayCount |
| `TransformIntoAfterPlay` | — | `CardModel? { get; protected set; }` | 🟢 打出后自动变形 |
| `IsAllowedInBlitz` | — | `virtual bool` | 🟢 Blitz 准入 |
| `IsAllowedInRun` | — | `bool (IRunState)` | 🟢 统一准入 |
| `InvokeKeywordsChanged` | — | `void ()` | 🟢 刷新关键字 |
| `ArrowHoverTip` | — | `protected IHoverTip` | 🟢 |

### `Models/RelicModel.cs`

| API | 111 | 113 | 说明 |
|---|---|---|---|
| `IsAllowed` | `public virtual bool (IRunState)` | `public bool (IRunState)` + `protected virtual bool IsAllowedInternal(IRunState)` | 🔴 去 virtual，override 点改 Internal |
| `IsBeforeAct3TreasureChest` | `protected static bool (IRunState)` | `protected static bool IsLateInAct3(IRunState)` | 🔴 改名 |
| `IsAllowedInShops` | — | `virtual bool` | 🟢 商店准入 |
| `ArrowHoverTip` | — | `protected IHoverTip` | 🟢 |

### `Models/MonsterModel.cs`

| API | 111 | 113 | 说明 |
|---|---|---|---|
| 血条/交互 | `virtual bool IsHealthBarVisible` | `virtual bool IsInteractable` | 🔴 改名；语义为"可否交互/选中"；动态切换用 `NCreature.SetIsInteractable` |

### `Models/PowerModel.cs`

| API | 111 | 113 | 说明 |
|---|---|---|---|
| `GetExtraHoverTips` | — | `IEnumerable<IHoverTip> ()` | 🟢 |

### `Models/CharacterModel.cs`

| API | 111 | 113 | 说明 |
|---|---|---|---|
| 代词属性 ×4 | `LocString PronounObject/PossessiveAdjective/PronounPossessive/PronounSubject` | — | 🔴 删除；改 `AddDetailsTo`/`GetPronoun(key, FoolPronounGuess)` |
| `AddDetailsTo` | `(LocString str)` | `(LocString str, FoolPronounGuess pronounGuess = Neutral)` | 🔴 签名变更 |
| `DeathSfx` | `string` | `virtual string` | 🔵 可 override |
| `ShortTitle` | — | `LocString` | 🟢 |
| `BaseArrowSlotCount` | — | `virtual int` | 🟢 Fool=1，默认 0 |
| `DreadBgBrightness`/`DreadBgContrast`/`DreadNameColor` | — | `virtual float` ×2 + `virtual Color` | 🟢 Dread 界面配色 |

### `Models/EventModel.cs`

| API | 111 | 113 | 说明 |
|---|---|---|---|
| `FoolPronounGuess` | — | `virtual FoolPronounGuess` | 🟢 事件代词性别 |
| `OnRoomExit` | — | `virtual void ()` | 🟢 离开房间回调 |

### `Models/AncientEventModel.cs`

| API | 111 | 113 | 说明 |
|---|---|---|---|
| `RelicOption<T>` | `protected EventOption (string pageName = "", string? customDonePage = null)` | `protected EventOption (string pageName = "")` | 🔴 去 `customDonePage` |
| `RelicOption(RelicModel)` | `protected EventOption (RelicModel, string pageName = "", string? customDonePage = null)` | `protected EventOption (RelicModel, string pageName = "")` | 🔴 同上 |
| `AllowedOptions` | — | `protected List<EventOption> (IEnumerable<EventOption>)` | 🟢 选项池过滤 |
| `GetOptionsFromThreePools` | — | `protected List<EventOption> (List, List, List)` | 🟢 |
| `ConfigureBackgroundScene` | — | `virtual void (Control)` | 🟢 自定义背景 |

### `Models/EncounterModel.cs`

| API | 111 | 113 | 说明 |
|---|---|---|---|
| `DebugRandomizeRng` | `void ()` | `ulong ()` | 🔴 改返回种子 |
| `DebugSetRng` | — | `void (ulong seed)` | 🟢 |
| `ScenePath` | — | `protected virtual string` | 🟢 场景路径 override 点 |
| `GetDominion` | — | `virtual DominionModel? ()` | 🟢 Dread 强化归属 |

### `Models/ActModel.cs`

| API | 111 | 113 | 说明 |
|---|---|---|---|
| `GenerateRooms` | `void (Rng, UnlockState, bool isMultiplayer = false)` | `void (RunState)` + `void (Rng, UnlockState, bool isMultiplayer = false, bool isBlitz = false)` | 🟢 新重载 + 🔵 尾参 |
| `SetRooms`/`GetRoomsDebug` | — | `void (RoomSet)` / `RoomSet ()` | 🟢 |

### `Models/PotionModel.cs` / `ModifierModel.cs`

| API | 111 | 113 | 说明 |
|---|---|---|---|
| `PotionModel.ArrowHoverTip` | — | `protected IHoverTip` | 🟢 |
| `ModifierModel.AdditionalRestSiteMendText` | — | `protected LocString?` | 🟢 |

### `Models/ModelId.cs` / `ModelDb.cs`

| API | 111 | 113 | 说明 |
|---|---|---|---|
| `ModelId` 拷贝构造 | `protected ModelId(ModelId original)` | — | 🔴 移除 |
| `ModelId.Compare` | — | `static int (ModelId?, ModelId?)` | 🟢 |
| `ModelDb.Singleton<T>` | `static T Singleton<T>() where T : SingletonModel` | `static T RunModel<T>() where T : RunModel` + `static T Dominion<T>() where T : DominionModel` | 🔴 改名/换约束；`SingletonModel` 删除，`MultiplayerScalingModel` 移到 `Models/` 直下 |

## 3. 战斗指令（Commands）

### `Commands/CreatureCmd.cs`

| API | 111 | 113 | 说明 |
|---|---|---|---|
| `Damage(Creature)` | `static Task<IEnumerable<DamageResult>> (PlayerChoiceContext, IEnumerable<Creature>?, decimal, ValueProp, Creature?, CardModel?, CardPlay?)` | 同前 + `ModifyDamageHookType modifyDamageHookType = All` | 🔵 尾加默认参 |
| `Damage(DamageTargetData)` | — | `static Task<IEnumerable<DamageResult>> (PlayerChoiceContext, IEnumerable<DamageTargetData>?, decimal, ValueProp, Creature?, CardModel?, CardPlay?, ModifyDamageHookType = All)` | 🟢 新重载 |
| `Kill` | `static Task (Creature)` | `static Task (Creature, CardModel? cardSource, bool force = false)` + `static Task (IReadOnlyCollection<Creature>, CardModel?, bool)` | 🔴🟢 |
| `LoseMaxHp` | `static Task (PlayerChoiceContext, Creature, decimal, bool isFromCard)` | `static Task (PlayerChoiceContext, Creature, decimal, CardModel? cardSource)` | 🔴 末参改类型 |

### `Commands/CardSelectCmd.cs`

| API | 111 | 113 | 说明 |
|---|---|---|---|
| 静态选择器栈 | `static ICardSelector? Selector/LocalSelector` + `UseSelector`/`PushSelector`/`SuspendSelectorForTest`/`Reset` + `StackedSelectorScope`/`RestoreSelectorScope`/`SelectorScope` | — | 🔴 全部移除 → `RunManager.CardSelectorStack`（`CardSelectorStack` 新类）；`TestSupport.ICardSelector` 不变 |
| `FromChooseABundleScreen` | `(Player, IReadOnlyList<IReadOnlyList<CardModel>>)` | 同前 + `bool canSkip = false` | 🔵 |

### `Commands/CardPileCmd.cs` / `Cmd.cs` / `VfxCmd.cs` / `Builders/AttackCommand.cs`

| API | 111 | 113 | 说明 |
|---|---|---|---|
| `CardPileCmd.AutoPlayFromDrawPile` | — | `static Task (PlayerChoiceContext, Player, int count, CardPilePosition, bool forceExhaust, Action<CardModel>)` | 🟢 自动从抽牌堆打出 |
| `Cmd.TryWait` | — | `static Task<bool> (float seconds, CancellationToken = default, bool ignoreCombatEnd = false)` | 🟢 |
| `VfxCmd.PlayOnCreature[Center]` | `(Creature, string path)` | 同前 + `bool forceIfDead = false` | 🔵 |
| `AttackCommand.FromArrow` | — | `()` 链式调用 | 🟢 箭矢攻击 |
| `ArrowCmd` / `MelodyCmd` | — | 新文件 | 🟢 Fool/Cho 机制指令 |

## 4. 战斗状态与玩家/生物实体

### `Combat/CombatState.cs` / `CombatManager.cs` / `CombatTurnState.cs` / `CombatHistory.cs`

| API | 111 | 113 | 说明 |
|---|---|---|---|
| `CombatState` 构造 | `(EncounterModel?, IRunState?, IReadOnlyList<ModifierModel>?, IReadOnlyList<BadgeModel>?, MultiplayerScalingModel?)` | `(EncounterModel?, IRunState?, IReadOnlyList<ModifierModel>?, IReadOnlyList<BadgeModel>?, IReadOnlyList<RunModel>?, DominionModel?)` | 🔴 参数换 |
| `CombatState` 模型 | `MultiplayerScalingModel? MultiplayerScalingModel { get; private set; }` | `IReadOnlyList<RunModel> RunModels { get; private set; }` + `DominionModel? Dominion` + `SetDominion(DominionModel?)` | 🔴 改名/拆分 |
| `CombatManager.UndoReadyToEndTurn` | `void (Player)` | `void TryUndoReadyToEndTurn(Player)` + `bool CanUnEndTurn(Player)` | 🔴 改名 + 🟢 |
| `CombatManager.ShouldSkipCombatEffect` | — | `bool` | 🟢 |
| `CombatTurnState.PlayersThatCannotUnEndTurn` | — | `HashSet<Player>` | 🟢 |
| `CombatHistory.ArrowShot` | — | `void (ICombatState, ArrowSlot)` | 🟢 新 entry `ArrowShotEntry` |

### `Entities/Players/Player.cs` / `PlayerCombatState.cs` / `ExtraPlayerFields.cs`

| API | 111 | 113 | 说明 |
|---|---|---|---|
| `Player.MaxAscensionWhenRunStarted` | `int { get; }` | — | 🔴 移除 |
| `Player.PopulateCombatState` | `void (Rng, CombatState)` | `void (Rng, ICombatState)` | 🔴 参数改接口 |
| `Player.PopulateRelicGrabBagDebug` | — | `void (List<RelicModel>, Rng)` | 🟢 |
| `PlayerCombatState` 箭矢 | — | `IReadOnlyList<ArrowSlot> Arrows` + `int AvailableArrowCount` + `void GainArrow()` + `event Action? ArrowsChanged` | 🟢 |
| `ExtraPlayerFields.IsPlayingRotatingCharacter` | — | `bool { get; set; }` | 🟢 Dread 轮换 |

### `Entities/Cards/` / `Creatures/` / `RestSite/` / `FoolArrows/`

| API | 111 | 113 | 说明 |
|---|---|---|---|
| `CardPile` | `class CardPile` + `CardPile(PileType)` | `class CardPile(PileType)` 主构造 | 🔵 等价；`RandomizeOrderInternal` 参数 `CombatState`→`ICombatState` |
| `DamageResult` | `Creature Target`/`HpLoss`/`Blocked`… | + `Creature OriginalTarget { get; set; }` + `int IntendedHpLoss { get; set; }` | 🟢 |
| `DamageTargetData` | — | 新类型 | 🟢 配合 `CreatureCmd.Damage` 重载 |
| `ArrowSlot`/`ArrowStatus` | — | 新目录新类型 | 🟢 Fool 箭矢槽位/状态 |
| `SmithRestSiteOption` | `int SmithCount { get; set; } = 1` + `override LocString Description` | — | 🔴 移除 |
| `EvolveRestSiteOption`/`RestoreRestSiteOption` | — | 新文件 | 🟢 新休息选项 |
| `TarotCards` | — | 新文件 | 🟢 `TarotCards.All` 塔罗牌集合 |

## 5. 奖励与选卡

| 文件 | API | 111 | 113 | 说明 |
|---|---|---|---|---|
| `Rewards/CardReward.cs` | 两个构造函数 | `(CardCreationOptions, int, Player, PlayerChoiceSynchronizer?)` / `(IEnumerable<CardModel>, CardCreationSource, Player, CardCreationOptions, PlayerChoiceSynchronizer?)` | 同前 + `CardSelectorStack? selectorStack = null` | 🔵 |
| `Rewards/RelicReward.cs` | 两个构造函数 | `(RelicModel, Player)` / `(RelicRarity, Player)` | 同前 + `Rng? rngOverride = null` | 🔵 |
| `Rewards/CardUpgradeReward.cs` | 新类型 | — | `UpgradeCard` 奖励 | 🟢 |
| `Odds/CardRarityOdds.cs` | `Roll*` ×4 | `(CardRarityOddsType)` / `(CardRarityOddsType, float)` / `(CardRarityOddsType)` | 同前 + `Rng? rngOverride = null` | 🔵；+ 🟢 `blitzShop*/blitzNeow*` 6 个稀有度常量 |
| `CardSelection/CardSelectorStack.cs` | 新类 | — | `RunManager.CardSelectorStack` | 🟢 承接原 `CardSelectCmd` 静态栈 |
| `Nodes/Screens/CardSelection/` | `ICardSelector.cs` | `ICardSelector` 接口 | `ICardSelectionScreen.cs` | 🔴 改名 |
| `Entities/TreasureRelicPicking/RelicPickingResult.cs` | `GenerateRelicFight` + 字段 | `(List<Player>, RelicModel, Func<RelicPickingFightMove>)` | `(List<Player>, RelicModel, int relicIndex, Func<RelicPickingFightMove>)` + `required int relicIndex` | 🔴 |

## 6. 多人上下文与接口（Multiplayer / 接口契约）

| 文件 | API | 111 | 113 | 说明 |
|---|---|---|---|---|
| `PlayerChoiceContext.cs` | `GameActionType` | — | `abstract GameActionType? GameActionType { get; }` | 🟢 各子类补 override |
| `BranchingPlayerChoiceContext.cs` | 两个构造函数 | `(ulong, GameActionType, PlayerChoiceContext)` / `(AbstractModel, ulong, GameActionType, PlayerChoiceContext)` | `(ulong, PlayerChoiceContext)` / `(AbstractModel, ulong, PlayerChoiceContext)` | 🔴 去 `gameActionType` |
| `ActionQueueSet.cs` | `WasReset`/`AreAnyPlayerDrivenActionsBeingExecuted` | — | `bool` / `bool (bool excludeEndOfTurn = false)` | 🟢 |
| `Runs/IRunState.cs` | 接口成员 | `MultiplayerScalingModel? MultiplayerScalingModel` | `IReadOnlyList<RunModel> RunModels` + `DominionModel? Dominion` + `IReadOnlyList<MapCoord> VisitedMapCoords` + `bool IsCustomGame` | 🔴 实现者必改 |
| `Combat/ICombatState.cs` | 接口成员 | `MultiplayerScalingModel? MultiplayerScalingModel` | `IReadOnlyList<RunModel> RunModels` | 🔴 `Null*` 同步 |
| `Game/INetHostGameService.cs` | `ConnectedPeers`/`DisconnectClient` | `(ulong, NetError, bool)` | + `IReadOnlyList<ulong> ConnectedPeers`；`DisconnectClient` 尾加 `string? debugReason = null` | 🟢🔵 |
| `Game/Lobby/IStartRunLobbyListener.cs` | `PlayerChanged`/`GameModeChanged` | `PlayerChanged(Player, bool isRandomCharacterResolution)` | `PlayerChanged(Player)` + `GameModeChanged()` | 🔴 |
| `Connection/IClientConnectionInitializer.cs` | `Platform`/`GetHostId` | — | `PlatformType Platform` + `ulong? GetHostId()` | 🟢（ENet/Steam 实现同步） |
| `Game/JoinResult.cs` | `isCustom` | — | `bool` | 🟢 |
| `Messages/Lobby/ClientLobbyJoinResponseMessage.cs` | `gameMode`/`isCustom` | — | 新增字段 | 🟢 |
| `Messages/Lobby/InitialGameInfoMessage.cs` | `gameMode` | 有 | — | 🔴 |
| `Messages/Lobby/LobbyPlayerChangedCharacterMessage.cs` | `isRotatingDread` | — | `bool` | 🟢 |
| `Messages/Lobby/` | `LobbyGameModeChangedMessage` | — | 新文件 | 🟢 |
| `Entities/Multiplayer/NetFullCombatState.cs` | `ArrowSlotState` | — | 内嵌结构体 | 🟢 箭矢网络同步 |
| `Entities/Multiplayer/NetErrorInfo.cs` | `JoinExtraInfo`/`ConnectionExtraInfo` | `ConnectionExtraInfo` get only | + `JoinExtraInfo` 属性；`ConnectionExtraInfo` get→get,set | 🟢 |
| `Entities/Multiplayer/StartRunLobbyPlayer.cs` | ascension | `int maxMultiplayerAscensionUnlocked` | `int maxStandardAscension` + `int maxBlitzAscension` + `bool isRotatingDread` | 🔴🟢 |
| `Nodes/Debug/IBootstrapSettings.cs` | `Setup` | `(Player localPlayer)` | `(Player player)` 参数名/用途改 `debugActMap` | 🔴 |
| `Nodes/Screens/CharacterSelect/ICharacterSelectButtonDelegate.cs` | `SelectCharacter` | `(NCharacterSelectButton, CharacterModel)` | `(NCharacterSelectButton)` | 🔴；`NCharacterSelectButton` +`InitAsRandom`/`InitAsRotating` |
| `Game/JoinFlow.cs` | 构造/`Begin` | `JoinFlow(INetClientGameService)` + `Begin(IClientConnectionInitializer, SceneTree?)` | `JoinFlow(INetClientGameService, IClientConnectionInitializer)` + `Begin(SceneTree?)` | 🔴 initializer 移到构造 |
| `Game/FlavorSynchronizer.cs` | `OnEndTurnPingReceived` | `event Action<ulong>?` | `event Action<ulong>? EndTurnPingReceived` + `event Action<Player, MapCoord>? MapPingReceived` | 🔴 改名 + 🟢 |
| `Game/MapSelectionSynchronizer.cs` | 构造/`PlayerVoteCancelled` | `(INetGameService, ActionQueueSynchronizer, RunState)` + `event Action<Player>?` | `(INetGameService, ActionQueueSynchronizer, IRunState)` + `event Action<Player, MapVote?>?` | 🔴；+ 🟢 `OnLocalPlayerVotedFor`/`BeforeBeginningMoveToNewMapCoord` |
| `Game/MapVote.cs` | 类型 | `struct` | `record struct` | 🔵 等价 |
| `Game/OneOffSynchronizer.cs` | `DoLocalMerchantCardRemoval` | `(int, bool)` → `Task<bool>` | — | 🔴 走 MerchantSynchronizer |
| `Game/TreasureRoomRelicSynchronizer.cs` | `RelicsAwarded`/构造 | `event Action<List<RelicPickingResult>>?` + `(IPlayerCollection, ulong, ActionQueueSynchronizer, RelicGrabBag, Rng)` | 事件签名改；构造去 `sharedGrabBag` 加 `treasureRelics` | 🔴 |
| `Game/RewardsSetSynchronizer.cs` | 内部字段 | — | — | 🔵 实现变化 |
| `Messages/Lobby/ClientLobbyJoinRequestMessage.cs` | `password` | `string` | — | 🔴 |
| `Serialization/QuantizeParams.cs` | `maxValue` | — | 字段 | 🟢 |
| `Platform/AchievementsUtil.cs` | 构造 | `(ILogger)` | `(IPlatformServices)` | 🔴 |
| `Platform/Steam/SteamInitializer.cs` | `AchievementsUtil` | — | `AchievementsUtil` 属性 | 🟢 |

## 7. 商店（Merchant）

| 文件 | API | 111 | 113 | 说明 |
|---|---|---|---|---|
| `MerchantEntry.cs` | `Cost` | `int` | `virtual int` | 🔵；+ 🟢 `Player`、`uint? Id` |
| 同上 | 购买钩子 | `public Task<bool> OnTryPurchaseWrapper(MerchantInventory?, bool)` + `protected abstract Task<(bool,int)> OnTryPurchase(MerchantInventory?, bool)` | `public Task<bool> OnTryPurchaseUnsynchronized(MerchantInventory?, bool)` + `protected abstract Task<(bool,int)> OnTryPurchaseInternal(MerchantInventory?, bool)` | 🔴 改名；子类同步 |
| `MerchantCardEntry.cs` | 构造/`Populate` | `(Player, MerchantInventory?, IEnumerable<CardModel>, CardType/CardRarity)` + `Populate()` | `(Player, IEnumerable<CardModel>, CardType/CardRarity)` + `Populate(MerchantInventory?)` | 🔴 inventory 移参 |
| `MerchantCardRemovalEntry.cs` | 取消/移除 | `OnTryPurchaseWrapper(..., bool cancelable)` | `SetPurchaseUncancelable()` + `static Task<bool> DoCardRemoval(Player, bool)` | 🔴 |
| `MerchantInventory.cs` | `AllEntries` | `IEnumerable<MerchantEntry>` | `List<MerchantEntry>` | 🔴 |
| 同上 | Blitz/事务 | — | `IReadOnlyList<BlitzMerchantEntry> BlitzEntries` + `bool IsBlitzShop` + `int BlitzChoicesRemaining` + `TryBeginPurchase`/`EndPurchase`/`Setup`/`CreateForBlitzMerchant`/`TryPurchaseEntryWithIdUnsynchronized` + 新构造 | 🟢 |
| `MerchantDialogueSet.cs` | `BlitzFinishedLines` | — | `IReadOnlyList<LocString>` | 🟢 |
| `Rooms/MerchantRoom.cs` | `Inventories`/`GetLocalInventory` | 有 | — | 🔴 |
| `Entities/Merchant/` | `BlitzMerchant*` | — | 21 个新文件 | 🟢 Blitz 商店条目体系 |
| `Multiplayer/Game/` | `MerchantSynchronizer` | — | 新类型 | 🟢；`MerchantCardRemovalMessage` 删除 |

## 8. 随机数

| 文件 | API | 111 | 113 | 说明 |
|---|---|---|---|---|
| `Random/Rng.cs` | `Shuffle<T>` | `void (IList<T>)` | — | 🔴 删除；用 `list.StableShuffle(rng)`/`UnstableShuffle(rng)`（`Extensions/ListExtensions.cs`） |
| 同上 | `Chaotic`/`CreateChaoticSeed` | `static Rng Chaotic { get; } = new Rng((ulong)DateTimeOffset.Now.ToUnixTimeSeconds())` | `= new Rng(CreateChaoticSeed())` + `static ulong CreateChaoticSeed()` | 🟢 |
| `Random/PlayerRngSet.cs` | `NonCombatGeneration` | — | `Rng` | 🟢 非战斗生成 RNG |

## 9. 工厂（Factories）

| 文件 | API | 111 | 113 | 说明 |
|---|---|---|---|---|
| `RelicFactory.cs` | 拉取/稀有度 | `PullNextRelicFromFront(Player)` + `PullNextRelicFromBack(Player)`（自动 roll）+ `RollRarity(Player)` | `PullNextRelicForRewardFromFront(Player)` + `RollRarityForReward(Player)` | 🔴 改名；自动 roll `PullNextRelicFromBack` 删除（商店用 `(player, rarity, filter)`） |
| `CardFactory.cs` | `CreateForMerchant` ×2 | `(Player, IEnumerable<CardModel> options, CardType/CardRarity)` | `(Player, IEnumerable<CardModel> options, IEnumerable<CardModel> blacklist, CardType/CardRarity)` | 🔴 中间插参 |

## 10. 悬停提示（HoverTips）

| 文件 | API | 111 | 113 | 说明 |
|---|---|---|---|---|
| `HoverTip.cs` | `Id`/`IsSmart`/`IsDebuff`/`IsInstanced` | `{ get; set; }` | `{ get; }` | 🔴 对象初始化器写法失效 |
| 同上 | `ShouldOverrideTextOverflow` | `{ get; set; }` | `{ get; init; }` | 🔴 |
| `HoverTipFactory.cs` | 新工厂 | — | `FromEnchantment(EnchantmentModel, int)` + `FromCardWithCardHoverTips` ×2 + `ForEnergy(DominionModel)` + `ForArrow(Player?, bool)` | 🟢 |

## 11. 本地化（Localization）

| 文件 | API | 111 | 113 | 说明 |
|---|---|---|---|---|
| `LocManager.cs` | RTL | — | `bool IsRtl` + `static bool IsHiddenLanguage(string)` + `static bool IsRtlLanguage(string)` | 🟢 阿拉伯语 |
| `DynamicVars/DynamicVarSet.cs` | `HitCount` | — | `HitCountVar` | 🟢（新文件 `HitCountVar`/`CalculatedHitCountVar`） |
| `DynamicVars/DynamicVar.cs` | `GetBaseValueForIConvertible` | `protected virtual decimal ()` | — | 🔴 移除 |
| 新文件 | `ArabicPluralRule`/`RtlControlUtils`/`AraFontPathSet` | — | 新文件 | 🟢 |

## 12. 地图（Map）

| 文件 | API | 111 | 113 | 说明 |
|---|---|---|---|---|
| `ActMap.cs` | `ConnectChildren` ×2 / `RestoreStartMapPoints` | — | `protected static`/`protected` 方法 | 🟢 序列化恢复下沉 |
| `MapPoint.cs` | `FromSerializable` | — | `static MapPoint (SerializableMapPoint)` | 🟢 |
| `MapCoord.cs`/`Runs/MapLocation.cs` | 主构造写法 | `struct` + 显式构造 | `struct(int col, int row)` 主构造 | 🔵 等价 |
| `BlitzActMap.cs` | 新文件 | — | Blitz 地图 | 🟢 |

## 13. 游戏流程（RunManager / RunState）

| 文件 | API | 111 | 113 | 说明 |
|---|---|---|---|---|
| `RunManager.cs` | `OnEnded` | `SerializableRun (bool)` | `PostRunProgressUpdateResult (bool)` | 🔴 返回类型 |
| 同上 | `ProceedFromTerminalRewardsScreen` | `async Task ()` | `void ProceedFromTerminalRewardsScreen()` + `async Task ProceedFromTerminalRewardsScreenAsync()` + `void Proceed()` | 🔴 拆分 |
| 同上 | 新增 | — | `HasRunEnded`/`IsChangingRooms`/`IsPotionUseLocked`/`MerchantSynchronizer`/`CardSelectorStack`/`MapChanged`/`OnIsChangingRoomsModified`/`InvokeMapChanged`/`IsDread()` | 🟢 |
| `RunHistory.cs`/`Runs/Metrics/*` | `SerializableMapPointHistoryEntry` | — | 新类型 | 🟢 |
| `Runs/RunHistory.cs` | `IsCustomGame`/`GameMode` | — | `bool`/`GameMode` | 🟢 |
| `RunState.cs` | 模型 | `MultiplayerScalingModel? MultiplayerScalingModel` | `IReadOnlyList<RunModel> RunModels` + `DominionModel? Dominion` + `SetDominion(DominionModel?)` | 🔴 |
| 同上 | `IsCustomGame` | — | `bool { get; init; }` | 🟢 |
| 同上 | `CreateForNewRun` | `(players, acts, modifiers, gameMode, ascensionLevel, seed)` | `(players, acts, modifiers, gameMode, bool isCustom, ascensionLevel, seed)` | 🔴 `gameMode` 后插参 |
| 同上 | `CreateForTest` | `(…, GameMode gameMode, int ascensionLevel, string? seed)` | `(…, GameMode gameMode, bool isCustomGame = false, int ascensionLevel, string? seed)` | 🔵 |
| `ExtraRunFields.cs`/`SerializableExtraRunFields.cs` | `UsedDebugCommand`/`MarkDebugToolUsed` | — | `bool` + `void ()` | 🟢 |
| `Runs/` | `RunRichPresence`/`History/BlitzMerchantHistoryEntry` | — | 新文件 | 🟢 |

## 14. 游戏模式（GameMode / Ascension / 新模式）

| 文件 | API | 111 | 113 | 说明 |
|---|---|---|---|---|
| `Runs/GameMode.cs` | 枚举 | `None,Standard,Daily,Custom` | `None,Standard,Daily,Dread,Blitz` | 🔴 `Custom=3` 删除；自定义用 `IsCustomGame` bool |
| `Runs/GameModeExtension.cs` → `Helpers/GameModeHelper.cs` | `AreAchievementsAndEpochsLocked` | `static bool (GameMode, bool?)`（`GameModeExtension`） | `static bool AreAchievementsAndEpochsLocked(GameMode, bool)` + `ForRun`/`ForHistory`/`ForSerializableRun`（`GameModeHelper`） | 🔴 文件/签名重构 |
| `Entities/Ascension/AscensionManager.cs` | 构造 | `(int)` / `(AscensionLevel)` | `(GameMode, int)` | 🔴；+ 🟢 `GetMaxAllowed`/`ClampToMode`/`maxAscensionAllowedBlitz=5` |
| `Helpers/AscensionHelper.cs` | 查询 | `GetTitle(int)`/`GetDescription(int)`/`GetHoverTip(CharacterModel,int,bool achievementsLocked)` | `GetTitle(int,GameMode)`/`GetDescription(int,GameMode)`/`GetHoverTip(CharacterModel,int,GameMode,bool isCustomGame)` | 🔴 全部追加 `GameMode` |
| 同上 | `PovertyAscensionGoldMultiplier` | `static double` 属性 | `const decimal povertyAscensionGoldMultiplier = 0.75m` | 🔴 变小写常量 |
| 同上 | Dread/轮换 | — | `IsDread`/`GetLevelForBlitz`/`GetPortraitHoverTip`/`GetDreadStreak`/`GetNextRotatingDreadCharacter*`/`GetRotatingCharacterIdForStreak`/`GetCurrentRotatingDread*` | 🟢 |
| `Models/Blitz/`/`Models/Dread/` | 新模式模型 | — | `BlitzRunModel`/`DreadRunModel`/`DominionModel`/`Dominions/*` | 🟢；`ModelDb.RunModel<T>()`/`Dominion<T>()` |
| `AutoSlay/AutoSlayConfig.cs` | `GameMode` | — | 字段 | 🟢 |
| `Multiplayer` 侧 | `StartRunLobby`/`StartHostAsync`/`FastHost` | `maxPlayers` 必填 | `maxPlayers` 可选/加参 | 🔵；+ `LobbyGameModeChangedMessage` |
| `StartRunLobbyPlayer.cs` | `IsCustomGame` 字段 | — | `bool` | 🟢 |

## 15. 存档（Saves）

| 文件 | API | 111 | 113 | 说明 |
|---|---|---|---|---|
| `SaveManager.cs` | `UpdateProgressWithRunData` | `void (SerializableRun, bool)` | `PostRunProgressUpdateResult (SerializableRun, bool)` | 🔴；+ 🟢 `ObtainFoolEpochIfDefectRunCompleted` |
| `Managers/ProgressSaveManager.cs` | `UpdateWithRunData` | `void (SerializableRun, bool)` | `PostRunProgressUpdateResult (SerializableRun, bool)` | 🔴；+ 🟢 `UpdateDreadWinStreakOnVictory`/`ReconcileDreadWinStreakVersion`/`ObtainFoolEpochIfDefectRunCompleted` |
| `Managers/RunSaveManager.cs` | `RenameBrokenMultiplayerRunSave` | `void (ReadSaveStatus)` | — | 🔴 |
| `Runs/PlayerMapPointHistoryEntry.cs` | `BlitzMerchantChoices` | — | `List<BlitzMerchantHistoryEntry>` | 🟢 |
| `Runs/History/*HistoryEntry.cs` | 主构造写法 | 显式构造 | `struct(...)` 主构造 | 🔵 等价（`CardEnchantment`/`CardTransformation`/`ModelChoice`/`ActMap`/`Ascension`） |
| `Saves/Test/MockGodotFileIo.cs` | `UnreadablePaths` | — | `HashSet<string>` | 🟢 |
| `SerializableRun.cs` | `IsCustomGame` | — | `bool { get; set; }` | 🟢（存档 V21） |
| `Migrations/**` | 文件名 | `*Migration*.cs` | `000N_*` 前缀；新增 `SerializableRunV20ToV21`/`RunHistoryV10ToV11` | 🔵 |
| `SaveContent.cs`/`PendingDreadWinStreakResult.cs`/`ProfileScopeUserDataMigrator.cs` | 新文件 | — | 新文件 | 🟢 |
| `SerializableProgress.cs`/`ProgressState.cs` | 偏好/连胜 | — | `PreferredBlitzAscension`/`MaxBlitzAscension`/`Preferred*Character`×6/`PreferredDreadRotating*`×2/`Current*DreadStartingCharacterForRotation`×2/`Pending*DreadWinStreakResult`×2 | 🟢 |
| `ProgressState.cs` | 新方法 | — | `GetStatsForCharacter<T>()`/`IsEmptyEpochSlotAvailable(epochId)` | 🟢 |
| `CharacterStats.cs` | `Best*/Current*DreadWinStreak*` ×10 | — | 属性 | 🟢 |
| `CloudSaveStore.cs` | `directoryPath` | `public string` | — | 🔴 |
| `Managers/PrefsSaveManager.cs` | 构造 | `(int profileId, ISaveStore, MigrationManager)` | — | 🔴 |
| `MegaCritSerializerContext.cs` | JsonTypeInfo | — | `BlitzMerchantEntryType`/`BlitzMerchantHistoryEntry`/`PendingDreadWinStreakResult`/`ListBlitzMerchantHistoryEntry` | 🟢 |
| `Runs/Metrics/RunMetrics.cs` | `GameMode` | — | `required string` | 🟢 |
| `Runs/Metrics/EncounterMetric.cs` | `damage` | `readonly int` | `readonly int = Math.Clamp(damage,0,100)` | 🔵 |
| `Runs/Metrics/CardChoiceMetric.cs` | `picked`/`skipped` | `readonly List<string>` | `readonly List<string> = new()` | 🔵 |
| `Saves/Runs/SavedProperties.cs` | `SavedProperty<T>` | 显式构造 | 主构造 | 🔵 |

## 16. 时间线 / 每日挑战 / 日志杂项

| 文件 | API | 111 | 113 | 说明 |
|---|---|---|---|---|
| `Nodes/Screens/Timeline/NEpochCard.cs` + `UnlockScreens/NUnlockEpochScreen.cs` | 删除 | 有 | — | 🔴 Timeline UI 改版 |
| `Timeline/Epochs/` | 新 Epoch | — | `BlitzEpoch`/`DreadEpoch`/`Fool1–7Epoch` + `Stories/FoolStory` | 🟢 |
| `Daily/DailyRunUtility.cs` | 时间/种子 | — | `GetDailySeed`/`GetDailySeedDate`/`TryGetDailySeedDate`/`IsFutureLeaderboardDay`/`IsCurrentLeaderboardDay`/`GetTimeServerTime` | 🟢 |
| `Logging/LogSanitizer.cs` | `AnonymizeSteamIds` | — | `void` | 🟢 |
| `Helpers/ImageHelper.cs` | `GetAtlasUvRegion` | — | `static` | 🟢 |
| `Assets/PreloadManager.cs` | `LoadRoomBlitzMerchantAssets` | — | `void` | 🟢 |
| `RichTextTags/RichTextYellow.cs` | 新文件 | — | `RichTextEffect` | 🟢 |
| `DevConsole/ConsoleCommands/` | 新命令 | — | `ScreenshotConsoleCmd`/`GetLogsConsoleCommand`/`UnlockConsoleCommand`/`AchievementConsoleCommand` + `BudgetedZipWriter`/`FeedbackAttachment`/`FeedbackLogFiles`/`FeedbackTextEntry` | 🟢 |
| `DevConsole/ConsoleCommands/FightConsoleCmd.cs` | `FightArgs`/`TryParseFightArgs` | — | `record struct` + `static bool` | 🟢 支持指定种子 |
| `DevConsole/ConsoleCommands/GetLogsConsoleCmd.cs` | `CollectFeedbackLogFiles`/`WriteFeedbackZip` | — | `static` | 🟢 |
| `Debug/` | 截图上报 | — | `Bootstrapper`/`CaptureResult`/`CaptureStatus`/`ScreenshotPaths`/`ViewportCapture` | 🟢 |
| `Helpers/StsColors.cs` | `halfTransparentBlack` | — | `static Color` | 🟢 |
| `Assets/AssetSets.cs` | 新资源集 | — | `NCardFlyShuffleVfx`/`ArrowSlot`/`NFoolUi`/`NBlitzTopBar`/`NBlitzIcon`/`NDreadIcon` 等 | 🟢 |
| `Audio/Debug/` | `TmpSfx`/`NDebugAudioManager` | — | 新增 | 🟢 |
| `ControllerInput/ControllerConfig.cs`/`SteamControllerConfig.cs` | `GlyphType`/`SteamDeckOnly`/`IsSteamInputActive` | — | 新增 | 🟢 |
| `Entities/Cards/CardTransformation.cs` | `TransformResult.transformer` | — | `CardModel?` 字段 | 🟢 |
| `Entities/Enchantments/EnchantmentOption.cs` | `card` | — | `CardModel?` 字段 | 🟢 |
| `Runs/CardCreationOptions.cs` | `MerchantBlacklist`/`CustomPool` | — | `IEnumerable<CardModel>` | 🟢 |
| `Runs/Metrics/ActWinMetric.cs` | `dread` | — | `bool` | 🟢 |
| `Runs/History/*HistoryEntry.cs` | 构造参数 | 旧参数 | `transformer`/`enchantment` 等参数重排/新增 | 🔴 |
| `Combat/History/Entries/` | `EnergySpentEntry`/`StarsModifiedEntry`/`SummonedEntry` | 旧构造 | 参数调整 | 🔴 |
| `GameInfo/NGameInfoUploader.cs` | `GameInfoPath`/`SerializeGameInfo` | — | `static` | 🟢 |
| `Runs/PlayerMapPointHistoryEntry.cs` | `BlitzMerchantChoices` | — | `List<BlitzMerchantHistoryEntry>` | 🟢 |
| `Saves/Test/MockGodotFileIo.cs` | `UnreadablePaths` | — | `HashSet<string>` | 🟢 |
| `TestSupport/TestRngInjector.cs` | `SetRelicOverride<T>` | `static void` | `static void AddRelicOverride<T>` | 🔴 改名 |
| `FmodSfx.cs` | `foolWah`/`foolCho`/`foolKi` | — | `const string` | 🟢 |
| `Entities/Merchant/MerchantDialogueSet.cs` | `BlitzFinishedLines` | — | `IReadOnlyList<LocString>` | 🟢 |

## 17. Modding 命名空间

| 文件 | 111 | 113 | 状态 |
|---|---|---|---|
| `Mod.cs`/`ModManifest.cs`/`ModSettings.cs`/`ModManager.cs`/`ModHelper.cs`/`ModDependency.cs`/`ModLoadState.cs`/`ModManagerState.cs`/`ModSource.cs`/`CombatHookSubscriptionDelegate.cs`/`RunHookSubscriptionDelegate.cs`/`IModManagerFileIo.cs`/`ModInitializerAttribute.cs`/`SettingsSaveMod.cs` | 原签名 | 相同 | ✅ 仅反编译器格式差异；`OnModDetected`/`OnMetricsUpload` 事件仍在 |

## 18. AutoSlay（自动测试，🔴 大重构）

| 区域 | 111 | 113 | 说明 |
|---|---|---|---|
| `Launchers/` | — | `IRunLauncher`/`StandardRunLauncher`/`BlitzRunLauncher`/`DreadRunLauncher`/`ModeScreen`/`RunLaunchers` | 🟢 |
| `Navigation/` | — | `IRoomNavigator`/`MapNavigator`/`BlitzNavigator`/`RunPosition`/`RoomNavigators` | 🟢 |
| `Scenarios/` | — | `ScenarioScript`/`ScenarioRunner`/`ScenarioConditions`/`ScenarioStatement`/`ScenarioOutcome`/`ScenarioExitCode`/`ScenarioLog`/`ScenarioWaitCondition`/`ScenarioParseResult`/`ScenarioDirectives`/`ScenarioConditionDescriptor` | 🟢 脚本化场景 |
| 其他 | `AutoSlayTimeoutException` | `DriverTimeoutException` + `AutoSlayMode`/`AutoSlayModes`/`AutoSlayUnlocks`/`ActEntryCheck`/`ByrdEvolutionScreenHandler` | 🔴 改名 + 🟢 |
| `AutoSlayer.cs` | `Start(string seed, string? logFile = null)` + `static Watchdog? CurrentWatchdog` | `Start(string seed, string? mode, string? logFile = null)` + `Watchdog.Current` | 🔴 |
| `Helpers/Watchdog.cs` | `Watchdog()` | `Watchdog(Action<string>, Action<string>, TimeSpan?, TimeSpan?, Func<DateTime>?)` + `WatchdogScope`/`Use`/`Current` | 🔴 |

## 19. UI 节点（Nodes）

| 区域 | 111 | 113 | 说明 |
|---|---|---|---|
| 全体 `N*` 类 | 非 partial + 手写信号 | `partial` + 源生成信号 | 🔵 等价；手写 `EmitSignal*`/`SignalName` 引用会断 |
| `Nodes/TopBar/` | `NTopBar` 单一类 | `NTopBarButton`/`NTopBarDeckButton`/`NTopBarGold`/`NTopBarHp`/`NTopBarMapButton`/`NTopBarPauseButton`/`NTopBarPortrait`/`NTopBarPortraitTip`/`NTopBarBossIcon`/`NTopBarFloorIcon`/`NTopBarRoomIcon`/`NTopBarModifier`/`NRunTimer` + 3 IconConfig | 🔴 拆分 |
| `Nodes/Combat/` | `NCreature.SetCreatureIsInteractable` | `SetIsInteractable(on, changeVisibilityImmediately)` + `NFoolArrowUi`/`NFoolCombatUi`/`NFoolCombatSymbol` | 🔴 + 🟢 |
| `Nodes/Rooms/` | `NMerchantRoom` | `NStandardMerchantRoom` + `NBlitzMerchantRoom` | 🔴 拆分 |
| `Nodes/Screens/` | — | `NBlitzScreen`/`NDreadScreen`/`NUnderConstruction`/`NSaveAndQuitButton`/`NSubmenuPortrait`/`NCustomGameModeDropdown`/`NLeaderboardDayArrow` | 🟢 |
| `Nodes/Screens/CardLibrary/` | `SortingOrders.cs` | `NCardLibraryGrid.SortingOrders.cs` | 🔴 移位 |
| `Bindings/MegaSpine/MegaSlotNode.cs` | `(Node3D)` | `(MegaSlot)` + `SlotName`/`Slot`/`AttachmentName` | 🔴；新类型 `MegaSlot` |
| `Nodes/GodotExtensions/` | — | `OwnedTween`/`OwnerFreeingTween`/`TweenOutcome`/`TweenWait` | 🟢 |
| `Nodes/CommonUi/NInputManager.cs` | — | `DebugSkipRestSite`/`DebugProceedFromRewards`/`IsKbOnlyDirectionalKey` | 🟢 |
| `Nodes/CommonUi/NErrorPopup.cs` | `NErrorPopup` | + `RunSaveErrorContent` record struct + `CreateForRunSave`/`GetRunSaveErrorContent` | 🟢 |
| `Nodes/GodotExtensions/NMegaTextEdit.cs` | `class NMegaTextEdit : TextEdit` | `class NMegaTextEdit` 持有 `TextEdit` 属性 | 🔴 继承者必改 |
| `Nodes/GodotExtensions/NDropdown.cs` | — | `protected bool IsOpen` | 🟢 |
| `Nodes/HoverTips/NHoverTipSet.cs` | — | `const float hoverTipWidth = 360f` + `SetAlignment` | 🟢 |
| `Nodes/Combat/NCreatureStateDisplay.cs` | — | `Reposition`/`AnimateInSimple`/`AnimateOutSimple` | 🟢 |
| `Nodes/Cards/NCard.cs` | — | `SetPortraitTexture(Texture2D)` | 🟢 |
| `Nodes/Cards/NCardGrid.cs` | — | `IReadOnlyList<CardModel> SortedCards` | 🟢 |
| `Nodes/Screens/Map/NNormalMapPoint.cs` | — | `static string IconName/IconPath/OutlinePath/UnknownIconPath/UnknownOutlinePath` | 🟢 |
| `Nodes/Rooms/NMerchantButton.cs` | — | `protected MegaSkeleton? _merchantSkeleton` + `protected NSelectionReticle _merchantSelectionReticle` + `protected bool _focusedWhileTargeting` | 🟢 |
| `Nodes/Relics/NRelicInventory.cs` | — | `UpdateNavigation()` | 🟢 |
| `Nodes/Screens/Shops/NMerchantInventory.cs` | — | `const int blitzColumns = 3` + `ShowOpenInventory`/`Close` | 🟢 |
| `Nodes/Screens/Shops/NMerchantDialogue.cs` | — | `ShowForBlitzFinished` | 🟢 |
| `Nodes/Screens/MainMenu/` | — | `static AssetPaths`（`NCompendiumSubmenu`/`NSingleplayerSubmenu`） | 🟢 |
| `Nodes/Screens/FeedbackScreen/NSendFeedbackScreen.cs` | — | `static GetUploadedScreenshotSize`/`SendFeedback` | 🟢 |
| `Nodes/Audio/NRunMusicController.cs` | — | `UpdateTrack(RoomType)` | 🟢 |
| `Nodes/Vfx/` | — | `NCardFlyVfx.Create`/`NFireSmokePuffVfx.Create`/`NCardSmithVfx()` | 🟢 |
| `Events/Custom/CrystalSphereEvent/` | — | `CrystalSphereMinigame.Owner` | 🟢 |
| `CardSelection/CardSelectorPrefs.cs` | — | `static bool AbsorbSelectionPrompt` | 🟢 |
| `TestSupport/TestRngInjector.cs` | `SetRelicOverride<T>` | `AddRelicOverride<T>` | 🔴 改名 |
| `addons/sentry/` | `Nodes/SentryBootstrap.cs`/`Nodes/SentryAutoInit.cs` | `addons/sentry/` | 🔵 移位 |
| `addons/mega_text/` | `MegaCrit.Sts2.addons.mega_text/MegaLabel`/`MegaRichTextLabel`/`ThemeConstants` | `addons/mega_text/`（同 namespace） | 🔵 移位 |

## 20. 枚举值变化汇总（真实变化）

| 枚举 | 111 | 113 | 说明 |
|---|---|---|---|
| `Runs/GameMode` | `None,Standard,Daily,Custom` | `None,Standard,Daily,Dread,Blitz` | 🔴 `-Custom`/`+Dread`/`+Blitz`；自定义→`IsCustomGame` |
| `Hooks/HpLossHookPhase` | `BeforeOsty=1,AfterOsty=2,All=3` | `BeforeWuppy=1,BeforeOsty=2,AfterOsty=4,All=6` | 🔴 位值全移 + 🟢 |
| `ValueProps/ValueProp` | … | `+FromArrow = 0x20` | 🟢 |
| `Entities/Cards/CardTag` | … | `+Wah`/`Cho`/`Ki`/`Shoot` | 🟢 |
| `Entities/Characters/CharacterGender` | `Male,Female,NonBinary,Unspecified` | `+Tree` | 🟢 |
| `Entities/Multiplayer/NetError` | … | `+DreadNotUnlocked=110`/`BlitzNotUnlocked=111` | 🟢 |
| `Entities/Rngs/PlayerRngType` | … | `+NonCombatGeneration` | 🟢 |
| `Rewards/RewardType` | … | `+UpgradeCard` | 🟢 |
| `Nodes/Vfx/VfxColor` | … | `+Fool` | 🟢 |
| `Runs/CardRarityOddsType` | … | `+Blitz`/`BlitzNeow` | 🟢 |
| `HoverTips/StaticHoverTip` | … | `+WahMelody`/`ChoMelody`/`KiMelody`/`Tarot` | 🟢 |

## 21. 原版模型行为改动（mod 若 hook 这些类需留意）

| 文件 | 111 | 113 | 说明 |
|---|---|---|---|
| `Models/Relics/Byrdpip.cs` | — | `SwoopsPlayed`/`ShowCounter`/`DisplayAmount`/`AfterCardPlayed`/`TryModifyRestSiteOptions` | 🟢 进化计数+休息选项 |
| `Models/Relics/PaelsEye.cs` | `ShouldTakeExtraTurn` | `ShouldTakeExtraTurnEarly` | 🔴 提前判定 |
| `Models/Relics/ScrollBoxes.cs` | `GenerateRandomBundles(count)` | `(Rng rng, count)` | 🔴 参数 |
| `Models/Relics/`（BookOfFiveRings/FrozenEgg/MoltenEgg/LuckyFysh/JuzuBracelet/Girya/Shovel/WhiteBeastStatue/PotionBelt/LordsParasol/BowlerHat/MealTicket/MassiveScroll/Planisphere） | 旧实现 | 实现更新 | 🔵 hook 签名未变 |
| `Models/Powers/JugglingPower.cs` | `BeforeCardPlayed` | `AfterCardPlayed` + `cardToClone` 公共字段 | 🔴 行为点移动 |
| `Models/Powers/PhantomBladesPower.cs` | `AfterCardEnteredCombat` | `TryModifyKeywordsInCombat` | 🔴 |
| `Models/Powers/InterceptPower.cs` | — | `IsCovering`/`RemoveCoveredCreature`/`AfterRemoved` | 🟢 |
| `Models/Powers/`（Covered/Reattach/Dampen/Constrict/Adaptable/Infested/Ravenous/PaleBlueDot/Tank/SicEm/Hex/Shrink/PossessSpeed/Illusion/DrawCardsNextTurn） | `AfterDeath` 旧签名 | `AfterDeath` 新签名 + 微调 | 🔴 签名适配 |
| `Models/Cards/`（Melancholy/SovereignBlade/ExpectAFight/SpoilsMap/ForgottenRitual/HandOfGreed/Royalties/Debt/Expertise/MementoMori） | 旧实现 | 挂接点微调（`AfterThisWasTransformedIntoInternal`/`ShouldGlowGoldInternal`/Blitz 禁用） | 🔵 |
| `Models/Monsters/KinFollower.cs` | `StartsWithDance` | `Index` | 🔴 构造参数 |
| `Models/Monsters/`（Byrdpip/TheInsatiable/Queen/Aeonglass/PaelsLegion/LagavulinMatriarch/TestSubject/TwigSlimeS） | 旧实现 | 实现更新 | 🔵 |
| `Models/Encounters/*Boss.cs` | — | `GetDominion`/`ScenePath` 接入 | 🟢 Dread 强化 |
| `Models/Enchantments/Sown.cs`/`Swift.cs` | 旧成员 | 成员调整 | 🔵 |
| `Models/Events/*`（Neow/DoorsOfLightAndDark/Nonupeipe/Tanx/TheArchitect/WelcomeToWongos/Orobas/Darv/Pael/Reflections/Tezcatara/Vakuu） | — | `FoolPronounGuess`/`OnRoomExit`/`ConfigureBackgroundScene` 接入 | 🟢 |
| `Models/Characters/*`（Ironclad/Defect/Silent/Regent/Necrobinder/Fool） | — | `DreadBgBrightness`/`DreadBgContrast`/`DreadNameColor` override | 🟢 |

## 22. 删除的类型/文件汇总

| 文件（111） | 去向（113） |
|---|---|
| `Runs/GameModeExtension.cs` | → `Helpers/GameModeHelper.cs` |
| `Models/Singleton/SingletonModel.cs` + `Singleton/MultiplayerScalingModel.cs` | → `Models/RunModel.cs`、`Models/MultiplayerScalingModel.cs` |
| `Nodes/Screens/CardSelection/ICardSelector.cs` | → `ICardSelectionScreen.cs` |
| `Models/Powers/AmbergrisPower.cs` | 删除 |
| `AutoSlay/AutoSlayTimeoutException.cs` | → `DriverTimeoutException.cs` |
| `Multiplayer/Messages/Game/MerchantCardRemovalMessage.cs` | 删除（走 MerchantSynchronizer） |
| `Nodes/Screens/Timeline/NEpochCard.cs`、`NUnlockEpochScreen.cs` | Timeline 改版 |
| `Nodes/Screens/CardLibrary/SortingOrders.cs` | → `NCardLibraryGrid.SortingOrders.cs` |
| `Nodes/SentryBootstrap.cs` / `SentryAutoInit.cs` | → `addons/sentry/` |
| `MegaCrit.Sts2.addons.mega_text`（`MegaLabel`/`MegaRichTextLabel`/`ThemeConstants`） | → `addons/mega_text/`（同 namespace） |

## 23. 按 mod 类型速查

| mod 类型 | 必改项 |
|---|---|
| 卡牌/遗物/能力 | `AfterDeath` 加 `source`；遗物 `IsAllowed`→`IsAllowedInternal`；怪 `IsHealthBarVisible`→`IsInteractable`；卡 `AfterTransformed*` 改名；`IsAllowedInBlitz`/`IsAllowedInRun`/`IsAllowedInShops` |
| 角色 | 删 4 个 Pronoun 属性 → `AddDetailsTo(str, pronounGuess)`；`ShortTitle`/`BaseArrowSlotCount`/`DreadBg*`/`virtual DeathSfx` |
| 事件 | `RelicOption` 去 `customDonePage`；`AllowedOptions`/`GetOptionsFromThreePools`/`OnRoomExit`/`FoolPronounGuess`/`ConfigureBackgroundScene` |
| Boss/遭遇 | `GetDominion`、`ScenePath`、怪 `IsInteractable` |
| 商店 | `MerchantEntry` 全系改写（`OnTryPurchaseInternal`、无 inventory 构造、`Id`+`TryBeginPurchase`） |
| 模式/爬塔 | `GameMode.Custom` 删 → `IsCustomGame`；`CreateForNewRun` 加 `isCustom`；Ascension* 签名 |
| 地图 | `GenerateRooms(RunState)`、`ActMap` protected 连接方法 |
| Hook 订阅 | `AfterDeath`/`AfterTakingExtraTurn`/`ShouldTakeExtraTurn`/`ModifyUnblockedDamageTarget` |
| 存档/历史 | `SerializableRun` V21 + `IsCustomGame`；`OnEnded`/`UpdateProgressWithRunData` → `PostRunProgressUpdateResult` |
| 选卡界面 | `CardSelectCmd` 静态栈 → `RunManager.CardSelectorStack`；`ICardSelector`→`ICardSelectionScreen` |
| 自动化测试 | AutoSlay 重构（Launchers/Navigation/Scenarios） |

## 0.110 至 0.111

### CardModel

| 类型/成员 | 0.110 | 0.111 |
| --- | --- | --- |
| 新增 `GeneratePlayCount` | - | `protected Task<int> GeneratePlayCount(ICombatState, Creature?)` |
| 新增 `MoveToResultPileWithoutPlaying` | - | `public Task MoveToResultPileWithoutPlaying(PlayerChoiceContext)` |

### CardCmd

| 类型/成员 | 0.110 | 0.111 |
| --- | --- | --- |
| 改返回类型 `Exhaust` | `Task Exhaust(PlayerChoiceContext, CardModel, bool causedByEthereal = false, bool skipVisuals = false)` | `Task<CardPileAddResult?> Exhaust(...)` |

### 回合结束卡牌（行为）

带回合结束效果（如虚无 Ethereal）的卡牌在结束回合时改为交错飞入打出牌堆后统一结算，不再逐张线性处理。新增 `StuckCombatException`。

### CharacterModel —— 角色动画

| 类型/成员 | 0.110 | 0.111 |
| --- | --- | --- |
| 加参 `GenerateAnimator` | `virtual CreatureAnimator GenerateAnimator(MegaSprite controller)` | `virtual CreatureAnimator GenerateAnimator(MegaSprite controller, Creature creature)` |

新增：

```csharp
protected virtual List<(AnimState, string)> AnimationStates { get; }   // 声明标准动画（触发名 → 状态）
protected Func<Creature, bool> IsLowHealth;                            // 生命 ≤ 25% 切换低血量待机动画
```

`Defect` / `Ironclad` / `Necrobinder` / `Silent` 改为覆写 `AnimationStates`；`Regent` 另移除 `GetSovereignBladeAnimIfApplicable` / `GetSovereignBladeDelayIfApplicable`。

> **迁移要点：** 覆写 `GenerateAnimator` 的自定义角色需补 `Creature` 参数，或改用 `AnimationStates` 声明动画。

### AnimState

| 类型/成员 | 0.110 | 0.111 |
| --- | --- | --- |
| 新增 `AddNextState` | - | `void AddNextState(AnimState state)` / `void AddNextState(AnimState state, Func<bool>? condition)` |
| 新增 `GetNextState` | - | `AnimState? GetNextState()` |
| 新增 `RemoveBranch` | - | `void RemoveBranch(string trigger, string stateId)` |
| 新增常量 | - | `lowHealthIdleAnim = "low_health_loop"` |

### Multiplayer —— 握手系统

新增连接握手子系统：`HandshakeManager` / `HandshakeResult` / `HandshakeStatus` / `IHandshakeHandler`。连接早期即校验版本与 Mod 兼容性。

#### PeerVersionInfo

| 类型/成员 | 0.110 | 0.111 |
| --- | --- | --- |
| 移除接口 | `struct PeerVersionInfo : IPacketSerializable` | `struct PeerVersionInfo` |
| 改返回类型 `Deserialize` | `void Deserialize(PacketReader)` | `bool TryDeserialize(PacketReader)` |
| 新增 `IsModded` | - | `bool IsModded()` |

#### 大厅玩家

| 类型/成员 | 0.110 | 0.111 |
| --- | --- | --- |
| `RunLobbyPlayer` / `LoadRunLobbyPlayer` / `StartRunLobbyPlayer` | `PeerVersionInfo versionInfo` | `bool isModded` |
| `NetClientData` 新增 | - | `PeerVersionInfo versionInfo` |

#### 大厅消息

`ClientLobbyJoinRequestMessage` / `ClientLoadJoinRequestMessage` / `ClientRejoinRequestMessage` / `InitialGameInfoMessage` 移除 `versionInfo` 字段；`ClientConnectionFailedMessage` 类型删除；`INetMessageSubtypes` 注册表 53 → 52。

#### 网络服务接口

| 类型/成员 | 0.110 | 0.111 |
| --- | --- | --- |
| `INetGameService` 新增 | - | `PeerVersionInfo LocalVersion { get; }` |
| `INetClientGameService` 新增 | - | `event Action<NetErrorInfo>? ConnectionFailed` |
| `INetHostGameService` 删除 | `IReadOnlyList<NetClientData> ConnectedPeers { get; }` | 删除 |
| `INetHostGameService` 新增 | - | `event Action<ulong, NetErrorInfo>? ClientConnectionFailed` / `PeerVersionInfo? GetVersionInfoForPeer(ulong)` |

#### 构造函数

| 类型/成员 | 0.110 | 0.111 |
| --- | --- | --- |
| `NetClientGameService` ctor | `NetClientGameService()` | `NetClientGameService(PeerVersionInfo versionInfo)` |
| `NetHostGameService` ctor | `NetHostGameService()` | `NetHostGameService(PeerVersionInfo versionInfo)` |
| `NetMessageBus` ctor | `NetMessageBus()` | `NetMessageBus(PacketReader reader, PacketWriter writer)` |

#### NetError（整体重新编号）

| 值 | 0.110 | 0.111 |
| --- | --- | --- |
| `LobbyFull` / `RunInProgress` / `NotInSaveGame` / `VersionMismatch` / `JoinBlockedByUser` / `StateDivergence` / `HandshakeTimeout` / `ModMismatch` | 7~14 | **100~107** |
| `NoInternet` / `Timeout` / `InternalError` / `UnknownNetworkError` / `RateLimited` / `TryAgainLater` / `FailedToHost` / `SecureConnectionFailed` | 15~22 | **200~207** |
| `InvalidHandshake` / `LobbyJoinTimeout` | - | 新增 = 108 / 109 |

> **迁移要点：** 硬编码 `NetError` 数值的代码需要全部同步。

#### 其他

| 类型/成员 | 0.110 | 0.111 |
| --- | --- | --- |
| `LoadRunLobby` / `StartRunLobby` 事件 | `event Action<ClientConnectionFailedMessage, ulong>? PlayerFailedToConnect` | `event Action<ulong, NetErrorInfo>? PlayerFailedToConnect` |
| `ClientConnectionFailedException` | 移除 `rawReason` 字段与 `(string, ConnectionFailureReason, ConnectionFailureExtraInfo?)` 构造函数 |
| `ConnectionFailureReason` 新增 | - | `HandshakeTimeout = 6` |
| `SteamUtil` 删除 | `handshakeMagicBytes` | 删除（移入 `HandshakeManager.magicBytes`） |
| `SteamDisconnectionReason` | `AppInternalError = 1017` | `AppInternalError = 1202` |

### IModManagerFileIo

| 类型/成员 | 0.110 | 0.111 |
| --- | --- | --- |
| 新增 `MakeDirRecursive` | - | `void MakeDirRecursive(string path)` |
| 新增 `CopyFile` | - | `Error CopyFile(string sourcePath, string destinationPath)` |

> **迁移要点：** 自定义 `IModManagerFileIo` 实现需补全这两个方法。

### ModManager

| 类型/成员 | 0.110 | 0.111 |
| --- | --- | --- |
| 加参 `CopyUnmoddedSaveFilesIfNeeded` | `()` | `(IModManagerFileIo fileIo)` |
| 加参 `Copy` | `(string baseDir, string sourceFile, string targetFile)` | `(IModManagerFileIo fileIo, ...)` |

### PlatformUtil

| 类型/成员 | 0.110 | 0.111 |
| --- | --- | --- |
| 改返回类型 `OpenInviteDialog` | `void OpenInviteDialog(INetGameService)` | `bool TryOpenInviteDialog(INetGameService)` |

### 输入系统

`MegaInput.confirm` 默认键 Enter → E（与 `endTurn` 同为 E）；重绑定时 `confirm` / `endTurn` 自动保持一致；新增 `SettingsSaveV7ToV8` 迁移同步旧存档键位。

### 其他

| 类型/成员 | 0.110 | 0.111 |
| --- | --- | --- |
| `SaveManager` / `PrefsSaveManager` 新增 | - | `IsPrefsLoaded` / `IsLoaded` |
| VFX 类命名空间迁移 | 全局命名空间 | `NOrbVfx` 等 → `MegaCrit.Sts2.Core.Nodes.Orbs` / `Nodes.Vfx.Utilities` / `Nodes.Debug` |

---

## 0.109 至 0.110

### CombatId（新增类型）

不透明标识符，标识一次战斗。防止已结束战斗的延迟操作泄露到下一场战斗。

```csharp
public readonly record struct CombatId(int Value);
```

### CombatManager

| 类型/成员 | 0.109 | 0.110 |
| --- | --- | --- |
| 改返回类型 `BeginCardOrPotionEffect` | `void BeginCardOrPotionEffect(Player)` | `CombatId? BeginCardOrPotionEffect(Player)` |
| 加参 `EndCardOrPotionEffect` | `Task EndCardOrPotionEffect(Player)` | `Task EndCardOrPotionEffect(CombatId?, Player)` |
| 加参 `CheckForEmptyHand` | `Task CheckForEmptyHand(PlayerChoiceContext, Player)` | `Task CheckForEmptyHand(CombatId?, PlayerChoiceContext, Player)` |
| 加参 `HandlePlayerDeath` | `Task HandlePlayerDeath(Player)` | `Task HandlePlayerDeath(CombatId?, Player)` |
| 加参 `RemoveDeadPlayerCardsFromCombat` | `Task RemoveDeadPlayerCardsFromCombat(Player)` | `Task RemoveDeadPlayerCardsFromCombat(CombatId?, Player)` |
| 去参 `EndPlayerTurnPhaseTwoInternal` | `Task EndPlayerTurnPhaseTwoInternal(CancellationToken?)` | `Task EndPlayerTurnPhaseTwoInternal()` |
| 去参 `SwitchFromPlayerToEnemySide` | `Task SwitchFromPlayerToEnemySide(Func<Task>?)` | `Task SwitchFromPlayerToEnemySide()` |

新增字段：

```csharp
public CombatId? CurrentCombatId { get; }
```

> **迁移要点：** 调用 `BeginCardOrPotionEffect` 时需捕获返回值 `CombatId?`，并在对应的 `EndCardOrPotionEffect` / `CheckForEmptyHand` 中传回。

### CardModel / PotionModel

`BeginCardOrPotionEffect` / `EndCardOrPotionEffect` / `CheckForEmptyHand` 调用点均需适配 `CombatId?`。

```csharp
// 0.109
CombatManager.Instance.BeginCardOrPotionEffect(Owner);
await CombatManager.Instance.EndCardOrPotionEffect(Owner);
await CombatManager.Instance.CheckForEmptyHand(choiceContext, originalOwner);

// 0.110
CombatId? effectCombatId = CombatManager.Instance.BeginCardOrPotionEffect(Owner);
await CombatManager.Instance.EndCardOrPotionEffect(effectCombatId, Owner);
await CombatManager.Instance.CheckForEmptyHand(effectCombatId, choiceContext, originalOwner);
```

### MegaInput

| 类型/成员 | 0.109 | 0.110 |
| --- | --- | --- |
| 改名 `MegaInput.accept` | `accept` | `confirm` |
| 删除 `MegaInput.releaseCard` | `releaseCard` | 删除 |

新增：

```csharp
public static readonly StringName endTurn = "ui_end_turn";
```

### BranchingPlayerChoiceContext

| 类型/成员 | 0.109 | 0.110 |
|---|---|---|
| 加参 ctor | `BranchingPlayerChoiceContext(ulong, GameActionType, PlayerChoiceContext)` | `BranchingPlayerChoiceContext(GameAction, ulong, GameActionType, PlayerChoiceContext)` |

### InputType（新增枚举）

```csharp
public enum InputType
{
    MouseAndKeyboard = 0,
    KeyboardOnlyMode = 1,
    Controller = 2
}
```

### PeerVersionInfo（新增类型）

用于多人游戏版本校验和 mod 兼容性检查。

```csharp
public struct PeerVersionInfo : IPacketSerializable
{
    public string version;
    public PlatformBranch branch;
    public uint idDatabaseHash;
    public List<string>? gameplayAffectingMods;
    public List<string>? otherMods;
    public static PeerVersionInfo LocalDefault();
}
```

### LobbyPlayer 拆分

| 类型/成员 | 0.109 | 0.110 |
| --- | --- | --- |
| 拆分 `LobbyPlayer` | 单一 `LobbyPlayer` 类 | 拆分为 `RunLobbyPlayer` / `LoadRunLobbyPlayer` / `StartRunLobbyPlayer` |
| 改名 `RunLobby.ConnectedPlayerIds` | `ConnectedPlayerIds` | `PlayerIds` |

### ProgressState

| 类型/成员 | 0.109 | 0.110 |
|---|---|---|
| 字段→计算属性 `TotalUnlocks` | `public int TotalUnlocks { get; set; }` | `public int TotalUnlocks => EpochModel.AgnosticUnlockOrder.Count(IsEpochObtained);` |

新增：

```csharp
public string? GrantNextUnlock();
```

## 0.108 至 0.109

### AbstractModel

| 类型/成员 | 0.108 | 0.109 |
| --- | --- | --- |
| 改签名 `AbstractModel.AfterBlockBroken` | `virtual Task AfterBlockBroken(Creature creature)` | `virtual Task AfterBlockBroken(PlayerChoiceContext choiceContext, Creature target, Creature? breaker)` |
| 改名+改返回类型 `ModifyCardPlayResultPileTypeAndPosition` | `virtual (PileType, CardPilePosition) ModifyCardPlayResultPileTypeAndPosition(CardModel, bool, ResourceInfo, PileType, CardPilePosition)` | `virtual CardLocation ModifyCardPlayResultLocation(CardModel, bool, ResourceInfo, CardLocation)` |
| 改名 `AfterModifyingCardPlayResultPileOrPosition` | `virtual Task AfterModifyingCardPlayResultPileOrPosition(CardModel, PileType, CardPilePosition)` | `virtual Task AfterModifyingCardPlayResultLocation(CardModel, CardLocation)` |

### Hook

| 类型/成员 | 0.108 | 0.109 |
| --- | --- | --- |
| 改签名 `Hook.AfterBlockBroken` | `static Task AfterBlockBroken(ICombatState, Creature)` | `static Task AfterBlockBroken(ICombatState, PlayerChoiceContext, Creature target, Creature? breaker)` |
| 改名+改返回类型 `Hook.ModifyCardPlayResultPileTypeAndPosition` | `static (PileType, CardPilePosition) ModifyCardPlayResultPileTypeAndPosition(...)` | `static CardLocation ModifyCardPlayResultLocation(...)` |

### CardLocation（新增类型）

替代旧的 `(PileType, CardPilePosition)` 元组。

```csharp
public record struct CardLocation(Player player, PileType pileType, CardPilePosition position);
```

### CardModel

| 类型/成员 | 0.108 | 0.109 |
| --- | --- | --- |
| 改名+改返回类型 `GetResultPileTypeAndPositionForCardPlay` | `protected (PileType, CardPilePosition) GetResultPileTypeAndPositionForCardPlay()` | `protected CardLocation GetResultLocationForCardPlay()` |
| 加参 `CardModel.CreateDupe` | `CardModel CreateDupe()` | `CardModel CreateDupe(Player newOwner)` |

### CreatureCmd

| 类型/成员 | 0.108 | 0.109 |
|---|---|---|
| 改签名 `CreatureCmd.LoseBlock` | `static Task LoseBlock(Creature creature, decimal amount)` | `static Task LoseBlock(PlayerChoiceContext choiceContext, Creature target, decimal amount, Creature? remover)` |

### CardPileCmd

| 类型/成员 | 0.108 | 0.109 |
|---|---|---|
| 去 async `CardPileCmd.Draw` | `static async Task<IEnumerable<CardModel>> Draw(...)` | `static Task<IEnumerable<CardModel>> Draw(...)` |

新增：

```csharp
public static Task DrawWithoutBlockingOnOtherPlayers(PlayerChoiceContext choiceContext, decimal count, Player player, bool fromHandDraw = false);
```

### CardCmd

新增：

```csharp
public static void ApplySingleTurnRetain(CardModel card);
```

### CardSelectCmd

| 类型/成员 | 0.108 | 0.109 |
|---|---|---|
| 改参数可空 `CardSelectCmd.FromCombatPile` | `(..., Func<CardModel, bool> filter)` | `(..., Func<CardModel, bool>? filter)` |

### CombatManager

| 类型/成员 | 0.108 | 0.109 |
| --- | --- | --- |
| 改返回类型 `EndCardOrPotionEffect` | `void EndCardOrPotionEffect(Player)` | `Task EndCardOrPotionEffect(Player)` |
| 加可选参 `EndPlayerTurnPhaseTwoInternal` | `Task EndPlayerTurnPhaseTwoInternal()` | `Task EndPlayerTurnPhaseTwoInternal(CancellationToken? combatCt = null)` |

新增：

```csharp
public event Action<CombatState>? CombatBegan;
public async Task RemoveDeadPlayerCardsFromCombat(Player player);
```

### AssemblyInfo

新增：

```csharp
public static Dictionary<Type, (Mod?, bool)>? MockTypes { get; set; }
public static Mod? ModForType(Type type, out bool isBaseGame);
```

### RunManager

| 类型/成员 | 0.108 | 0.109 |
| --- | --- | --- |
| 加参 `SetUpReplay` | `SetUpReplay(RunState, CombatReplay)` | `SetUpReplay(RunState, CombatReplay, ulong playerIdToLoad)` |
| 改可见性 `FadeIn` | `private Task FadeIn(bool)` | `public Task FadeIn(bool)` |
| 改可见性 `FadeOut` | `private Task FadeOut()` | `public Task FadeOut()` |

### PotionModel

新增：

```csharp
public string LargeImagePath;
public Texture2D LargeImage;
```

### RNG 系统重构（`uint` -> `ulong`）

RNG种子默认长度由10扩展为12位。

#### StringHelper

| 类型/成员 | 0.108 | 0.109 |
|---|---|---|
| 改返回类型 `GetDeterministicHashCode` | `int GetDeterministicHashCode(string)` | `ulong GetDeterministicHashCode(string)` |

新增（旧算法保留用于兼容）：

```csharp
public static int GetDeterministicHashCodeOld(string str);
```

#### Rng

| 类型/成员 | 0.108 | 0.109 |
| --- | --- | --- |
| 改类型 `Rng.Seed` | `uint Seed` | `ulong Seed` |
| 改签名 `Rng` ctor | `Rng(uint seed = 0u, int counter = 0)` | `Rng(ulong seed = 0uL)` |
| 改签名 `Rng` ctor | `Rng(Player, ModelId, uint mixin = 0u, int counter = 0)` | `Rng(Player, ModelId, ulong mixin = 0uL)` |
| 改签名 `Rng` ctor | `Rng(uint seed, string name)` | `Rng(ulong seed, string name)` |
| 删除 `Rng.Counter` | `int Counter { get; private set; }` | 删除 |
| 删除 `Rng.FastForwardCounter` | `void FastForwardCounter(int)` | 删除 |

新增：

```csharp
public Rng(SerializableRng serializable);
public void LoadFromSerializable(SerializableRng serializable);
public SerializableRng ToSerializable();
public ulong NextUnsignedLong();
public ulong NextUnsignedLong(ulong maxExclusive = ulong.MaxValue);
public ulong NextUnsignedLong(ulong minInclusive, ulong maxExclusive);
```

#### EventSynchronizer

| 类型/成员 | 0.108 | 0.109 |
|---|---|---|
| 改参数类型 ctor | `EventSynchronizer(..., uint seed)` | `EventSynchronizer(..., ulong seed)` |

#### MegaRandom

新增：

```csharp
public MegaRandom(SerializableRng serializable);
public void Reinitialise(SerializableRng serializable);
public void FillSerializableState(SerializableRng rng);
```

#### PlayerRngSet

| 类型/成员 | 0.108 | 0.109 |
| --- | --- | --- |
| 改类型 `PlayerRngSet.Seed` | `uint Seed` | `ulong Seed` |
| 改签名 `PlayerRngSet` ctor | `PlayerRngSet(uint seed)` | `PlayerRngSet(ulong seed)` |
| 改可见性 `PlayerRngSet.GetRng` | `private Rng GetRng(PlayerRngType)` | `public Rng GetRng(PlayerRngType)` |

#### RunRngSet

| 类型/成员 | 0.108 | 0.109 |
| --- | --- | --- |
| 改类型 `RunRngSet.Seed` | `uint Seed` | `ulong Seed` |
| 改签名 `RunRngSet.MockRng` | `MockRng(RunRngType, uint seed)` | `MockRng(RunRngType, ulong seed)` |
| 改可见性 `RunRngSet.GetRng` | `private Rng GetRng(RunRngType)` | `public Rng GetRng(RunRngType)` |

### ModelIdSerializationCache

`SavedPropertiesTypeCache` 的功能合并入此类。新增：

```csharp
public static int PropertyIdBitSize { get; }
public static int MaxPropertyId { get; }
public static void ResetForTest();
public static int GetNetIdForPropertyName(string propertyName);
public static string GetPropertyNameForNetId(int netId);
public static List<PropertyInfo>? GetJsonPropertiesForType(Type t);
public static void CacheSavedPropertiesForTypeDebug(Type type);
```

#### MegaCritSerializerContext

| 类型/成员 | 0.108 | 0.109 |
| --- | --- | --- |
| 删除 `UInt32` | `JsonTypeInfo<uint> UInt32` | 删除 |
| 新增 `SerializableRng` | - | `JsonTypeInfo<SerializableRng> SerializableRng` |
| 改类型参数 | `Dictionary<PlayerRngType, int>` | `Dictionary<PlayerRngType, SerializableRng>` |
| 改类型参数 | `Dictionary<RunRngType, int>` | `Dictionary<RunRngType, SerializableRng>` |

### PlayerChoiceContext

| 类型/成员 | 0.108 | 0.109 |
|---|---|---|
| 加参 `PlayerChoiceContext.SignalPlayerChoiceBegun` | `abstract Task SignalPlayerChoiceBegun(PlayerChoiceOptions)` | `abstract Task SignalPlayerChoiceBegun(Player chooser, PlayerChoiceOptions)` |

新增：

```csharp
public IEnumerable<AbstractModel>? ModelStack { get; }
public abstract ulong? OwnerId { get; }
```

> `SignalPlayerChoiceBegun` 的签名变更影响所有子类 override：`BlockingPlayerChoiceContext`、`GameActionPlayerChoiceContext`、`HookPlayerChoiceContext`、`ThrowingPlayerChoiceContext`。

### HookPlayerChoiceContext

| 类型/成员 | 0.108 | 0.109 |
|---|---|---|
| 改参数可空 ctor | `HookPlayerChoiceContext(AbstractModel, ulong, ICombatState, GameActionType)` | `HookPlayerChoiceContext(AbstractModel, ulong, ICombatState?, GameActionType)` |

新增：

```csharp
public static Player? GetOwner(AbstractModel source, ICombatState? combatState);
```

### BranchingPlayerChoiceContext（新增类型）

多人分支选择上下文，继承 `PlayerChoiceContext`。

```csharp
public class BranchingPlayerChoiceContext : PlayerChoiceContext
{
    public BranchingPlayerChoiceContext(ulong localPlayerId, GameActionType gameActionType, PlayerChoiceContext existing);
    public event Action<HookPlayerChoiceContext>? AfterBranched;
    public Task AssignTaskAndWaitForPauseOrCompletion(Task task);
}
```

---

## 0.107 至 0.108

### AbstractModel

| 类型/成员 | 0.107 | 0.108 |
| --- | --- | --- |
| 加参 `AbstractModel.ModifyDamageAdditive` | `(..., CardModel? cardSource)` | `(..., CardModel? cardSource, CardPlay? cardPlay)` |
| 加参 `AbstractModel.ModifyDamageMultiplicative` | 同上 | 同上 |
| 加参 `AbstractModel.ModifyDamageCap` | `(..., CardModel? cardSource)` | `(..., CardModel? cardSource, CardPlay? cardPlay)` |

新增：

```csharp
// AbstractModel 上
public virtual Task BeforeCombatRewardOffered(RewardsSet, CombatRoom);
public virtual bool IsMock => false;
```

### CardModel

| 类型/成员 | 0.107 | 0.108 |
| --- | --- | --- |
| 改名和改返回类型 `CardModel.GetResultPileTypeForCardPlay` | `PileType GetResultPileTypeForCardPlay()` | `(PileType, CardPilePosition) GetResultPileTypeAndPositionForCardPlay()` |
| 改可见性 `CardModel.PortraitPngPath` | `private` | `protected virtual` |
| 加参 `AttackCommand.FromCard` | `FromCard(CardModel)` | `FromCard(CardModel, CardPlay?)` |
| 加参 `AttackCommand.FromOsty` | `FromOsty(Creature, CardModel)` | `FromOsty(Creature, CardModel, CardPlay?)` |
| 改参数类型 `AttackCommand.CreateContextAsync` | `(..., PlayerChoiceContext, CardModel)` | `(..., PlayerChoiceContext, CardPlay)` |
| 改参数类型 `AttackContext.CreateAsync` | `(..., PlayerChoiceContext, CardModel)` | `(..., PlayerChoiceContext, CardPlay)` |

新增：

```csharp
public CardModel CreateCloneForPlayer(Player);
public void GiveToAnotherPlayer(Player);
// AttackCommand
public CardPlay? CardPlay { get; }
```

### OrbModel

| 类型/成员 | 0.107 | 0.108 |
| --- | --- | --- |
| 改名 `OrbModel.Triggered` 事件 | `event Action? Triggered` | `event Action? PassiveActivated` |
| 改名+拆分 `OrbModel.Trigger()` | `void Trigger()` | `void ActivateEvoke(Creature[])` + `Task TriggerPassive(PlayerChoiceContext, Creature?)` |

新增事件 `event Action<Creature[]>? EvokeActivated`。

### EventModel / EventCombatSynchronizer

| 类型/成员 | 0.107 | 0.108 |
| --- | --- | --- |
| 加参 `EventModel.BeginEvent` | `BeginEvent(Player, bool)` | `BeginEvent(Player, EventCombatSynchronizer?, bool)` |
| 删除 `EventModel.GenerateInternalCombatState` | `void GenerateInternalCombatState(IRunState)` | 删除 |
| 删除 `EventModel.ResetInternalCombatState` | `void ResetInternalCombatState()` | 删除 |
| 删除 `EncounterModel.IsDebugEncounter` | `virtual bool IsDebugEncounter => false` | 删除 |

新增类 `EventCombatSynchronizer`（`InitializeForEvent`/`ReadyToEnterCombat`/`ResetState`/`MutableEncounterForLayout`/`CombatStateForLayout`），替代被删除的两个方法。

### EpochModel

| 类型/成员 | 0.107 | 0.108 |
| --- | --- | --- |
| 删除 `EpochModel.Year` | `string Year` | 删除/私有化 |
| 删除 `EpochModel.EraName` | `string EraName` | 删除/私有化 |
| 删除 `EpochModel.ModelId` | `ModelId ModelId` | 删除/私有化 |
| 删除 `EpochModel.IsArtPlaceholder` | `bool IsArtPlaceholder` | 删除 |
| 删除 `EpochModel.PackedPortraitPath` | `string PackedPortraitPath` | 删除/私有化 |

新增：

```csharp
public bool HasRealPortrait;
public static IReadOnlyList<Type> AllEpochs;
```

### CardCreationOptions / Save / UserData

`CardCreationOptions` 卡池与过滤器拆分。

| 类型/成员 | 0.107 | 0.108 |
| --- | --- | --- |
| 删除 `CardCreationOptions.CustomCardPool` | `IEnumerable<CardModel>? CustomCardPool` | 删除 |
| 删除 `CardCreationOptions.ForNonCombatWithDefaultOdds` | 静态方法 | 删除 |
| 删除 `CardCreationOptions.WithRngOverride` | `WithRngOverride(Rng)` | 删除 |
| 改签名 `CardCreationOptions.WithCardPools` | `WithCardPools(IEnumerable<CardPoolModel>, Func<CardModel,bool>?)` | `WithCardPools(IEnumerable<CardPoolModel>)` |

新增 `CardCreationOptions WithFilter(Func<CardModel,bool>)` 替代原先内联的过滤 predicate。

| 类型/成员 | 0.107 | 0.108 |
| --- | --- | --- |
| 改参数类型 `SaveManager.IncrementNumReloads` | `(SerializableRun, bool isMultiplayer)` | `(SerializableRun, NetGameType, bool forceInTest=false)` |
| 加重载 `UserDataPathProvider.GetProfileDir` | `GetProfileDir(int)` | `GetProfileDir(int, bool? forceModState)`（旧重载保留） |

新增 `UserDataPathProvider.GetAccountDir(bool? forceModState=null)`、`PrefsSave.IsBestiaryActionsPreferred`。

### GameActions / RunManager / ControllerInput

`VoteToMoveToNextActAction` 构造加参，控制器方向键统一为 `Up/Down/Left/Right`。

| 类型/成员 | 0.107 | 0.108 |
| --- | --- | --- |
| 加参 `VoteToMoveToNextActAction` ctor | `VoteToMoveToNextActAction(Player)` | `VoteToMoveToNextActAction(Player, int currentActIndex)` |
| 改名 `Controller.dPadNorth` | `dPadNorth` | `dPadUp` |
| 改名 `Controller.dPadSouth` | `dPadSouth` | `dPadDown` |
| 改名 `Controller.dPadEast` | `dPadEast` | `dPadRight` |
| 改名 `Controller.dPadWest` | `dPadWest` | `dPadLeft` |
| 改名 `Controller.joystickPress` | `joystickPress` | `lStickPress` |

新增（部分）：

```csharp
// VoteToMoveToNextActAction
public int CurrentActIndex { get; }
// NGame
public Task GameStartupComplete { get; }
public static string GetGameVersion();
// RunManager
public bool IsPaused;
public event Func<Task>? TestFadeOut;
public event Func<Task>? TestFadeIn;
// Creature
public void SetNodeVisible(bool);
// NullCombatState 单例
public static NullCombatState Instance { get; }
// GodotControllerInputStrategy / SteamControllerInputStrategy
public Vector2 GetLeftAnalogStickDirection();
// EventOption 拷贝构造
public EventOption(EventOption);
// DailyRunUtility
public static DateTimeOffset? AddLeaderboardDays(DateTimeOffset, int);
// RestSiteOption 测试入口
public static Func<Player, List<RestSiteOption>>? generateForTests;
// CharacterModel
public LocString BestiarySeenQuote;
public LocString? BestiaryKillQuote;
// ModifierModel
public static IReadOnlyCollection<ModifierModel> Pick2Good1Bad(Rng, IEnumerable<CharacterModel>);
// CardPoolModel
protected void InvalidateCardCache();
// MonsterModel
public virtual float HurtAnimationTrackOffsetForDoom => 0.1f;
// PlayerMapPointHistoryEntry
public bool IsAffectedByFurCoat { get; set; }
```

## 0.106 至 0.107

### `ActModel` 新增 abstract 成员

```csharp
public abstract int Index { get; }
public abstract bool IsDefault { get; }
public abstract bool IsUnlocked(UnlockState unlockState);
```

任何继承 `ActModel` 的 mod 类型**必须**实现这三个新成员，否则编译失败。

### AbstractModel 新增 virtual 方法

```csharp
// 卡牌关键词修饰
public virtual bool TryModifyKeywordsInCombat(CardModel card, ISet<CardKeyword> keywords)

// 金币修饰（替代旧的 ShouldGainGold 概念）
public virtual decimal ModifyGoldGained(Player player, decimal amount)

// Power Amount 拆分为加法和乘法
public virtual decimal ModifyPowerAmountGivenAdditive(PowerModel power, Creature giver, decimal amount, Creature? target, CardModel? cardSource)
public virtual decimal ModifyPowerAmountGivenMultiplicative(PowerModel power, Creature giver, decimal amount, Creature? target, CardModel? cardSource)

// 金币修饰后通知
public virtual Task AfterModifyingGoldGained(Player player, decimal amount)
```

### 删除的方法

| sts2106 | 替代 |
| --- | --- |
| `ModifyPowerAmountGiven(...)` | `ModifyPowerAmountGivenAdditive` + `ModifyPowerAmountGivenMultiplicative` |
| `ShouldGainGold(decimal, Player)` | 改用 `ModifyGoldGained` + 检查返回值 |

### CardModel 新增属性

```csharp
public virtual string Title
```

卡牌模型现在可以直接获取标题文本。之前需要通过 LocString 查询，现在有直接的 Title 属性。

## EncounterModel 变更

新增：

```csharp
public virtual float CalculateGoldProportion(CombatState combatState)
```

## 0.105 至 0.106

## 变量变动

* 新增枚举`HpLossHookPhase`，用于`ModifyHpLost`。

* `ModifyDamageHookType`新增`ModifyDamageHookType.Cap`，用于`ModifyDamageCap`接口。

## 函数变动

### AbstractModel

涉及一些函数改名和参数新增。

| 0.105 | 0.106 |
| --- | --- |
| `BeforeSideTurnStart(PlayerChoiceContext choiceContext, CombatSide side, ICombatState combatState)` | `BeforeSideTurnStart(PlayerChoiceContext choiceContext, CombatSide side, IReadOnlyList<Creature> participants, ICombatState combatState)` |
| `AfterSideTurnStart(CombatSide side, ICombatState combatState)` | `AfterSideTurnStart(CombatSide side, IReadOnlyList<Creature> participants, ICombatState combatState)` |
| `BeforeTurnEndVeryEarly(PlayerChoiceContext choiceContext, CombatSide side)` | `BeforeSideTurnEndVeryEarly(PlayerChoiceContext choiceContext, CombatSide side, IEnumerable<Creature> participants)` |
| `BeforeTurnEndEarly(PlayerChoiceContext choiceContext, CombatSide side)` | `BeforeSideTurnEndEarly(PlayerChoiceContext choiceContext, CombatSide side, IEnumerable<Creature> participants)` |
| `BeforeTurnEnd(PlayerChoiceContext choiceContext, CombatSide side)` | `BeforeSideTurnEnd(PlayerChoiceContext choiceContext, CombatSide side, IEnumerable<Creature> participants)` |
| `AfterTurnEnd(PlayerChoiceContext choiceContext, CombatSide side)` | `AfterSideTurnEnd(PlayerChoiceContext choiceContext, CombatSide side, IEnumerable<Creature> participants)` |
| `AfterTurnEndLate(PlayerChoiceContext choiceContext, CombatSide side)` | `AfterSideTurnEndLate(PlayerChoiceContext choiceContext, CombatSide side, IEnumerable<Creature> participants)` |
| `AfterCardChangedPiles(..., AbstractModel? source)` | `AfterCardChangedPiles(..., AbstractModel? clonedBy)` |
| `AfterCardChangedPilesLate(..., AbstractModel? source)` | `AfterCardChangedPilesLate(..., AbstractModel? clonedBy)` |

此外`ModifyHpLost`一些函数进行了合并，新增枚举`HpLossHookPhase`。

之前的`ModifyHpLostBeforeOsty`相当于传入参数`HpLossHookPhase.BeforeOsty`，afterosty以此类推。

| 0.105 | 0.106 |
| --- | --- |
| `ModifyHpLostBeforeOsty(..., out IEnumerable<AbstractModel> modifiers)` | `ModifyHpLost(..., HpLossHookPhase phases, out IEnumerable<AbstractModel> modifiers)` |
| `ModifyHpLostAfterOsty(..., out IEnumerable<AbstractModel> modifiers)` | `ModifyHpLost(..., HpLossHookPhase phases, out IEnumerable<AbstractModel> modifiers)` |

### CardPileCmd

| 0.105 | 0.106 |
| --- | --- |
| `Task AddCurseToDeck<T>(Player owner)` | `Task<CardModel?> AddCurseToDeck<T>(Player owner)` |
| `Task AddCursesToDeck(IEnumerable<CardModel> curses, Player owner)` | `Task<IEnumerable<CardPileAddResult>> AddCursesToDeck(...)` |
| `Add(..., AbstractModel? source = null, ...)` | `Add(..., AbstractModel? clonedBy = null, ...)` |

### CardSelectCmd

新增函数`FromCombatPile`。

### OrbCmd

`IncreaseBaseOrbCount`改名为`AddSlots`。

## 0.103 至 0.105测试版

### manifest json变动

* 添加了`min_game_version`字段，必填。

* 依赖mod写法变动，查看`环境配置`或者两个基础库的第0章。

### 变量变动

* `bool ShowsInfiniteHp`改成了`HpDisplay`枚举。

* `bool IsInstanced`改成了`PowerInstanceType`枚举。

### 函数变动

* 一些函数开始传入`PlayerChoiceContext`参数，与下面的进行配合。

* 一些效果执行函数，例如`PowerCmd.Apply`等，需要一个`PlayerChoiceContext`参数。如果你的函数传入参数有对应类型添加即可。如果你找不到这个类型的参数，传入`new ThrowingPlayerChoiceContext()`。

* `CardPileCmd.AddGeneratedCardToCombat`等，之前传入`addedByPlayer`的`bool`类型的参数的位置，改成了`Player? creator`。所以如果之前是`false`的现在填`null`，是`true`的话填`cardPlay.card.Owner`或者`Owner`，根据语境。

* `OnTurnEndInHand`从`public virtual`改为`protected virtual`。

* `GetResultPileType`改名为`GetResultPileTypeForCardPlay`。新增`GetResultPileTypeForOnTurnEndInHandEffect`。

旧版 `AbstractModel` 里有：

* `BeforePlayPhaseStart(PlayerChoiceContext choiceContext, Player player)`
* `BeforePlayPhaseStartLate(PlayerChoiceContext choiceContext, Player player)`

0.104 版这两个点被移除了，换成了：

* `AfterAutoPrePlayPhaseEnteredEarly(PlayerChoiceContext choiceContext, Player player)`
* `AfterAutoPrePlayPhaseEntered(PlayerChoiceContext choiceContext, Player player)`
* `AfterAutoPrePlayPhaseEnteredLate(PlayerChoiceContext choiceContext, Player player)`
* `AfterAutoPostPlayPhaseEntered(PlayerChoiceContext choiceContext, Player player)`

### 接口变动

* 一些参数的类型从`CombatState`改成了`ICombatState`。

## 0.99 至 0.103

主要是能量表盘问题。

结构从：

```
TestEnergyCounter (Control)
├── BurstBack (CPUParticles2D) %
├── Layers (Control) %
│   ├── Layer1 (TextureRect，或任意)
│   └── RotationLayers (Control) %
├── BurstFront (CPUParticles2D) %
└── Label (Label)
```

改成了：

```
TestEnergyCounter (Control)
├── EnergyVfxBack (NParticlesContainer) %
├── Layers (Control) %
│   ├── Layer1 (TextureRect，或任意)
│   └── RotationLayers (Control) %
├── EnergyVfxFront (NParticlesContainer) %
└── Label (Label)
```

所以如果你在正式版添加人物，需要添加`BurstBack (CPUParticles2D) %`和`BurstFront (CPUParticles2D) %`这两个节点。
