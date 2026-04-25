时间线是2代用来兼顾解锁人物内容和故事讲述的功能。

## 解释

人物一般有以下“时期”（`Epoch`）。

| 类型 | 解锁条件 | 解锁内容 | 需要代码 |
|---|---|---|---|
| 解锁角色 | 指定角色打一把后解锁角色 | 角色 | `[RegisterEpoch]`、`[RegisterStoryEpoch]`、角色上 `[RequireEpoch]` |
| 打一局 | 用角色完成一局 | 卡牌/遗物/药水 | 角色上`[UnlockEpochAfterRunAs]` |
| 赢一局 | 用角色赢一局 | 卡牌/遗物/药水 | 角色上`[UnlockEpochAfterWinAs]` |
| 打败第一幕 | 用角色打败第一幕Boss | 卡牌 | 指定ID |
| 打败第二幕 | 用角色打败第二幕Boss | 遗物 | 指定ID |
| 打败第三幕 | 用角色打败第三幕Boss | 药水/卡牌 | 指定ID |
| 累计击败精英 | 用角色累计击败精英15个 | 卡牌/遗物/药水 | 角色上 `[UnlockEpochAfterEliteVictories]` |
| 累计击败Boss | 用角色累计击败Boss15个 | 卡牌/遗物/药水 | 角色上 `[UnlockEpochAfterBossVictories]` |
| 进阶1 | 用角色在进阶1胜利 | 卡牌/遗物/药水 | 角色上 `[UnlockEpochAfterAscensionOneWin]` |

## 代码

* 首先你需要自己的人物。参考`添加新人物`。

* 创建一个`TestCharacterStory.cs`。为了方便管理我们把所有故事和时期放一个文件里了。

```csharp
using MegaCrit.Sts2.Core.Timeline;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Timeline.Scaffolding;

namespace Test.Scripts;

// 注册故事
[RegisterStory]
public class TestStory : ModStoryTemplate
{
    // 唯一标识符，和别人不一样防撞车
    protected override string StoryKey => "test";

    // 用于生成通过某一幕的时期的键的函数
    internal static string ActEpochKey(int actNum) => ModContentRegistry.GetFixedPublicEntry(Entry.ModId, typeof(TestCharacter)) + $"_{actNum + 1}_EPOCH";
}

// 第一个时期。该时期会使用AutoTimelineSlotBeforeColumn自动分配时间线位置
[RegisterEpoch]
[RegisterStoryEpoch(typeof(TestStory), Order = 0)]
// 自动分配时间线位置，在Seeds0时期的前面
[AutoTimelineSlotBeforeColumn(EpochEra.Seeds0)]
// 该卡池中的所有卡牌依赖该时期，也就是我们的人物的卡池
[RequireAllCardsInPool(typeof(TestCardPool))]
public class TestEpoch : CharacterUnlockEpochTemplate<TestCharacter>
{
    // 用于本地化的键
    public override string Id => "TEST_CHARACTER_EPOCH";

    // 解锁该时期后，解锁的所有后续时期
    protected override IEnumerable<Type> ExpansionEpochTypes =>
    [
        typeof(TestCardEpoch),
        typeof(TestAct1Epoch),
        typeof(TestAct2Epoch),
        typeof(TestAct3Epoch),
        typeof(TestVictoryEpoch),
        typeof(TestEliteEpoch),
        typeof(TestBossEpoch),
        typeof(TestAscensionOneEpoch),
    ];
}

[RegisterEpoch]
[RegisterStoryEpoch(typeof(TestStory), Order = 1)]
// 自动分配时间线位置，在Seeds0时期
[AutoTimelineSlot(EpochEra.Seeds0)]
// 该时期解锁的所有卡牌
[RegisterEpochCards(typeof(TestCard), typeof(TestCard2), typeof(TestCard3))]
public class TestCardEpoch : PackDeclaredCardUnlockEpochTemplate
{
    // 用于本地化的键
    public override string Id => "TEST_CARD_EPOCH";

    // 时期的图片路径
    public override EpochAssetProfile AssetProfile => new(
        PackedPortraitPath: "res://icon.svg",
        BigPortraitPath: "res://icon.svg"
    );
}

[RegisterEpoch]
[RegisterStoryEpoch(typeof(TestStory), Order = 2)]
[AutoTimelineSlot(EpochEra.Blight1)]
[RegisterEpochCards(typeof(TestCard), typeof(TestCard2), typeof(TestCard3))]
public sealed class TestAct1Epoch : PackDeclaredCardUnlockEpochTemplate
{
    // 用于本地化的键.通过某一幕是按ID检索的
    public override string Id => TestStory.ActEpochKey(1);
}

[RegisterEpoch]
[RegisterStoryEpoch(typeof(TestStory), Order = 3)]
[AutoTimelineSlot(EpochEra.Peace0)]
// 到达该时期后，解锁TestRelicPool中的所有遗物
[RegisterEpochRelicsFromPool(typeof(TestRelicPool))]
public sealed class TestAct2Epoch : PackDeclaredRelicUnlockEpochTemplate
{
    // 用于本地化的键.通过某一幕是按ID检索的
    public override string Id => TestStory.ActEpochKey(2);
}

[RegisterEpoch]
[RegisterStoryEpoch(typeof(TestStory), Order = 4)]
[AutoTimelineSlot(EpochEra.Seeds2)]
[RegisterEpochCards(typeof(TestCard), typeof(TestCard2), typeof(TestCard3))]
public sealed class TestAct3Epoch : PackDeclaredCardUnlockEpochTemplate
{
    // 用于本地化的键.通过某一幕是按ID检索的
    public override string Id => TestStory.ActEpochKey(3);
}

[RegisterEpoch]
[RegisterStoryEpoch(typeof(TestStory), Order = 5)]
[AutoTimelineSlot(EpochEra.Blight2)]
[RegisterEpochCards(typeof(TestCard), typeof(TestCard2), typeof(TestCard3))]
public sealed class TestVictoryEpoch : PackDeclaredCardUnlockEpochTemplate
{
    // 用于本地化的键
    public override string Id => "TEST_VICTORY_EPOCH";
}

[RegisterEpoch]
[RegisterStoryEpoch(typeof(TestStory), Order = 6)]
[AutoTimelineSlot(EpochEra.Prehistoria2)]
[RegisterEpochCards(typeof(TestCard), typeof(TestCard2), typeof(TestCard3))]
public sealed class TestEliteEpoch : PackDeclaredCardUnlockEpochTemplate
{
    // 用于本地化的键
    public override string Id => "TEST_ELITE_MILESTONE_EPOCH";
}

[RegisterEpoch]
[RegisterStoryEpoch(typeof(TestStory), Order = 7)]
[AutoTimelineSlot(EpochEra.Flourish0)]
[RegisterEpochCards(typeof(TestCard), typeof(TestCard2), typeof(TestCard3))]
public sealed class TestBossEpoch : PackDeclaredCardUnlockEpochTemplate
{
    // 用于本地化的键
    public override string Id => "TEST_BOSS_MILESTONE_EPOCH";
}

[RegisterEpoch]
[RegisterStoryEpoch(typeof(TestStory), Order = 8)]
[AutoTimelineSlot(EpochEra.Invitation5)]
[RegisterEpochCards(typeof(TestCard), typeof(TestCard2), typeof(TestCard3))]
public sealed class TestAscensionOneEpoch : PackDeclaredCardUnlockEpochTemplate
{
    // 用于本地化的键
    public override string Id => "TEST_ASCENSION_ONE_EPOCH";
}
```

## 文本

然后创建`{modId}/localization/{Language}/epochs.json`。

```json
{
  "STORY_TEST": "戈多",
  "TEST_CHARACTER_EPOCH.description": "路旁只有一棵[green]树[/green]、一块石头，以及一只被反复擦亮的[gold]怀表[/gold]。\n\n人们说，[blue]戈多[/blue]总会到来。也有人说，他已经来过了，只是没人认出他的影子。\n\n于是等待本身开始有了形状。它穿上外套，整理帽檐，慢慢走向[gold]高塔[/gold]。",
  "TEST_CHARACTER_EPOCH.title": "等待者",
  "TEST_CHARACTER_EPOCH.unlock": "[blue]戈多[/blue]终于出现在路尽头。\n他也许已经准备好进入[gold]高塔[/gold]了。",
  "TEST_CHARACTER_EPOCH.unlockInfo": "{IsRevealed:已经用|用}[pink]{Prerequisite}[/pink]进行一局游戏{IsRevealed:|来揭示这个历史节点}。",
  "TEST_CHARACTER_EPOCH.unlockText": "解锁[blue]戈多[/blue]成为一名可玩角色。",
  "TEST_CARD_EPOCH.description": "[blue]戈多[/blue]把卡牌一张张摊在膝上，像是在清点迟到的信件。\n\n有些牌写着[gold]承诺[/gold]，有些牌写着[sine]明天[/sine]。剩下的那些没有字，只在被打出时发出轻轻的叹息。\n\n“还不够。”他说。“但可以先这样等下去。”",
  "TEST_CARD_EPOCH.title": "第一副牌",
  "TEST_CARD_EPOCH.unlock": "[blue]戈多[/blue]开始整理自己的牌组。",
  "TEST_CARD_EPOCH.unlockInfo": "{IsRevealed:已经以|以}[blue]戈多[/blue]完成一局游戏{IsRevealed:|来揭示这个历史节点}。",
  "TEST_CARD_EPOCH.unlockText": "解锁[blue]戈多[/blue]的更多卡牌。",
  "TEST_CHARACTER_TEST_CHARACTER_2_EPOCH.description": "第一层的空气潮湿而昏暗，墙壁上满是旧日旅人的划痕。\n\n[blue]戈多[/blue]在每一个岔路口停下，认真听着远处传来的脚步声。那声音总是越来越近，又总是在转角处消失。\n\n他没有追上去。他只是继续向上。",
  "TEST_CHARACTER_TEST_CHARACTER_2_EPOCH.title": "脚步声",
  "TEST_CHARACTER_TEST_CHARACTER_2_EPOCH.unlockInfo": "以[blue]戈多[/blue]通关[blue]第一[/blue][gold]阶段[/gold]{IsRevealed:|来揭示这个历史节点}。",
  "TEST_CHARACTER_TEST_CHARACTER_2_EPOCH.unlockText": "解锁[blue]戈多[/blue]的更多卡牌。",
  "TEST_CHARACTER_TEST_CHARACTER_3_EPOCH.description": "第二层的商人与怪物都很忙碌。每个人都有目的地，每件东西都有价格。\n\n[blue]戈多[/blue]买下了一双并不合脚的[gold]靴子[/gold]，又把它们整齐地放回原处。\n\n“也许有人会需要它们。”他说。\n\n当晚，靴子自己向楼上走去。",
  "TEST_CHARACTER_TEST_CHARACTER_3_EPOCH.title": "不合脚的靴子",
  "TEST_CHARACTER_TEST_CHARACTER_3_EPOCH.unlockInfo": "以[blue]戈多[/blue]通关[blue]第二[/blue][gold]阶段[/gold]{IsRevealed:|来揭示这个历史节点}。",
  "TEST_CHARACTER_TEST_CHARACTER_3_EPOCH.unlockText": "解锁[blue]戈多[/blue]的遗物。",
  "TEST_CHARACTER_TEST_CHARACTER_4_EPOCH.description": "第三层的天空近得像一张垂下来的幕布。\n\n[blue]戈多[/blue]站在幕前，听见观众席里没有任何声音。没有掌声，没有嘘声，也没有人离场。\n\n他向那片空座鞠了一躬。\n\n[gold]灯光[/gold]亮起。高塔没有谢幕。",
  "TEST_CHARACTER_TEST_CHARACTER_4_EPOCH.title": "空座",
  "TEST_CHARACTER_TEST_CHARACTER_4_EPOCH.unlock": "[blue]戈多[/blue]仍在等待更艰难的明天。\n现在可以在开始游戏时选择[red]进阶难度[/red]。",
  "TEST_CHARACTER_TEST_CHARACTER_4_EPOCH.unlockInfo": "以[blue]戈多[/blue]通关[blue]第三[/blue][gold]阶段[/gold]{IsRevealed:|来揭示这个历史节点}。",
  "TEST_CHARACTER_TEST_CHARACTER_4_EPOCH.unlockText": "为[blue]戈多[/blue]解锁[red]进阶难度[/red]。同时解锁[gold]{Potion1}[/gold]、[gold]{Potion2}[/gold]和[gold]{Potion3}[/gold]。",
  "TEST_VICTORY_EPOCH.description": "[purple]心脏[/purple]停止跳动之后，塔内变得异常安静。\n\n[blue]戈多[/blue]取出怀表，发现指针仍旧没有移动。胜利并没有让时间恢复，也没有让等待结束。\n\n他想了很久，终于笑了笑。\n\n“那么，明天见。”",
  "TEST_VICTORY_EPOCH.title": "明天见",
  "TEST_VICTORY_EPOCH.unlock": "[blue]戈多[/blue]完成了一次漫长的等待。",
  "TEST_VICTORY_EPOCH.unlockInfo": "{IsRevealed:已经以|以}[blue]戈多[/blue]赢得一局游戏{IsRevealed:|来揭示这个历史节点}。",
  "TEST_VICTORY_EPOCH.unlockText": "解锁[blue]戈多[/blue]的更多卡牌。",
  "TEST_ELITE_MILESTONE_EPOCH.description": "[purple]精英[/purple]们总是准时出现。\n\n这让[blue]戈多[/blue]感到些许欣慰。至少在这座塔里，仍有一些事情不需要被等待。\n\n他把每一次艰难的胜利都记在同一本小册子里。第十五行写完时，墨水正好用尽。",
  "TEST_ELITE_MILESTONE_EPOCH.title": "准时者",
  "TEST_ELITE_MILESTONE_EPOCH.unlockInfo": "{IsRevealed:已经|}以[blue]戈多[/blue]击杀[blue]15[/blue]个[purple]精英[/purple]{IsRevealed:|来揭示这个历史节点}。",
  "TEST_ELITE_MILESTONE_EPOCH.unlockText": "解锁[blue]戈多[/blue]的更多卡牌。",
  "TEST_BOSS_MILESTONE_EPOCH.description": "[red]Boss[/red]们一个接一个倒下，每个都像是一场提前排练好的终幕。\n\n可幕布落下后，总还有下一层、下一扇门、下一句未说出口的话。\n\n[blue]戈多[/blue]把帽子摘下又戴上。\n\n“看来还没轮到我离场。”",
  "TEST_BOSS_MILESTONE_EPOCH.title": "终幕之后",
  "TEST_BOSS_MILESTONE_EPOCH.unlockInfo": "{IsRevealed:已经|}以[blue]戈多[/blue]击杀[blue]15[/blue]个[red]Boss[/red]{IsRevealed:|来揭示这个历史节点}。",
  "TEST_BOSS_MILESTONE_EPOCH.unlockText": "解锁[blue]戈多[/blue]的更多卡牌。",
  "TEST_ASCENSION_ONE_EPOCH.description": "更高的难度并没有改变道路，只是让每一步都更像一次选择。\n\n[blue]戈多[/blue]开始明白，等待并非停在原地。等待是明知结局迟迟不来，仍然把脚从泥里拔出来。\n\n在更冷的风里，他再次向塔顶走去。",
  "TEST_ASCENSION_ONE_EPOCH.title": "更冷的明天",
  "TEST_ASCENSION_ONE_EPOCH.unlockInfo": "以[blue]戈多[/blue]通关[red]进阶[/red][blue]1[/blue]{IsRevealed:|来揭示这个历史节点}。",
  "TEST_ASCENSION_ONE_EPOCH.unlockText": "解锁[blue]戈多[/blue]的更多卡牌。"
}
```