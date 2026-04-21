---
title: 03-12 添加新事件
date: 2026-04-11 16:00:00
permalink: docs/03-baselib/03-12-add-event/
categories:
- Basics
---
## 简单多阶段事件

首先创建类：

```csharp
using BaseLib.Abstracts;
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Gold;
using MegaCrit.Sts2.Core.Events;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.Localization.DynamicVars;
using MegaCrit.Sts2.Core.Rewards;
using MegaCrit.Sts2.Core.Runs;
using MegaCrit.Sts2.Core.ValueProps;

namespace Test.Scripts;

public sealed class TestEvent : CustomEventModel
{
    // 背景图位置
    public override string? CustomInitialPortraitPath => "res://images/events/battleworn_dummy.png";

    // 设置一些数值
    protected override IEnumerable<DynamicVar> CanonicalVars =>
    [
        new DamageVar(10m, ValueProp.Unblockable | ValueProp.Unpowered),
        new GoldVar(60)
    ];

    // 什么时候会遇到。这里的条件是所有玩家的金币都大于等于60
    public override bool IsAllowed(RunState runState) => runState.Players.All(p => p.Gold >= DynamicVars.Gold.BaseValue);

    // 事件开始前的逻辑。这里是禁止玩家移除药水
    protected override Task BeforeEventStarted(bool isPreFinished)
    {
        Owner!.CanRemovePotions = false;
        return Task.CompletedTask;
    }

    // 事件结束后的逻辑。这里是允许玩家移除药水
    protected override void OnEventFinished()
    {
        Owner!.CanRemovePotions = true;
    }

    // 生成事件初始选项。这里是两个选项：失去生命值或者失去金币，然后进入选择奖励阶段
    protected override IReadOnlyList<EventOption> GenerateInitialOptions() =>
    [
        Option(TakeDamage),
        Option(LoseGold),
    ];

    // 失去生命
    private async Task TakeDamage()
    {
        await CreatureCmd.Damage(new ThrowingPlayerChoiceContext(), Owner!.Creature, DynamicVars.Damage, null, null);
        ChooseRewardTypePage();
    }

    // 失去金币
    private async Task LoseGold()
    {
        await PlayerCmd.LoseGold(DynamicVars.Gold.BaseValue, Owner!, GoldLossType.Stolen);
        ChooseRewardTypePage();
    }

    // 进入事件第二阶段，两个选项：选择药水或者选择卡牌
    private void ChooseRewardTypePage()
    {
        SetEventState(PageDescription("CHOOSE_TYPE"), [
            Option(ChoosePotions, "CHOOSE_TYPE"), // 第二个参数代表该选项所在页面
            Option(ChooseCards, "CHOOSE_TYPE"),
        ]);
    }

    // 选择药水奖励，然后结束事件
    private async Task ChoosePotions()
    {
        await RewardsCmd.OfferCustom(Owner!, [new PotionReward(Owner!)]);
        SetEventFinished(PageDescription("POTIONS_CHOSEN")); // 结束事件时调用这个
    }

    // 选择卡牌奖励，然后结束事件
    private async Task ChooseCards()
    {
        await RewardsCmd.OfferCustom(Owner!, [new CardReward(CardCreationOptions.ForNonCombatWithDefaultOdds([Owner!.Character.CardPool]), 3, Owner)]);
        SetEventFinished(PageDescription("CARDS_CHOSEN"));
    }
}
```

以上代码的字符串基本都和json中的文本键有关。

创建`{modId}/localization/{Language}/events.json`。

```json
{
  // 事件标题
  "TEST-TEST_EVENT.title": "与戈多相遇",
  // INITIAL是初始页面。这是初始页面的描述
  "TEST-TEST_EVENT.pages.INITIAL.description": "岔路口的长椅上空无一人，只有风掠过草丛。\n\n[sine]然后你看见了他。[/sine]\n\n那个小小的、蓝蓝的剪影静静坐着，像在等一封永远不会寄到的信，又像在等某个永远「快好了」的构建结束。\n\n[gold]戈多[/gold]抬起眼睛——如果那算是眼睛——语气平淡得近乎温柔：\n\n「[sine]时间还早……也还很长。你愿意先付一点代价，换一点……打发等待的东西吗？[/sine]」",
  // 这是选项的标题。这个TAKE_DAMAGE是从你的函数生成的id名字。（从TakeDamage生成）
  "TEST-TEST_EVENT.pages.INITIAL.options.TAKE_DAMAGE.title": "用疼痛记住这一刻",
  // 选项的描述。
  "TEST-TEST_EVENT.pages.INITIAL.options.TAKE_DAMAGE.description": "受到[red]{Damage}[/red]点伤害。",
  "TEST-TEST_EVENT.pages.INITIAL.options.LOSE_GOLD.title": "留下过路费",
  "TEST-TEST_EVENT.pages.INITIAL.options.LOSE_GOLD.description": "失去[gold]{Gold}[/gold]枚金币。",
  // 这是第二页。CHOOSE_TYPE是我们自己设置的。
  "TEST-TEST_EVENT.pages.CHOOSE_TYPE.description": "戈多从长椅底下摸出一个布包，又像是摸出了整个宇宙的耐心。\n\n「[sine]可以喝点什么……也可以领几张牌。反正，[/sine]」他顿了顿，「[sine]我们哪儿也不去。[/sine]」",
  "TEST-TEST_EVENT.pages.CHOOSE_TYPE.options.CHOOSE_POTIONS.title": "接过一瓶药水",
  "TEST-TEST_EVENT.pages.CHOOSE_TYPE.options.CHOOSE_POTIONS.description": "领取药水奖励，然后与这次等待道别。",
  "TEST-TEST_EVENT.pages.CHOOSE_TYPE.options.CHOOSE_CARDS.title": "领张牌再走",
  "TEST-TEST_EVENT.pages.CHOOSE_TYPE.options.CHOOSE_CARDS.description": "领取卡牌奖励，然后与这次等待道别。",
  // 结束页。POTIONS_CHOSEN也是我们设置的。
  "TEST-TEST_EVENT.pages.POTIONS_CHOSEN.description": "液体在瓶里轻轻晃荡，像远处引擎空转的节奏。\n\n[gold]戈多[/gold]把空瓶口朝你举了举，像在敬酒，又像在敬时间本身。\n\n[sine]……好了。剩下的，你自己慢慢等吧。[/sine]",
  "TEST-TEST_EVENT.pages.CARDS_CHOSEN.description": "纸牌边缘划过指缝，留下一点脆响——至少比沉默更热闹。\n\n[gold]戈多[/gold]望着你把牌收好，点点头。\n\n[sine]带走它们。路还长，别让自己……等得太安静。[/sine]"
}

```

![alt text](../../../../../images/image33.png)

## 战斗事件

TODO
