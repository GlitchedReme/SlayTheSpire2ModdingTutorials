`RitsuLib` 提供了一个完整的右键交互系统，支持卡牌、遗物、能力、药水四种模型的右键点击，自动处理多人同步、控制器兼容和优先级调度。

> 以下示例默认已经在 `Entry.Init()` 中调用了 `ModTypeDiscoveryHub.RegisterModAssembly(...)`，否则自动注册不会生效。

## 方式一：模型实现接口

如果想把右键行为直接绑定到模型本身（比如一张卡牌或一个遗物），让模型实现对应的接口即可：

| 模型 | 接口 |
| - | - |
| 卡牌 | `IModRightClickableCard` |
| 遗物 | `IModRightClickableRelic` |
| 能力 | `IModRightClickablePower` |
| 药水 | `IModRightClickablePotion` |

```csharp
using MegaCrit.Sts2.Core.Entities.Powers;
using MegaCrit.Sts2.Core.Models;
using STS2RitsuLib.Interactions.RightClick;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

[RegisterPower]
public sealed class TestInfoPower
    : ModPowerTemplate, IModRightClickablePower
{
    public override PowerType Type => PowerType.Buff;

    public override PowerStackType StackType => PowerStackType.Counter;

    public override PowerAssetProfile AssetProfile => new(
        IconPath: "res://Test/images/powers/test_info.png",
        BigIconPath: "res://Test/images/powers/test_info_big.png");

    // 可选：本地预检，返回 false 则本次右键不会触发
    public bool CanHandleRightClickLocal(ModRightClickContext context)
    {
        return Amount > 0;
    }

    // 右键执行（多人下会在所有客户端同步执行）
    public async Task OnRightClick(ModRightClickExecutionContext context)
    {
        // 做你想做的事，比如弹 Toast
        RitsuToastService.ShowInfo($"当前层数：{Amount}");
    }
}
```

`CanHandleRightClickLocal` 有默认返回 `true` 的实现，不是必须重写。

## 方式二：注册绑定

如果不想改模型类，或者想为同类模型或没有编辑权限的模型注册右键行为，可以用 `ModRightClickRegistry.Register<TModel>`。返回值是 `IDisposable`，Dispose 后该绑定自动注销。

```csharp
using MegaCrit.Sts2.Core.Models;
using STS2RitsuLib.Interactions.RightClick;

namespace Test.Scripts;

[ModInitializer(nameof(Init))]
public class Entry
{
    private static IDisposable? _examineBinding;

    public static void Init()
    {
        _examineBinding = ModRightClickRegistry.Register<CardModel>(
            ModId,
            "examine", // ID，防撞
            canHandle: ctx =>
            {
                // 本地预检：只对打击牌生效
                return ctx.Model is CardModel card
                    && card.Tags.Contains(CardTag.Strike);
            },
            execute: async ctx =>
            {
                // 执行（多人同步）
            },
            priority: 0); // 优先级，越高越先触发
    }

    // 如何取消
    public static void Unregister()
    {
        _examineBinding?.Dispose();
    }
}
```

同一个模型上可以挂多个绑定，它们会按优先级排序依次执行；如果某个绑定的 `canHandle` 返回 `false`，则跳过该绑定。

## 方式三：注册接口

如果想绑定自定义类，可以实现 `IModRightClickHandler` 并用 `Register` 注册。

```csharp
using MegaCrit.Sts2.Core.Models;
using STS2RitsuLib.Interactions.RightClick;

namespace Test.Scripts;

public sealed class TestGlobalHandler : IModRightClickHandler
{
    public int Priority => 100; // 默认 0，越高越先执行

    public bool TryHandle(ModRightClickContext context)
    {
        // 对所有遗物右键弹出提示
        if (context.Model is RelicModel relic)
        {
            RitsuToastService.ShowInfo($"遗物：{relic.DisplayName}");
            return true; // 消费事件，不再往后传递
        }

        return false; // 不处理，交给下一个处理器
    }
}

// 在 Entry.Init 中注册
ModRightClickRegistry.Register(new TestGlobalHandler());
```

处理器运行在模型绑定之前，按 `Priority` 降序执行。返回 `true` 就消费事件，不会再走模型绑定流程。

## 上下文参数

右键交互的本地处理阶段通过 `ModRightClickContext` 传递触发信息：

```csharp
public readonly record struct ModRightClickContext(
    Player Player,
    AbstractModel Model,
    ModRightClickTrigger Trigger);
```

| 参数 | 类型 | 说明 |
| - | - | - |
| `Player` | `Player` | 发起右键的本地玩家实体，通过 `LocalContext.GetMe(...)` 解析得到 |
| `Model` | `AbstractModel` | 被右键点击的游戏模型，运行时可能是 `CardModel` / `RelicModel` / `PowerModel` / `PotionModel`（都继承自 `AbstractModel`） |
| `Trigger` | `ModRightClickTrigger` | 触发元信息，包含 `IsController`（是否为控制器触发）和 `Metadata`（预留的自定义数据） |

> 同步执行阶段使用的是 `ModRightClickExecutionContext`，它多了 `PlayerChoiceContext` 和 `Action` 两个字段。