## Implementation

The base library provides an interface for modifying max hand size. Implement `IMaxHandSizeModifier` on the relevant `AbstractModel`.

Add and implement the interface on the class that modifies hand size, e.g. on a `PowerModel`:

(For cards: if drawing causes a hand-size-modifying card to enter the hand, that draw's result won't change. Implement that yourself.)

```csharp
public class TestPower : CustomPowerModel, IMaxHandSizeModifier // Add the interface
{
    // Other content omitted

    // Implement this or ModifyMaxHandSizeLate. Late runs after this one.
    public int ModifyMaxHandSize(Player player, int currentMaxHandSize)
    {
        // Proper implementation: check that it's the current player
        if (player != Owner.Player)
            return currentMaxHandSize;
        // Max hand size + 2
        return currentMaxHandSize + 2;
    }
}
```

To get a player's current max hand size, use `MaxHandSizePatch.GetMaxHandSize(player)` instead of hardcoding `10`.

## Notes

* The returned value is the modified max hand size. If you want to set a fixed value, use `ModifyMaxHandSizeLate`. Be aware of hook ordering (e.g. daily modifiers and singletons trigger last — see `IterateHookListeners`).

* It won't go below 0. There's a floor.
