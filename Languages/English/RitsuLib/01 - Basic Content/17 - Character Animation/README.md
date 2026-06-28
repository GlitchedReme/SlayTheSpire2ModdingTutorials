There are several quick ways to set up character animation.

All the code below goes inside the character class.

## VisualCueSet and state machine (static images or frame animation)

`VisualCueSet` is suited for static images or frame animations. Each cue can be a single image or a sequence of frame animations.

When using this system, it is still recommended to keep `VisualsPath` and `TryCreateCreatureVisuals`. Additionally, your scene needs at least one `Sprite2D` type node (e.g., change `Visuals` to that type).

```csharp
using MegaCrit.Sts2.Core.Nodes.Combat;
using STS2RitsuLib.Scaffolding.Characters;
using STS2RitsuLib.Scaffolding.Godot;
using STS2RitsuLib.Scaffolding.Visuals;

namespace Test.Scripts;

public sealed class TestCharacter
    : ModCharacterTemplate<TestCardPool, TestRelicPool, TestPotionPool>
{
    public override CharacterAssetProfile AssetProfile => new( // If you use the Ironclad merge approach from the Characters chapter, you can keep that writing style
        Scenes: new(
            VisualsPath: "res://Test/scenes/characters/test_visuals.tscn" // must be kept
        ),
        VisualCues: ModVisualCues.CueSet()
            // idle animation uses a single image
            .Single("idle", "res://Test/images/character/idle.png")
            .Single("hit", "res://Test/images/character/hit.png", 0.5f) // lasts 0.5 seconds
            // .Single("hit", "res://Test/images/character/hit.png") // or permanent switch
            // attack animation uses frame animation
            .Sequence("attack", seq => seq
                .Frame("res://Test/images/character/attack_01.png", 0.06f)
                .Frame("res://Test/images/character/attack_02.png", 0.06f)
                .Frame("res://Test/images/character/attack_03.png", 0.08f))
            .Single("dead", "res://Test/images/character/dead.png")
            .Build() // must call build once at the end
    );

    protected override NCreatureVisuals? TryCreateCreatureVisuals() => RitsuGodotNodeFactories.CreateFromScenePath<NCreatureVisuals>(AssetProfile.Scenes!.VisualsPath!); // must be kept
}
```

If you simply want the common vanilla states `idle`, `hit`, `attack`, `cast`, `dead`, `relaxed`, you can directly use `ModAnimStateMachines.StandardCue`:

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

Here `idle` and `relaxed` loop by default; all other animations automatically return to `idle` after finishing.

Characters in world scenes like shops and rest sites can also use procedural cues — there's no need to create a full scene for each:

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

## Auto scene conversion (Spine animation or custom animation types)

If you don't want to maintain a full `.tscn`, you can use auto scene conversion in code. This approach only requires your scene structure to match the vanilla one, with no extra configuration needed.

This is also the approach used in the tutorial.

```csharp
using Godot;
using MegaCrit.Sts2.Core.Nodes.Combat;
using STS2RitsuLib.Scaffolding.Characters;
using STS2RitsuLib.Scaffolding.Godot;

namespace Test.Scripts;

public sealed class TestCharacter
    : ModCharacterTemplate<TestCardPool, TestRelicPool, TestPotionPool>
{
    protected override NCreatureVisuals? TryCreateCreatureVisuals() => RitsuGodotNodeFactories.CreateFromScenePath<NCreatureVisuals>(AssetProfile.Scenes!.VisualsPath!);
}
```

## Animation state machine (adding extra animation names)

### CreatureAnimator

If using Spine animation, configure via `SetupCustomCreatureAnimator`. For example, below is adding a shiv action animation for Silent:

```csharp
    protected override CreatureAnimator? SetupCustomCreatureAnimator(MegaSprite controller)
    {
        // Set animation name and whether it loops
        AnimState animState = new("idle", isLooping: true);
        AnimState animState2 = new("cast");
        AnimState animState3 = new("attack");
        AnimState animState4 = new("hurt");
        AnimState state = new("die");
        AnimState animState5 = new("shiv"); // new
        AnimState animState6 = new("relaxed", isLooping: true);

        // Set auto transition after playing; here all return to idle
        animState2.NextState = animState;
        animState3.NextState = animState;
        animState4.NextState = animState;
        animState5.NextState = animState;
        animState6.AddBranch("Idle", animState);

        // Bind animation names
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

To play it, use `await CreatureCmd.TriggerAnim(Owner.Creature, "Shiv", Owner.Character.CastAnimDelay);` or specify it when attacking:

```csharp
await DamageCmd.Attack(DynamicVars.Damage.BaseValue).WithAttackerAnim("Shiv", 0.5f)
```

### AnimationStateMachine

Use `SetupCustomCombatAnimationStateMachine` for an animation state machine that can simultaneously extend Spine, static images, and frame animations.

Below creates a state machine with the same effect as above, with consistent playback logic.

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

        // Map states to Cue animation names set above
        builder.AddAnyState("Idle", "idle");
        builder.AddAnyState("Dead", "dead");
        builder.AddAnyState("Hit", "hit");
        builder.AddAnyState("Attack", "attack");
        builder.AddAnyState("Cast", "cast");
        builder.AddAnyState("Relaxed", "relaxed");
        builder.AddAnyState("Shiv", "shiv");
        // return builder.BuildSpine(spineBody); // Create Spine animation. Need to find the spine node from visualsRoot; for Spine, using CreatureAnimator is still recommended
        return builder.BuildForVisualsRoot(visualsRoot, character); // Create frame animation.
    }   
```
