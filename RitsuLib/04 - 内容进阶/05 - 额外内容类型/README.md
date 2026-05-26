卡牌、遗物、能力、药水这些基础内容已经有独立教程。本章只补几个更少见但 RitsuLib 已经包装好的内容类型：Act、休息点选项、每日挑战 Modifier、Affliction、Badge 和占位内容。

如果你只是想新增一张牌或一个遗物，回到基础内容章节会更直接；这里适合做完整角色、挑战模式、成就徽章或开发期占位。

## 自定义 Act

自定义章节从 `ModActTemplate` 开始。先给章节资源，事件、遭遇、先古再按前面教程分别注册到这个 Act。

```csharp
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

[RegisterAct]
public sealed class TestAct : ModActTemplate
{
    public override ActAssetProfile AssetProfile => new(
        BackgroundScenePath: "res://Test/scenes/acts/test_act_background.tscn",
        RestSiteBackgroundPath: "res://Test/images/acts/test_rest_site.png",
        MapTopBgPath: "res://Test/images/map/test_top.png",
        MapMidBgPath: "res://Test/images/map/test_mid.png",
        MapBotBgPath: "res://Test/images/map/test_bot.png",
        ChestSpineResourcePath: "res://Test/spine/chest/test_chest.tres",
        BackgroundLayersDirectoryPath: "res://Test/scenes/acts/test_layers");
}
```

显式注册也可以写在内容包里：

```csharp
using STS2RitsuLib;

RitsuLibFramework.CreateContentPack(Entry.ModId)
    .Act<TestAct>()
    .ActEncounter<TestAct, TestEncounter>()
    .ActEvent<TestAct, TestEvent>()
    .ActAncient<TestAct, TestAncient>()
    .Apply();
```

`BackgroundLayersDirectoryPath` 用来放战斗背景图层场景。RitsuLib 会查找目录里的 `_bg_`、`_fg_` 相关场景；不需要分层时只填 `BackgroundScenePath` 就够。

复用原版章节美术时不要手写一堆路径，可以从原版 Act id 生成 profile：

```csharp
public override ActAssetProfile AssetProfile =>
    ContentAssetProfiles.FromVanillaActId("exordium");
```

## 休息点选项

休息点选项不是 ModelDb 内容，不用 `[Register...]`。它要在卡牌、遗物、Modifier 等模型的 `TryModifyRestSiteOptions` 里插入。

```csharp
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Entities.RestSite;
using MegaCrit.Sts2.Core.Localization;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

public sealed class TestRelic : ModRelicTemplate
{
    public override RelicRarity Rarity => RelicRarity.Rare;

    public override void TryModifyRestSiteOptions(Player player, List<RestSiteOption> options)
    {
        options.Add(new TestRestSiteOption(player));
    }
}

public sealed class TestRestSiteOption(Player owner) : ModRestSiteOptionTemplate(owner)
{
    public override RestSiteOptionAssetProfile AssetProfile => new(
        IconPath: "res://Test/images/rest_sites/test_option.png");

    public override LocString CustomTitle =>
        new("test_ui", "rest_site.test_option.name");

    public override LocString Description =>
        new("test_ui", "rest_site.test_option.description");

    public override Task OnSelected()
    {
        Owner.Heal(6);
        return Task.CompletedTask;
    }
}
```

如果选项有条件，可以在构造函数里设置 `IsEnabled`，模式和原版 `SmithRestSiteOption`、`CookRestSiteOption` 一样。`CustomTitle` 和 `AssetProfile.IconPath` 会由 RitsuLib 的补丁接管，普通 `RestSiteOption` 没有 virtual title/icon 也能显示自定义内容。

本地化示例：

```json
{
  "test_ui": {
    "rest_site.test_option.name": "试炼",
    "rest_site.test_option.description": "回复 6 点生命。"
  }
}
```

## 每日挑战 Modifier

Modifier 是出现在自定义模式、每日挑战里的运行修饰符。它可以是正面或负面，并且可以加入互斥组，避免一局里同时 roll 到冲突规则。

```csharp
using MegaCrit.Sts2.Core.Models;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

[RegisterGoodModifier(ModifierListSortOrder = 10)]
[RegisterMutuallyExclusiveModifierGroup(typeof(TestBadModifier))]
public sealed class TestGoodModifier : ModModifierTemplate
{
    public override ModifierAssetProfile AssetProfile => new(
        IconPath: "res://Test/images/modifiers/test_good.png");
}

[RegisterBadModifier(ModifierListSortOrder = 10)]
public sealed class TestBadModifier : ModModifierTemplate
{
    public override ModifierAssetProfile AssetProfile => new(
        IconPath: "res://Test/images/modifiers/test_bad.png");
}
```

或使用内容包：

```csharp
RitsuLibFramework.CreateContentPack(Entry.ModId)
    .GoodModifier<TestGoodModifier>(10)
    .BadModifier<TestBadModifier>(10)
    .MutuallyExclusiveModifierGroup(typeof(TestGoodModifier), typeof(TestBadModifier))
    .Apply();
```

`ModifierListSortOrder` 小于 0 会插在原版列表前，非负数插在原版列表后。Modifier 只负责“出现在可选列表里”；具体玩法效果还是写在模型逻辑、生命周期事件或补丁里。

## Affliction

Affliction 是跑局内的苦痛/负面条目。RitsuLib 提供 overlay 资源和关键词悬浮提示。

```csharp
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

[RegisterAffliction]
public sealed class TestAffliction : ModAfflictionTemplate
{
    public override AfflictionAssetProfile AssetProfile => new(
        OverlayScenePath: "res://Test/scenes/afflictions/test_overlay.tscn");

    protected override IEnumerable<string> RegisteredKeywordIds =>
        ["test:fragile_mind"];
}
```

`RegisteredKeywordIds` 只用于 hover tip 展示。原版 `AfflictionModel` 没有像卡牌那样的 gameplay keyword 集合，所以真正的效果必须由 Affliction 自己的逻辑实现。

## Badge

Badge 用于跑局结算或历史记录里的徽章。继承 `ModBadgeTemplate` 后决定图标、稀有度和是否获得。

```csharp
using MegaCrit.Sts2.Core.Models.Badges;
using MegaCrit.Sts2.Core.Saves;
using MegaCrit.Sts2.Core.Saves.Runs;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

[RegisterBadge]
public sealed class TestPerfectBadge : ModBadgeTemplate
{
    public override bool RequiresWin => true;

    public override string? CustomBadgeIconPath =>
        "res://Test/images/badges/test_perfect.png";

    public override BadgeRarity Rarity(SerializableRun run, SerializablePlayer player)
    {
        return BadgeRarity.Rare;
    }

    public override bool IsObtained(SerializableRun run, SerializablePlayer player)
    {
        return player.CurrentHealth == player.MaxHealth;
    }
}
```

默认 `Id` 会从类型名转成稳定的大写 stem。发布后最好不要改类型名；如果确实要重命名，就显式覆写 `Id` 保持旧值。

## 占位内容

大型 Mod 经常先列一批卡牌、遗物和药水，等数值设计确定后再补完整类型。占位内容可以不用写 CLR 类，直接让 RitsuLib 生成一个空行为模型。

```csharp
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Potions;
using MegaCrit.Sts2.Core.Entities.Relics;
using STS2RitsuLib;
using STS2RitsuLib.Content;

namespace Test.Scripts;

RitsuLibFramework.CreateContentPack(Entry.ModId)
    .PlaceholderCard<TestCardPool>(
        "WIP_STRIKE",
        new PlaceholderCardDescriptor(
            BaseCost: 1,
            Type: CardType.Attack,
            Rarity: CardRarity.Common,
            Target: TargetType.AnyEnemy,
            ShowInCardLibrary: true))
    .PlaceholderRelic<TestRelicPool>(
        "WIP_RELIC",
        new PlaceholderRelicDescriptor(Rarity: RelicRarity.Common))
    .PlaceholderPotion<TestPotionPool>(
        "WIP_POTION",
        new PlaceholderPotionDescriptor(
            Rarity: PotionRarity.Common,
            Usage: PotionUsage.Combat,
            TargetType: TargetType.Self))
    .Apply();
```

占位卡牌打出后什么都不做，占位药水使用后也什么都不做。它们适合开发期和内容清单验证，不适合长期保留在正式发布内容里。

## 验证

* 进主菜单前没有注册冲突日志。
* Act 能在日志里看到注册 id，关联的事件/遭遇/先古能进入对应章节。
* 休息点选项显示自定义图标、标题、描述，点击后效果只触发一次。
* Modifier 出现在自定义模式或每日挑战列表里，互斥组不会同时出现。
* Affliction 的 overlay 场景能加载，关键词只作为 hover tip 展示。
* Badge 在结算或历史记录里按 `IsObtained` 结果显示。
* 占位内容能出现在对应池里，且本地化 key、资源路径与稳定 entry stem 对齐。
