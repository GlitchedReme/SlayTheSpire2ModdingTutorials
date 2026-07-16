单例（`SingletonModel`）是一种独立于卡牌、遗物等的`AbstractModel`。所有的`AbstractModel`都有接收游戏事件发生的能力。

可以用来做一些全局的影响。

例如，多人模式就使用了一个`SingletonModel`，用于判断怪物是否根据玩家数量提高获得的格挡。

你可以用来做关键词的效果，例如一个关键词是打出后抽一张，就可以创建单例，在出牌后判断是否有关键词然后抽牌。

## 代码

```csharp
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.Logging;
using MegaCrit.Sts2.Core.Models;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Models;

namespace Test.Scripts;

// 注册单例
[RegisterSingleton]
public class TestSingleton : HookedSingletonModel
{
    // 填入HookType，可选Combat、Run或者None。Combat涉及战斗接口，Run涉及全局接口，具体看Hook类中的定义。
    public TestSingleton() : base(HookType.Combat)
    {
    }

    // 自己实现AbstractModel中的各种override。
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

* 然后你可以向上面一样重载`AbstractModel`下的虚函数来监听游戏事件了，和遗物、药水等的接口一致。

* 你可以反编译原版的`Hook.cs`看看有哪些接口。