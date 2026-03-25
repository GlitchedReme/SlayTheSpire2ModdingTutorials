---
title: 03 BaseLib
date: 2026-03-15 00:00:00
permalink: docs/03-baselib/
categories:
- Basics
---

`BaseLib`是统一添加新内容行为的基础mod，类似于塔1的`basemod`和`stslib`。

https://github.com/Alchyr/BaseLib-StS2

> 由于目前`BaseLib`尚处于开发阶段，如果只打patch不添加新内容可以不使用。

## 下载

* 前往 https://github.com/Alchyr/BaseLib-StS2/releases 下载`dll`，`pck`和`json`三个文件，把他们放在`mods`文件夹里。记住你下载的版本。

* 在`csproj`文件中相应位置引用`BaseLib.dll`，如下，两种方式都可。

```xml
  <ItemGroup>
    <Reference Include="sts2">
      <HintPath>$(Sts2DataDir)/sts2.dll</HintPath>
      <Private>false</Private>
    </Reference>

    <Reference Include="0Harmony">
      <HintPath>$(Sts2DataDir)/0Harmony.dll</HintPath>
      <Private>false</Private>
    </Reference>

    <!-- 本地引用，注意路径是否正确 -->
    <Reference Include="BaseLib">
      <HintPath>$(Sts2Dir)/mods/BaseLib/BaseLib.dll</HintPath>
      <Private>false</Private>
    </Reference>
    <!-- NuGet获取，注意版本是否一致，不一致手动更改Version -->
    <!-- <PackageReference Include="Alchyr.Sts2.BaseLib" Version="*" /> -->
  </ItemGroup>
```

* 不要忘了在你`{modid}.json`中填写`dependencies`。

```json
  "dependencies": ["BaseLib"],
```

## 添加新卡牌

### 代码

创建一个新的`Cards`文件夹方便管理，并创建新的`cs`文件，例如`TestCard.cs`。

```csharp
using BaseLib.Abstracts;
using BaseLib.Utils;
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.Localization.DynamicVars;
using MegaCrit.Sts2.Core.Models.CardPools;
using MegaCrit.Sts2.Core.ValueProps;

namespace Test.Scripts;

// 加入哪个卡池
[Pool(typeof(ColorlessCardPool))]
public class TestCard : CustomCardModel
{
    // 基础耗能
    private const int energyCost = 1;
    // 卡牌类型
    private const CardType type = CardType.Attack;
    // 卡牌稀有度
    private const CardRarity rarity = CardRarity.Common;
    // 目标类型（AnyEnemy表示任意敌人）
    private const TargetType targetType = TargetType.AnyEnemy;
    // 是否在卡牌图鉴中显示
    private const bool shouldShowInCardLibrary = true;

    // 卡牌的基础属性（例如这里是12点伤害）
    protected override IEnumerable<DynamicVar> CanonicalVars => [new DamageVar(12, ValueProp.Move)];

    public TestCard() : base(energyCost, type, rarity, targetType, shouldShowInCardLibrary)
    {
    }

    // 打出时的效果逻辑
    protected override async Task OnPlay(PlayerChoiceContext choiceContext, CardPlay cardPlay)
    {
        await DamageCmd.Attack(DynamicVars.Damage.BaseValue) // 造成伤害，数值来源于卡牌的基础伤害属性
            .FromCard(this) // 伤害来源于这张卡牌
            .Targeting(cardPlay.Target) // 伤害目标是玩家选择的目标
            .Execute(choiceContext);
    }

    // 升级后的效果逻辑
    protected override void OnUpgrade()
    {
        DynamicVars.Damage.UpgradeValueBy(4); // 升级后增加4点伤害
    }
}
```

* `CanonicalVars`翻译是“规范值”，指卡牌的基础数值。添加一个`DamageVar`意为指定卡牌的基础伤害是多少，例如这里是`12`。

* `ValueProp`表示数值的属性，例如`ValueProp.Move`表示是通过卡牌造成的伤害/格挡，`ValueProp.Unpowered`表示不受修正影响（如力量等），`ValueProp.Unblockable`表示伤害不可被格挡，`ValueProp.SkipHurtAnim`表示跳过受伤动画。这是一个bitflag类型的枚举，你可以进行组合，例如`ValueProp.Unblockable | ValueProp.Unpowered`，不可被格挡也不受修正影响。

* 尖塔2使用了`async`和`await`来控制效果逻辑顺序执行，比如选择一张牌时就一直`await`不让后续代码执行，和尖塔1的`action`类似的生态位。此处的`OnPlay`中写了一个造成单体伤害的指令。

* 想做什么样的卡牌，看原版代码哪张有类似的效果，参考即可。

* 添加一个`Pool`的attribute，并指定要添加的颜色卡池，然后会自动注册。
* 继承`CustomCardModel`而不是`CardModel`。
* <b>注意</b>：通过`baselib`添加卡牌，其id会变成`{命名空间第一段大写}-{原卡牌id}`，例如`namespace Test.Scripts;`取`TEST`，原始卡牌id为`TEST-CARD`，是`TestCard`的大写snake-case，最后变成`TEST-TEST_CARD`。

### 卡图

可以通过在卡牌类中添加一个表达式属性来添加卡牌，这样的话可以任意指定位置：`public override string PortraitPath => $"res://test/images/cards/{Id.Entry.ToLowerInvariant()}.png";`，
如下，那么路径就是`test/images/cards/test-test_card.png`（是你类名的`snake_case`命名风格加前缀，例如`TestCard`即为`test-test_card`）。当然按你的喜好组织资源路径也可。

卡图任意尺寸都可，且不需要裁剪，官方使用的尺寸是普通卡1000x760，先古卡606x852。

```csharp
public class TestCard : TestCardModel
{
    private const int energyCost = 1;
    private const CardType type = CardType.Attack;
    private const CardRarity rarity = CardRarity.Common;
    private const TargetType targetType = TargetType.AnyEnemy;
    private const bool shouldShowInCardLibrary = true;

    protected override IEnumerable<DynamicVar> CanonicalVars => [new DamageVar(12, ValueProp.Move)];

    // 添加这一行，指定卡牌立绘路径
    public override string PortraitPath => $"res://test/images/cards/{Id.Entry.ToLowerInvariant()}.png";

    public TestCard() : base(energyCost, type, rarity, targetType, shouldShowInCardLibrary)
    {
    }
}
```

![示例卡图](../../images/image10.png)

你也可以通过新增一个`abstract`类，避免每张卡都写一遍卡图路径，并且方便管理一些自定义功能。

```csharp
public abstract class TestCardModel : CardModel
{
    public override string PortraitPath => $"res://test/images/cards/{Id.Entry.ToLowerInvariant()}.png";

    public TestCardModel(int energyCost, CardType type, CardRarity rarity, TargetType targetType, bool shouldShowInCardLibrary) : base(energyCost, type, rarity, targetType, shouldShowInCardLibrary)
    {
    }
}

public class TestCard : TestCardModel {}
```

### 文本

此外还需要本地化文件。创建一个`{modId}/localization/{Language}/cards.json`。
* `modId`即为你`{modId}.json`中填写的。<b>不是你的根目录，而是一个新文件夹。</b>
* `Language`可以写`zhs`表示简体中文。填写`{CardId}.title`（卡牌名）和`{CardId}.description`（卡牌描述）：

```json
{
    "TEST-TEST_CARD.title": "测试卡牌",
    "TEST-TEST_CARD.description": "造成{Damage:diff()}点伤害。"
}
```

编译打包`dll`和`pck`后打开游戏。如果你在对应池子中看到卡牌说明成功了。如果没有任何卡牌（或者一张在左上角的卡牌）说明出问题了。

按`~`打开控制台输入`card TEST-TEST_CARD`获得这张卡。

![示例卡牌](../../images/image11.png)

如果报错，回头看看。最终项目结构参考：

```
Test (你的项目文件夹)
├── Scripts (你的脚本文件夹，随意)
│   ├── TestCard.cs
│   └── Entry.cs
└── Test (不要忘了这一层文件夹)
    ├── images
    │   └── cards
    │       └── test-test_card.png
    └── localization
        └── zhs
            └── cards.json
```

## 自定义模组配置

* 要使用此功能，需要先放一张图片到`{modId}\mod_image.png`作为mod图标，尺寸任意，否则会由于报错不显示配置。
* 添加一个继承`SimpleModConfig`（或者是`ModConfig`如果你想要更复杂的设置）的类，在其中添加`public static bool`变量。支持`bool`，`double`，`enum`。
* 在初始化函数调用`ModConfigRegistry.Register`。字符串写你的`modId`。

```csharp
[ModInitializer("Init")]
public class Entry
{
    public static void Init()
    {
        ModConfigRegistry.Register("test", new ModConfig());
    }
}

public class ModConfig : SimpleModConfig
{
    public static bool Test1 { get; set; } = true;
    public static bool Test2 { get; set; } = false;
    public static bool Test3 { get; set; } = true;
}
```

![示例配置](../../images/image12.png)

更多请参考`baselib`的`BaseLibConfig`类。

## 添加新遗物

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

## 添加新卡牌关键词

这里的关键词指的是`消耗`，`虚无`一类的卡牌属性，塔2并不需要你在卡牌描述里写这些，只需在`CanonicalKeywords`添加即可。

* 新建一个类：

```csharp
public class MyKeywords
{
    // 自定义枚举的名字。最终会变成{前缀}-{枚举值大写}的形式，例如TEST-UNIQUE
    [CustomEnum("UNIQUE")]
    // 放在原版卡牌描述的位置，这里是卡牌描述的前面
    [KeywordProperties(AutoKeywordPosition.Before)]
    public static CardKeyword Unique;
}
```

* 添加一个本地化文件，`{modId}/localization/{Language}/card_keywords.json`。

```json
{
    "TEST-UNIQUE.description": "卡组中只能有一张同名牌。",
    "TEST-UNIQUE.title": "唯一"
}
```

* 然后在你的卡牌类里添加这一行，或者添加keyword：

```csharp
    public override IEnumerable<CardKeyword> CanonicalKeywords => [MyKeywords.Unique];
```

![alt text](../../images/image23.png)

## 添加动态变量

动态变量是指`伤害`，`格挡`，`抽牌数`，`获得能量数`等这种动态数值。虽然可以通过`new DynamicPower("xxx", 1)`这种形式添加，但是写一个新的类比较规范也便于扩展功能。

先创建新的类：
```csharp
using BaseLib.Extensions;
using MegaCrit.Sts2.Core.Localization.DynamicVars;

namespace Test.Scripts;

public class TestDynamicVar : DynamicVar
{
    // 在描述中用作占位符的键，推荐添加前缀避免撞车
    public const string Key = "Test-Leech";
    // 本地化键，这里设置为大写的Key，也就是"TEST-LEECH"
    public static readonly string LocKey = Key.ToUpperInvariant();

    public TestDynamicVar(decimal baseValue) : base(Key, baseValue)
    {
        this.WithTooltip(LocKey);
    }
}
```

然后添加一个新的本地化文件`{modId}/localization/{Language}/static_hover_tips.json`。

```json
{
    "TEST-LEECH.description": "吸取等量生命。",
    "TEST-LEECH.title": "汲取"
}
```

如果要使用这个变量，在`CanonicalVars`中添加你新建的变量即可。

```csharp
    protected override IEnumerable<DynamicVar> CanonicalVars => [
        new DamageVar(12, ValueProp.Move),
        new TestDynamicVar(3)
    ];
```

然后修改卡牌的描述以使用：

```json
{
    "TEST-TEST_CARD.title": "测试卡牌",
    "TEST-TEST_CARD.description": "[gold]汲取[/gold]{Test-Leech:diff()}。\n造成{Damage:diff()}点伤害。"
}
```

`:diff()`表示这个值一旦和基础值不同，就会变红色或绿色（例如升级时增加数值，预览变成绿色）。


![alt text](../../images/image26.png)

当然如果你只是个简单的数值，这样就行：

```csharp
    protected override IEnumerable<DynamicVar> CanonicalVars => [
        new DamageVar(12, ValueProp.Move),
        new DynamicVar("Test-Leech", 1m).WithTooltip("TEST-LEECH")
    ];
```


## 添加局内保存

在卡牌、遗物、附魔、Modifier（每日挑战效果）的`Model`的属性中中添加带`SavedProperty`的属性即可保存。

```csharp
[Pool(typeof(SharedRelicPool))]
public class TestRelic : CustomRelicModel
{
    // 这个属性会被保存。建议添加前缀id防止撞车。
    // 设置不同的SerializationCondition来控制属性的保存条件，例如这里使用默认值AlwaysSave表示无论属性值是什么都保存。
    [SavedProperty]
    public int Test_GameTurns { get; set; } = 0;

    protected override IEnumerable<DynamicVar> CanonicalVars => [new CardsVar(1), new DynamicVar("GameTurns", Test_GameTurns)];

    public override async Task AfterPlayerTurnStart(PlayerChoiceContext choiceContext, Player player)
    {
        // 每回合开始时，修改Test_GameTurns的值，并改变卡牌描述中{GameTurns}的值为Test_GameTurns的值
        Test_GameTurns++;
        DynamicVars["GameTurns"].BaseValue = Test_GameTurns;
        await CardPileCmd.Draw(choiceContext, DynamicVars.Cards.IntValue, player);
    }
}
```

```json
{
  "TEST-TEST_RELIC.title": "测试遗物",
  "TEST-TEST_RELIC.description": "每回合开始时，抽[blue]{Cards}[/blue]张牌。\n已经历过[blue]{GameTurns}[/blue]回合了。",
  "TEST-TEST_RELIC.flavor": "觉得很眼熟？"
}
```

## 添加新能力

新建类：

```csharp
public class TestPower : CustomPowerModel
{
    // 类型，Buff或Debuff
    public override PowerType Type => PowerType.Buff;
    // 叠加类型，Counter表示可叠加，Single表示不可叠加
    public override PowerStackType StackType => PowerStackType.Counter;

    // 自定义图标路径，自己指定，或者创建一个基类来统一指定图标路径
    public override string? CustomPackedIconPath => "res://test/powers/test_power.png";
    public override string? CustomBigIconPath => "res://test/powers/test_power.png";

    // 抽牌后给予玩家力量
    public override async Task AfterCardDrawn(PlayerChoiceContext choiceContext, CardModel card, bool fromHandDraw)
    {
        await PowerCmd.Apply<StrengthPower>(Owner, Amount, Owner, null);
    }
}
```

添加json，`{modId}/localization/{Language}/powers.json`。
```json
{
    "TEST-TEST_POWER.description": "每次抽牌时，获得一点[gold]力量[/gold]。",
    "TEST-TEST_POWER.smartDescription": "每次抽牌时，获得[blue]{Amount}[/blue]点[gold]力量[/gold]。", // smartDescription可以使用{Amount}来显示当前的数值
    "TEST-TEST_POWER.title": "邪火"
}
```

然后使用`PowerCmd.Apply<TestPower>(...)`给予即可。

![alt text](../../images/image25.png)

## 添加新怪物
TODO

## 添加新事件
TODO

## 添加新药水
TODO

## 添加新附魔
TODO

## 添加先古卡
TODO

## 添加先古之民
TODO