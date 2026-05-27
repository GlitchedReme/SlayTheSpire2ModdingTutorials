角色和怪物的战斗模型可以从简单贴图一路做到完整 Spine。RitsuLib 的建议是：先用最小的入口跑起来，再按需求升级到状态机或程序化世界视觉。

## 选择入口

| 需求 | 推荐入口 |
| - | - |
| 只换一个打包好的战斗场景 | `CharacterAssetProfile.Scenes.VisualsPath` 或 `MonsterAssetProfile.VisualsScenePath` |
| 非 Spine，只有几张静态图或帧动画 | `VisualCueSet` |
| 需要在代码里生成节点树 | `TryCreateCreatureVisuals()` |
| 自己控制攻击、受击、死亡等状态 | `SetupCustomCombatAnimationStateMachine(...)` |
| 商店、篝火使用不同表现 | `CharacterAssetProfile.WorldProceduralVisuals` |

如果你已经能用 `.tscn` 完成，就不要直接写状态机。状态机只负责“什么时候播哪个动画”，不解决资源路径、节点结构和打包问题。

## VisualCueSet

`VisualCueSet` 适合非 Spine 模型。每个 cue 可以是一张图，也可以是一段帧动画。

```csharp
using STS2RitsuLib.Scaffolding.Characters;
using STS2RitsuLib.Scaffolding.Visuals;

namespace Test.Scripts;

public sealed class TestCharacter
    : ModCharacterTemplate<TestCardPool, TestRelicPool, TestPotionPool>
{
    public override CharacterAssetProfile AssetProfile => new()
    {
        Scenes = new()
        {
            VisualsPath = "res://Test/scenes/characters/test_visuals.tscn",
        },
        VisualCues = ModVisualCues.CueSet()
            .Single("idle", "res://Test/images/character/idle.png")
            .Single("hit", "res://Test/images/character/hit.png")
            .Sequence("attack", seq => seq
                .Frame("res://Test/images/character/attack_01.png", 0.06f)
                .Frame("res://Test/images/character/attack_02.png", 0.06f)
                .Frame("res://Test/images/character/attack_03.png", 0.08f))
            .Single("dead", "res://Test/images/character/dead.png")
            .Build(),
    };
}
```

cue 名称不强制固定，但要和你的状态机请求的动画名一致。比如状态机播放 `"attack"`，就要有对应的 `"attack"` cue。

## 标准非 Spine 状态机

如果你只是想拥有原版常见的 `idle`、`hit`、`attack`、`cast`、`dead`、`relaxed` 状态，可以直接使用 `ModAnimStateMachines.StandardCue`：

```csharp
using Godot;
using MegaCrit.Sts2.Core.Models;
using STS2RitsuLib.Scaffolding.Characters;
using STS2RitsuLib.Scaffolding.Visuals.StateMachine;

namespace Test.Scripts;

public sealed class TestCharacter
    : ModCharacterTemplate<TestCardPool, TestRelicPool, TestPotionPool>
{
    protected override ModAnimStateMachine? SetupCustomCombatAnimationStateMachine(
        Node visualsRoot,
        CharacterModel character)
    {
        return ModAnimStateMachines.StandardCue(
            visualsRoot,
            character,
            idleName: "idle",
            deadName: "dead",
            hitName: "hit",
            attackName: "attack",
            castName: "cast",
            relaxedName: "idle");
    }
}
```

怪物模板也有同名入口：

```csharp
using Godot;
using MegaCrit.Sts2.Core.Models;
using STS2RitsuLib.Scaffolding.Content;
using STS2RitsuLib.Scaffolding.Visuals.StateMachine;

namespace Test.Scripts;

public sealed class TestMonster : ModMonsterTemplate
{
    protected override ModAnimStateMachine? SetupCustomCombatAnimationStateMachine(
        Node visualsRoot,
        MonsterModel monster)
    {
        return ModAnimStateMachines.StandardCue(
            visualsRoot,
            null,
            idleName: "idle",
            deadName: "dead",
            hitName: "hit",
            attackName: "attack");
    }
}
```

返回 `null` 表示继续使用普通原版动画路径。

## 自定义节点树

如果不想维护完整 `.tscn`，也可以在代码里构建视觉节点：

```csharp
using Godot;
using MegaCrit.Sts2.Core.Nodes;
using STS2RitsuLib.Scaffolding.Characters;

namespace Test.Scripts;

public sealed class TestCharacter
    : ModCharacterTemplate<TestCardPool, TestRelicPool, TestPotionPool>
{
    protected override NCreatureVisuals? TryCreateCreatureVisuals()
    {
        var root = new NCreatureVisuals();
        var visuals = new Node2D { Name = "Visuals" };
        var sprite = new Sprite2D
        {
            Texture = ResourceLoader.Load<Texture2D>(
                "res://Test/images/character/idle.png"),
            Position = new Vector2(0, -160),
        };

        visuals.AddChild(sprite);
        root.AddChild(visuals);
        return root;
    }
}
```

代码建节点适合调试或极简单模型。正式角色通常还是推荐 `.tscn`，因为碰撞、位置、挂点和多节点动画在编辑器里更好调。

## 商店和篝火视觉

角色在商店、篝火等世界场景里可以使用程序化 cue，不一定要单独做一个完整场景：

```csharp
using STS2RitsuLib.Scaffolding.Characters;
using STS2RitsuLib.Scaffolding.Characters.Visuals.Definition;

namespace Test.Scripts;

public sealed class TestCharacter
    : ModCharacterTemplate<TestCardPool, TestRelicPool, TestPotionPool>
{
    public override CharacterAssetProfile AssetProfile => new()
    {
        WorldProceduralVisuals = CharacterWorldProceduralVisualSetBuilder.Create()
            .Merchant(cues => cues
                .Single("idle", "res://Test/images/character/merchant_idle.png")
                .Sequence("talk", seq => seq
                    .Frame("res://Test/images/character/merchant_talk_01.png", 0.08f)
                    .Frame("res://Test/images/character/merchant_talk_02.png", 0.08f)
                    .Loop()))
            .RestSite(cues => cues
                .Single("relaxed", "res://Test/images/character/rest_idle.png"))
            .Build(),
    };
}
```

商店和篝火视觉要同时测试“第一次进入房间”和“读档回到房间”。这两个路径实例化节点的时间点不同，最容易暴露漏注册脚本或路径错误。

## Spine 的情况

如果你使用 Spine，通常保持原版命名最省事：

* `idle_loop`
* `attack`
* `cast`
* `hurt`
* `die`
* `relaxed_loop`

需要自定义命名时，再用 `ModAnimStateMachines.Standard(...)` 指定动画名。Spine、Godot `AnimationPlayer`、`AnimatedSprite2D`、cue 帧序列都可以通过统一状态机接入，但不要混用太多套命名。

## 调试建议

* 每个非 Spine 生物至少准备 `idle` 和 `dead`，否则异常状态容易显示空白。
* 攻击和施法动画结束后应回到 `idle`。
* 死亡动画一般不要自动回 `idle`。
* 测试受击、死亡、复活、读档、商店、篝火和战斗结束。
* 看不到模型时先检查 `res://` 路径，再检查场景根节点和脚本注册。
