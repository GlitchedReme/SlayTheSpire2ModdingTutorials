Node Attachments are suitable for attaching your own child node to a vanilla Godot node — for example, adding a small panel to the combat UI, adding a debug layer next to a health bar, or stuffing an auxiliary `Control` into an existing container.

It is analogous to "patching" an existing scene.

## Registration Method 1: Explicit Registration

### Creating Nodes from Code

Register in `Entry.Init()`. The example below adds a `TestCombatUiBadge` whenever an `NCombatUi` becomes ready.

```csharp
using Godot;
using MegaCrit.Sts2.Core.Modding;
using MegaCrit.Sts2.Core.Nodes.Combat;
using STS2RitsuLib.Scaffolding.Godot.NodeAttachments;

namespace Test.Scripts;

[ModInitializer(nameof(Init))]
public static class Entry
{
    public const string ModId = "test";

    public static void Init()
    {
        ModNodeAttachmentRegistry.For(ModId)
            .RegisterReadyChild<NCombatUi, TestCombatUiBadge>(
                "combat_ui_badge",
                static _ => new TestCombatUiBadge(),
                static (parent, node) => node.Bind(parent),
                new NodeAttachmentOptions
                {
                    Name = "TestCombatUiBadge",
                    Order = 10,
                    DuplicatePolicy = NodeAttachmentDuplicatePolicy.ReuseExistingByName,
                    SetupTiming = NodeAttachmentSetupTiming.AfterAdd,
                });
    }
}

public sealed partial class TestCombatUiBadge : Control
{
    private Label _label = null!;

    public override void _Ready()
    {
        _label = new Label
        {
            Text = "Test",
            Position = new Vector2(36f, 36f),
        };
        AddChild(_label);
    }

    public void Bind(NCombatUi combatUi)
    {
        Position = Vector2.Zero;
        Size = combatUi.Size;
    }
}
```

### Creating Nodes from Scenes

If the UI is already written as a `.tscn`, you can instantiate directly from the scene:

```csharp
ModNodeAttachmentRegistry.For(Entry.ModId)
    .RegisterReadyChildFromScene<NCombatUi, Control>(
        "combat_status_panel",
        "res://Test/scenes/ui/combat_status_panel.tscn",
        static (parent, panel) =>
        {
            panel.Position = new Vector2(24f, 120f);
            panel.Visible = parent.IsInsideTree();
        },
        new NodeAttachmentOptions
        {
            Name = "TestCombatStatusPanel",
            DuplicatePolicy = NodeAttachmentDuplicatePolicy.ThrowIfExistingByName,
        });
```

`RegisterReadyChildFromScene` requires that the scene root node itself is already of type `TNode` (here `Control`).

If the scene root node needs to go through RitsuLib's scene conversion:

```csharp
ModNodeAttachmentRegistry.For(Entry.ModId)
    .RegisterReadyChildFromConvertedScene<NCombatUi, TestCombatUiPanel>(
        "converted_combat_panel",
        "res://Test/scenes/ui/converted_combat_panel.tscn",
        static (_, panel) => panel.Refresh());
```

`RegisterReadyChildFromConvertedScene<TParent,TNode>`'s `TNode` must have a public parameterless constructor.

## Registration Method 2: Auto-Registration

If the project has already called `ModTypeDiscoveryHub.RegisterModAssembly(...)` during initialization, you can use attribute-based registration. The simplest approach is to place the attribute on the child node class:

```csharp
using Godot;
using MegaCrit.Sts2.Core.Nodes.Combat;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Scaffolding.Godot.NodeAttachments;

namespace Test.Scripts;

[RegisterNodeAttachment(
    typeof(NCombatUi),
    "turn_counter",
    NodeName = "TestTurnCounter",
    DuplicatePolicy = NodeAttachmentDuplicatePolicy.ReuseExistingByName)]
public sealed partial class TestTurnCounter : Label, INodeAttachmentSetup
{
    public void Setup(Node parent, Node node)
    {
        Text = "Turn";
        Position = new Vector2(40f, 84f);
    }
}
```

There are also `[RegisterNodeAttachment]`, `[RegisterNodeAttachmentFromScene]`, and `[RegisterNodeAttachmentFromConvertedScene]` auto-registration attributes.

## Retrieving Attached Nodes

Registration is only responsible for attaching the child node when the parent becomes ready. To retrieve it afterwards:

```csharp
if (ModNodeAttachmentRegistry.For(Entry.ModId)
    .TryGetAttached<NCombatUi, TestCombatUiBadge>(
        combatUi,
        "combat_ui_badge",
        out var badge))
{
    badge.Visible = true;
}
```

You can also use a qualified id:

```csharp
var id = ModNodeAttachmentRegistry.GetQualifiedNodeAttachmentId(
    Entry.ModId,
    "combat_ui_badge");

ModNodeAttachmentRegistry.TryGetAttachedById<NCombatUi, TestCombatUiBadge>(
    combatUi,
    id,
    out var badge);
```

`TryGetAttached` will not create nodes; attachment only happens when the parent node becomes ready.

## NodeAttachmentOptions Parameters

| Option | Purpose |
| - | - |
| `Name` / `NodeName` | Set the name on the direct child node; also used by the duplicate policy to find existing nodes |
| `Order` | Sort order for multiple attachments on the same parent; smaller values execute first |
| `DuplicatePolicy` | How to handle an existing direct child with the same name: reuse, skip, replace, throw, or allow duplicates |
| `AddMode` | Defaults to `AddChildSafely`; for the few nodes that must be immediately added to the tree, use `AddChildDirect` |
| `SetupTiming` | Whether setup executes before or after the node is added to the tree |
| `ChildIndex` | Move to the specified child index after attaching |
| `InsertBeforeName` / `InsertAfterName` | Move to before/after a sibling node with the given name after attaching |
| `UniqueNameInOwner` | Set `UniqueNameInOwner` and make the parent the owner after adding |
| `IncludeDerivedParentTypes` | Whether child classes of the parent type also receive this attachment; default true |

Only one of `ChildIndex`, `InsertBeforeName`, and `InsertAfterName` can be chosen. As long as `DuplicatePolicy` is not `AllowDuplicateName`, `Name` / `NodeName` must be set.
