---
title: Release to Beta
date: 2026-03-27 12:27:58
permalink: en/docs/07-migration-99-100/
categories:
- Basics
---
This records some changes that may require you to update your code. Not an exhaustive list.

---

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
