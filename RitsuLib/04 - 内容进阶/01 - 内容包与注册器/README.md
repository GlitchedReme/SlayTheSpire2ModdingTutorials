前面的教程大多使用 `[RegisterCard]`、`[RegisterRelic]` 这类注解。项目变大后，你还会遇到两种需求：

* 想把“这个角色有哪些初始牌、哪些解锁规则”集中写在一个地方。
* 内容由工具生成，或某些内容只在配置满足时注册。

这时可以用 `ContentPack` 或直接使用各类注册器。三种方式可以混用，但建议一个功能域保持一种主写法。

## 初始化位置

注册内容仍然写在 `Entry.Init()` 里。RitsuLib 会在游戏模型初始化完成前冻结注册，冻结后再添加模型就太晚了。

```csharp
using System.Reflection;
using MegaCrit.Sts2.Core.Logging;
using MegaCrit.Sts2.Core.Modding;
using STS2RitsuLib;
using STS2RitsuLib.Interop;

namespace Test.Scripts;

[ModInitializer(nameof(Init))]
public static class Entry
{
    public const string ModId = "test";
    public static readonly Logger Logger = RitsuLibFramework.CreateLogger(ModId);

    public static void Init()
    {
        var assembly = Assembly.GetExecutingAssembly();
        RitsuLibFramework.EnsureGodotScriptsRegistered(assembly, Logger);

        // 扫描注解式注册。
        ModTypeDiscoveryHub.RegisterModAssembly(ModId, assembly);

        // 显式注册写在同一个初始化阶段。
        RegisterContent();
    }

    private static void RegisterContent()
    {
    }
}
```

不要等 `ContentRegistrationClosedEvent` 之类的事件再注册内容。那类事件只适合记录诊断信息。

## 注解式注册

内容和注册关系天然在一起时，用注解最清楚：

```csharp
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Models.Cards;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

[RegisterCard(typeof(TestCardPool), StableEntryStem = "BLAZING_STRIKE")]
[RegisterCharacterStarterCard(typeof(TestCharacter), 4, Order = 10)]
public sealed class BlazingStrike
    : ModCardTemplate(1, CardType.Attack, CardRarity.Common, TargetType.AnyEnemy)
{
}
```

* `StableEntryStem` 用来固定模型 entry。发布后不要随便改，否则旧存档和本地化 key 会对不上。
* `Order` 控制同一批注册操作的顺序，也会影响初始牌、初始遗物这类列表的排列。
* 注解写在抽象基类上时，只有设置 `Inherit = true` 才会传给子类。

适合用注解的内容包括：卡牌、遗物、药水、能力、人物、怪物、事件、先古、卡池、关键词、卡牌标签、卡牌堆、顶栏按钮、时间线、解锁规则等。

## ContentPack

如果一个功能需要“一眼看完”，用 `RitsuLibFramework.CreateContentPack(ModId)`：

```csharp
using STS2RitsuLib;

namespace Test.Scripts;

public static partial class Entry
{
    private static void RegisterContent()
    {
        RitsuLibFramework.CreateContentPack(ModId)
            .Character<TestCharacter>(character => character
                .AddStartingRelic<TestStarterRelic>(1, order: 0)
                .AddStartingCard<BlazingStrike>(4, order: 10)
                .AddStartingCard<TestDefend>(4, order: 20))
            .Card<TestCardPool, BlazingStrike>()
            .Card<TestCardPool, TestDefend>()
            .Relic<TestRelicPool, TestStarterRelic>()
            .Power<TestPower>()
            .ActEncounter<TestAct, TestEncounter>()
            .Story<TestStory>()
            .Epoch<TestEpoch>()
            .StoryEpoch<TestStory, TestEpoch>()
            .RequireEpoch<TestRareCard, TestEpoch>()
            .UnlockEpochAfterWinAs<TestCharacter, TestEpoch>()
            .Apply();
    }
}
```

`Apply()` 只在这一串最后调用一次。Builder 会按你添加的顺序执行，所以会被其他规则引用的模型要先注册。

常用 builder 入口：

| 分类 | 方法例子 |
| - | - |
| 基础内容 | `.Card<TPool, TCard>()`、`.Relic<TPool, TRelic>()`、`.Potion<TPool, TPotion>()`、`.Power<TPower>()`、`.Orb<TOrb>()` |
| 角色 | `.Character<TCharacter>()`、`.Character<TCharacter>(entry => ...)` |
| 世界内容 | `.Act<TAct>()`、`.Monster<TMonster>()`、`.ActEncounter<TAct, TEncounter>()`、`.GlobalEncounter<TEncounter>()` |
| 事件 | `.SharedEvent<TEvent>()`、`.ActEvent<TAct, TEvent>()`、`.SharedAncient<TAncient>()`、`.ActAncient<TAct, TAncient>()` |
| 进阶内容 | `.Achievement<T>()`、`.Enchantment<T>()`、`.Affliction<T>()`、`.Badge<T>()`、`.Singleton<T>()` |
| UI | `.CardPileOwned(...)`、`.TopBarButtonOwned(...)` |
| 时间线与解锁 | `.Story<T>()`、`.Epoch<T>()`、`.StoryEpoch<TStory, TEpoch>()`、`.RequireEpoch<TModel, TEpoch>()`、`.UnlockEpochAfter...()` |
| 批量输入 | `.ContentManifest(...)`、`.KeywordManifest(...)`、`.PackManifest(...)`、`.Manifest(...)` |

## 直接使用注册器

共享库、条件注册或循环生成内容时，直接拿注册器更方便：

```csharp
using STS2RitsuLib;
using STS2RitsuLib.Keywords;
using STS2RitsuLib.Scaffolding.Cards.HandOutline;

namespace Test.Scripts;

public static class OptionalContent
{
    public static void Register(bool enableDebugContent)
    {
        var content = RitsuLibFramework.GetContentRegistry(Entry.ModId);
        content.RegisterCard<TestCardPool, BlazingStrike>();

        if (enableDebugContent)
            content.RegisterRelic<TestRelicPool, DebugRelic>();

        var keywords = RitsuLibFramework.GetKeywordRegistry(Entry.ModId);
        keywords.RegisterCardKeywordOwnedByLocNamespace(
            "burning",
            iconPath: "res://Test/images/keywords/burning.png",
            cardDescriptionPlacement: ModKeywordCardDescriptionPlacement.BeforeCardDescription);

        var cardTags = RitsuLibFramework.GetCardTagRegistry(Entry.ModId);
        cardTags.RegisterOwned("heavy");
    }
}
```

常见注册器：

| 注册器 | 获取方式 |
| - | - |
| 内容 | `RitsuLibFramework.GetContentRegistry(ModId)` |
| 关键词 | `RitsuLibFramework.GetKeywordRegistry(ModId)` |
| 时间线 | `RitsuLibFramework.GetTimelineRegistry(ModId)` |
| 解锁 | `RitsuLibFramework.GetUnlockRegistry(ModId)` |
| 卡牌标签 | `RitsuLibFramework.GetCardTagRegistry(ModId)` |
| 卡牌堆 | `RitsuLibFramework.GetCardPileRegistry(ModId)` |
| 顶栏按钮 | `RitsuLibFramework.GetTopBarButtonRegistry(ModId)` |
| SmartFormat | `RitsuLibFramework.GetSmartFormatRegistry(ModId)` |

## Manifest 批量注册

如果内容来自生成器，或者你想把注册表拆到多个文件，可以准备数组后交给 builder：

```csharp
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

public static class TestManifest
{
    public static readonly IContentRegistrationEntry[] Content =
    [
        new CardRegistrationEntry<TestCardPool, BlazingStrike>(),
        new RelicRegistrationEntry<TestRelicPool, TestStarterRelic>(),
    ];

    public static readonly IModContentPackEntry[] Pack =
    [
        new RequireEpochPackEntry(typeof(TestRareCard), typeof(TestEpoch)),
        new UnlockEpochAfterWinAsPackEntry(typeof(TestCharacter), typeof(TestEpoch)),
    ];
}
```

```csharp
RitsuLibFramework.CreateContentPack(ModId)
    .ContentManifest(TestManifest.Content)
    .PackManifest(TestManifest.Pack)
    .Apply();
```

能拆开就拆开：模型内容放 `ContentManifest`，关键词放 `KeywordManifest`，时间线和解锁规则放 `PackManifest`。这样以后查问题比较轻松。

## 常见问题

* 同一个模型不要重复注册到多个互斥池里。共享池内容可以单独建共享池。
* 发布后不要改稳定 ID、entry stem、本地化 key。
* 初始化阶段注册内容；战斗中、读档后、事件回调里不要临时往 ModelDb 加新模型。
* 注解和 builder 混用时，确认没有把同一个类型注册两次。
* 注册失败或冲突时先看日志，RitsuLib 会尽量指出是哪个 mod、哪个模型或哪个 entry 出问题。
