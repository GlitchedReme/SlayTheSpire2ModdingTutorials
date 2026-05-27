这一章只补时间线基础教程没有展开的部分：更精细的列布局、时代轴图标、以及把卡牌/遗物/药水的门控和解锁 UI 放进同一个内容包里。Story、Epoch、本地化字段和常见解锁条件的基础写法仍然看 `01 - 添加基础内容/09 - 添加时间线`。

## 推荐组织方式

进阶时间线最容易乱的地方不是单个 API，而是注册分散。推荐把同一个 story column 的布局、门控和展示内容都放在 `TimelineColumn<TStory>(...)` 里：

```csharp
using System;
using System.Collections.Generic;
using MegaCrit.Sts2.Core.Timeline;
using STS2RitsuLib;
using STS2RitsuLib.Scaffolding.Content;
using STS2RitsuLib.Timeline.Scaffolding;

namespace Test.Scripts.Timeline;

public static class TestTimelineRegistration
{
    public static void Register()
    {
        RitsuLibFramework.CreateContentPack(Entry.ModId)
            .Character<TestCharacter>()
            .Card<TestCardPool, TestStrike>()
            .Card<TestCardPool, TestRareCard>()
            .Card<TestCardPool, TestFinisherCard>()
            .Relic<TestRelicPool, TestStarterRelic>()
            .Relic<TestRelicPool, TestUnlockRelic>()
            .Potion<TestPotionPool, TestUnlockPotion>()
            .TimelineColumn<TestStory>(column => column
                .Epoch<TestRootEpoch>(slot => slot
                    .AutoTimelineSlotBeforeColumn(EpochEra.Seeds0)
                    .EraAxisIcon("res://Test/Assets/Timeline/test_root_axis.png")
                    .RequireAllCardsInPool<TestCardPool>())
                .Epoch<TestRareCardsEpoch>(slot => slot
                    .AutoTimelineSlotInEpochColumn<TestRootEpoch>()
                    .DisableEraAxisIcon()
                    .Cards(new[] { typeof(TestRareCard), typeof(TestFinisherCard) }))
                .Epoch<TestRelicsEpoch>(slot => slot
                    .AutoTimelineSlotAfterEpochColumn<TestRareCardsEpoch>()
                    .EraAxisIcon("res://Test/Assets/Timeline/test_relic_axis.png")
                    .RelicsFromPool<TestRelicPool>())
                .Epoch<TestPotionEpoch>(slot => slot
                    .AutoTimelineSlotAfterEpochColumn<TestRelicsEpoch>()
                    .Potions(new[] { typeof(TestUnlockPotion) }))
                .RegisterStory())
            .RequireEpoch<TestCharacter, TestRootEpoch>()
            .UnlockCharacterAfterRunAs<TestPreviousCharacter, TestRootEpoch>()
            .UnlockEpochAfterRunAs<TestCharacter, TestRareCardsEpoch>()
            .UnlockEpochAfterWinAs<TestCharacter, TestRelicsEpoch>()
            .UnlockEpochAfterAscensionWin<TestCharacter, TestPotionEpoch>(1)
            .Apply();
    }
}
```

`TimelineColumn` 里的 `.Epoch<TEpoch>()` 会把 epoch 注册进原版时间线发现，并按调用顺序追加到 story column。对 `ModEpochTemplate` 派生类来说，必须在注册冻结前声明布局；在 slot 回调里写 `.AutoTimelineSlot...()` 是最直观的做法。

上面示例还把角色本身门控到 `TestRootEpoch` 后面，并声明“用 `TestPreviousCharacter` 完成一局后授予这个根节点”。如果你的角色一开始就可选，可以去掉 `.RequireEpoch<TestCharacter, TestRootEpoch>()` 和 `.UnlockCharacterAfterRunAs<...>()`。

## Story 与 Epoch

这里的 epoch 类和基础教程一样，只是把解锁内容列表交给内容包声明。

```csharp
using System;
using System.Collections.Generic;
using STS2RitsuLib.Scaffolding.Content;
using STS2RitsuLib.Timeline.Scaffolding;

namespace Test.Scripts.Timeline;

public sealed class TestStory : ModStoryTemplate
{
    protected override string StoryKey => "test_advanced_timeline";
}

public sealed class TestRootEpoch : CharacterUnlockEpochTemplate<TestCharacter>
{
    public override string Id => "TEST_ADVANCED_ROOT";

    public override EpochAssetProfile AssetProfile => new(
        PackedPortraitPath: "res://Test/Assets/Timeline/root_packed.png",
        BigPortraitPath: "res://Test/Assets/Timeline/root_big.png");

    protected override IEnumerable<Type> ExpansionEpochTypes => new[]
    {
        typeof(TestRareCardsEpoch),
        typeof(TestRelicsEpoch),
        typeof(TestPotionEpoch),
    };
}

public sealed class TestRareCardsEpoch : PackDeclaredCardUnlockEpochTemplate
{
    public override string Id => "TEST_ADVANCED_RARE_CARDS";

    public override EpochAssetProfile AssetProfile => new(
        PackedPortraitPath: "res://Test/Assets/Timeline/cards_packed.png",
        BigPortraitPath: "res://Test/Assets/Timeline/cards_big.png");
}

public sealed class TestRelicsEpoch : PackDeclaredRelicUnlockEpochTemplate
{
    public override string Id => "TEST_ADVANCED_RELICS";

    public override EpochAssetProfile AssetProfile => new(
        PackedPortraitPath: "res://Test/Assets/Timeline/relics_packed.png",
        BigPortraitPath: "res://Test/Assets/Timeline/relics_big.png");
}

public sealed class TestPotionEpoch : PotionUnlockEpochTemplate
{
    public override string Id => "TEST_ADVANCED_POTION";

    public override EpochAssetProfile AssetProfile => new(
        PackedPortraitPath: "res://Test/Assets/Timeline/potion_packed.png",
        BigPortraitPath: "res://Test/Assets/Timeline/potion_big.png");

    protected override IEnumerable<Type> PotionTypes => new[]
    {
        typeof(TestUnlockPotion),
    };
}
```

`PackDeclaredCardUnlockEpochTemplate` 和 `PackDeclaredRelicUnlockEpochTemplate` 会从内容包里的 `.Cards(...)`、`.CardsFromPool<TPool>()`、`.Relics(...)`、`.RelicsFromPool<TPool>()` 读取解锁展示内容。药水不进 `ModEpochGatedContentRegistry`，所以需要 `PotionUnlockEpochTemplate` 自己实现 `PotionTypes`，slot 里的 `.Potions(...)` 负责把药水真正门控在这个 epoch 后面。

## 布局选择

时间线横向列由 `EpochEra` 决定，列内纵向位置由 `EraPosition` 决定。RitsuLib 会先播种原版占用格子；显式撞格会直接抛异常。

| 方法 | 用法 |
| - | - |
| `.TimelineSlot(era, position)` | 固定列和位置，适合你明确维护一张布局表的 Mod。 |
| `.AutoTimelineSlot(era)` | 放进指定列的第一个空位。 |
| `.AutoTimelineSlotBeforeColumn(anchorEra)` | 放到锚点列左侧的第一个可用新列，优先 `EraPosition == 0`。 |
| `.AutoTimelineSlotAfterColumn(anchorEra)` | 放到锚点列右侧的第一个可用新列。 |
| `.AutoTimelineSlotInColumn(anchorEra)` | 和某个 `EpochEra` 共用一列，自动找空位。 |
| `.AutoTimelineSlotBeforeEpochColumn<TReference>()` | 以另一个 epoch 所在列作为锚点，放到左侧。 |
| `.AutoTimelineSlotAfterEpochColumn<TReference>()` | 以另一个 epoch 所在列作为锚点，放到右侧。 |
| `.AutoTimelineSlotInEpochColumn<TReference>()` | 和另一个 epoch 共用一列。 |

需要把布局写在内容包外时，`ModContentPackBuilder` 也提供对应方法，例如：

```csharp
RitsuLibFramework.CreateContentPack(Entry.ModId)
    .Story<TestStory>()
    .Epoch<TestRareCardsEpoch>()
    .StoryEpoch<TestStory, TestRareCardsEpoch>()
    .ModEpochAutoTimelineSlotAfterEpochColumn<TestRareCardsEpoch, TestRootEpoch>()
    .Apply();
```

低层入口是 `ModTimelineLayoutRegistry.RegisterTimelineSlot(...)` 和 `RegisterAutoTimelineSlot...(...)` 系列。只有在你写自己的注册器或需要根据配置动态选择布局时才建议直接调用它们。

## 时代轴图标

slot 里的图标方法作用于该 epoch 最终解析到的 era column：

```csharp
.Epoch<TestRootEpoch>(slot => slot
    .AutoTimelineSlotBeforeColumn(EpochEra.Seeds0)
    .EraAxisIcon("res://Test/Assets/Timeline/test_axis.png"))
.Epoch<TestRareCardsEpoch>(slot => slot
    .AutoTimelineSlotInEpochColumn<TestRootEpoch>()
    .DisableEraAxisIcon())
```

`EraAxisIcon(path)` 会启用并替换该列轴图标；`EnableEraAxisIcon()` 只显式启用；`DisableEraAxisIcon()` 隐藏。规则按 era 保存，同一列多次配置时以后注册的规则为准，所以一个 era column 最好只让一个 epoch 负责图标。

不用 `TimelineColumn` 时也可以直接配置：

```csharp
using MegaCrit.Sts2.Core.Timeline;
using STS2RitsuLib.Timeline;

ModTimelineEraIconRegistry.Configure(
    EpochEra.Seeds0,
    enabled: true,
    texturePath: "res://Test/Assets/Timeline/test_axis.png");
```

`texturePath` 使用 Godot 路径。图片放在 Mod 资源目录时，先确认打包后能通过 `res://...` 访问；路径错了通常表现为时间线打开正常，但轴图标丢失或回退。

## 内容锁定和解锁展示

slot 里有两类方法，名字很像，但效果不同：

| 方法 | 作用 |
| - | - |
| `.RequireAllCardsInPool<TPool>()` | 只把池内卡牌门控在这个 epoch 后面，不生成本 epoch 的卡牌解锁展示列表。 |
| `.RequireAllRelicsInPool<TPool>()` | 只门控池内遗物。 |
| `.RequireAllPotionsInPool<TPool>()` | 只门控池内药水。 |
| `.Cards(types)` | 门控这些卡牌，并写入 `ModEpochGatedContentRegistry`，供 `PackDeclaredCardUnlockEpochTemplate` 展示。 |
| `.CardsFromPool<TPool>()` | 把整个牌池作为这个 epoch 的卡牌解锁展示内容。 |
| `.Relics(types)` | 门控这些遗物，并供 `PackDeclaredRelicUnlockEpochTemplate` 展示。 |
| `.RelicsFromPool<TPool>()` | 把整个遗物池作为这个 epoch 的遗物解锁展示内容。 |
| `.Potions(types)` | 门控这些药水；展示内容由 `PotionUnlockEpochTemplate.PotionTypes` 决定。 |

一个 `PackDeclared...` epoch 只对应一条 gated content 记录。不要在同一个 slot 里同时调用 `.Cards(...)` 和 `.Relics(...)`；要么拆成两个 epoch，要么自己继承 `ModEpochTemplate` 并重写 `QueueUnlocks()`。

## Attribute 对应写法

如果项目主要使用自动扫描，布局和部分门控也可以写成 attribute：

```csharp
using MegaCrit.Sts2.Core.Timeline;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Timeline.Scaffolding;

namespace Test.Scripts.Timeline;

[RegisterEpoch]
[RegisterStoryEpoch(typeof(TestStory), Order = 20)]
[AutoTimelineSlotAfterEpochColumn(typeof(TestRareCardsEpoch))]
[RegisterEpochRelicsFromPool(typeof(TestRelicPool))]
public sealed class TestRelicsEpoch : PackDeclaredRelicUnlockEpochTemplate
{
    public override string Id => "TEST_ADVANCED_RELICS";
}
```

常用 attribute 对应如下：

| Attribute | 对应 builder |
| - | - |
| `[AutoTimelineSlot(EpochEra.Seeds0)]` | `.AutoTimelineSlot(EpochEra.Seeds0)` |
| `[AutoTimelineSlotBeforeColumn(EpochEra.Seeds0)]` | `.AutoTimelineSlotBeforeColumn(EpochEra.Seeds0)` |
| `[AutoTimelineSlotAfterColumn(EpochEra.Seeds0)]` | `.AutoTimelineSlotAfterColumn(EpochEra.Seeds0)` |
| `[AutoTimelineSlotInColumn(EpochEra.Seeds0)]` | `.AutoTimelineSlotInColumn(EpochEra.Seeds0)` |
| `[AutoTimelineSlotBeforeEpochColumn(typeof(SomeEpoch))]` | `.AutoTimelineSlotBeforeEpochColumn<SomeEpoch>()` |
| `[AutoTimelineSlotAfterEpochColumn(typeof(SomeEpoch))]` | `.AutoTimelineSlotAfterEpochColumn<SomeEpoch>()` |
| `[AutoTimelineSlotInEpochColumn(typeof(SomeEpoch))]` | `.AutoTimelineSlotInEpochColumn<SomeEpoch>()` |
| `[RegisterEpochCards(typeof(A), typeof(B))]` | `.Cards(new[] { typeof(A), typeof(B) })` |
| `[RegisterEpochRelicsFromPool(typeof(TestRelicPool))]` | `.RelicsFromPool<TestRelicPool>()` |
| `[RequireAllCardsInPool(typeof(TestCardPool))]` | `.RequireAllCardsInPool<TestCardPool>()` |
| `[RequireEpoch(typeof(SomeEpoch))]` | `.RequireEpoch<TModel, SomeEpoch>()` 或内容类上的门控。 |

attribute 没有 era 轴图标配置，也不覆盖 `TimelineColumn` 的全部组合能力。时间线复杂后，建议把 attribute 限制在简单 epoch 上，把跨内容的门控放回内容包。

## 文本和资源

本地化仍然写在 `{modId}/localization/zhs/epochs.json`。每个 epoch 至少准备：

```json
{
  "STORY_TEST_ADVANCED_TIMELINE": "测试时间线",
  "TEST_ADVANCED_ROOT.title": "起点",
  "TEST_ADVANCED_ROOT.description": "这段历史从一个新角色开始。",
  "TEST_ADVANCED_ROOT.unlock": "测试角色已经加入。",
  "TEST_ADVANCED_ROOT.unlockInfo": "完成指定条件来揭示这个历史节点。",
  "TEST_ADVANCED_ROOT.unlockText": "解锁测试角色。",
  "TEST_ADVANCED_RARE_CARDS.title": "新的招式",
  "TEST_ADVANCED_RARE_CARDS.description": "更多卡牌被加入牌池。",
  "TEST_ADVANCED_RARE_CARDS.unlockInfo": "以测试角色完成一局游戏。",
  "TEST_ADVANCED_RARE_CARDS.unlockText": "解锁测试角色的更多卡牌。"
}
```

`StoryKey` 会被 slugify 后生成 story id，本地化 key 通常是 `STORY_` 加上大写 story id。epoch 的 `Id` 要保持稳定；发布后改 id 会让旧进度和本地化都断开。

资源路径建议分清三类：

| 资源 | 使用位置 |
| - | - |
| `PackedPortraitPath` | 时间线节点小图。 |
| `BigPortraitPath` | 解锁弹窗或大预览。 |
| `EraAxisIcon(...)` | 时间线 era 轴图标。 |

## 验证

1. 开游戏进时间线界面，确认新 story column 出现，节点顺序和左右列位置符合预期。
2. 查看日志，如果有 `Timeline slot conflict`，说明固定位置撞到原版或其他 Mod；改用自动布局或换 `EraPosition`。
3. 在未解锁时检查牌池、遗物池、药水池，确认门控内容不会出现。
4. 触发解锁条件后，确认 `PackDeclaredCardUnlockEpochTemplate`、`PackDeclaredRelicUnlockEpochTemplate` 和 `PotionUnlockEpochTemplate` 的解锁 UI 都显示正确内容。
5. 临时删除或改错一个图标路径，确认你能在日志或界面上发现资源问题，再恢复正确路径。
