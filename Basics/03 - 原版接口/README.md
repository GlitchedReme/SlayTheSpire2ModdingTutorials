如同尖塔1一样，添加一个新内容包括以下步骤：编写类、注册、写本地化文本。

> 这一章节将被逐步废弃，推荐通过`baselib`添加内容（目前开发阶段）。请先查看`BaseLib`这一章。

## 添加新卡牌

### 代码

创建一个新的`Cards`文件夹方便管理，并创建新的`cs`文件，例如`TestCard.cs`。

```csharp
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.Localization.DynamicVars;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.ValueProps;

namespace Test.Scripts.Cards;

public class TestCard : CardModel
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

然后通过`ModHelper.AddModelToPool`注册这张卡牌。

```csharp
namespace Test.Scripts;

[ModInitializer("Init")]
public class Entry
{
    public static void Init()
    {
        // 把TestCard添加到无色牌池。你也可以加到SilentCardPool等。
        ModHelper.AddModelToPool<ColorlessCardPool, TestCard>();
    }
}
```

### 卡图

~~如果要添加卡图，放一张图到`images/packed/card_portraits/{Pool}/{CardId}.png`，任意尺寸都可，且不需要裁剪，官方使用的尺寸是普通卡1000x760，先古卡606x852。~~
* ~~其中`pool`有`ironclad`,`silent`,`regrent`,`necrobinder`,`colorless`等选项。~~
* ~~`CardId`是你类名的`snake_case`命名风格，例如`TestCard`即为`test_card`。~~
* ~~由于id通过类名生成，且暂时没有`basemod`，推荐给你的卡牌类名加个前缀防止和其他作者的卡牌id撞车产生问题。~~

可以通过在卡牌类中添加一个表达式属性来添加卡牌，这样的话可以任意指定位置：`public override string PortraitPath => $"res://test/images/cards/{Id.Entry.ToLowerInvariant()}.png";`，
如下，那么路径就是`test/images/cards/test_card.png`。当然按你的喜好组织资源路径也可。

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

    // 指定卡牌立绘路径
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
* `modId`即为你`{modId}.json`中填写的。
* `Language`可以写`zhs`表示简体中文。填写`{CardId}.title`（卡牌名）和`{CardId}.description`（卡牌描述）：

```json
{
    "TEST_CARD.title": "测试卡牌",
    "TEST_CARD.description": "造成{Damage:diff()}点伤害。"
}
```

编译打包`dll`和`pck`后打开游戏。如果你在对应池子中看到卡牌说明成功了。如果没有任何卡牌（或者一张在左上角的卡牌）说明出问题了。

按`~`打开控制台输入`card TEST_CARD`获得这张卡。

![示例卡牌](../../images/image11.png)

## 添加新遗物

和添加卡牌类似。先新建一个类。

```csharp
public class TestRelic : RelicModel
{
    // 稀有度
    public override RelicRarity Rarity => RelicRarity.Common;

    // 小图标
    public override string PackedIconPath => $"res://test/images/relics/{Id.Entry.ToLowerInvariant()}.png";
    // 轮廓图标
    protected override string PackedIconOutlinePath => $"res://test/images/relics/{Id.Entry.ToLowerInvariant()}.png";
    // 大图标
    protected override string BigIconPath => $"res://test/images/relics/{Id.Entry.ToLowerInvariant()}.png";

    public override async Task AfterPlayerTurnStart(PlayerChoiceContext choiceContext, Player player)
    {
        await CardPileCmd.Draw(choiceContext, 1, player);
    }
}
```

然后放一张图片`test/images/relics/test_relic.png`。路径不一定是`test`，组织风格自定义，参考上面卡图部分。这里偷懒三张图片用了一样的，可以自己修改。

![示例遗物](../../images/image13.png)

然后注册，写一个本地化文件，`{modId}/localization/{Language}/relics.json`。

```csharp
[ModInitializer("Init")]
public class Entry
{
    public static void Init()
    {
        ModHelper.AddModelToPool<ColorlessCardPool, TestCard>();
        // 注册到通用遗物
        ModHelper.AddModelToPool<SharedRelicPool, TestRelic>();
        var harmony = new Harmony("com.example.testmod");
        harmony.PatchAll();
    }
}
```

```json
{
  "TEST_RELIC.title": "测试遗物",
  "TEST_RELIC.description": "每回合开始时，抽[blue]1[/blue]张牌。",
  "TEST_RELIC.flavor": "觉得很眼熟？"
}
```

## 添加新药水

与卡牌和遗物添加类似，但是没有override修改图片的地方。官方找药水图的路径为`res://images/atlases/potion_atlas.sprites/{id}.tres`，需要是一个图集（AtlasTexture）。

## 添加新人物

官方没有给接口，且*非常麻烦*，需要大量的资源。建议通过`baselib`添加。

官方只给了卡牌、遗物、药水的添加接口，除此以外的东西都需要patch添加。建议等待`baselib`。