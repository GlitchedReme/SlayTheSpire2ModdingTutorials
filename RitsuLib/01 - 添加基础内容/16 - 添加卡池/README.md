> 以下示例默认你已经在`Entry.Init()`中启用了`RitsuLib`的自动注册，否则`[RegisterCharacter]`之类的attribute不会生效（详见第0章）。

## 人物卡池

参考添加人物一章：

`TestCardPool.cs`:
```csharp
using Godot;
using STS2RitsuLib.Scaffolding.Content;
using STS2RitsuLib.Utils;

namespace Test.Scripts;

public class TestCardPool : TypeListCardPoolModel
{
    // 卡池的ID。必须唯一防撞车。
    public override string Title => "test";
    public override string EnergyColorName => "test";

    // 描述中使用的能量图标。大小为24x24。
    public override string? TextEnergyIconPath => "res://Test/images/energy_test.png";
    // tooltip和卡牌左上角的能量图标。大小为74x74。
    public override string? BigEnergyIconPath => "res://Test/images/energy_test_big.png";

    // 卡池的主题色。
    public override Color DeckEntryCardColor => new(0.5f, 0.5f, 1f);
    // 能量表盘文字轮廓颜色
    public override Color EnergyOutlineColor => new(0.5f, 0.5f, 1f);
    // 如果你想用原版卡框换色，加这两行
    private static readonly Material? _poolFrameMaterial = MaterialUtils.CreateRgbShaderMaterial(0.5f, 0.5f, 1f);
    // 如果你是自定义卡框，上面一行换成这个
    // private static readonly Material? _poolFrameMaterial = MaterialUtils.CreateUnmodulatedHsvShaderMaterial();
    public override Material? PoolFrameMaterial => _poolFrameMaterial;

    // 卡池是否是无色。例如事件、状态等卡池就是无色的。
    public override bool IsColorless => false;
}
```

其中的`PoolFrameMaterial`是对所有注册在其中的卡牌生效的，除非卡牌自己指定了`FrameMaterial`。

然后写在人物的泛型里即可：

```csharp
public class TestCharacter : ModCharacterTemplate<TestCardPool, TestRelicPool, TestPotionPool>
```

## 通用卡池

在卡池类上添加一个`[RegisterSharedCardPool]`。

```csharp
[RegisterSharedCardPool]
public class MultiClassSharedPool : TypeListCardPoolModel
{
}
```

这种方式默认不会出现在图鉴里。如果需要出现在图鉴，在你的初始化函数`Entry.Init`中写：

```csharp
    ModContentRegistry.For(ModId)
        .RegisterCardLibraryCompendiumSharedPoolFilter<MultiClassSharedPool>(
            "reme_multiclass_shared_pool", // ID
            "res://icon.svg" // 图标位置
            // null // 放置顺序（可选）
        );
```

如果你想在图鉴里悬浮图标时显示额外文字，在`{modId}/localization/{Language}/card_library.json`中写：

其中的ID为`{ModId}_POOLFILTER_{ID}`，ID是我们刚刚代码写入的大写形式。

```json
{
    "REME_MOD_POOLFILTER_REME_MULTICLASS_SHARED_POOL": "多职业共享池。"
}
```