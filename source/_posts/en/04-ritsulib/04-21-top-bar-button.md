---
title: Top Bar Buttons
date: 2026-05-16 23:27:19
permalink: en/docs/04-ritsulib/04-21-top-bar-button/
author: alkaid616
categories:
- Basics
---
> The examples below assume `ModTypeDiscoveryHub.RegisterModAssembly(...)` has already been called in `Entry.Init()`, otherwise auto-registration will not take effect.

`RitsuLib` provides custom top bar button registration.

## Usage

Implement the `IModTopBarButtonHandler` interface on the class that manages your top bar button (a new class, a singleton, etc.) and decorate it with `[RegisterOwnedTopBarButton]`:

```csharp
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Screens;
using STS2RitsuLib.TopBar;
using STS2RitsuLib.Ui.Toast;

namespace Test.Scripts;

[RegisterOwnedTopBarButton(
    // ID, generates localization key {ModId}_TOPBARBUTTON_{ID}
    "recipes",
    // Button icon (optional)
    IconPath = "res://Test/images/recipe_icon.png",
    // Order; smaller values appear closer to the vanilla deck button (optional)
    ButtonOrder = 0,
    // Additional pixel offset relative to the auto-layout slot (can specify only one) (optional)
    OffsetX = 0,
    OffsetY = 0)]
public class RecipeButtonHandler : IModTopBarButtonHandler
{
    // Triggered on click (must implement)
    public void OnClick(ModTopBarButtonContext ctx)
    {
        // Can open/toggle screens:
        // ctx.OpenCapstoneScreen(myScreen);
        // ctx.ToggleCapstoneScreen(myScreen);
        // ctx.CloseCapstoneScreen();
    }

    public bool IsVisible(ModTopBarButtonContext ctx)
    {
        // Whether to show the button
        return ctx.Player != null;
    }

    public bool IsOpen(ModTopBarButtonContext ctx)
    {
        // Whether the associated screen is already open. If open, the button will continuously wiggle.
        return ModScreenService.CurrentCapstoneScreen is MyRecipeScreen;
    }

    public int GetCount(ModTopBarButtonContext ctx)
    {
        // Badge number; return -1 to hide
        return -1;
    }
}
```

## Localization

Add text in `{modId}/localization/{lang}/static_hover_tips.json`.

The ID format is `{MODID}_TOPBARBUTTON_{LOCALSTEM}`; for example, this becomes `TEST_TOPBARBUTTON_RECIPES`.

```json
{
    "TEST_TOPBARBUTTON_RECIPES.title": "Recipes",
    "TEST_TOPBARBUTTON_RECIPES.description": "View unlocked recipes."
}
```

## Explicit Registration

If you need dynamic registration during initialization, call `ModTopBarButtonRegistry.For(ModId).RegisterOwned(...)` inside `Entry.Init`:

```csharp
using STS2RitsuLib.TopBar;

ModTopBarButtonRegistry.For(ModId).RegisterOwned("recipes", new ModTopBarButtonSpec
{
    IconPath = "res://Test/images/recipe_icon.png",
    OnClick = ctx => RitsuToastService.ShowInfo("Recipe button clicked"),
    VisibleWhen = ctx => ctx.Player != null,
});
```
