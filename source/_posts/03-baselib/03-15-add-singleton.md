---
title: 添加单例
date: 2026-04-27 00:00:00
permalink: docs/03-baselib/03-15-add-singleton/
categories:
- Basics
---
单例（`SingletonModel`）是一种独立于卡牌、遗物等的`AbstractModel`。所有的`AbstractModel`都有接收游戏事件发生的能力。

可以用来做一些全局的影响。例如，多人模式就使用了一个`SingletonModel`，用于判断怪物是否根据玩家数量提高获得的格挡。

## 代码

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

* 然后你可以向上面一样重载`AbstractModel`下的虚函数来监听游戏事件了，和遗物、药水等的接口一致。

* 你可以反编译原版的`Hook.cs`看看有哪些接口。
