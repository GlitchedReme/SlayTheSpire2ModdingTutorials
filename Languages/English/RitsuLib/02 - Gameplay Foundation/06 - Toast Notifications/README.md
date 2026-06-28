`RitsuLib` provides a toast notification service for displaying non-intrusive messages to the player. The framework attaches the Toast to the game root node after `GameReadyEvent`. It is recommended to call it after the run/UI is ready.

## Usage

```csharp
using MegaCrit.Sts2.Core.Logging;
using MegaCrit.Sts2.Core.Modding;
using STS2RitsuLib;
using STS2RitsuLib.Ui.Toast;

namespace Test.Scripts;

[ModInitializer(nameof(Init))]
public class Entry
{
    public const string ModId = "Test";
    public static readonly Logger Logger = RitsuLibFramework.CreateLogger(ModId);

    public static void Init()
    {
        RitsuLibFramework.SubscribeLifecycle<GameReadyEvent>(_ =>
        {
            // Display a Toast message.
            // ShowInfo: normal tip; parameters are body, title (optional), click action (optional)
            RitsuToastService.ShowInfo("Mod loaded");

            // ShowWarning: warning; changed title
            RitsuToastService.ShowWarning("HP is low", "Warning");

            // ShowError: error; includes a click callback
            RitsuToastService.ShowError(
                "Save failed.",
                onClick: () => Logger.Info("User clicked the Toast"));
        });
    }
}
```

When you need full control over style and animation, construct a `RitsuToastRequest` and pass it to `Show`:

```csharp
using Godot;
using STS2RitsuLib.Ui.Toast;

RitsuToastService.Show(new RitsuToastRequest(
    // Body, required
    body: "New recipe unlocked!",
    // Title, nullable
    title: "Recipes",
    // Left-side image, nullable
    image: myTexture,
    // Level.
    // Info: normal tip
    // Warning: warning
    // Error: error
    level: RitsuToastLevel.Info,
    // Display duration in seconds; null uses the default 3.5 seconds
    durationSeconds: 5.0,
    // Triggered when the body is clicked, nullable
    onClick: () => Logger.Info("Open recipe screen"),
    // Animation.
    // Fade: fade in/out only
    // FadeSlide: fade in/out with slide, global default
    // FadeScale: fade in/out with scale
    animationOverride: RitsuToastAnimationPreset.FadeScale));
```
