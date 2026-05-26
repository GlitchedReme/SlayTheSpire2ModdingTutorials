教程大多使用 `[RegisterCard]`、`[RegisterRelic]` 这类注解，但其实`Ritsulib`支持至少三种注册方式。

## 方式一：注解式注册

内容和注册关系天然在一起时，用注解最清楚：

```csharp
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Models.Cards;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

[RegisterCard(typeof(TestCardPool))]
[RegisterCharacterStarterCard(typeof(TestCharacter), 4)]
public sealed class BlazingStrike : ModCardTemplate(1, CardType.Attack, CardRarity.Common, TargetType.AnyEnemy)
{
}
```

## 方式二：ContentPack

如果你需要统一的显示注册，用 `RitsuLibFramework.CreateContentPack(ModId)`：

```csharp
using STS2RitsuLib;

namespace Test.Scripts;

[ModInitializer(nameof(Init))]
public class Entry
{
    public static void Init()
    {
        RitsuLibFramework.CreateContentPack(ModId)
            .Character<TestCharacter>(character => character
                .AddStartingRelic<TestStarterRelic>(1)
                .AddStartingCard<BlazingStrike>(4)
                .AddStartingCard<TestDefend>(4))
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

## 方法三：直接使用注册器

部分功能需要手动注册时，直接拿注册器更方便：

```csharp
[ModInitializer(nameof(Init))]
public class Entry
{
    public static void Init()
    {
        var content = RitsuLibFramework.GetContentRegistry(Entry.ModId); // 或ModContentRegistry.For，任意
        content.RegisterCard<TestCardPool, BlazingStrike>();

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