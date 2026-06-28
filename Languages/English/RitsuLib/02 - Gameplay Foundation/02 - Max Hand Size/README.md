## Implementing the Feature

The base library provides an interface for modifying max hand size. Simply implement `IMaxHandSizeModifier`.

Add and implement the interface on the `AbstractModel` class of the entity that modifies max hand size, for example on `PowerModel`:

(For cards: if drawing causes a hand-size-modifying card to enter your hand, the result of that draw action will not change. Please implement this yourself.)

```csharp
[RegisterPower]
public class TestPower : ModPowerTemplate, IMaxHandSizeModifier // Add this interface
{
    // Other members omitted


    // Implement this method, or implement ModifyMaxHandSizeLate. Late executes after this.
    public int ModifyMaxHandSize(Player player, int currentMaxHandSize)
    {
        // Healthy implementation: check if it is the current player
        if (player != Owner.Player)
            return currentMaxHandSize;
        // Max hand size +2
        return currentMaxHandSize + 2;
    }
}
```

If you want to get a player's max hand size, use `RitsuLibFramework.GetMaxHandSize(player)` instead of `10`.

## Notes

* The returned value is the modified max hand size. If you want to set a fixed value, use `ModifyMaxHandSizeLate`. Pay attention to the Hook order (e.g., daily modifiers and singletons trigger last; see `IterateHookListeners` for details).

* It will never be less than 0; a floor value is applied at the end.
