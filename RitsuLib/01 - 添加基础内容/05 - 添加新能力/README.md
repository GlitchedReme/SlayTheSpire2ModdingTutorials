> 以下示例默认已经在`Entry.Init()`中调用了`RitsuLibFramework.EnsureGodotScriptsRegistered(...)`和`ModTypeDiscoveryHub.RegisterModAssembly(...)`，否则自动注册不会生效。

## 代码

新建类：

```csharp
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Powers;
using MegaCrit.Sts2.Core.GameActions.Multiplayer;
using MegaCrit.Sts2.Core.Models.Cards;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

[RegisterPower]
public class TestPower : ModPowerTemplate
{
    // 类型，Buff或Debuff
    public override PowerType Type => PowerType.Buff;
    // 叠加类型，Counter表示可叠加，Single表示不可叠加
    public override PowerStackType StackType => PowerStackType.Counter;

    // 自定义图标路径。1:1即可。原版游戏大图256x256，小图64x64。
    public override PowerAssetProfile AssetProfile => new(
        IconPath: "res://Test/images/powers/test_power.png",
        BigIconPath: "res://Test/images/powers/test_power.png"
    );

    // 抽牌后给予玩家力量
    public override async Task AfterCardDrawn(PlayerChoiceContext choiceContext, CardModel card, bool fromHandDraw)
    {
        await PowerCmd.Apply<StrengthPower>(Owner, Amount, Owner, null);
        // await PowerCmd.Apply<StrengthPower>(choiceContext, Owner, Amount, Owner, null); // 测试版
    }
}
```

* `[RegisterPower]`会自动注册能力。
* 继承的是`ModPowerTemplate`。
* `AssetProfile`里的`IconPath`和`BigIconPath`分别对应能力的小图和大图。
* 示例演示了`AfterCardDrawn`钩子，你想监听别的时机时，直接继续重写对应方法即可。

## 文本

添加json，`{ModId}/localization/{Language}/powers.json`。

* 通过`ritsulib`添加内容，其id会变成`{modid}_{类别}_{原id}`。例如这里的`modid`是`TEST`,类别是`POWER`。

```json
{
    "TEST_POWER_TEST_POWER.description": "每次抽牌时，获得一点[gold]力量[/gold]。",
    "TEST_POWER_TEST_POWER.smartDescription": "每次抽牌时，获得[blue]{Amount}[/blue]点[gold]力量[/gold]。",
    "TEST_POWER_TEST_POWER.title": "邪火"
}
```

`smartDescription`可以使用`{Amount}`来显示当前层数。

然后使用`PowerCmd.Apply<TestPower>(...)`给予即可。或者使用控制台`power TEST_POWER_TEST_POWER 1 0`。

![alt text](../../../images/image25.png)

## 最终项目参考

```text
Test
├── Scripts
│   ├── Entry.cs
│   └── TestPower.cs
└── Test
    ├── images
    │   └── powers
    │       └── test_power.png
    └── localization
        └── zhs
            └── powers.json
```

## 临时能力

塔2的临时能力有来源显示，于是提供了一个方便的包装。

这个临时能力会在回合结束时自动消失。

其他的图标资源和额外效果等参照上方。

```csharp
using MegaCrit.Sts2.Core.Localization;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.Models.Powers;
using STS2RitsuLib.Combat.Powers;
using STS2RitsuLib.Interop.AutoRegistration;

namespace Test.Scripts;

// 注册power并设置Inherit = true，使得继承这个类的power自动被注册
[RegisterPower(Inherit = true)]
public abstract class TempPower<T> : ModTemporaryAppliedPowerTemplate<T, StrengthPower> where T : AbstractModel
{
    // 自定义图标路径。
    public override PowerAssetProfile AssetProfile => new(
        IconPath: $"res://Test/images/powers/{GetType().Name}.png",
        BigIconPath: $"res://Test/images/powers/{GetType().Name}.png"
    );
    
    // protected override bool IsPositive => false; // 正面效果还是负面

    // protected override bool UntilEndOfOtherSideTurn => false; // 为 true 时，在另一方回合结束时过期；否则在拥有者一方回合结束时过期。

    // protected override int LastForXExtraTurns => 0; // 额外持续回合数

    // 推荐重载描述，以达到多个power共享一条文本的效果
    // 例如这里的文本需要在powers.json中写"TEST_POWER_TEMP_POWER.description"和"TEST_POWER_TEMP_POWER_DOWN.description"
    public override LocString Description => new("powers", IsPositive ? "TEST_POWER_TEMP_POWER.description" : "TEST_POWER_TEMP_POWER_DOWN.description");
}

// 创建多个类标记不同的来源并使用不同的图标。
// 当然如果你所有这种临时能力都用一个图标，取消父类的abstract直接给予TempPower即可。
public class TempFromTestCardPower : TempPower<TestCard>
{
}
```
