你可以使用该功能制作类似`中毒` `灾厄`的血条覆盖层。

![alt text](../../images/image34.png)

## 代码

在你的能力类上添加`IHealthBarForecastSource`接口并重写`GetHealthBarForecastSegments`：

```csharp
using Godot;
using MegaCrit.Sts2.Core.Entities.Creatures;
using MegaCrit.Sts2.Core.Entities.Powers;
using MegaCrit.Sts2.Core.Localization.DynamicVars;
using MegaCrit.Sts2.Core.Models;
using MegaCrit.Sts2.Core.ValueProps;
using STS2RitsuLib.Combat.HealthBars;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

[RegisterPower]
// 实现IHealthBarForecastSource接口以使用该功能
public class TestPower2 : ModPowerTemplate, IHealthBarForecastSource
{
    public override PowerType Type => PowerType.Debuff;
    public override PowerStackType StackType => PowerStackType.Counter;

    public override PowerAssetProfile AssetProfile => new(
        IconPath: "res://RitsuTest/images/powers/test_power.png",
        BigIconPath: "res://RitsuTest/images/powers/test_power.png"
    );

    protected override IEnumerable<DynamicVar> CanonicalVars => [
        new DynamicVar("Weakness", 1.25m)
    ];

    public override decimal ModifyDamageMultiplicative(Creature? target, decimal amount, ValueProp props, Creature? dealer, CardModel? cardSource)
    {
        if (target != Owner || !props.IsPoweredAttack() || Owner.CurrentHp > Amount)
            return 1m;

        return DynamicVars["Weakness"].BaseValue;
    }

    // 实现接口重载
    public IEnumerable<HealthBarForecastSegment> GetHealthBarForecastSegments(HealthBarForecastContext context)
    {
        return HealthBarForecasts.Single(
            context.Creature.GetPowerAmount<TestPower2>(), // 展示的数量（例如如果你的能力有2倍效果可以乘2）
            new Color(0.4f, 0.1f, 0.1f), // 颜色
            HealthBarForecastGrowthDirection.FromLeft // 从左边开始延伸还是右边开始
        // 0, // 顺序，越大越远离血条边缘，默认0
        // PreloadManager.Cache.GetMaterial("res://xxx.tres") // 如果需要自定义材质
        );
    }
}
```

配套的文本`powers.json`：

```json
{
    "TEST_POWER_TEST_POWER2.description": "生命低于阈值时额外受到伤害。",
    "TEST_POWER_TEST_POWER2.smartDescription": "生命低于[blue]{Amount}[/blue]点时额外受到[blue]{Weakness:percentMore()}%[/blue]的伤害。",
    "TEST_POWER_TEST_POWER2.title": "弱点"
}
```