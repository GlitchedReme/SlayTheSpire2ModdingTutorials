---
title: Content Registration
date: 2026-05-27 15:36:11
permalink: en/docs/04-ritsulib/04-27-content-registry/
author: alkaid616
categories:
- Basics
---
The tutorials mostly use annotations like `[RegisterCard]`, `[RegisterRelic]`, but RitsuLib actually supports at least three registration methods.

## Method 1: Annotation-Based Registration

When content and registration relationships are naturally together, annotations are clearest:

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

## Method 2: ContentPack

If you need unified display registration, use `RitsuLibFramework.CreateContentPack(ModId)`:

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

Call `Apply()` only once at the end of the chain. The Builder executes in the order you added, so models referenced by other rules should be registered first.

## Method 3: Direct Use of Registries

When some features require manual registration, using registries directly is more convenient:

```csharp
[ModInitializer(nameof(Init))]
public class Entry
{
    public static void Init()
    {
        var content = RitsuLibFramework.GetContentRegistry(Entry.ModId); // Or ModContentRegistry.For, either works
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
