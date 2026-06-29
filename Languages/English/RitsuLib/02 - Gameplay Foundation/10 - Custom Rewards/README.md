You can use the `ModCustomReward` base class provided by RitsuLib to implement custom rewards.

---

## 1. Register the Reward Type

Every custom reward needs a `RewardType` identifier. `RewardType` is an enum compatible with the vanilla one.

Register in `Entry.Init()` (or in your own management class — just don't forget to register):

```csharp
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Logging;
using MegaCrit.Sts2.Core.Modding;
using MegaCrit.Sts2.Core.Rewards;
using MegaCrit.Sts2.Core.Saves.Runs;
using STS2RitsuLib;
using STS2RitsuLib.Combat.Rewards;

namespace MyMod.Scripts;

[ModInitializer(nameof(Init))]
public static class Entry
{
    public const string ModId = "MyMod";
    public static readonly Logger Logger = RitsuLibFramework.CreateLogger(ModId);

    // Store the assigned RewardType as a static field for later reference
    public static RewardType TokenRewardType;

    public static void Init()
    {
        // Register a reward without any save data: simply new up a fresh instance on load
        TokenRewardType = ModRewardRegistry.For(ModId)
            .RegisterOwned(
                // Reward ID, ultimately generating MYMOD_REWARD_TOKEN
                "token",
                // Factory function, used to reconstruct saved rewards into runtime objects on load
                (save, player, json) => new MyTokenReward(player))
            .RewardType;
    }
}
```
---

## 2. Write the Reward Class

Create a new class inheriting `ModCustomReward`:

```csharp
using System.Threading.Tasks;
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Rewards;
using STS2RitsuLib.Combat.Rewards;

namespace MyMod.Scripts.Rewards;

public class MyTokenReward : ModCustomReward
{
    // Required constructor; passes the owning player to the base Reward class
    public MyTokenReward(Player player) : base(player) { }

    // [Required] Use the RewardType you registered in Init
    public override RewardType ModRewardType => Entry.TokenRewardType;

    // [Optional] Icon resource path. If null, only an empty container is shown
    protected override string? RewardIconPath => "res://MyMod/images/rewards/token.png";

    // [Optional] LocTable file name for the description text (default gameplay_ui)
    // protected override string DescriptionLocTable => "gameplay_ui";


    // [Optional] Description Key; if not specified, the ID assigned at registration is used (here MYMOD_REWARD_TOKEN)
    // protected override string DescriptionLocKey => "MYMOD_REWARD_TOKEN";

    // [Must implement] Mark reward content as seen by the player (e.g. cards or potions).
    public override void MarkContentAsSeen()
    {
    }

    // [Must implement] The actual effect when the player clicks this reward
    protected override async Task<bool> OnSelect()
    {
        // Example: give the player 25 gold
        await PlayerCmd.GainGold(25, Player);

        // true: claim successful, UI removes this option
        // false: claim cancelled (e.g., player cancelled in a confirmation dialog), button remains
        return true;
    }
}
```

### Localization Text

Add to `{modId}/localization/{lang}/gameplay_ui.json`:

```json
{
    "MYMOD_REWARD_TOKEN": "Gain 25 Gold"
}
```

---

## 3. Grant the Reward to the Player

For example, write this in a card effect: (for relics or other contexts, just find `CombatState`, e.g. `Owner.CombatState`)

```csharp
using MegaCrit.Sts2.Core.Rooms;

if (CombatState.RunState.CurrentRoom is CombatRoom combatRoom)
{
    combatRoom.AddExtraReward(player, new MyTokenReward(player));
}
```

If you are adding inside a vanilla relic's `OnGetRewards` (or similar callback), simply:

```csharp
rewards.Add(new MyTokenReward(Owner));
```


---

## Data Persistence (Rewards with Payload)

If your reward contains **dynamically generated state** (e.g., random gold amount, randomly selected card IDs), to ensure that the reward is not regenerated or lost when the player presses ESC at the rewards screen and reloads, you must write this state into the save.

`ModCustomReward` provides a convenient override:

### 1. Define Payload and JSON Context

```csharp
using System.Text.Json.Serialization;

namespace MyMod.Scripts.Rewards;

public readonly record struct TokenPayload(int TokenCount);

[JsonSerializable(typeof(TokenPayload))]
internal sealed partial class MyJsonContext : JsonSerializerContext;
```

### 2. Pass JSON Contract and a Payload-Aware Factory During Registration

```csharp
TokenRewardType = ModRewardRegistry.For(ModId)
    .RegisterOwned<TokenPayload>(
        "token",
        MyJsonContext.Default.TokenPayload,
        // The payload here has already been decoded by RitsuLib; payload is null if old save had no data
        (save, player, payload) => new MyTokenReward(player, payload?.TokenCount ?? 0))
    .RewardType;
```

### 3. Serialize Payload in the Reward Class

```csharp
public class MyTokenReward : ModCustomReward
{
    private readonly int _tokenCount;

    public MyTokenReward(Player player, int count) : base(player)
    {
        _tokenCount = count;
    }

    public override RewardType ModRewardType => Entry.TokenRewardType;

    // Serialize reward-specific state as a JSON string and attach it to the save
    public override string? ToModRewardJson()
    {
        return System.Text.Json.JsonSerializer.Serialize(
            new TokenPayload(_tokenCount),
            MyJsonContext.Default.TokenPayload);
    }

    protected override async Task<bool> OnSelect()
    {
        await PlayerCmd.GainGold(_tokenCount, Player);
        return true;
    }
}
```

> Only JSON-serializable data (`int`, `string`, `record struct` compositions, etc.) should go into the Payload. Do not stuff Godot nodes, images, or other objects in there.

If you are already using the `ToSerializable<TPayload>(payload, jsonTypeInfo)` overload, you can skip manually writing `ToModRewardJson`, but you must return `base.ToSerializable<TPayload>(...)` in your `ToSerializable` override. Choose one approach or the other.

---

## Multiplayer Sync Rules

> *Reward-set selection is synchronized by vanilla, but reward-specific side effects must either be deterministic on every client or explicitly synchronized by the derived reward.*
>
> *（奖励集合中"选了哪个奖励"由原版引擎自动网络同步；但奖励自身造成的副作用必须在所有客户端确定性执行，否则你需要自己显式同步。）*

- For example, when the team claims a reward, if player A clicks `MyTokenReward`, vanilla broadcasts the "claim" event to everyone; each client will execute your `OnSelect()` once.
- However! If your `OnSelect()` contains **random checks** or **resources that only exist locally**, different clients may produce inconsistent results, leading to disconnection or state divergence.

So ensure the logic in your `OnSelect()`:
1. **Is strictly deterministic**: use `RunState.Rng` or other shared random sequences across all clients, or ensure all computation factors are completely equivalent on both sides.
2. **Goes through vanilla sync**: directly dispatch network commands already wrapped by the dev team, such as `PlayerCmd.GainGold`, `PlayerCmd.GainRelic`, etc.
