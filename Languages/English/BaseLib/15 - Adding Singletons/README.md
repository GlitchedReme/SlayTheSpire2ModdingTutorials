A singleton (`SingletonModel`) is an `AbstractModel` independent of cards, relics, etc. All `AbstractModel` instances can receive game events.

Useful for global effects.

For example, multiplayer uses a `SingletonModel` to determine whether monsters gain extra block based on player count.

You can use one for keyword effects. For instance, a keyword that draws a card when played — create a singleton that checks for the keyword after a card is played, then draws.

## Code

```csharp
using BaseLib.Abstracts;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.Logging;
using MegaCrit.Sts2.Core.Models;

namespace Test.Scripts;

public class TestSingleton : CustomSingletonModel
{
    public TestSingleton() : base(true, true)
    {
    }

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

* Override the virtual methods from `AbstractModel` to listen to game events — the same interface as relics, potions, etc.

* Decompile the vanilla `Hook.cs` to see which interfaces are available.
