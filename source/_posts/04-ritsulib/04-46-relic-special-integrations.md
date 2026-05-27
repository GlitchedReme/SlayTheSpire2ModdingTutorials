---
title: 遗物专项集成
date: 2026-05-26 00:11:24
permalink: docs/04-ritsulib/04-46-relic-special-integrations/
author: alkaid616
categories:
- Basics
---
这一章只讲两个原版特殊遗物和 Mod 内容的专项联动：`ArchaicTooth` 把初始牌超越成先古卡，`TouchOfOrobas` 把初始遗物精炼成升级遗物。普通遗物、卡牌和人物起始内容的写法仍然看各自基础教程。

## 适用场景

当你的自定义人物有自己的初始牌和初始遗物时，需要告诉 RitsuLib 两个映射：

| 原版效果 | RitsuLib 映射 |
| - | - |
| `ArchaicTooth` 在牌组里找到某张初始牌，并把它变成一张先古卡 | `RegisterArchaicToothTranscendenceMapping<TStarterCard,TAncientCard>()` |
| `TouchOfOrobas` 看到玩家的初始遗物，并把它替换成升级遗物 | `RegisterTouchOfOrobasRefinementMapping<TStarterRelic,TUpgradedRelic>()` |

RitsuLib 的补丁会保留原版行为：`ArchaicTooth` 转化时会继承升级状态和附魔；`TouchOfOrobas` 会先查 Mod 注册的精炼映射，再回落到原版映射。

## Attribute 自动注册

如果你已经在初始化里调用了 `ModTypeDiscoveryHub.RegisterModAssembly(...)`，最省事的是把映射写在起始牌和起始遗物类上。

```csharp
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts.SpecialRelics;

[RegisterCard(typeof(TestCardPool))]
[RegisterCharacterStarterCard(typeof(TestCharacter), 5)]
[RegisterArchaicToothTranscendence(typeof(TestStrikeAncient))]
public sealed class TestStrike : ModCardTemplate
{
}

[RegisterCard(typeof(TestCardPool))]
public sealed class TestStrikeAncient : ModCardTemplate
{
}

[RegisterRelic(typeof(TestRelicPool))]
[RegisterCharacterStarterRelic(typeof(TestCharacter))]
[RegisterTouchOfOrobasRefinement(typeof(TestStarterRelicPlus))]
public sealed class TestStarterRelic : ModRelicTemplate
{
}

[RegisterRelic(typeof(TestRelicPool))]
public sealed class TestStarterRelicPlus : ModRelicTemplate
{
}
```

两个 attribute 都允许重复写。如果一个 Mod 后续替换同一张起始牌或同一个起始遗物的目标，RitsuLib 会保留最后注册的映射，并在日志里提示被替换。

## 显式注册

如果你的初始化本来就集中写注册，也可以在 `Entry.Init()` 或内容包 `Apply()` 前后显式调用。类型参数版本会延迟通过 `ModelDb` 解析目标，所以可以安全放在内容注册阶段。

```csharp
using STS2RitsuLib;

namespace Test.Scripts;

public static class TestSpecialRelicMappings
{
    public static void Register()
    {
        RitsuLibFramework.RegisterArchaicToothTranscendenceMapping<
            TestStrike,
            TestStrikeAncient>(Entry.ModId);

        RitsuLibFramework.RegisterTouchOfOrobasRefinementMapping<
            TestStarterRelic,
            TestStarterRelicPlus>(Entry.ModId);
    }
}
```

如果你拿到的是 `ModelId`，也可以用显式 id 版本：

```csharp
using MegaCrit.Sts2.Core.Models;
using STS2RitsuLib;

var starterCardId = ModelDb.GetId<TestStrike>();
var starterRelicId = ModelDb.GetId<TestStarterRelic>();

RitsuLibFramework.RegisterArchaicToothTranscendenceMapping(
    starterCardId,
    typeof(TestStrikeAncient),
    Entry.ModId);

RitsuLibFramework.RegisterTouchOfOrobasRefinementMapping(
    starterRelicId,
    typeof(TestStarterRelicPlus),
    Entry.ModId);
```

显式 id 适合和别的 Mod 或配置文件交互；平时优先用泛型版本，重命名类时编译器会帮你发现问题。

## 内容包写法

如果你已经使用 `CreateContentPack(...).Apply()` 统一注册内容，可以把映射放进 builder 链里，和卡牌、遗物、人物注册保持在同一批。

```csharp
RitsuLibFramework.CreateContentPack(Entry.ModId)
    .Card<TestCardPool, TestStrike>()
    .Card<TestCardPool, TestStrikeAncient>()
    .Relic<TestRelicPool, TestStarterRelic>()
    .Relic<TestRelicPool, TestStarterRelicPlus>()
    .Character<TestCharacter>()
    .ArchaicToothTranscendence<TestStrike, TestStrikeAncient>()
    .TouchOfOrobasRefinement<TestStarterRelic, TestStarterRelicPlus>()
    .Apply();
```

builder 也有 id 版本：`ArchaicToothTranscendence(ModelId starterCardId, Type ancientCardType)` 和 `TouchOfOrobasRefinement(ModelId starterRelicId, Type upgradedRelicType)`。

## 先古卡和升级遗物怎么写

先古目标卡本身仍然是一张普通 Mod 卡。推荐把它注册到同一人物卡池，并让稀有度、颜色和资源都像正常卡牌一样完整。

```csharp
[RegisterCard(typeof(TestCardPool))]
public sealed class TestStrikeAncient : ModCardTemplate
{
    public override CardRarity Rarity => CardRarity.Special;
}
```

升级遗物也是普通 Mod 遗物。它通常不应该再作为人物起始遗物注册，否则新开局就会直接拿到升级版。

```csharp
[RegisterRelic(typeof(TestRelicPool))]
public sealed class TestStarterRelicPlus : ModRelicTemplate
{
    public override RelicRarity Rarity => RelicRarity.Special;
}
```

`ArchaicTooth.TranscendenceCards` 会被 RitsuLib 扩展，已注册的先古目标也会被 Dusty Tome 之类查看先古卡列表的逻辑看到。

## 多人物和多起始套装

一个人物如果有多张不同起始牌，可以分别注册多条超越映射：

```csharp
RitsuLibFramework.RegisterArchaicToothTranscendenceMapping<
    TestDefend,
    TestDefendAncient>(Entry.ModId);

RitsuLibFramework.RegisterArchaicToothTranscendenceMapping<
    TestSkill,
    TestSkillAncient>(Entry.ModId);
```

`ArchaicTooth` 会先执行原版查找；原版找不到时，RitsuLib 才会从牌组里找已注册的 Mod 起始牌。若多张都在牌组里，实际选中哪张取决于牌组顺序，所以不要给同一套起始牌制造互相冲突的映射。

## 验证

1. 开自定义人物新局，确认牌组里有 `TestStrike`，遗物栏里有 `TestStarterRelic`。
2. 通过控制台、调试奖励或测试事件获得 `ArchaicTooth`，确认 `TestStrike` 变成 `TestStrikeAncient`。
3. 把 `TestStrike` 升级或附魔后再触发，确认升级和附魔被继承。
4. 触发 `TouchOfOrobas`，确认初始遗物替换成 `TestStarterRelicPlus`。
5. 查看日志，确认没有 `OrobasAncientUpgrades` 的 missing model 或 replaced mapping 警告。
