A singleton (`SingletonModel`) is an `AbstractModel` that exists independently from cards, relics, etc. All `AbstractModel`s have the ability to receive game events.

It can be used for global effects.

For example, the multiplayer mode uses a `SingletonModel` to determine whether monsters gain additional block based on the number of players.

You can use it to implement keyword effects. For instance, if a keyword is "draw a card after playing," you can create a singleton that checks for the keyword after a card is played and then draws a card.

## Code

```csharp
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.Logging;
using MegaCrit.Sts2.Core.Models;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Models;

namespace Test.Scripts;

// Register singleton
[RegisterSingleton]
public class TestSingleton : HookedSingletonModel
{
    // Fill in HookType, options: Combat, Run, or None. Combat relates to combat interfaces, Run relates to global interfaces. See the Hook class definition for specifics.
    public TestSingleton() : base(HookType.Combat)
    {
    }

    // Implement various overrides from AbstractModel yourself.
    // public override Task AfterActEntered()
    // {
    //     Log.Info("AfterActEntered");
    //     return Task.CompletedTask;
    // }

    // public async override Task AfterCardDrawn(PlayerChoiceContext choiceContext, CardModel card, bool fromHandDraw)
    // {
    //     Log.Info($"AfterCardDrawn: {card.Id}");
    // }
}
```

* Then you can override the virtual functions under `AbstractModel` as shown above to listen to game events, with the same interface as relics, potions, etc.

* You can decompile the vanilla `Hook.cs` to see what interfaces are available.
