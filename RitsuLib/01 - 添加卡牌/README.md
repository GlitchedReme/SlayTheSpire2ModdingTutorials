> 以下示例默认你已经在`Entry.Init()`中启用了`RitsuLib`的自动注册，否则`[RegisterCard]`之类的attribute不会生效（详见第0章）：

```csharp
var assembly = Assembly.GetExecutingAssembly();
RitsuLibFramework.EnsureGodotScriptsRegistered(assembly, Logger);
ModTypeDiscoveryHub.RegisterModAssembly(ModId, assembly);
```

## 代码

创建一个新的`Cards`文件夹方便管理，并创建新的`cs`文件，例如`TestCard.cs`。

```csharp
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.HoverTips;
using MegaCrit.Sts2.Core.Localization.DynamicVars;
using MegaCrit.Sts2.Core.Models.Cards;
using MegaCrit.Sts2.Core.ValueProps;
using STS2RitsuLib.Cards.DynamicVars;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Keywords;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

// 注册卡牌
[RegisterCard(typeof(TestCardPool))]
// 注册成人物起始卡。不需要删除即可。
[RegisterCharacterStarterCard(typeof(TestCharacter), 5)]
public class TestCard : ModCardTemplate
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

    public override string PortraitPath => $"res://Test/images/cards/{GetType().Name}.png";

    // 卡牌基础数值
    protected override IEnumerable<DynamicVar> CanonicalVars => [
        new DamageVar(12, ValueProp.Move)
    ];

    public TestCard() : base(energyCost, type, rarity, targetType, shouldShowInCardLibrary)
    {
    }

    // 打出时的效果逻辑
    protected override async Task OnPlay(PlayerChoiceContext choiceContext, CardPlay cardPlay)
    {
        await DamageCmd.Attack(DynamicVars.Damage.BaseValue)
            .FromCard(this)
            .Targeting(cardPlay.Target!)
            .Execute(choiceContext);
    }

    // 升级后的效果逻辑
    protected override void OnUpgrade()
    {
        DynamicVars.Damage.UpgradeValueBy(4);
    }
}
```

* `[RegisterCard(typeof(TestCardPool))]`会把这张卡自动注册进指定卡池。

* `[RegisterCharacterStarterCard(typeof(TestCharacter), 5)]`会把它自动登记成该角色的起始卡组内容。如果你不是做起始卡，删掉这行即可。

* `CanonicalVars`翻译是“规范值”，指卡牌的基础数值。添加一个`DamageVar`意为指定卡牌的基础伤害是多少，例如这里是`12`。

* `ValueProp`表示数值的属性，例如`ValueProp.Move`表示是通过卡牌造成的伤害/格挡，`ValueProp.Unpowered`表示不受修正影响（如力量等），`ValueProp.Unblockable`表示伤害不可被格挡，`ValueProp.SkipHurtAnim`表示跳过受伤动画。这是一个bitflag类型的枚举，你可以进行组合，例如`ValueProp.Unblockable | ValueProp.Unpowered`，不可被格挡也不受修正影响。

* 尖塔2使用了`async`和`await`来控制效果逻辑顺序执行，比如选择一张牌时就一直`await`不让后续代码执行，和尖塔1的`action`类似的生态位。此处的`OnPlay`中写了一个造成单体伤害的指令。

* 想做什么样的卡牌，看原版代码哪张有类似的效果，参考即可。

* 继承`ModCardTemplate`而不是`CardModel`。
* <b>注意</b>：通过`ritsulib`添加卡牌，其id会变成`{modid}_CARD_{原卡牌id}`，例如原始卡牌id为`TEST_CARD`，是`TestCard`的大写snake-case，最后变成`TEST_TEST_CARD`。

## 卡图

和`BaseLib`一样，可以直接重写`PortraitPath`指定路径：

```csharp
public override string PortraitPath => $"res://Test/images/cards/{GetType().Name}.png";
```

如果你按这行代码写，文件名就对应`Test/images/cards/TestCard.png`。这里的`res://Test/...`是Godot资源路径，对应的是你的资源文件夹名字。

记得修改`Test`为你的`modid`。`modId`即为你`{modId}.json`中填写的。<b>不是你的根目录，而是一个新文件夹。</b>

卡图任意尺寸都可，且不需要裁剪，官方使用的尺寸是普通卡250x190，先古卡250x351。

![示例卡图](../../images/image10.png)

如果你想统一管理卡图路径，也可以额外写一个抽象基类，例如`TestCardModel.cs`，然后其他卡牌类继承这个类即可。

```csharp
using MegaCrit.Sts2.Core.Entities.Cards;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

public abstract class TestCardModel : ModCardTemplate
{
    public override string PortraitPath => $"res://Test/images/cards/{GetType().Name}.png";

    public TestCardModel(int energyCost, CardType type, CardRarity rarity, TargetType targetType, bool shouldShowInCardLibrary)
        : base(energyCost, type, rarity, targetType, shouldShowInCardLibrary)
    {
    }
}
```

## 文本

此外还需要本地化文件。创建一个`{modId}/localization/{Language}/cards.json`。
* `modId`即为你`{modId}.json`中填写的。<b>不是你的根目录，而是一个新文件夹。</b>

* `Language`可以写`zhs`表示简体中文。填写`{CardId}.title`（卡牌名）和`{CardId}.description`（卡牌描述）：

* 通过`ritsulib`添加内容，其id会变成`{modid}_{类别}_{原id}`。例如这里的`modid`是`TEST`,类别是`CARD`。

```json
{
    "TEST_CARD_TEST_CARD.title": "测试卡牌",
    "TEST_CARD_TEST_CARD.description": "造成{Damage:diff()}点伤害。"
}
```

* `{Damage:diff()}`对应前面的`DamageVar`。

编译打包`dll`和`pck`后打开游戏。如果你在对应池子中看到卡牌说明成功了。如果没有任何卡牌（或者一张在左上角的卡牌）说明出问题了。

按`~`打开控制台输入`card TEST_CARD_TEST_CARD`获得这张卡。

![示例卡牌](../../images/image11.png)

## 最终项目参考

如果报错，回头看看。最终项目结构参考：

```
Test (你的项目文件夹)
├── Scripts (你的脚本文件夹，随意)
│   ├── TestCard.cs (或者套一层Cards文件夹)
│   └── Entry.cs
└── Test (不要忘了这一层文件夹，是你的modid)
    ├── images
    │   └── cards
    │       └── TestCard.png
    └── localization
        └── zhs
            └── cards.json
```