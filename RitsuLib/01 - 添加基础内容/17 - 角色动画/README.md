角色动画有多种快速建立的方式。

以下代码都在人物类里编写。

## VisualCueSet 和状态机（静态图或帧动画）

`VisualCueSet` 适合静态图或帧动画。每个 cue 可以是一张图，也可以是一段帧动画。

使用该系统仍然推荐保留`VisualsPath`和`TryCreateCreatureVisuals`。另外你的场景需要至少有一个`Sprite2D`类型的节点（例如把`Visuals`改成该类型）。

```csharp
using STS2RitsuLib.Scaffolding.Characters;
using STS2RitsuLib.Scaffolding.Visuals;

namespace Test.Scripts;

public sealed class TestCharacter
    : ModCharacterTemplate<TestCardPool, TestRelicPool, TestPotionPool>
{
    public override CharacterAssetProfile AssetProfile => new( // 如果你用人物那章和ironclad merge的用法可以保留你的写法
        Scenes: new(
            VisualsPath = "res://Test/scenes/characters/test_visuals.tscn", // 需要保留
        ),
        VisualCues: ModVisualCues.CueSet()
            // idle动画使用单图
            .Single("idle", "res://Test/images/character/idle.png")
            .Single("hit", "res://Test/images/character/hit.png")
            // .Single("hit", "res://Test/images/character/hit.png", 0.5f) // 对于ritsulib0.3.9及以上版本，可以设置单图的持续时间
            // attack动画使用帧动画
            .Sequence("attack", seq => seq
                .Frame("res://Test/images/character/attack_01.png", 0.06f)
                .Frame("res://Test/images/character/attack_02.png", 0.06f)
                .Frame("res://Test/images/character/attack_03.png", 0.08f))
            .Single("dead", "res://Test/images/character/dead.png")
            .Build(), // 最后需要调用一次build
    )

    protected override NCreatureVisuals? TryCreateCreatureVisuals() => RitsuGodotNodeFactories.CreateFromScenePath<NCreatureVisuals>(AssetProfile.Scenes!.VisualsPath!); // 需要保留
    };
}
```

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
            relaxedName: "relaxed");
    }
}
```

这里`idle`和`relaxed`默认是循环的，其他动画播放结束后自动回到`idle`。

> 对于0.3.9版本以下，单帧`Single`或者单帧`Sequence`无法设置持续时间，所以如果你都用静态帧的话推荐用0.3.9版本以上的`RitsuLib`。

> 0.3.9版本以上，单图动画可以设置持续时间，例如`Single("hit", "res://Test/images/character/hit.png", 0.5f)`。

角色在商店、篝火等世界场景里也可以使用程序化 cue，不一定要单独做一个完整场景：

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

## 场景自动转换（spine动画或自定义种类动画）

如果不想维护完整 `.tscn`，也可以在代码里使用自动场景转换，这种方式只需要你的场景结构和原版一致，不需要额外配置。

也是教程使用的方式。

```csharp
using Godot;
using MegaCrit.Sts2.Core.Nodes;
using STS2RitsuLib.Scaffolding.Characters;

namespace Test.Scripts;

public sealed class TestCharacter
    : ModCharacterTemplate<TestCardPool, TestRelicPool, TestPotionPool>
{
    protected override NCreatureVisuals? TryCreateCreatureVisuals() => RitsuGodotNodeFactories.CreateFromScenePath<NCreatureVisuals>(AssetProfile.Scenes!.VisualsPath!);
}
```

## 动画状态机（额外的动画名添加）

### CreatureAnimator

如果你使用spine动画，通过`SetupCustomCreatureAnimator`设置。例如以下是猎人额外加个小刀动作的动画：

```csharp
    protected override CreatureAnimator? SetupCustomCreatureAnimator(MegaSprite controller)
    {
        // 设定动画名和是否循环播放
        AnimState animState = new("idle", isLooping: true);
        AnimState animState2 = new("cast");
        AnimState animState3 = new("attack");
        AnimState animState4 = new("hurt");
        AnimState state = new("die");
        AnimState animState5 = new("shiv"); // new
        AnimState animState6 = new("relaxed", isLooping: true);

        // 设定播放后自动跳转，例如这里都是返回idle
        animState2.NextState = animState;
        animState3.NextState = animState;
        animState4.NextState = animState;
        animState5.NextState = animState;
        animState6.AddBranch("Idle", animState);

        // 绑定播放动画名
        CreatureAnimator creatureAnimator = new(animState, controller);
        creatureAnimator.AddAnyState("Idle", animState);
        creatureAnimator.AddAnyState("Dead", state);
        creatureAnimator.AddAnyState("Hit", animState4);
        creatureAnimator.AddAnyState("Attack", animState3);
        creatureAnimator.AddAnyState("Cast", animState2);
        creatureAnimator.AddAnyState("Shiv", animState5); // new
        creatureAnimator.AddAnyState("Relaxed", animState6);
        return creatureAnimator;
    }
```

要播放，可以使用`await CreatureCmd.TriggerAnim(Owner.Creature, "Shiv", Owner.Character.CastAnimDelay);`或者在攻击时指定：

```csharp
await DamageCmd.Attack(DynamicVars.Damage.BaseValue).WithAttackerAnim("Shiv", 0.5f)
```

### AnimationStateMachine

使用`SetupCustomCombatAnimationStateMachine`动画状态机控制可同时扩展spine、静态图和帧动画。

以下创建和上面效果相同的状态机，播放逻辑一致。

```csharp
    protected override ModAnimStateMachine? SetupCustomCombatAnimationStateMachine(
            Node visualsRoot,
            CharacterModel character)
    {
        var builder = ModAnimStateMachineBuilder.Create()
            .AddState("Idle", loop: true).AsInitial().Done()
            .AddState("Attack").WithNext("Idle").Done()
            .AddState("Cast").WithNext("Idle").Done()
            .AddState("Hit").WithNext("Idle").Done()
            .AddState("Dead").Done()
            .AddState("Relaxed", loop: true).Done()
            .AddState("Shiv").WithNext("Idle").Done();

        // 映射 状态到上面设置的Cue动画名
        builder.AddAnyState("Idle", "idle");
        builder.AddAnyState("Dead", "dead");
        builder.AddAnyState("Hit", "hit");
        builder.AddAnyState("Attack", "attack");
        builder.AddAnyState("Cast", "cast");
        builder.AddAnyState("Relaxed", "relaxed");
        builder.AddAnyState("Shiv", "shiv");
        // return builder.BuildSpine(spineBody); // 创建spine动画。需要根据visualsRoot找到spine节点，使用spine还是推荐使用CreatureAnimator
        return builder.BuildForVisualsRoot(visualsRoot, character); // 创建帧动画。
    }   
```