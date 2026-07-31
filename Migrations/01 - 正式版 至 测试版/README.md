此处记录一些可能会导致你修改代码的更改，并不是所有修改。

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
