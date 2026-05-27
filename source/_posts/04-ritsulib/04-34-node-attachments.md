---
title: 节点附加
date: 2026-05-25 22:48:49
permalink: docs/04-ritsulib/04-34-node-attachments/
author: alkaid616
categories:
- Basics
---
节点附加适合给原版 Godot 节点挂一个自己的子节点，例如给战斗 UI 加一个小面板、给血条旁边加一个调试层，或给某个已有容器塞入辅助 `Control`。

它和自己写 Harmony patch 的区别是：你只声明“哪个父节点 ready 时挂哪个子节点”，RitsuLib 会 patch 对应父类型的 `_Ready`，并负责创建、排序、重复处理和取回已经挂上的节点。

## 显式注册

在 `Entry.Init()` 中注册。下面的例子会在每个 `NCombatUi` ready 时添加一个 `TestCombatUiBadge`。

```csharp
using Godot;
using MegaCrit.Sts2.Core.Nodes.Combat;
using STS2RitsuLib.Scaffolding.Godot.NodeAttachments;

namespace Test.Scripts;

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

`localId` 只需要在当前 Mod 内唯一。RitsuLib 会把它扩展成类似 `TEST_NODEATTACHMENT_COMBAT_UI_BADGE` 的全局 id。

## 从场景创建节点

如果 UI 已经写成 `.tscn`，可以直接从场景实例化：

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

`RegisterReadyChildFromScene` 要求场景根节点本身就是 `TNode`。如果场景根节点需要经过 RitsuLib 的 Godot 脚本转换，使用 converted scene 版本：

```csharp
ModNodeAttachmentRegistry.For(Entry.ModId)
    .RegisterReadyChildFromConvertedScene<NCombatUi, TestCombatUiPanel>(
        "converted_combat_panel",
        "res://Test/scenes/ui/converted_combat_panel.tscn",
        static (_, panel) => panel.Refresh());
```

`RegisterReadyChildFromConvertedScene<TParent,TNode>` 的 `TNode` 需要有公开无参构造函数。

## 自动注册

如果项目已经在初始化时调用了 `ModTypeDiscoveryHub.RegisterModAssembly(...)`，可以用属性注册。最简单的写法是把属性标在子节点类上：

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

属性上的名字叫 `NodeName`，对应显式注册里的 `NodeAttachmentOptions.Name`。

当子节点不能用无参构造函数创建时，把属性标在工厂类上，并设置 `NodeType`：

```csharp
[RegisterNodeAttachment(
    typeof(NCombatUi),
    "factory_badge",
    NodeType = typeof(TestCombatUiBadge),
    NodeName = "TestFactoryBadge")]
public sealed class TestCombatUiBadgeFactory : INodeAttachmentFactory
{
    public Node CreateNode(Node parent)
    {
        return new TestCombatUiBadge();
    }
}
```

场景也有对应属性：

```csharp
[RegisterNodeAttachmentFromScene(
    typeof(NCombatUi),
    "scene_badge",
    "res://Test/scenes/ui/combat_status_panel.tscn",
    NodeType = typeof(Control),
    NodeName = "TestSceneBadge")]
public sealed class TestSceneBadgeRegistration
{
}
```

如果用 converted scene，把属性换成 `RegisterNodeAttachmentFromConvertedScene`。

## 取回附加节点

注册只负责在父节点 ready 时挂子节点。之后如果别的系统要刷新它，可以用同一个 registry 取回：

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

也可以用全局 id：

```csharp
var id = ModNodeAttachmentRegistry.GetQualifiedNodeAttachmentId(
    Entry.ModId,
    "combat_ui_badge");

ModNodeAttachmentRegistry.TryGetAttachedById<NCombatUi, TestCombatUiBadge>(
    combatUi,
    id,
    out var badge);
```

`TryGetAttached` 不会创建节点；只有父节点 ready 时才会真正挂载。

## 常用选项

| 选项 | 用途 |
| - | - |
| `Name` / `NodeName` | 给直接子节点设置名称，也是重复策略查找已有节点的依据 |
| `Order` | 同一个父节点上多个 attachment 的排序，数值小的先执行 |
| `DuplicatePolicy` | 处理已有同名直接子节点：复用、跳过、替换、报错或允许重名 |
| `AddMode` | 默认用 `AddChildSafely`；少数必须立刻加入树的节点可用 `AddChildDirect` |
| `SetupTiming` | setup 在加入树前还是加入树后执行 |
| `ChildIndex` | 挂载后移动到指定子节点下标 |
| `InsertBeforeName` / `InsertAfterName` | 挂载后移动到某个同级节点前后 |
| `UniqueNameInOwner` | 设置 `UniqueNameInOwner`，并在加入后把父节点设为 owner |
| `IncludeDerivedParentTypes` | 父类型的子类是否也应用该 attachment，默认 true |

`ChildIndex`、`InsertBeforeName`、`InsertAfterName` 三者只能选一个。只要 `DuplicatePolicy` 不是 `AllowDuplicateName`，就必须设置 `Name` / `NodeName`。

## 适合和不适合

适合：

* 给现有 UI 加一个额外显示层。
* 把 `.tscn` 面板挂到原版 screen 或 combat UI 下面。
* 在多个同类原版节点上统一追加一个辅助节点。

不适合：

* 修改原版节点自己的逻辑分支。那仍然应该用补丁系统。
* 需要在 `_Ready` 之前影响父节点初始化。节点附加发生在父节点 ready 之后。
* 需要跨房间长期保存状态。状态放在模型、`ModDataStore` 或 run data 里，节点只负责显示。

## 验证

* 日志中出现 `[NodeAttachment] Registered ...`。
* 进入目标界面后，父节点下面只出现一次你的子节点。
* 使用场景注册时，路径拼写正确，场景根节点类型和 `TNode` 一致。
* 设置 `DuplicatePolicy = ReuseExistingByName` 后，重复进入界面不会生成多个同名节点。
* `TryGetAttached` 能在父节点 ready 后取到节点，在 ready 前返回 false。
