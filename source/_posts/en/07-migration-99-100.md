---
title: Release to Beta
date: 2026-03-27 12:27:58
permalink: en/docs/07-migration-99-100/
categories:
- Basics
---
This records some changes that may require you to update your code. Not an exhaustive list.

---

## 0.111 to 0.113

### Hooks (Hook System)

#### `Hooks/Hook.cs`

| Type/Member | 0.111 | 0.113 | Notes |
|---|---|---|---|
| `AfterDeath` | `(IRunState, ICombatState?, Creature, bool wasRemovalPrevented, float deathAnimLength)` | `(IRunState, ICombatState?, Creature, CardModel? source, bool wasRemovalPrevented, float deathAnimLength)` | 🔴 `source` param inserted |
| `ShouldTakeExtraTurn` | `(ICombatState, Player)` → `bool` | `(ICombatState, Player, out AbstractModel? source)` → `bool` | 🔴 returns triggering model |
| `AfterTakingExtraTurn` | `(ICombatState, Player)` | `(ICombatState, Player, AbstractModel source)` | 🔴 trailing param added |
| `ModifyUnblockedDamageTarget` | `(ICombatState, Creature, decimal, ValueProp, Creature?)` → `Creature` | `(ICombatState?, Creature, decimal, ValueProp, Creature?)` → `Creature` | 🔴 combatState now nullable |
| `AfterArrowShot` | — | `(ICombatState, Player, ArrowSlot?, PlayerChoiceContext, CardModel?)` | 🟢 Fool arrows |
| `AfterArrowImpaled` | — | `(ICombatState, ImpaledPower, ArrowSlot, PlayerChoiceContext, CardModel?)` | 🟢 |
| `AfterArrowDislodged` | — | `(ICombatState, ImpaledPower, ArrowSlot, PlayerChoiceContext, CardModel?)` | 🟢 |
| `ModifyPreBlockDamageTarget` | — | `(ICombatState?, Creature, decimal, ValueProp, Creature?)` → `Creature?` | 🟢 modify target before block resolution |
| `TryReplaceDefaultRoomRewards` | — | `(IRunState, Player, List<Reward>, AbstractRoom)` → `bool` | 🟢 replace default rewards |
| `ModifyExtraRestSiteMendText` | — | `(IRunState, Player, IReadOnlyList<LocString>)` → `IReadOnlyList<LocString>` | 🟢 extra rest-site mend text |

#### `Hooks/HpLossHookPhase.cs` (⚠️ enum bit values changed)

| Member | 0.111 | 0.113 | Notes |
|---|---|---|---|
| `BeforeWuppy` | — | `1` | 🟢 new (Wuppy intercept phase, before Osty) |
| `BeforeOsty` | `1` | `2` | 🔴 **bit value changed** — code that stores/passes the integer will break |
| `AfterOsty` | `2` | `4` | 🔴 **bit value changed** |
| `All` | `3` | `6` | 🔴 **bit value changed** (no longer includes BeforeWuppy bit) |

### Model Base Classes

#### `Models/AbstractModel.cs`

| Type/Member | 0.111 | 0.113 | Notes |
|---|---|---|---|
| `AfterDeath` | `(PlayerChoiceContext, Creature, bool wasRemovalPrevented, float deathAnimLength)` | `(PlayerChoiceContext, Creature, CardModel? source, bool wasRemovalPrevented, float deathAnimLength)` | 🔴 all overrides must change |
| `AfterArrowShot` | — | `virtual Task (Player, ArrowSlot?, PlayerChoiceContext, CardModel?)` | 🟢 |
| `AfterArrowImpaled` | — | `virtual Task (ImpaledPower, ArrowSlot, PlayerChoiceContext, CardModel?)` | 🟢 |
| `AfterArrowDislodged` | — | `virtual Task (ImpaledPower, ArrowSlot, PlayerChoiceContext, CardModel?)` | 🟢 |
| `ModifyDamageMultiplicativeLate` | — | `virtual decimal (Creature?, decimal, ValueProp, Creature?, CardModel?, CardPlay?)` | 🟢 late multiplicative modifier |
| `ModifyPreBlockDamageTarget` | — | `virtual Creature? (Creature, Creature?, decimal, ValueProp, Creature?)` | 🟢 |
| `ShouldTakeExtraTurnEarly` | — | `virtual bool (Player)` | 🟢 runs before `ShouldTakeExtraTurn` |
| `TryReplaceDefaultRoomRewards` | — | `virtual bool (Player, List<Reward>, AbstractRoom)` | 🟢 |
| `ModifyExtraRestSiteMendText` | — | `virtual IReadOnlyList<LocString> (Player, IReadOnlyList<LocString>)` | 🟢 |

#### `Models/CardModel.cs`

| Type/Member | 0.111 | 0.113 | Notes |
|---|---|---|---|
| Transform callbacks | `virtual void AfterTransformedFrom()` + `virtual void AfterTransformedTo()` | `virtual void AfterThisWasTransformedFrom(CardModel)` + `void AfterThisWasTransformedInto(CardModel)` (via `protected virtual AfterThisWasTransformedIntoInternal`) | 🔴 renamed/split |
| `BigPortrait` | — | `Texture2D` | 🟢 |
| `ExtraReplayThisTurn` | — | `int` | 🟢 counted in EnchantPlayCount |
| `TransformIntoAfterPlay` | — | `CardModel? { get; protected set; }` | 🟢 auto-transform after play |
| `IsAllowedInBlitz` | — | `virtual bool` | 🟢 Blitz eligibility |
| `IsAllowedInRun` | — | `bool (IRunState)` | 🟢 unified eligibility check |
| `InvokeKeywordsChanged` | — | `void ()` | 🟢 refresh keywords |
| `ArrowHoverTip` | — | `protected IHoverTip` | 🟢 |

#### `Models/RelicModel.cs`

| Type/Member | 0.111 | 0.113 | Notes |
|---|---|---|---|
| `IsAllowed` | `public virtual bool (IRunState)` | `public bool (IRunState)` + `protected virtual bool IsAllowedInternal(IRunState)` | 🔴 no longer virtual; override point moved to Internal |
| `IsBeforeAct3TreasureChest` | `protected static bool (IRunState)` | `protected static bool IsLateInAct3(IRunState)` | 🔴 renamed |
| `IsAllowedInShops` | — | `virtual bool` | 🟢 shop eligibility |
| `ArrowHoverTip` | — | `protected IHoverTip` | 🟢 |

#### `Models/MonsterModel.cs`

| Type/Member | 0.111 | 0.113 | Notes |
|---|---|---|---|
| Health bar / interaction | `virtual bool IsHealthBarVisible` | `virtual bool IsInteractable` | 🔴 renamed; semantics now "can interact/select"; use `NCreature.SetIsInteractable` for runtime toggling |

#### `Models/PowerModel.cs`

| Type/Member | 0.111 | 0.113 | Notes |
|---|---|---|---|
| `GetExtraHoverTips` | — | `IEnumerable<IHoverTip> ()` | 🟢 |

#### `Models/CharacterModel.cs`

| Type/Member | 0.111 | 0.113 | Notes |
|---|---|---|---|
| Pronoun props ×4 | `LocString PronounObject/PossessiveAdjective/PronounPossessive/PronounSubject` | — | 🔴 removed; use `AddDetailsTo`/`GetPronoun(key, FoolPronounGuess)` |
| `AddDetailsTo` | `(LocString str)` | `(LocString str, FoolPronounGuess pronounGuess = Neutral)` | 🔴 signature changed |
| `DeathSfx` | `string` | `virtual string` | 🔵 can now be overridden |
| `ShortTitle` | — | `LocString` | 🟢 |
| `BaseArrowSlotCount` | — | `virtual int` | 🟢 Fool=1, default 0 |
| `DreadBgBrightness`/`DreadBgContrast`/`DreadNameColor` | — | `virtual float` ×2 + `virtual Color` | 🟢 Dread UI colors |

#### `Models/EventModel.cs`

| Type/Member | 0.111 | 0.113 | Notes |
|---|---|---|---|
| `FoolPronounGuess` | — | `virtual FoolPronounGuess` | 🟢 event pronoun gender |
| `OnRoomExit` | — | `virtual void ()` | 🟢 room-exit callback |

#### `Models/AncientEventModel.cs`

| Type/Member | 0.111 | 0.113 | Notes |
|---|---|---|---|
| `RelicOption<T>` | `protected EventOption (string pageName = "", string? customDonePage = null)` | `protected EventOption (string pageName = "")` | 🔴 `customDonePage` removed |
| `RelicOption(RelicModel)` | `protected EventOption (RelicModel, string pageName = "", string? customDonePage = null)` | `protected EventOption (RelicModel, string pageName = "")` | 🔴 same |
| `AllowedOptions` | — | `protected List<EventOption> (IEnumerable<EventOption>)` | 🟢 option-pool filtering |
| `GetOptionsFromThreePools` | — | `protected List<EventOption> (List, List, List)` | 🟢 |
| `ConfigureBackgroundScene` | — | `virtual void (Control)` | 🟢 custom background |

#### `Models/EncounterModel.cs`

| Type/Member | 0.111 | 0.113 | Notes |
|---|---|---|---|
| `DebugRandomizeRng` | `void ()` | `ulong ()` | 🔴 now returns seed |
| `DebugSetRng` | — | `void (ulong seed)` | 🟢 |
| `ScenePath` | — | `protected virtual string` | 🟢 scene-path override point |
| `GetDominion` | — | `virtual DominionModel? ()` | 🟢 Dread boss empowerment |

#### `Models/ActModel.cs`

| Type/Member | 0.111 | 0.113 | Notes |
|---|---|---|---|
| `GenerateRooms` | `void (Rng, UnlockState, bool isMultiplayer = false)` | `void (RunState)` + `void (Rng, UnlockState, bool isMultiplayer = false, bool isBlitz = false)` | 🟢 new overload + 🔵 trailing param |
| `SetRooms`/`GetRoomsDebug` | — | `void (RoomSet)` / `RoomSet ()` | 🟢 |

#### `Models/PotionModel.cs` / `ModifierModel.cs`

| Type/Member | 0.111 | 0.113 | Notes |
|---|---|---|---|
| `PotionModel.ArrowHoverTip` | — | `protected IHoverTip` | 🟢 |
| `ModifierModel.AdditionalRestSiteMendText` | — | `protected LocString?` | 🟢 |

#### `Models/ModelId.cs` / `ModelDb.cs`

| Type/Member | 0.111 | 0.113 | Notes |
|---|---|---|---|
| `ModelId` copy ctor | `protected ModelId(ModelId original)` | — | 🔴 removed |
| `ModelId.Compare` | — | `static int (ModelId?, ModelId?)` | 🟢 |
| `ModelDb.Singleton<T>` | `static T Singleton<T>() where T : SingletonModel` | `static T RunModel<T>() where T : RunModel` + `static T Dominion<T>() where T : DominionModel` | 🔴 renamed/re-constrained; `SingletonModel` deleted, `MultiplayerScalingModel` moved to `Models/` root |

### Commands

#### `Commands/CreatureCmd.cs`

| Type/Member | 0.111 | 0.113 | Notes |
|---|---|---|---|
| `Damage(Creature)` | `static Task<IEnumerable<DamageResult>> (PlayerChoiceContext, IEnumerable<Creature>?, decimal, ValueProp, Creature?, CardModel?, CardPlay?)` | same + `ModifyDamageHookType modifyDamageHookType = All` | 🔵 trailing default param |
| `Damage(DamageTargetData)` | — | `static Task<IEnumerable<DamageResult>> (PlayerChoiceContext, IEnumerable<DamageTargetData>?, decimal, ValueProp, Creature?, CardModel?, CardPlay?, ModifyDamageHookType = All)` | 🟢 new overload |
| `Kill` | `static Task (Creature)` | `static Task (Creature, CardModel? cardSource, bool force = false)` + `static Task (IReadOnlyCollection<Creature>, CardModel?, bool)` | 🔴🟢 |
| `LoseMaxHp` | `static Task (PlayerChoiceContext, Creature, decimal, bool isFromCard)` | `static Task (PlayerChoiceContext, Creature, decimal, CardModel? cardSource)` | 🔴 last param type changed |

#### `Commands/CardSelectCmd.cs`

| Type/Member | 0.111 | 0.113 | Notes |
|---|---|---|---|
| Static selector stack | `static ICardSelector? Selector/LocalSelector` + `UseSelector`/`PushSelector`/`SuspendSelectorForTest`/`Reset` + `StackedSelectorScope`/`RestoreSelectorScope`/`SelectorScope` | — | 🔴 all removed → `RunManager.CardSelectorStack` (new `CardSelectorStack` class); `TestSupport.ICardSelector` unchanged |
| `FromChooseABundleScreen` | `(Player, IReadOnlyList<IReadOnlyList<CardModel>>)` | same + `bool canSkip = false` | 🔵 |

#### `Commands/CardPileCmd.cs` / `Cmd.cs` / `VfxCmd.cs` / `Builders/AttackCommand.cs`

| Type/Member | 0.111 | 0.113 | Notes |
|---|---|---|---|
| `CardPileCmd.AutoPlayFromDrawPile` | — | `static Task (PlayerChoiceContext, Player, int count, CardPilePosition, bool forceExhaust, Action<CardModel>)` | 🟢 auto-play from draw pile |
| `Cmd.TryWait` | — | `static Task<bool> (float seconds, CancellationToken = default, bool ignoreCombatEnd = false)` | 🟢 |
| `VfxCmd.PlayOnCreature[Center]` | `(Creature, string path)` | same + `bool forceIfDead = false` | 🔵 |
| `AttackCommand.FromArrow` | — | `()` chain call | 🟢 arrow attack |
| `ArrowCmd` / `MelodyCmd` | — | new files | 🟢 Fool/Cho mechanics commands |

### Combat State & Player/Creature Entities

#### `Combat/CombatState.cs` / `CombatManager.cs` / `CombatTurnState.cs` / `CombatHistory.cs`

| Type/Member | 0.111 | 0.113 | Notes |
|---|---|---|---|
| `CombatState` ctor | `(EncounterModel?, IRunState?, IReadOnlyList<ModifierModel>?, IReadOnlyList<BadgeModel>?, MultiplayerScalingModel?)` | `(EncounterModel?, IRunState?, IReadOnlyList<ModifierModel>?, IReadOnlyList<BadgeModel>?, IReadOnlyList<RunModel>?, DominionModel?)` | 🔴 params swapped |
| `CombatState` models | `MultiplayerScalingModel? MultiplayerScalingModel { get; private set; }` | `IReadOnlyList<RunModel> RunModels { get; private set; }` + `DominionModel? Dominion` + `SetDominion(DominionModel?)` | 🔴 renamed/split |
| `CombatManager.UndoReadyToEndTurn` | `void (Player)` | `void TryUndoReadyToEndTurn(Player)` + `bool CanUnEndTurn(Player)` | 🔴 renamed + 🟢 |
| `CombatManager.ShouldSkipCombatEffect` | — | `bool` | 🟢 |
| `CombatTurnState.PlayersThatCannotUnEndTurn` | — | `HashSet<Player>` | 🟢 |
| `CombatHistory.ArrowShot` | — | `void (ICombatState, ArrowSlot)` | 🟢 new entry `ArrowShotEntry` |

#### `Entities/Players/Player.cs` / `PlayerCombatState.cs` / `ExtraPlayerFields.cs`

| Type/Member | 0.111 | 0.113 | Notes |
|---|---|---|---|
| `Player.MaxAscensionWhenRunStarted` | `int { get; }` | — | 🔴 removed |
| `Player.PopulateCombatState` | `void (Rng, CombatState)` | `void (Rng, ICombatState)` | 🔴 param changed to interface |
| `Player.PopulateRelicGrabBagDebug` | — | `void (List<RelicModel>, Rng)` | 🟢 |
| `PlayerCombatState` arrows | — | `IReadOnlyList<ArrowSlot> Arrows` + `int AvailableArrowCount` + `void GainArrow()` + `event Action? ArrowsChanged` | 🟢 |
| `ExtraPlayerFields.IsPlayingRotatingCharacter` | — | `bool { get; set; }` | 🟢 Dread rotation |

#### `Entities/Cards/` / `Creatures/` / `RestSite/` / `FoolArrows/`

| Type/Member | 0.111 | 0.113 | Notes |
|---|---|---|---|
| `CardPile` | `class CardPile` + `CardPile(PileType)` | `class CardPile(PileType)` primary ctor | 🔵 equivalent; `RandomizeOrderInternal` param `CombatState`→`ICombatState` |
| `DamageResult` | `Creature Target`/`HpLoss`/`Blocked`… | + `Creature OriginalTarget { get; set; }` + `int IntendedHpLoss { get; set; }` | 🟢 |
| `DamageTargetData` | — | new type | 🟢 used by `CreatureCmd.Damage` overload |
| `ArrowSlot`/`ArrowStatus` | — | new dir & types | 🟢 Fool arrow slots/status |
| `SmithRestSiteOption` | `int SmithCount { get; set; } = 1` + `override LocString Description` | — | 🔴 removed |
| `EvolveRestSiteOption`/`RestoreRestSiteOption` | — | new files | 🟢 new rest-site options |
| `TarotCards` | — | new file | 🟢 `TarotCards.All` tarot card set |

### Rewards & Card Selection

| File | Type/Member | 0.111 | 0.113 | Notes |
|---|---|---|---|---|
| `Rewards/CardReward.cs` | both ctors | `(CardCreationOptions, int, Player, PlayerChoiceSynchronizer?)` / `(IEnumerable<CardModel>, CardCreationSource, Player, CardCreationOptions, PlayerChoiceSynchronizer?)` | same + `CardSelectorStack? selectorStack = null` | 🔵 |
| `Rewards/RelicReward.cs` | both ctors | `(RelicModel, Player)` / `(RelicRarity, Player)` | same + `Rng? rngOverride = null` | 🔵 |
| `Rewards/CardUpgradeReward.cs` | new type | — | `UpgradeCard` reward | 🟢 |
| `Odds/CardRarityOdds.cs` | `Roll*` ×4 | `(CardRarityOddsType)` / `(CardRarityOddsType, float)` / `(CardRarityOddsType)` | same + `Rng? rngOverride = null` | 🔵; + 🟢 `blitzShop*/blitzNeow*` 6 rarity constants |
| `CardSelection/CardSelectorStack.cs` | new class | — | `RunManager.CardSelectorStack` | 🟢 takes over old `CardSelectCmd` static stack |
| `Nodes/Screens/CardSelection/` | `ICardSelector.cs` | `ICardSelector` interface | `ICardSelectionScreen.cs` | 🔴 renamed |
| `Entities/TreasureRelicPicking/RelicPickingResult.cs` | `GenerateRelicFight` + field | `(List<Player>, RelicModel, Func<RelicPickingFightMove>)` | `(List<Player>, RelicModel, int relicIndex, Func<RelicPickingFightMove>)` + `required int relicIndex` | 🔴 |

### Multiplayer Contexts & Interfaces

| File | Type/Member | 0.111 | 0.113 | Notes |
|---|---|---|---|---|
| `PlayerChoiceContext.cs` | `GameActionType` | — | `abstract GameActionType? GameActionType { get; }` | 🟢 all subclasses add override |
| `BranchingPlayerChoiceContext.cs` | both ctors | `(ulong, GameActionType, PlayerChoiceContext)` / `(AbstractModel, ulong, GameActionType, PlayerChoiceContext)` | `(ulong, PlayerChoiceContext)` / `(AbstractModel, ulong, PlayerChoiceContext)` | 🔴 `gameActionType` removed |
| `ActionQueueSet.cs` | `WasReset`/`AreAnyPlayerDrivenActionsBeingExecuted` | — | `bool` / `bool (bool excludeEndOfTurn = false)` | 🟢 |
| `Runs/IRunState.cs` | interface members | `MultiplayerScalingModel? MultiplayerScalingModel` | `IReadOnlyList<RunModel> RunModels` + `DominionModel? Dominion` + `IReadOnlyList<MapCoord> VisitedMapCoords` + `bool IsCustomGame` | 🔴 implementers must change |
| `Combat/ICombatState.cs` | interface members | `MultiplayerScalingModel? MultiplayerScalingModel` | `IReadOnlyList<RunModel> RunModels` | 🔴 `Null*` updated in sync |
| `Game/INetHostGameService.cs` | `ConnectedPeers`/`DisconnectClient` | `(ulong, NetError, bool)` | + `IReadOnlyList<ulong> ConnectedPeers`; `DisconnectClient` gains `string? debugReason = null` | 🟢🔵 |
| `Game/Lobby/IStartRunLobbyListener.cs` | `PlayerChanged`/`GameModeChanged` | `PlayerChanged(Player, bool isRandomCharacterResolution)` | `PlayerChanged(Player)` + `GameModeChanged()` | 🔴 |
| `Connection/IClientConnectionInitializer.cs` | `Platform`/`GetHostId` | — | `PlatformType Platform` + `ulong? GetHostId()` | 🟢 (ENet/Steam impls updated too) |
| `Game/JoinResult.cs` | `isCustom` | — | `bool` | 🟢 |
| `Messages/Lobby/ClientLobbyJoinResponseMessage.cs` | `gameMode`/`isCustom` | — | new fields | 🟢 |
| `Messages/Lobby/InitialGameInfoMessage.cs` | `gameMode` | present | — | 🔴 |
| `Messages/Lobby/LobbyPlayerChangedCharacterMessage.cs` | `isRotatingDread` | — | `bool` | 🟢 |
| `Messages/Lobby/` | `LobbyGameModeChangedMessage` | — | new file | 🟢 |
| `Entities/Multiplayer/NetFullCombatState.cs` | `ArrowSlotState` | — | nested struct | 🟢 arrow network sync |
| `Entities/Multiplayer/NetErrorInfo.cs` | `JoinExtraInfo`/`ConnectionExtraInfo` | `ConnectionExtraInfo` get only | + `JoinExtraInfo` prop; `ConnectionExtraInfo` get→get,set | 🟢 |
| `Entities/Multiplayer/StartRunLobbyPlayer.cs` | ascension | `int maxMultiplayerAscensionUnlocked` | `int maxStandardAscension` + `int maxBlitzAscension` + `bool isRotatingDread` | 🔴🟢 |
| `Nodes/Debug/IBootstrapSettings.cs` | `Setup` | `(Player localPlayer)` | `(Player player)` — param renamed/purposed for `debugActMap` | 🔴 |
| `Nodes/Screens/CharacterSelect/ICharacterSelectButtonDelegate.cs` | `SelectCharacter` | `(NCharacterSelectButton, CharacterModel)` | `(NCharacterSelectButton)` | 🔴; `NCharacterSelectButton` +`InitAsRandom`/`InitAsRotating` |
| `Game/JoinFlow.cs` | ctor/`Begin` | `JoinFlow(INetClientGameService)` + `Begin(IClientConnectionInitializer, SceneTree?)` | `JoinFlow(INetClientGameService, IClientConnectionInitializer)` + `Begin(SceneTree?)` | 🔴 initializer moved to ctor |
| `Game/FlavorSynchronizer.cs` | `OnEndTurnPingReceived` | `event Action<ulong>?` | `event Action<ulong>? EndTurnPingReceived` + `event Action<Player, MapCoord>? MapPingReceived` | 🔴 renamed + 🟢 |
| `Game/MapSelectionSynchronizer.cs` | ctor/`PlayerVoteCancelled` | `(INetGameService, ActionQueueSynchronizer, RunState)` + `event Action<Player>?` | `(INetGameService, ActionQueueSynchronizer, IRunState)` + `event Action<Player, MapVote?>?` | 🔴; + 🟢 `OnLocalPlayerVotedFor`/`BeforeBeginningMoveToNewMapCoord` |
| `Game/MapVote.cs` | type | `struct` | `record struct` | 🔵 equivalent |
| `Game/OneOffSynchronizer.cs` | `DoLocalMerchantCardRemoval` | `(int, bool)` → `Task<bool>` | — | 🔴 handled by MerchantSynchronizer |
| `Game/TreasureRoomRelicSynchronizer.cs` | `RelicsAwarded`/ctor | `event Action<List<RelicPickingResult>>?` + `(IPlayerCollection, ulong, ActionQueueSynchronizer, RelicGrabBag, Rng)` | event signature changed; ctor drops `sharedGrabBag`, adds `treasureRelics` | 🔴 |
| `Game/RewardsSetSynchronizer.cs` | internal fields | — | — | 🔵 implementation change |
| `Messages/Lobby/ClientLobbyJoinRequestMessage.cs` | `password` | `string` | — | 🔴 |
| `Serialization/QuantizeParams.cs` | `maxValue` | — | field | 🟢 |
| `Platform/AchievementsUtil.cs` | ctor | `(ILogger)` | `(IPlatformServices)` | 🔴 |
| `Platform/Steam/SteamInitializer.cs` | `AchievementsUtil` | — | `AchievementsUtil` prop | 🟢 |

### Merchant

| File | Type/Member | 0.111 | 0.113 | Notes |
|---|---|---|---|---|
| `MerchantEntry.cs` | `Cost` | `int` | `virtual int` | 🔵; + 🟢 `Player`, `uint? Id` |
| same | purchase hooks | `public Task<bool> OnTryPurchaseWrapper(MerchantInventory?, bool)` + `protected abstract Task<(bool,int)> OnTryPurchase(MerchantInventory?, bool)` | `public Task<bool> OnTryPurchaseUnsynchronized(MerchantInventory?, bool)` + `protected abstract Task<(bool,int)> OnTryPurchaseInternal(MerchantInventory?, bool)` | 🔴 renamed; subclasses updated |
| `MerchantCardEntry.cs` | ctor/`Populate` | `(Player, MerchantInventory?, IEnumerable<CardModel>, CardType/CardRarity)` + `Populate()` | `(Player, IEnumerable<CardModel>, CardType/CardRarity)` + `Populate(MerchantInventory?)` | 🔴 inventory moved to Populate |
| `MerchantCardRemovalEntry.cs` | cancel/removal | `OnTryPurchaseWrapper(..., bool cancelable)` | `SetPurchaseUncancelable()` + `static Task<bool> DoCardRemoval(Player, bool)` | 🔴 |
| `MerchantInventory.cs` | `AllEntries` | `IEnumerable<MerchantEntry>` | `List<MerchantEntry>` | 🔴 |
| same | Blitz/transactions | — | `IReadOnlyList<BlitzMerchantEntry> BlitzEntries` + `bool IsBlitzShop` + `int BlitzChoicesRemaining` + `TryBeginPurchase`/`EndPurchase`/`Setup`/`CreateForBlitzMerchant`/`TryPurchaseEntryWithIdUnsynchronized` + new ctor | 🟢 |
| `MerchantDialogueSet.cs` | `BlitzFinishedLines` | — | `IReadOnlyList<LocString>` | 🟢 |
| `Rooms/MerchantRoom.cs` | `Inventories`/`GetLocalInventory` | present | — | 🔴 |
| `Entities/Merchant/` | `BlitzMerchant*` | — | 21 new files | 🟢 Blitz shop entry system |
| `Multiplayer/Game/` | `MerchantSynchronizer` | — | new type | 🟢; `MerchantCardRemovalMessage` deleted |

### RNG

| File | Type/Member | 0.111 | 0.113 | Notes |
|---|---|---|---|---|
| `Random/Rng.cs` | `Shuffle<T>` | `void (IList<T>)` | — | 🔴 deleted; use `list.StableShuffle(rng)`/`UnstableShuffle(rng)` (`Extensions/ListExtensions.cs`) |
| same | `Chaotic`/`CreateChaoticSeed` | `static Rng Chaotic { get; } = new Rng((ulong)DateTimeOffset.Now.ToUnixTimeSeconds())` | `= new Rng(CreateChaoticSeed())` + `static ulong CreateChaoticSeed()` | 🟢 |
| `Random/PlayerRngSet.cs` | `NonCombatGeneration` | — | `Rng` | 🟢 non-combat generation RNG |

### Factories

| File | Type/Member | 0.111 | 0.113 | Notes |
|---|---|---|---|---|
| `RelicFactory.cs` | pull/rarity | `PullNextRelicFromFront(Player)` + `PullNextRelicFromBack(Player)` (auto-roll) + `RollRarity(Player)` | `PullNextRelicForRewardFromFront(Player)` + `RollRarityForReward(Player)` | 🔴 renamed; auto-roll `PullNextRelicFromBack` deleted (shops use `(player, rarity, filter)`) |
| `CardFactory.cs` | `CreateForMerchant` ×2 | `(Player, IEnumerable<CardModel> options, CardType/CardRarity)` | `(Player, IEnumerable<CardModel> options, IEnumerable<CardModel> blacklist, CardType/CardRarity)` | 🔴 param inserted |

### HoverTips

| File | Type/Member | 0.111 | 0.113 | Notes |
|---|---|---|---|---|
| `HoverTip.cs` | `Id`/`IsSmart`/`IsDebuff`/`IsInstanced` | `{ get; set; }` | `{ get; }` | 🔴 object-initializer syntax no longer works |
| same | `ShouldOverrideTextOverflow` | `{ get; set; }` | `{ get; init; }` | 🔴 |
| `HoverTipFactory.cs` | new factories | — | `FromEnchantment(EnchantmentModel, int)` + `FromCardWithCardHoverTips` ×2 + `ForEnergy(DominionModel)` + `ForArrow(Player?, bool)` | 🟢 |

### Localization

| File | Type/Member | 0.111 | 0.113 | Notes |
|---|---|---|---|---|
| `LocManager.cs` | RTL | — | `bool IsRtl` + `static bool IsHiddenLanguage(string)` + `static bool IsRtlLanguage(string)` | 🟢 Arabic |
| `DynamicVars/DynamicVarSet.cs` | `HitCount` | — | `HitCountVar` | 🟢 (new files `HitCountVar`/`CalculatedHitCountVar`) |
| `DynamicVars/DynamicVar.cs` | `GetBaseValueForIConvertible` | `protected virtual decimal ()` | — | 🔴 removed |
| new files | `ArabicPluralRule`/`RtlControlUtils`/`AraFontPathSet` | — | new files | 🟢 |

### Map

| File | Type/Member | 0.111 | 0.113 | Notes |
|---|---|---|---|---|
| `ActMap.cs` | `ConnectChildren` ×2 / `RestoreStartMapPoints` | — | `protected static`/`protected` methods | 🟢 serialization restore moved down |
| `MapPoint.cs` | `FromSerializable` | — | `static MapPoint (SerializableMapPoint)` | 🟢 |
| `MapCoord.cs`/`Runs/MapLocation.cs` | primary-ctor syntax | `struct` + explicit ctor | `struct(int col, int row)` primary ctor | 🔵 equivalent |
| `BlitzActMap.cs` | new file | — | Blitz map | 🟢 |

### Run Flow (RunManager / RunState)

| File | Type/Member | 0.111 | 0.113 | Notes |
|---|---|---|---|---|
| `RunManager.cs` | `OnEnded` | `SerializableRun (bool)` | `PostRunProgressUpdateResult (bool)` | 🔴 return type |
| same | `ProceedFromTerminalRewardsScreen` | `async Task ()` | `void ProceedFromTerminalRewardsScreen()` + `async Task ProceedFromTerminalRewardsScreenAsync()` + `void Proceed()` | 🔴 split |
| same | new | — | `HasRunEnded`/`IsChangingRooms`/`IsPotionUseLocked`/`MerchantSynchronizer`/`CardSelectorStack`/`MapChanged`/`OnIsChangingRoomsModified`/`InvokeMapChanged`/`IsDread()` | 🟢 |
| `RunHistory.cs`/`Runs/Metrics/*` | `SerializableMapPointHistoryEntry` | — | new type | 🟢 |
| `Runs/RunHistory.cs` | `IsCustomGame`/`GameMode` | — | `bool`/`GameMode` | 🟢 |
| `RunState.cs` | models | `MultiplayerScalingModel? MultiplayerScalingModel` | `IReadOnlyList<RunModel> RunModels` + `DominionModel? Dominion` + `SetDominion(DominionModel?)` | 🔴 |
| same | `IsCustomGame` | — | `bool { get; init; }` | 🟢 |
| same | `CreateForNewRun` | `(players, acts, modifiers, gameMode, ascensionLevel, seed)` | `(players, acts, modifiers, gameMode, bool isCustom, ascensionLevel, seed)` | 🔴 param inserted after `gameMode` |
| same | `CreateForTest` | `(…, GameMode gameMode, int ascensionLevel, string? seed)` | `(…, GameMode gameMode, bool isCustomGame = false, int ascensionLevel, string? seed)` | 🔵 |
| `ExtraRunFields.cs`/`SerializableExtraRunFields.cs` | `UsedDebugCommand`/`MarkDebugToolUsed` | — | `bool` + `void ()` | 🟢 |
| `Runs/` | `RunRichPresence`/`History/BlitzMerchantHistoryEntry` | — | new files | 🟢 |

### GameMode / Ascension / New Modes

| File | Type/Member | 0.111 | 0.113 | Notes |
|---|---|---|---|---|
| `Runs/GameMode.cs` | enum | `None,Standard,Daily,Custom` | `None,Standard,Daily,Dread,Blitz` | 🔴 `Custom=3` deleted; custom games use `IsCustomGame` bool |
| `Runs/GameModeExtension.cs` → `Helpers/GameModeHelper.cs` | `AreAchievementsAndEpochsLocked` | `static bool (GameMode, bool?)` (`GameModeExtension`) | `static bool AreAchievementsAndEpochsLocked(GameMode, bool)` + `ForRun`/`ForHistory`/`ForSerializableRun` (`GameModeHelper`) | 🔴 file/signature rework |
| `Entities/Ascension/AscensionManager.cs` | ctor | `(int)` / `(AscensionLevel)` | `(GameMode, int)` | 🔴; + 🟢 `GetMaxAllowed`/`ClampToMode`/`maxAscensionAllowedBlitz=5` |
| `Helpers/AscensionHelper.cs` | queries | `GetTitle(int)`/`GetDescription(int)`/`GetHoverTip(CharacterModel,int,bool achievementsLocked)` | `GetTitle(int,GameMode)`/`GetDescription(int,GameMode)`/`GetHoverTip(CharacterModel,int,GameMode,bool isCustomGame)` | 🔴 `GameMode` param added everywhere |
| same | `PovertyAscensionGoldMultiplier` | `static double` property | `const decimal povertyAscensionGoldMultiplier = 0.75m` | 🔴 now a lowercase const |
| same | Dread/rotation | — | `IsDread`/`GetLevelForBlitz`/`GetPortraitHoverTip`/`GetDreadStreak`/`GetNextRotatingDreadCharacter*`/`GetRotatingCharacterIdForStreak`/`GetCurrentRotatingDread*` | 🟢 |
| `Models/Blitz/`/`Models/Dread/` | new mode models | — | `BlitzRunModel`/`DreadRunModel`/`DominionModel`/`Dominions/*` | 🟢; `ModelDb.RunModel<T>()`/`Dominion<T>()` |
| `AutoSlay/AutoSlayConfig.cs` | `GameMode` | — | field | 🟢 |
| `Multiplayer` side | `StartRunLobby`/`StartHostAsync`/`FastHost` | `maxPlayers` required | `maxPlayers` optional/re-paramed | 🔵; + `LobbyGameModeChangedMessage` |
| `StartRunLobbyPlayer.cs` | `IsCustomGame` field | — | `bool` | 🟢 |

### Saves

| File | Type/Member | 0.111 | 0.113 | Notes |
|---|---|---|---|---|
| `SaveManager.cs` | `UpdateProgressWithRunData` | `void (SerializableRun, bool)` | `PostRunProgressUpdateResult (SerializableRun, bool)` | 🔴; + 🟢 `ObtainFoolEpochIfDefectRunCompleted` |
| `Managers/ProgressSaveManager.cs` | `UpdateWithRunData` | `void (SerializableRun, bool)` | `PostRunProgressUpdateResult (SerializableRun, bool)` | 🔴; + 🟢 `UpdateDreadWinStreakOnVictory`/`ReconcileDreadWinStreakVersion`/`ObtainFoolEpochIfDefectRunCompleted` |
| `Managers/RunSaveManager.cs` | `RenameBrokenMultiplayerRunSave` | `void (ReadSaveStatus)` | — | 🔴 |
| `Runs/PlayerMapPointHistoryEntry.cs` | `BlitzMerchantChoices` | — | `List<BlitzMerchantHistoryEntry>` | 🟢 |
| `Runs/History/*HistoryEntry.cs` | primary-ctor syntax | explicit ctors | `struct(...)` primary ctors | 🔵 equivalent (`CardEnchantment`/`CardTransformation`/`ModelChoice`/`ActMap`/`Ascension`) |
| `Saves/Test/MockGodotFileIo.cs` | `UnreadablePaths` | — | `HashSet<string>` | 🟢 |
| `SerializableRun.cs` | `IsCustomGame` | — | `bool { get; set; }` | 🟢 (save V21) |
| `Migrations/**` | filenames | `*Migration*.cs` | `000N_*` prefix; new `SerializableRunV20ToV21`/`RunHistoryV10ToV11` | 🔵 |
| `SaveContent.cs`/`PendingDreadWinStreakResult.cs`/`ProfileScopeUserDataMigrator.cs` | new files | — | new files | 🟢 |
| `SerializableProgress.cs`/`ProgressState.cs` | prefs/streaks | — | `PreferredBlitzAscension`/`MaxBlitzAscension`/`Preferred*Character`×6/`PreferredDreadRotating*`×2/`Current*DreadStartingCharacterForRotation`×2/`Pending*DreadWinStreakResult`×2 | 🟢 |
| `ProgressState.cs` | new methods | — | `GetStatsForCharacter<T>()`/`IsEmptyEpochSlotAvailable(epochId)` | 🟢 |
| `CharacterStats.cs` | `Best*/Current*DreadWinStreak*` ×10 | — | properties | 🟢 |
| `CloudSaveStore.cs` | `directoryPath` | `public string` | — | 🔴 |
| `Managers/PrefsSaveManager.cs` | ctor | `(int profileId, ISaveStore, MigrationManager)` | — | 🔴 |
| `MegaCritSerializerContext.cs` | JsonTypeInfo | — | `BlitzMerchantEntryType`/`BlitzMerchantHistoryEntry`/`PendingDreadWinStreakResult`/`ListBlitzMerchantHistoryEntry` | 🟢 |
| `Runs/Metrics/RunMetrics.cs` | `GameMode` | — | `required string` | 🟢 |
| `Runs/Metrics/EncounterMetric.cs` | `damage` | `readonly int` | `readonly int = Math.Clamp(damage,0,100)` | 🔵 |
| `Runs/Metrics/CardChoiceMetric.cs` | `picked`/`skipped` | `readonly List<string>` | `readonly List<string> = new()` | 🔵 |
| `Saves/Runs/SavedProperties.cs` | `SavedProperty<T>` | explicit ctor | primary ctor | 🔵 |

### Timeline / Daily / Logging / Misc

| File | Type/Member | 0.111 | 0.113 | Notes |
|---|---|---|---|---|
| `Nodes/Screens/Timeline/NEpochCard.cs` + `UnlockScreens/NUnlockEpochScreen.cs` | deleted | present | — | 🔴 Timeline UI rework |
| `Timeline/Epochs/` | new Epochs | — | `BlitzEpoch`/`DreadEpoch`/`Fool1–7Epoch` + `Stories/FoolStory` | 🟢 |
| `Daily/DailyRunUtility.cs` | time/seed | — | `GetDailySeed`/`GetDailySeedDate`/`TryGetDailySeedDate`/`IsFutureLeaderboardDay`/`IsCurrentLeaderboardDay`/`GetTimeServerTime` | 🟢 |
| `Logging/LogSanitizer.cs` | `AnonymizeSteamIds` | — | `void` | 🟢 |
| `Helpers/ImageHelper.cs` | `GetAtlasUvRegion` | — | `static` | 🟢 |
| `Assets/PreloadManager.cs` | `LoadRoomBlitzMerchantAssets` | — | `void` | 🟢 |
| `RichTextTags/RichTextYellow.cs` | new file | — | `RichTextEffect` | 🟢 |
| `DevConsole/ConsoleCommands/` | new commands | — | `ScreenshotConsoleCmd`/`GetLogsConsoleCommand`/`UnlockConsoleCommand`/`AchievementConsoleCommand` + `BudgetedZipWriter`/`FeedbackAttachment`/`FeedbackLogFiles`/`FeedbackTextEntry` | 🟢 |
| `DevConsole/ConsoleCommands/FightConsoleCmd.cs` | `FightArgs`/`TryParseFightArgs` | — | `record struct` + `static bool` | 🟢 fight command accepts seed |
| `DevConsole/ConsoleCommands/GetLogsConsoleCmd.cs` | `CollectFeedbackLogFiles`/`WriteFeedbackZip` | — | `static` | 🟢 |
| `Debug/` | screenshot reporting | — | `Bootstrapper`/`CaptureResult`/`CaptureStatus`/`ScreenshotPaths`/`ViewportCapture` | 🟢 |
| `Helpers/StsColors.cs` | `halfTransparentBlack` | — | `static Color` | 🟢 |
| `Assets/AssetSets.cs` | new asset sets | — | `NCardFlyShuffleVfx`/`ArrowSlot`/`NFoolUi`/`NBlitzTopBar`/`NBlitzIcon`/`NDreadIcon` etc. | 🟢 |
| `Audio/Debug/` | `TmpSfx`/`NDebugAudioManager` | — | new | 🟢 |
| `ControllerInput/ControllerConfig.cs`/`SteamControllerConfig.cs` | `GlyphType`/`SteamDeckOnly`/`IsSteamInputActive` | — | new | 🟢 |
| `Entities/Cards/CardTransformation.cs` | `TransformResult.transformer` | — | `CardModel?` field | 🟢 |
| `Entities/Enchantments/EnchantmentOption.cs` | `card` | — | `CardModel?` field | 🟢 |
| `Runs/CardCreationOptions.cs` | `MerchantBlacklist`/`CustomPool` | — | `IEnumerable<CardModel>` | 🟢 |
| `Runs/Metrics/ActWinMetric.cs` | `dread` | — | `bool` | 🟢 |
| `Runs/History/*HistoryEntry.cs` | ctor params | old params | `transformer`/`enchantment` etc. reordered/added | 🔴 |
| `Combat/History/Entries/` | `EnergySpentEntry`/`StarsModifiedEntry`/`SummonedEntry` | old ctors | params adjusted | 🔴 |
| `GameInfo/NGameInfoUploader.cs` | `GameInfoPath`/`SerializeGameInfo` | — | `static` | 🟢 |
| `Runs/PlayerMapPointHistoryEntry.cs` | `BlitzMerchantChoices` | — | `List<BlitzMerchantHistoryEntry>` | 🟢 |
| `Saves/Test/MockGodotFileIo.cs` | `UnreadablePaths` | — | `HashSet<string>` | 🟢 |
| `TestSupport/TestRngInjector.cs` | `SetRelicOverride<T>` | `static void` | `static void AddRelicOverride<T>` | 🔴 renamed |
| `FmodSfx.cs` | `foolWah`/`foolCho`/`foolKi` | — | `const string` | 🟢 |
| `Entities/Merchant/MerchantDialogueSet.cs` | `BlitzFinishedLines` | — | `IReadOnlyList<LocString>` | 🟢 |

### Modding Namespace

| File | 0.111 | 0.113 | Status |
|---|---|---|---|
| `Mod.cs`/`ModManifest.cs`/`ModSettings.cs`/`ModManager.cs`/`ModHelper.cs`/`ModDependency.cs`/`ModLoadState.cs`/`ModManagerState.cs`/`ModSource.cs`/`CombatHookSubscriptionDelegate.cs`/`RunHookSubscriptionDelegate.cs`/`IModManagerFileIo.cs`/`ModInitializerAttribute.cs`/`SettingsSaveMod.cs` | original signatures | identical | ✅ only decompiler formatting diffs; `OnModDetected`/`OnMetricsUpload` events still present |

### AutoSlay (auto-testing, 🔴 major refactor)

| Area | 0.111 | 0.113 | Notes |
|---|---|---|---|
| `Launchers/` | — | `IRunLauncher`/`StandardRunLauncher`/`BlitzRunLauncher`/`DreadRunLauncher`/`ModeScreen`/`RunLaunchers` | 🟢 |
| `Navigation/` | — | `IRoomNavigator`/`MapNavigator`/`BlitzNavigator`/`RunPosition`/`RoomNavigators` | 🟢 |
| `Scenarios/` | — | `ScenarioScript`/`ScenarioRunner`/`ScenarioConditions`/`ScenarioStatement`/`ScenarioOutcome`/`ScenarioExitCode`/`ScenarioLog`/`ScenarioWaitCondition`/`ScenarioParseResult`/`ScenarioDirectives`/`ScenarioConditionDescriptor` | 🟢 scripted scenarios |
| other | `AutoSlayTimeoutException` | `DriverTimeoutException` + `AutoSlayMode`/`AutoSlayModes`/`AutoSlayUnlocks`/`ActEntryCheck`/`ByrdEvolutionScreenHandler` | 🔴 renamed + 🟢 |
| `AutoSlayer.cs` | `Start(string seed, string? logFile = null)` + `static Watchdog? CurrentWatchdog` | `Start(string seed, string? mode, string? logFile = null)` + `Watchdog.Current` | 🔴 |
| `Helpers/Watchdog.cs` | `Watchdog()` | `Watchdog(Action<string>, Action<string>, TimeSpan?, TimeSpan?, Func<DateTime>?)` + `WatchdogScope`/`Use`/`Current` | 🔴 |

### UI Nodes

| Area | 0.111 | 0.113 | Notes |
|---|---|---|---|
| all `N*` classes | non-partial + handwritten signals | `partial` + source-generated signals | 🔵 equivalent; handwritten `EmitSignal*`/`SignalName` references break |
| `Nodes/TopBar/` | single `NTopBar` class | `NTopBarButton`/`NTopBarDeckButton`/`NTopBarGold`/`NTopBarHp`/`NTopBarMapButton`/`NTopBarPauseButton`/`NTopBarPortrait`/`NTopBarPortraitTip`/`NTopBarBossIcon`/`NTopBarFloorIcon`/`NTopBarRoomIcon`/`NTopBarModifier`/`NRunTimer` + 3 IconConfig | 🔴 split |
| `Nodes/Combat/` | `NCreature.SetCreatureIsInteractable` | `SetIsInteractable(on, changeVisibilityImmediately)` + `NFoolArrowUi`/`NFoolCombatUi`/`NFoolCombatSymbol` | 🔴 + 🟢 |
| `Nodes/Rooms/` | `NMerchantRoom` | `NStandardMerchantRoom` + `NBlitzMerchantRoom` | 🔴 split |
| `Nodes/Screens/` | — | `NBlitzScreen`/`NDreadScreen`/`NUnderConstruction`/`NSaveAndQuitButton`/`NSubmenuPortrait`/`NCustomGameModeDropdown`/`NLeaderboardDayArrow` | 🟢 |
| `Nodes/Screens/CardLibrary/` | `SortingOrders.cs` | `NCardLibraryGrid.SortingOrders.cs` | 🔴 moved |
| `Bindings/MegaSpine/MegaSlotNode.cs` | `(Node3D)` | `(MegaSlot)` + `SlotName`/`Slot`/`AttachmentName` | 🔴; new type `MegaSlot` |
| `Nodes/GodotExtensions/` | — | `OwnedTween`/`OwnerFreeingTween`/`TweenOutcome`/`TweenWait` | 🟢 |
| `Nodes/CommonUi/NInputManager.cs` | — | `DebugSkipRestSite`/`DebugProceedFromRewards`/`IsKbOnlyDirectionalKey` | 🟢 |
| `Nodes/CommonUi/NErrorPopup.cs` | `NErrorPopup` | + `RunSaveErrorContent` record struct + `CreateForRunSave`/`GetRunSaveErrorContent` | 🟢 |
| `Nodes/GodotExtensions/NMegaTextEdit.cs` | `class NMegaTextEdit : TextEdit` | `class NMegaTextEdit` holding a `TextEdit` prop | 🔴 inheritors must change |
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
| `Nodes/Screens/MainMenu/` | — | `static AssetPaths` (`NCompendiumSubmenu`/`NSingleplayerSubmenu`) | 🟢 |
| `Nodes/Screens/FeedbackScreen/NSendFeedbackScreen.cs` | — | `static GetUploadedScreenshotSize`/`SendFeedback` | 🟢 |
| `Nodes/Audio/NRunMusicController.cs` | — | `UpdateTrack(RoomType)` | 🟢 |
| `Nodes/Vfx/` | — | `NCardFlyVfx.Create`/`NFireSmokePuffVfx.Create`/`NCardSmithVfx()` | 🟢 |
| `Events/Custom/CrystalSphereEvent/` | — | `CrystalSphereMinigame.Owner` | 🟢 |
| `CardSelection/CardSelectorPrefs.cs` | — | `static bool AbsorbSelectionPrompt` | 🟢 |
| `TestSupport/TestRngInjector.cs` | `SetRelicOverride<T>` | `AddRelicOverride<T>` | 🔴 renamed |
| `addons/sentry/` | `Nodes/SentryBootstrap.cs`/`Nodes/SentryAutoInit.cs` | `addons/sentry/` | 🔵 moved |
| `addons/mega_text/` | `MegaCrit.Sts2.addons.mega_text/MegaLabel`/`MegaRichTextLabel`/`ThemeConstants` | `addons/mega_text/` (same namespace) | 🔵 moved |

### Enum Value Changes (real changes)

| Enum | 0.111 | 0.113 | Notes |
|---|---|---|---|
| `Runs/GameMode` | `None,Standard,Daily,Custom` | `None,Standard,Daily,Dread,Blitz` | 🔴 `-Custom`/`+Dread`/`+Blitz`; custom→`IsCustomGame` |
| `Hooks/HpLossHookPhase` | `BeforeOsty=1,AfterOsty=2,All=3` | `BeforeWuppy=1,BeforeOsty=2,AfterOsty=4,All=6` | 🔴 all bit values shifted + 🟢 |
| `ValueProps/ValueProp` | … | `+FromArrow = 0x20` | 🟢 |
| `Entities/Cards/CardTag` | … | `+Wah`/`Cho`/`Ki`/`Shoot` | 🟢 |
| `Entities/Characters/CharacterGender` | `Male,Female,NonBinary,Unspecified` | `+Tree` | 🟢 |
| `Entities/Multiplayer/NetError` | … | `+DreadNotUnlocked=110`/`BlitzNotUnlocked=111` | 🟢 |
| `Entities/Rngs/PlayerRngType` | … | `+NonCombatGeneration` | 🟢 |
| `Rewards/RewardType` | … | `+UpgradeCard` | 🟢 |
| `Nodes/Vfx/VfxColor` | … | `+Fool` | 🟢 |
| `Runs/CardRarityOddsType` | … | `+Blitz`/`BlitzNeow` | 🟢 |
| `HoverTips/StaticHoverTip` | … | `+WahMelody`/`ChoMelody`/`KiMelody`/`Tarot` | 🟢 |

### Vanilla Model Behavior Changes (relevant if your mod hooks these classes)

| File | 0.111 | 0.113 | Notes |
|---|---|---|---|
| `Models/Relics/Byrdpip.cs` | — | `SwoopsPlayed`/`ShowCounter`/`DisplayAmount`/`AfterCardPlayed`/`TryModifyRestSiteOptions` | 🟢 evolution counter + rest options |
| `Models/Relics/PaelsEye.cs` | `ShouldTakeExtraTurn` | `ShouldTakeExtraTurnEarly` | 🔴 earlier check |
| `Models/Relics/ScrollBoxes.cs` | `GenerateRandomBundles(count)` | `(Rng rng, count)` | 🔴 param |
| `Models/Relics/` (BookOfFiveRings/FrozenEgg/MoltenEgg/LuckyFysh/JuzuBracelet/Girya/Shovel/WhiteBeastStatue/PotionBelt/LordsParasol/BowlerHat/MealTicket/MassiveScroll/Planisphere) | old impl | impl updated | 🔵 hook signatures unchanged |
| `Models/Powers/JugglingPower.cs` | `BeforeCardPlayed` | `AfterCardPlayed` + public `cardToClone` field | 🔴 trigger point moved |
| `Models/Powers/PhantomBladesPower.cs` | `AfterCardEnteredCombat` | `TryModifyKeywordsInCombat` | 🔴 |
| `Models/Powers/InterceptPower.cs` | — | `IsCovering`/`RemoveCoveredCreature`/`AfterRemoved` | 🟢 |
| `Models/Powers/` (Covered/Reattach/Dampen/Constrict/Adaptable/Infested/Ravenous/PaleBlueDot/Tank/SicEm/Hex/Shrink/PossessSpeed/Illusion/DrawCardsNextTurn) | old `AfterDeath` sig | new `AfterDeath` sig + tweaks | 🔴 signature adaptation |
| `Models/Cards/` (Melancholy/SovereignBlade/ExpectAFight/SpoilsMap/ForgottenRitual/HandOfGreed/Royalties/Debt/Expertise/MementoMori) | old impl | hook-point tweaks (`AfterThisWasTransformedIntoInternal`/`ShouldGlowGoldInternal`/Blitz bans) | 🔵 |
| `Models/Monsters/KinFollower.cs` | `StartsWithDance` | `Index` | 🔴 ctor param |
| `Models/Monsters/` (Byrdpip/TheInsatiable/Queen/Aeonglass/PaelsLegion/LagavulinMatriarch/TestSubject/TwigSlimeS) | old impl | impl updated | 🔵 |
| `Models/Encounters/*Boss.cs` | — | `GetDominion`/`ScenePath` wired in | 🟢 Dread empowerment |
| `Models/Enchantments/Sown.cs`/`Swift.cs` | old members | members adjusted | 🔵 |
| `Models/Events/*` (Neow/DoorsOfLightAndDark/Nonupeipe/Tanx/TheArchitect/WelcomeToWongos/Orobas/Darv/Pael/Reflections/Tezcatara/Vakuu) | — | `FoolPronounGuess`/`OnRoomExit`/`ConfigureBackgroundScene` wired in | 🟢 |
| `Models/Characters/*` (Ironclad/Defect/Silent/Regent/Necrobinder/Fool) | — | `DreadBgBrightness`/`DreadBgContrast`/`DreadNameColor` overrides | 🟢 |

### Removed Types/Files

| File (0.111) | Destination (0.113) |
|---|---|
| `Runs/GameModeExtension.cs` | → `Helpers/GameModeHelper.cs` |
| `Models/Singleton/SingletonModel.cs` + `Singleton/MultiplayerScalingModel.cs` | → `Models/RunModel.cs`, `Models/MultiplayerScalingModel.cs` |
| `Nodes/Screens/CardSelection/ICardSelector.cs` | → `ICardSelectionScreen.cs` |
| `Models/Powers/AmbergrisPower.cs` | deleted |
| `AutoSlay/AutoSlayTimeoutException.cs` | → `DriverTimeoutException.cs` |
| `Multiplayer/Messages/Game/MerchantCardRemovalMessage.cs` | deleted (handled by MerchantSynchronizer) |
| `Nodes/Screens/Timeline/NEpochCard.cs`, `NUnlockEpochScreen.cs` | Timeline rework |
| `Nodes/Screens/CardLibrary/SortingOrders.cs` | → `NCardLibraryGrid.SortingOrders.cs` |
| `Nodes/SentryBootstrap.cs` / `SentryAutoInit.cs` | → `addons/sentry/` |
| `MegaCrit.Sts2.addons.mega_text` (`MegaLabel`/`MegaRichTextLabel`/`ThemeConstants`) | → `addons/mega_text/` (same namespace) |

### Per-Mod-Type Checklist

| Mod type | Required changes |
|---|---|
| Cards/relics/powers | `AfterDeath` gains `source`; relic `IsAllowed`→`IsAllowedInternal`; monster `IsHealthBarVisible`→`IsInteractable`; card `AfterTransformed*` renamed; `IsAllowedInBlitz`/`IsAllowedInRun`/`IsAllowedInShops` |
| Characters | 4 Pronoun props removed → `AddDetailsTo(str, pronounGuess)`; `ShortTitle`/`BaseArrowSlotCount`/`DreadBg*`/`virtual DeathSfx` |
| Events | `RelicOption` loses `customDonePage`; `AllowedOptions`/`GetOptionsFromThreePools`/`OnRoomExit`/`FoolPronounGuess`/`ConfigureBackgroundScene` |
| Boss/encounter | `GetDominion`, `ScenePath`, monster `IsInteractable` |
| Merchant | `MerchantEntry` fully reworked (`OnTryPurchaseInternal`, inventory-free ctor, `Id`+`TryBeginPurchase`) |
| Modes/ascension | `GameMode.Custom` deleted → `IsCustomGame`; `CreateForNewRun` gains `isCustom`; Ascension* signatures |
| Map | `GenerateRooms(RunState)`, `ActMap` protected connection methods |
| Hook subscriptions | `AfterDeath`/`AfterTakingExtraTurn`/`ShouldTakeExtraTurn`/`ModifyUnblockedDamageTarget` |
| Saves/history | `SerializableRun` V21 + `IsCustomGame`; `OnEnded`/`UpdateProgressWithRunData` → `PostRunProgressUpdateResult` |
| Card-select UI | `CardSelectCmd` static stack → `RunManager.CardSelectorStack`; `ICardSelector`→`ICardSelectionScreen` |
| Auto-testing | AutoSlay refactor (Launchers/Navigation/Scenarios) |

## 0.110 to 0.111

### CardModel — Card Play Flow Rework

| Type/Member | 0.110 | 0.111 |
| --- | --- | --- |
| New `GeneratePlayCount` | - | `protected Task<int> GeneratePlayCount(ICombatState, Creature?)` |
| New `MoveToResultPileWithoutPlaying` | - | `public Task MoveToResultPileWithoutPlaying(PlayerChoiceContext)` |

### CardCmd

| Type/Member | 0.110 | 0.111 |
| --- | --- | --- |
| Return type changed `Exhaust` | `Task Exhaust(PlayerChoiceContext, CardModel, bool causedByEthereal = false, bool skipVisuals = false)` | `Task<CardPileAddResult?> Exhaust(...)` |

### Turn-End Cards (behavior)

Cards with turn-end effects (such as Ethereal) now fly into the play pile in an interleaved fashion at turn end and are resolved together, instead of being processed linearly one by one. New `StuckCombatException` added.

### CharacterModel — Character Animation Rework

| Type/Member | 0.110 | 0.111 |
| --- | --- | --- |
| Param added `GenerateAnimator` | `virtual CreatureAnimator GenerateAnimator(MegaSprite controller)` | `virtual CreatureAnimator GenerateAnimator(MegaSprite controller, Creature creature)` |

New:

```csharp
protected virtual List<(AnimState, string)> AnimationStates { get; }   // declare standard animations (trigger name → state)
protected Func<Creature, bool> IsLowHealth;                            // switch to low-health idle animation at HP ≤ 25%
```

`Defect` / `Ironclad` / `Necrobinder` / `Silent` now override `AnimationStates`; `Regent` additionally removed `GetSovereignBladeAnimIfApplicable` / `GetSovereignBladeDelayIfApplicable`.

> **Migration note:** custom characters overriding `GenerateAnimator` need the new `Creature` parameter, or should declare animations via `AnimationStates` instead.

### AnimState

| Type/Member | 0.110 | 0.111 |
| --- | --- | --- |
| New `AddNextState` | - | `void AddNextState(AnimState state)` / `void AddNextState(AnimState state, Func<bool>? condition)` |
| New `GetNextState` | - | `AnimState? GetNextState()` |
| New `RemoveBranch` | - | `void RemoveBranch(string trigger, string stateId)` |
| New constant | - | `lowHealthIdleAnim = "low_health_loop"` |

### Multiplayer — Handshake System

New connection handshake subsystem: `HandshakeManager` / `HandshakeResult` / `HandshakeStatus` / `IHandshakeHandler`. Version and mod compatibility are validated early during connection.

#### PeerVersionInfo

| Type/Member | 0.110 | 0.111 |
| --- | --- | --- |
| Interface removed | `struct PeerVersionInfo : IPacketSerializable` | `struct PeerVersionInfo` |
| Return type changed `Deserialize` | `void Deserialize(PacketReader)` | `bool TryDeserialize(PacketReader)` |
| New `IsModded` | - | `bool IsModded()` |

#### Lobby Players

| Type/Member | 0.110 | 0.111 |
| --- | --- | --- |
| `RunLobbyPlayer` / `LoadRunLobbyPlayer` / `StartRunLobbyPlayer` | `PeerVersionInfo versionInfo` | `bool isModded` |
| `NetClientData` new | - | `PeerVersionInfo versionInfo` |

#### Lobby Messages

`ClientLobbyJoinRequestMessage` / `ClientLoadJoinRequestMessage` / `ClientRejoinRequestMessage` / `InitialGameInfoMessage` removed the `versionInfo` field; `ClientConnectionFailedMessage` type deleted; `INetMessageSubtypes` registry 53 → 52.

#### Network Service Interfaces

| Type/Member | 0.110 | 0.111 |
| --- | --- | --- |
| `INetGameService` new | - | `PeerVersionInfo LocalVersion { get; }` |
| `INetClientGameService` new | - | `event Action<NetErrorInfo>? ConnectionFailed` |
| `INetHostGameService` removed | `IReadOnlyList<NetClientData> ConnectedPeers { get; }` | removed |
| `INetHostGameService` new | - | `event Action<ulong, NetErrorInfo>? ClientConnectionFailed` / `PeerVersionInfo? GetVersionInfoForPeer(ulong)` |

#### Constructors

| Type/Member | 0.110 | 0.111 |
| --- | --- | --- |
| `NetClientGameService` ctor | `NetClientGameService()` | `NetClientGameService(PeerVersionInfo versionInfo)` |
| `NetHostGameService` ctor | `NetHostGameService()` | `NetHostGameService(PeerVersionInfo versionInfo)` |
| `NetMessageBus` ctor | `NetMessageBus()` | `NetMessageBus(PacketReader reader, PacketWriter writer)` |

#### NetError (fully renumbered)

| Value | 0.110 | 0.111 |
| --- | --- | --- |
| `LobbyFull` / `RunInProgress` / `NotInSaveGame` / `VersionMismatch` / `JoinBlockedByUser` / `StateDivergence` / `HandshakeTimeout` / `ModMismatch` | 7~14 | **100~107** |
| `NoInternet` / `Timeout` / `InternalError` / `UnknownNetworkError` / `RateLimited` / `TryAgainLater` / `FailedToHost` / `SecureConnectionFailed` | 15~22 | **200~207** |
| `InvalidHandshake` / `LobbyJoinTimeout` | - | new = 108 / 109 |

> **Migration note:** code hardcoding `NetError` numeric values must be updated across the board.

#### Other

| Type/Member | 0.110 | 0.111 |
| --- | --- | --- |
| `LoadRunLobby` / `StartRunLobby` event | `event Action<ClientConnectionFailedMessage, ulong>? PlayerFailedToConnect` | `event Action<ulong, NetErrorInfo>? PlayerFailedToConnect` |
| `ClientConnectionFailedException` | removed `rawReason` field and `(string, ConnectionFailureReason, ConnectionFailureExtraInfo?)` ctor |
| `ConnectionFailureReason` new | - | `HandshakeTimeout = 6` |
| `SteamUtil` removed | `handshakeMagicBytes` | removed (moved to `HandshakeManager.magicBytes`) |
| `SteamDisconnectionReason` | `AppInternalError = 1017` | `AppInternalError = 1202` |

### IModManagerFileIo

| Type/Member | 0.110 | 0.111 |
| --- | --- | --- |
| New `MakeDirRecursive` | - | `void MakeDirRecursive(string path)` |
| New `CopyFile` | - | `Error CopyFile(string sourcePath, string destinationPath)` |

> **Migration note:** custom `IModManagerFileIo` implementations must add both methods.

### ModManager

| Type/Member | 0.110 | 0.111 |
| --- | --- | --- |
| Param added `CopyUnmoddedSaveFilesIfNeeded` | `()` | `(IModManagerFileIo fileIo)` |
| Param added `Copy` | `(string baseDir, string sourceFile, string targetFile)` | `(IModManagerFileIo fileIo, ...)` |

### PlatformUtil

| Type/Member | 0.110 | 0.111 |
| --- | --- | --- |
| Return type changed `OpenInviteDialog` | `void OpenInviteDialog(INetGameService)` | `bool TryOpenInviteDialog(INetGameService)` |

### Input System

`MegaInput.confirm` default key Enter → E (same as `endTurn`); rebinding keeps `confirm` / `endTurn` in sync automatically; new `SettingsSaveV7ToV8` migration updates old save keybinds.

### Other

| Type/Member | 0.110 | 0.111 |
| --- | --- | --- |
| `SaveManager` / `PrefsSaveManager` new | - | `IsPrefsLoaded` / `IsLoaded` |
| VFX class namespace migration | global namespace | `NOrbVfx` etc. → `MegaCrit.Sts2.Core.Nodes.Orbs` / `Nodes.Vfx.Utilities` / `Nodes.Debug` |

---

## 0.109 to 0.110

### CombatId (new type)

An opaque identifier for a single combat. Prevents delayed operations (card effects, death handling) from a finished combat leaking into the next one.

```csharp
public readonly record struct CombatId(int Value);
```

### CombatManager

| Type/Member | 0.109 | 0.110 |
| --- | --- | --- |
| Return type changed `BeginCardOrPotionEffect` | `void BeginCardOrPotionEffect(Player)` | `CombatId? BeginCardOrPotionEffect(Player)` |
| Added param `EndCardOrPotionEffect` | `Task EndCardOrPotionEffect(Player)` | `Task EndCardOrPotionEffect(CombatId?, Player)` |
| Added param `CheckForEmptyHand` | `Task CheckForEmptyHand(PlayerChoiceContext, Player)` | `Task CheckForEmptyHand(CombatId?, PlayerChoiceContext, Player)` |
| Added param `HandlePlayerDeath` | `Task HandlePlayerDeath(Player)` | `Task HandlePlayerDeath(CombatId?, Player)` |
| Added param `RemoveDeadPlayerCardsFromCombat` | `Task RemoveDeadPlayerCardsFromCombat(Player)` | `Task RemoveDeadPlayerCardsFromCombat(CombatId?, Player)` |
| Removed param `EndPlayerTurnPhaseTwoInternal` | `Task EndPlayerTurnPhaseTwoInternal(CancellationToken?)` | `Task EndPlayerTurnPhaseTwoInternal()` |
| Removed param `SwitchFromPlayerToEnemySide` | `Task SwitchFromPlayerToEnemySide(Func<Task>?)` | `Task SwitchFromPlayerToEnemySide()` |

New field:

```csharp
public CombatId? CurrentCombatId { get; }
```

> **Migration note:** When calling `BeginCardOrPotionEffect`, capture the returned `CombatId?` and pass it back to `EndCardOrPotionEffect` / `CheckForEmptyHand`.

### CardModel / PotionModel

All call sites for `BeginCardOrPotionEffect` / `EndCardOrPotionEffect` / `CheckForEmptyHand` must be adapted for `CombatId?`.

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

| Type/Member | 0.109 | 0.110 |
| --- | --- | --- |
| Renamed `MegaInput.accept` | `accept` | `confirm` |
| Removed `MegaInput.releaseCard` | `releaseCard` | removed |

New:

```csharp
public static readonly StringName endTurn = "ui_end_turn";
```

### BranchingPlayerChoiceContext

| Type/Member | 0.109 | 0.110 |
|---|---|---|
| Added param ctor | `BranchingPlayerChoiceContext(ulong, GameActionType, PlayerChoiceContext)` | `BranchingPlayerChoiceContext(GameAction, ulong, GameActionType, PlayerChoiceContext)` |

### InputType (new enum)

```csharp
public enum InputType
{
    MouseAndKeyboard = 0,
    KeyboardOnlyMode = 1,
    Controller = 2
}
```

### PeerVersionInfo (new type)

Used for multiplayer version validation and mod compatibility checks.

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

### LobbyPlayer Split

| Type/Member | 0.109 | 0.110 |
| --- | --- | --- |
| Split `LobbyPlayer` | Single `LobbyPlayer` class | Split into `RunLobbyPlayer` / `LoadRunLobbyPlayer` / `StartRunLobbyPlayer` |
| Renamed `RunLobby.ConnectedPlayerIds` | `ConnectedPlayerIds` | `PlayerIds` |

### ProgressState

| Type/Member | 0.109 | 0.110 |
|---|---|---|
| Field → computed property `TotalUnlocks` | `public int TotalUnlocks { get; set; }` | `public int TotalUnlocks => EpochModel.AgnosticUnlockOrder.Count(IsEpochObtained);` |

New:

```csharp
public string? GrantNextUnlock();
```

---

## 0.108 to 0.109

### AbstractModel

| Type/Member | 0.108 | 0.109 |
| --- | --- | --- |
| Signature changed `AbstractModel.AfterBlockBroken` | `virtual Task AfterBlockBroken(Creature creature)` | `virtual Task AfterBlockBroken(PlayerChoiceContext choiceContext, Creature target, Creature? breaker)` |
| Renamed + return type changed `ModifyCardPlayResultPileTypeAndPosition` | `virtual (PileType, CardPilePosition) ModifyCardPlayResultPileTypeAndPosition(CardModel, bool, ResourceInfo, PileType, CardPilePosition)` | `virtual CardLocation ModifyCardPlayResultLocation(CardModel, bool, ResourceInfo, CardLocation)` |
| Renamed `AfterModifyingCardPlayResultPileOrPosition` | `virtual Task AfterModifyingCardPlayResultPileOrPosition(CardModel, PileType, CardPilePosition)` | `virtual Task AfterModifyingCardPlayResultLocation(CardModel, CardLocation)` |

### Hook

| Type/Member | 0.108 | 0.109 |
| --- | --- | --- |
| Signature changed `Hook.AfterBlockBroken` | `static Task AfterBlockBroken(ICombatState, Creature)` | `static Task AfterBlockBroken(ICombatState, PlayerChoiceContext, Creature target, Creature? breaker)` |
| Renamed + return type changed `Hook.ModifyCardPlayResultPileTypeAndPosition` | `static (PileType, CardPilePosition) ModifyCardPlayResultPileTypeAndPosition(...)` | `static CardLocation ModifyCardPlayResultLocation(...)` |

### CardLocation (new type)

Replaces the old `(PileType, CardPilePosition)` tuple.

```csharp
public record struct CardLocation(Player player, PileType pileType, CardPilePosition position);
```

### CardModel

| Type/Member | 0.108 | 0.109 |
| --- | --- | --- |
| Renamed + return type changed `GetResultPileTypeAndPositionForCardPlay` | `protected (PileType, CardPilePosition) GetResultPileTypeAndPositionForCardPlay()` | `protected CardLocation GetResultLocationForCardPlay()` |
| Added param `CardModel.CreateDupe` | `CardModel CreateDupe()` | `CardModel CreateDupe(Player newOwner)` |

### CreatureCmd

| Type/Member | 0.108 | 0.109 |
|---|---|---|
| Signature changed `CreatureCmd.LoseBlock` | `static Task LoseBlock(Creature creature, decimal amount)` | `static Task LoseBlock(PlayerChoiceContext choiceContext, Creature target, decimal amount, Creature? remover)` |

### CardPileCmd

| Type/Member | 0.108 | 0.109 |
|---|---|---|
| Removed async `CardPileCmd.Draw` | `static async Task<IEnumerable<CardModel>> Draw(...)` | `static Task<IEnumerable<CardModel>> Draw(...)` |

New:

```csharp
public static Task DrawWithoutBlockingOnOtherPlayers(PlayerChoiceContext choiceContext, decimal count, Player player, bool fromHandDraw = false);
```

### CardCmd

New:

```csharp
public static void ApplySingleTurnRetain(CardModel card);
```

### CardSelectCmd

| Type/Member | 0.108 | 0.109 |
|---|---|---|
| Param made nullable `CardSelectCmd.FromCombatPile` | `(..., Func<CardModel, bool> filter)` | `(..., Func<CardModel, bool>? filter)` |

### CombatManager

| Type/Member | 0.108 | 0.109 |
| --- | --- | --- |
| Return type changed `EndCardOrPotionEffect` | `void EndCardOrPotionEffect(Player)` | `Task EndCardOrPotionEffect(Player)` |
| Added optional param `EndPlayerTurnPhaseTwoInternal` | `Task EndPlayerTurnPhaseTwoInternal()` | `Task EndPlayerTurnPhaseTwoInternal(CancellationToken? combatCt = null)` |

New:

```csharp
public event Action<CombatState>? CombatBegan;
public async Task RemoveDeadPlayerCardsFromCombat(Player player);
```

### AssemblyInfo

New:

```csharp
public static Dictionary<Type, (Mod?, bool)>? MockTypes { get; set; }
public static Mod? ModForType(Type type, out bool isBaseGame);
```

### RunManager

| Type/Member | 0.108 | 0.109 |
| --- | --- | --- |
| Added param `SetUpReplay` | `SetUpReplay(RunState, CombatReplay)` | `SetUpReplay(RunState, CombatReplay, ulong playerIdToLoad)` |
| Visibility changed `FadeIn` | `private Task FadeIn(bool)` | `public Task FadeIn(bool)` |
| Visibility changed `FadeOut` | `private Task FadeOut()` | `public Task FadeOut()` |

### PotionModel

New:

```csharp
public string LargeImagePath;
public Texture2D LargeImage;
```

### RNG System Refactor (`uint` -> `ulong`)

Default RNG seed length expanded from 10 to 12 digits.

#### StringHelper

| Type/Member | 0.108 | 0.109 |
|---|---|---|
| Return type changed `GetDeterministicHashCode` | `int GetDeterministicHashCode(string)` | `ulong GetDeterministicHashCode(string)` |

New (old algorithm kept for compatibility):

```csharp
public static int GetDeterministicHashCodeOld(string str);
```

#### Rng

| Type/Member | 0.108 | 0.109 |
| --- | --- | --- |
| Type changed `Rng.Seed` | `uint Seed` | `ulong Seed` |
| Signature changed `Rng` ctor | `Rng(uint seed = 0u, int counter = 0)` | `Rng(ulong seed = 0uL)` |
| Signature changed `Rng` ctor | `Rng(Player, ModelId, uint mixin = 0u, int counter = 0)` | `Rng(Player, ModelId, ulong mixin = 0uL)` |
| Signature changed `Rng` ctor | `Rng(uint seed, string name)` | `Rng(ulong seed, string name)` |
| Removed `Rng.Counter` | `int Counter { get; private set; }` | removed |
| Removed `Rng.FastForwardCounter` | `void FastForwardCounter(int)` | removed |

New:

```csharp
public Rng(SerializableRng serializable);
public void LoadFromSerializable(SerializableRng serializable);
public SerializableRng ToSerializable();
public ulong NextUnsignedLong();
public ulong NextUnsignedLong(ulong maxExclusive = ulong.MaxValue);
public ulong NextUnsignedLong(ulong minInclusive, ulong maxExclusive);
```

#### EventSynchronizer

| Type/Member | 0.108 | 0.109 |
|---|---|---|
| Param type changed ctor | `EventSynchronizer(..., uint seed)` | `EventSynchronizer(..., ulong seed)` |

#### MegaRandom

New:

```csharp
public MegaRandom(SerializableRng serializable);
public void Reinitialise(SerializableRng serializable);
public void FillSerializableState(SerializableRng rng);
```

#### PlayerRngSet

| Type/Member | 0.108 | 0.109 |
| --- | --- | --- |
| Type changed `PlayerRngSet.Seed` | `uint Seed` | `ulong Seed` |
| Signature changed `PlayerRngSet` ctor | `PlayerRngSet(uint seed)` | `PlayerRngSet(ulong seed)` |
| Visibility changed `PlayerRngSet.GetRng` | `private Rng GetRng(PlayerRngType)` | `public Rng GetRng(PlayerRngType)` |

#### RunRngSet

| Type/Member | 0.108 | 0.109 |
| --- | --- | --- |
| Type changed `RunRngSet.Seed` | `uint Seed` | `ulong Seed` |
| Signature changed `RunRngSet.MockRng` | `MockRng(RunRngType, uint seed)` | `MockRng(RunRngType, ulong seed)` |
| Visibility changed `RunRngSet.GetRng` | `private Rng GetRng(RunRngType)` | `public Rng GetRng(RunRngType)` |

### ModelIdSerializationCache

`SavedPropertiesTypeCache` functionality merged into this class. New:

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

| Type/Member | 0.108 | 0.109 |
| --- | --- | --- |
| Removed `UInt32` | `JsonTypeInfo<uint> UInt32` | removed |
| New `SerializableRng` | - | `JsonTypeInfo<SerializableRng> SerializableRng` |
| Type parameter changed | `Dictionary<PlayerRngType, int>` | `Dictionary<PlayerRngType, SerializableRng>` |
| Type parameter changed | `Dictionary<RunRngType, int>` | `Dictionary<RunRngType, SerializableRng>` |

### PlayerChoiceContext

| Type/Member | 0.108 | 0.109 |
|---|---|---|
| Added param `PlayerChoiceContext.SignalPlayerChoiceBegun` | `abstract Task SignalPlayerChoiceBegun(PlayerChoiceOptions)` | `abstract Task SignalPlayerChoiceBegun(Player chooser, PlayerChoiceOptions)` |

New:

```csharp
public IEnumerable<AbstractModel>? ModelStack { get; }
public abstract ulong? OwnerId { get; }
```

> The signature change to `SignalPlayerChoiceBegun` affects all subclass overrides: `BlockingPlayerChoiceContext`, `GameActionPlayerChoiceContext`, `HookPlayerChoiceContext`, `ThrowingPlayerChoiceContext`.

### HookPlayerChoiceContext

| Type/Member | 0.108 | 0.109 |
|---|---|---|
| Param made nullable ctor | `HookPlayerChoiceContext(AbstractModel, ulong, ICombatState, GameActionType)` | `HookPlayerChoiceContext(AbstractModel, ulong, ICombatState?, GameActionType)` |

New:

```csharp
public static Player? GetOwner(AbstractModel source, ICombatState? combatState);
```

### BranchingPlayerChoiceContext (new type)

Multiplayer branching choice context, inherits `PlayerChoiceContext`.

```csharp
public class BranchingPlayerChoiceContext : PlayerChoiceContext
{
    public BranchingPlayerChoiceContext(ulong localPlayerId, GameActionType gameActionType, PlayerChoiceContext existing);
    public event Action<HookPlayerChoiceContext>? AfterBranched;
    public Task AssignTaskAndWaitForPauseOrCompletion(Task task);
}
```

---

## 0.107 to 0.108

### AbstractModel

| Type/Member | 0.107 | 0.108 |
| --- | --- | --- |
| Added param `AbstractModel.ModifyDamageAdditive` | `(..., CardModel? cardSource)` | `(..., CardModel? cardSource, CardPlay? cardPlay)` |
| Added param `AbstractModel.ModifyDamageMultiplicative` | same | same |
| Added param `AbstractModel.ModifyDamageCap` | `(..., CardModel? cardSource)` | `(..., CardModel? cardSource, CardPlay? cardPlay)` |

New:

```csharp
// on AbstractModel
public virtual Task BeforeCombatRewardOffered(RewardsSet, CombatRoom);
public virtual bool IsMock => false;
```

### CardModel

| Type/Member | 0.107 | 0.108 |
| --- | --- | --- |
| Renamed + return type changed `CardModel.GetResultPileTypeForCardPlay` | `PileType GetResultPileTypeForCardPlay()` | `(PileType, CardPilePosition) GetResultPileTypeAndPositionForCardPlay()` |
| Visibility changed `CardModel.PortraitPngPath` | `private` | `protected virtual` |
| Added param `AttackCommand.FromCard` | `FromCard(CardModel)` | `FromCard(CardModel, CardPlay?)` |
| Added param `AttackCommand.FromOsty` | `FromOsty(Creature, CardModel)` | `FromOsty(Creature, CardModel, CardPlay?)` |
| Param type changed `AttackCommand.CreateContextAsync` | `(..., PlayerChoiceContext, CardModel)` | `(..., PlayerChoiceContext, CardPlay)` |
| Param type changed `AttackContext.CreateAsync` | `(..., PlayerChoiceContext, CardModel)` | `(..., PlayerChoiceContext, CardPlay)` |

New:

```csharp
public CardModel CreateCloneForPlayer(Player);
public void GiveToAnotherPlayer(Player);
// AttackCommand
public CardPlay? CardPlay { get; }
```

### OrbModel

| Type/Member | 0.107 | 0.108 |
| --- | --- | --- |
| Renamed `OrbModel.Triggered` event | `event Action? Triggered` | `event Action? PassiveActivated` |
| Renamed + split `OrbModel.Trigger()` | `void Trigger()` | `void ActivateEvoke(Creature[])` + `Task TriggerPassive(PlayerChoiceContext, Creature?)` |

New event `event Action<Creature[]>? EvokeActivated`.

### EventModel / EventCombatSynchronizer

| Type/Member | 0.107 | 0.108 |
| --- | --- | --- |
| Added param `EventModel.BeginEvent` | `BeginEvent(Player, bool)` | `BeginEvent(Player, EventCombatSynchronizer?, bool)` |
| Removed `EventModel.GenerateInternalCombatState` | `void GenerateInternalCombatState(IRunState)` | removed |
| Removed `EventModel.ResetInternalCombatState` | `void ResetInternalCombatState()` | removed |
| Removed `EncounterModel.IsDebugEncounter` | `virtual bool IsDebugEncounter => false` | removed |

New class `EventCombatSynchronizer` (`InitializeForEvent`/`ReadyToEnterCombat`/`ResetState`/`MutableEncounterForLayout`/`CombatStateForLayout`), replacing the two removed methods.

### EpochModel

| Type/Member | 0.107 | 0.108 |
| --- | --- | --- |
| Removed `EpochModel.Year` | `string Year` | removed/private |
| Removed `EpochModel.EraName` | `string EraName` | removed/private |
| Removed `EpochModel.ModelId` | `ModelId ModelId` | removed/private |
| Removed `EpochModel.IsArtPlaceholder` | `bool IsArtPlaceholder` | removed |
| Removed `EpochModel.PackedPortraitPath` | `string PackedPortraitPath` | removed/private |

New:

```csharp
public bool HasRealPortrait;
public static IReadOnlyList<Type> AllEpochs;
```

### CardCreationOptions / Save / UserData

`CardCreationOptions` card pool and filter split.

| Type/Member | 0.107 | 0.108 |
| --- | --- | --- |
| Removed `CardCreationOptions.CustomCardPool` | `IEnumerable<CardModel>? CustomCardPool` | removed |
| Removed `CardCreationOptions.ForNonCombatWithDefaultOdds` | static method | removed |
| Removed `CardCreationOptions.WithRngOverride` | `WithRngOverride(Rng)` | removed |
| Signature changed `CardCreationOptions.WithCardPools` | `WithCardPools(IEnumerable<CardPoolModel>, Func<CardModel,bool>?)` | `WithCardPools(IEnumerable<CardPoolModel>)` |

New `CardCreationOptions WithFilter(Func<CardModel,bool>)` replaces the previously inlined filter predicate.

| Type/Member | 0.107 | 0.108 |
| --- | --- | --- |
| Param type changed `SaveManager.IncrementNumReloads` | `(SerializableRun, bool isMultiplayer)` | `(SerializableRun, NetGameType, bool forceInTest=false)` |
| Added overload `UserDataPathProvider.GetProfileDir` | `GetProfileDir(int)` | `GetProfileDir(int, bool? forceModState)` (old overload kept) |

New `UserDataPathProvider.GetAccountDir(bool? forceModState=null)`, `PrefsSave.IsBestiaryActionsPreferred`.

### GameActions / RunManager / ControllerInput

`VoteToMoveToNextActAction` ctor gains a param; controller D-pad keys unified to `Up/Down/Left/Right`.

| Type/Member | 0.107 | 0.108 |
| --- | --- | --- |
| Added param `VoteToMoveToNextActAction` ctor | `VoteToMoveToNextActAction(Player)` | `VoteToMoveToNextActAction(Player, int currentActIndex)` |
| Renamed `Controller.dPadNorth` | `dPadNorth` | `dPadUp` |
| Renamed `Controller.dPadSouth` | `dPadSouth` | `dPadDown` |
| Renamed `Controller.dPadEast` | `dPadEast` | `dPadRight` |
| Renamed `Controller.dPadWest` | `dPadWest` | `dPadLeft` |
| Renamed `Controller.joystickPress` | `joystickPress` | `lStickPress` |

New (partial):

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
// NullCombatState singleton
public static NullCombatState Instance { get; }
// GodotControllerInputStrategy / SteamControllerInputStrategy
public Vector2 GetLeftAnalogStickDirection();
// EventOption copy ctor
public EventOption(EventOption);
// DailyRunUtility
public static DateTimeOffset? AddLeaderboardDays(DateTimeOffset, int);
// RestSiteOption test entry
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

## 0.106 to 0.107

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
| --- | --- |
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

## 0.105 to 0.106

## Variable Changes

* New enum `HpLossHookPhase` for `ModifyHpLost`.
* `ModifyDamageHookType` added `ModifyDamageHookType.Cap` for the `ModifyDamageCap` interface.

## Function Changes

### AbstractModel

Some renames and new parameters.

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

Some `ModifyHpLost` functions were merged. The new `HpLossHookPhase` enum is used instead.

The old `ModifyHpLostBeforeOsty` is now equivalent to passing `HpLossHookPhase.BeforeOsty`. AfterOsty follows the same pattern.

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
* `BeforePlayPhaseStart(PlayerChoiceContext choiceContext, Player player)`
* `BeforePlayPhaseStartLate(PlayerChoiceContext choiceContext, Player player)`

0.104 replaced these with:
* `AfterAutoPrePlayPhaseEnteredEarly(PlayerChoiceContext choiceContext, Player player)`
* `AfterAutoPrePlayPhaseEntered(PlayerChoiceContext choiceContext, Player player)`
* `AfterAutoPrePlayPhaseEnteredLate(PlayerChoiceContext choiceContext, Player player)`
* `AfterAutoPostPlayPhaseEntered(PlayerChoiceContext choiceContext, Player player)`

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
