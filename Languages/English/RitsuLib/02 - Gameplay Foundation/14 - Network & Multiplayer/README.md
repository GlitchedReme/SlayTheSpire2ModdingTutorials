Slay the Spire 2 supports up to 4-player co-op. In multiplayer, the game uses a **host-client** model: the host holds authoritative state, clients send requests, and the host adjudicates before broadcasting results. If your mod needs cross-player communication in co-op (sending notifications to teammates, syncing custom data, executing cross-player effects), you'll need the networking APIs.

This chapter first explains how the vanilla game synchronizes, then introduces RitsuLib's two networking tools, and finally gives selection advice.

> Data persistence related to co-op (lobby staging, run data sync) is covered in the `In-Run Data` chapter. This chapter focuses on real-time communication.

## Vanilla Network Synchronization

### Network Model

The game uses `NetGameType` to represent the current network state:

| Value | Meaning |
| - | - |
| `None` | No network |
| `Singleplayer` | Single player |
| `Host` | Co-op host (created the room) |
| `Client` | Co-op client (joined the room) |
| `Replay` | Replay |

The network entry point is `INetGameService`, obtained via `RunManager.Instance.NetService`. It provides:

```csharp
public interface INetGameService
{
    ulong NetId { get; }                    // Local network ID
    bool IsConnected { get; }
    bool IsGameLoading { get; }
    NetGameType Type { get; }               // Current network type
    event Action<NetErrorInfo>? Disconnected;
    void SendMessage<T>(T message, ulong playerId) where T : INetMessage; // Send to a specific player
    void SendMessage<T>(T message) where T : INetMessage;                 // Broadcast
    void RegisterMessageHandler<T>(MessageHandlerDelegate<T> handler) where T : INetMessage;
    void UnregisterMessageHandler<T>(...) where T : INetMessage;
}
```

### Action Queue Synchronization (ActionQueueSynchronizer)

In multiplayer, all players must see an **identical** game state. If two players play cards at the same time and effects execute in different orders, the two sides will diverge. So the game puts every action into a single unified **action queue** (`ActionQueueSynchronizer`) and executes them in a deterministic order.

The flow:

```
Client                             Host
  │  Play a card                    │
  │── RequestEnqueueActionMessage →│  Received, validated
  │    (INetMessage)               │  Action enqueued
  │←── ActionEnqueuedMessage ───── │  Confirmation sent back
  │   (INetMessage)                │
  │  Execute effect only after     │  Host executes itself
  │  receiving confirmation        │
```

- A client **cannot** execute an action directly; it must first send `RequestEnqueueActionMessage` to the host
- The host checks that it is actually the Host (rejects otherwise), enqueues the action, and sends back `ActionEnqueuedMessage`
- The client executes only after receiving confirmation, keeping both sides in order

Sent messages aren't delivered immediately — they pass through `RunLocationTargetedMessageBuffer` (buffered by scene/location), ensuring delayed actions replay in the correct scene.

## RitsuLib Networking Tool 1: Sidecar (Message Communication)

Sidecar is RitsuLib's typed message channel: you define a message type + serialization, and RitsuLib handles the opcode, registry, and underlying `INetMessage` for you — you only send and receive.

### Define the Message

A message is just a record/class:

```csharp
public record struct MyPingMessage(string Text, int Number);
```

### Define the Descriptor

`RitsuLibSidecarMessageDescriptor<T>` describes a message: module ID + message key + serialize/deserialize delegates.

```csharp
using System.Text.Json;
using STS2RitsuLib.Networking.Sidecar;

private static readonly RitsuLibSidecarMessageDescriptor<MyPingMessage> PingDescriptor = new(
    ModuleId: Entry.ModId,        // Your mod id, part of the opcode
    MessageKey: "my_ping",        // Message key, unique within the mod
    Serialize: static msg => JsonSerializer.SerializeToUtf8Bytes(msg),
    Deserialize: static bytes => JsonSerializer.Deserialize<MyPingMessage>(bytes),
    Delivery: RitsuLibSidecarDeliverySemantics.StableSync); // Default StableSync, can be omitted
```

`ModuleId + MessageKey` generates a stable opcode (`RitsuLibSidecarOpcodes.For`). Different mods using different ModuleIds won't conflict.

### Subscribe and Receive

```csharp
// Returns IDisposable; dispose to unsubscribe
private static IDisposable? _pingSubscription;

// Call this in your initialization function, e.g. Init()
_pingSubscription ??= RitsuLibSidecarTypedMessageRegistry.Subscribe(PingDescriptor, OnPingReceived);

private static void OnPingReceived(RitsuLibSidecarTypedDispatchContext<MyPingMessage> context)
{
    // context.Message      message content
    // context.SenderNetId  sender's network ID
    // context.TransferMode transfer mode
    // context.Channel      channel
    // context.IsHostIngest whether this is a client message received by the host
    Entry.Logger.Info($"[Ping] from {context.SenderNetId}: {context.Message.Text}");
}
```

### Send

```csharp
using MegaCrit.Sts2.Core.Runs;

// Client → Host
RitsuLibSidecarTypedMessageRegistry.SendToHost(RunManager.Instance, PingDescriptor, new("hello", 1));

// Host → specific player
RitsuLibSidecarTypedMessageRegistry.SendToPeer(
    RunManager.Instance.NetService, peerNetId, PingDescriptor, new("hi", 2));

// Host broadcasts to all peers
RitsuLibSidecarTypedMessageRegistry.Broadcast(RunManager.Instance, PingDescriptor, new("all", 3));
```

Each send method has both `INetGameService` and `RunManager` overloads; pick either.

### Delivery Semantics

| Value | Meaning |
| - | - |
| `BestEffort` | Unreliable transport (may drop/reorder frames), better performance |
| `StableSync` | Reliable transport (default), no loss or duplication |

## RitsuLib Networking Tool 2: ManagedNetAction (Action Queue)

Sidecar is an instant message — callback on receipt, **no guarantee** of executing in game action order. If your cross-player effect needs to run in the same order and determinism as other actions (card plays, resolutions) — and be recorded in replays — use ManagedNetAction.

It disguises a custom action as a vanilla `GameAction` and stuffs it into the vanilla action queue: the client requests through the vanilla `RequestEnqueueActionMessage` pipeline, the host adjudicates and enqueues, and all players execute in the same order.

### Define the Descriptor

`RitsuLibManagedNetActionDescriptor<T>` adds an `ActionType` and an execute delegate over Sidecar:

```csharp
using MegaCrit.Sts2.Core.Entities.Multiplayer; // GameActionType
using STS2RitsuLib.Networking.ManagedActions;

private static readonly RitsuLibManagedNetActionDescriptor<MyPingMessage> PingActionDescriptor = new(
    ModuleId: Entry.ModId,
    ActionKey: "ping_action",
    Serialize: static msg => JsonSerializer.SerializeToUtf8Bytes(msg),
    Deserialize: static bytes => JsonSerializer.Deserialize<MyPingMessage>(bytes),
    Execute: ExecutePingActionAsync,
    ActionType: GameActionType.Any);   // Required
```

`ActionType` decides when the action may execute:

| Value | Meaning |
| - | - |
| `Combat` | Executes during combat; cancelled if enqueued when combat ends or outside combat |
| `CombatPlayPhaseOnly` | Only executes during the player's play phase; otherwise deferred to the local player's play phase |
| `NonCombat` | Executes outside combat; if it reaches the front of the queue during combat, it waits until combat ends |
| `Any` | Can execute at any time (default choice) |

### Execute Logic

The execute delegate receives `RitsuLibManagedNetActionContext<T>`, which contains the action's owning player and an available choice context:

```csharp
private static async Task ExecutePingActionAsync(RitsuLibManagedNetActionContext<MyPingMessage> context)
{
    // context.Message               message content
    // context.Player               player who owns the action
    // context.Action               underlying queued action
    // context.PlayerChoiceContext  available choice context (can pass to command APIs)
    Entry.Logger.Info($"[ManagedPing] {context.Player.NetId}: {context.Message.Text}");
    await Task.CompletedTask;
}
```

### Register and Request

```csharp
// Call this in your initialization function, e.g. Init()
RitsuLibManagedNetActions.Register(PingActionDescriptor);

// Request execution: initiated by the client, goes through the vanilla action queue
bool queued = RitsuLibManagedNetActions.Request(
    RunManager.Instance,
    PingActionDescriptor,
    new("hello", 1));
```

> `Request` returning `true` only means the **enqueue request was issued**, not that execution succeeded. Also, the `ownerNetId` parameter (defaults to the local player when omitted) can only be your own ID — you can't request on someone else's behalf.

### Limits

| Item | Value |
| - | - |
| Max payload per action | 64 KB |
| `Request` return semantics | Only indicates enqueue success |
| `ownerNetId` | Only your own ID |

## Selection Guide

| Scenario | Use |
| - | - |
| Check whether in co-op, who you are, player count | Read `INetGameService` properties directly (`Type`/`NetId`), no communication needed |
| Send arbitrary data to teammates/host (notifications, UI, custom config) | **Sidecar** |
| Cross-player effects that must sync through the action queue and be replayable (same type as cards and potions) | **ManagedNetAction** |
