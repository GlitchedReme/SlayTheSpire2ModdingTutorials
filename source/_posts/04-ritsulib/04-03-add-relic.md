---
title: 04-03 添加新遗物
date: 2026-04-21 00:00:00
permalink: docs/04-ritsulib/04-03-add-relic/
categories:
- Basics
---
> 以下示例默认已经在`Entry.Init()`中调用了`RitsuLibFramework.EnsureGodotScriptsRegistered(...)`和`ModTypeDiscoveryHub.RegisterModAssembly(...)`，否则自动注册不会生效。

和添加卡牌类似。先新建一个类。

```csharp
using Godot;
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Entities.Relics;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.Localization.DynamicVars;
using MegaCrit.Sts2.Core.Models.RelicPools;
using MegaCrit.Sts2.Core.Saves.Runs;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

// 注册遗物。如果要写自定义池看添加人物的开头
[RegisterRelic(typeof(SharedRelicPool))]
// [RegisterCharacterStarterRelic(typeof(TestCharacter))] // 注册起始遗物
public class TestRelic : ModRelicTemplate
{
    // 稀有度
    public override RelicRarity Rarity => RelicRarity.Common;

    // 遗物的数值。这里会替换本地化中的{Cards}。
    protected override IEnumerable<DynamicVar> CanonicalVars => [new CardsVar(1)];

    public override RelicAssetProfile AssetProfile => new(
        // 小图标（原版85x85）
        IconPath: $"res://Test/images/relics/{GetType().Name}.png",
        // 轮廓图标（原版85x85）
        IconOutlinePath: $"res://Test/images/relics/{GetType().Name}.png",
        // 大图标（原版256x256）
        BigIconPath: $"res://Test/images/relics/{GetType().Name}.png"
    );

    // 每回合开始时，抽一张牌
    public override async Task AfterPlayerTurnStart(PlayerChoiceContext choiceContext, Player player)
    {
        await CardPileCmd.Draw(choiceContext, DynamicVars.Cards.IntValue, player);
    }
}
```

* `[RegisterRelic(typeof(TestRelicPool))]`会把遗物自动注册到指定遗物池。示例用的是自定义池；如果你要放到别的池子里，就把这里的类型改掉。

* 继承的是`ModRelicTemplate`。
* 图片资源统一放在`AssetProfile`里配置。

然后放一张图片`Test/images/relics/TestRelic.png`。这里偷懒三张图片用了一样的，可以自己修改路径。

![示例遗物](../../images/image13.png)

然后写一个本地化文件，`{modId}/localization/{Language}/relics.json`。

```json
{
    "TEST_RELIC_TEST_RELIC.title": "测试遗物",
    "TEST_RELIC_TEST_RELIC.description": "每回合开始时，抽[blue]{Cards}[/blue]张牌。",
    "TEST_RELIC_TEST_RELIC.flavor": "觉得很眼熟？"
}
```

* `{Cards}`对应上面的`CardsVar(1)`。

## 最终项目参考

```text
Test
├── Scripts
│   ├── Entry.cs
│   └── TestRelic.cs (或者放单独的Relics文件夹)
└── Test
    ├── images
    │   └── relics
    │       └── TestRelic.png
    └── localization
        └── zhs
            └── relics.json
```
