---
title: 03-03 添加新遗物
date: 2026-04-02 00:00:00
permalink: docs/03-03-add-relic/
categories:
- Basics
---
和添加卡牌类似。先新建一个类。

```csharp
// 加入哪个遗物池，此处为通用
[Pool(typeof(SharedRelicPool))]
public class TestRelic : CustomRelicModel
{
    // 稀有度
    public override RelicRarity Rarity => RelicRarity.Common;

    // 遗物的数值。替换本地化中的{Cards}。
    protected override IEnumerable<DynamicVar> CanonicalVars => [new CardsVar(1)];

    // 小图标
    public override string PackedIconPath => $"res://test/images/relics/{Id.Entry.ToLowerInvariant()}.png";
    // 轮廓图标
    protected override string PackedIconOutlinePath => $"res://test/images/relics/{Id.Entry.ToLowerInvariant()}.png";
    // 大图标
    protected override string BigIconPath => $"res://test/images/relics/{Id.Entry.ToLowerInvariant()}.png";

    public override async Task AfterPlayerTurnStart(PlayerChoiceContext choiceContext, Player player)
    {
        // 这里的DynamicVars.Cards.IntValue为上面设置的CardsVar的数值。
        await CardPileCmd.Draw(choiceContext, DynamicVars.Cards.IntValue, player);
    }
}
```

然后放一张图片`test/images/relics/test_relic.png`。路径不一定是`test`，组织风格自定义，参考上面卡图部分。这里偷懒三张图片用了一样的，可以自己修改。

![示例遗物](../../images/image13.png)

然后写一个本地化文件，`{modId}/localization/{Language}/relics.json`。

```json
{
  "TEST-TEST_RELIC.title": "测试遗物",
  "TEST-TEST_RELIC.description": "每回合开始时，抽[blue]{Cards}[/blue]张牌。",
  "TEST-TEST_RELIC.flavor": "觉得很眼熟？"
}
```

