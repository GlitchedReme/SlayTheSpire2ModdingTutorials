## VFX Instantiation and Playback

Once your VFX is built, you need to figure out how to play it.

The game uses methods like `AttackCommand.WithHitFX()` to play effects. We don't recommend using these because they can only play effects from vanilla game paths — your mod's effects are in a subdirectory. Not unless you patch the game or use a framework.

Also, the game's scene cache strategy clears non-vanilla scenes, so you're better off implementing your own approach.

### Using a Utility Class for Instantiation

Create a `VFXUtil` utility class for a unified instantiation entry point, loading from your mod's own cache first:

```csharp
public static class VFXUtil {
    // Mod-independent scene cache (avoids being cleared by PreloadManager)
    public static readonly ConcurrentDictionary<string, PackedScene> ModSceneCache = new();

    public static Node2D GenVFXNode(string scenePath) {
        if (ModSceneCache.TryGetValue(scenePath, out var modScene)) {
            return modScene.Instantiate<Node2D>();
        }
        return PreloadManager.Cache.GetScene(scenePath).Instantiate<Node2D>();
    }

    public static T GenVFXNode<T>(string scenePath) where T : Node2D {
        if (ModSceneCache.TryGetValue(scenePath, out var modScene)) {
            return modScene.Instantiate<T>();
        }
        return PreloadManager.Cache.GetScene(scenePath).Instantiate<T>();
    }
    
    public static Node2D? PlaySimple(string scenePath, Vector2 position, float lifetime = 2f) {
        if (!TestMode.IsOn && NCombatRoom.Instance != null) {
            Node2D node2D = GenVFXNode(scenePath);
            NCombatRoom.Instance.CombatVfxContainer.AddChildSafely(node2D);
            node2D.GlobalPosition = position;
            
            // Create a timer; destroy after timeout
            SceneTreeTimer timer = node2D.GetTree().CreateTimer(lifetime);
            timer.Timeout += () => {
                if (GodotObject.IsInstanceValid(node2D)) {
                    node2D.QueueFreeSafely();
                }
            };
            return node2D;
        }
        return null;
    }
}
```

`VFXUtil.PlaySimple()` instantiates a node and auto-destroys it after the given time (in seconds), saving you the step of writing a destroy script.

```csharp
// Usage
VFXUtil.PlaySimple("res://YourMod/scenes/vfx/glow.tscn", position, 2f);
```
**Advanced usage example** (factory method):
If your effect has a custom script attached, use `GenVFXNode<T>()` for more precise instantiation and position control.

Here's how the Pillars of Creation animation is created in the All-Star Regent mod (needs to appear behind the character and not be destroyed):

```csharp
public static Pillar? Spawn(Creature creature, Vector2 position) {
    if (TestMode.IsOn) return null;

    var pillar = VFXUtil.GenVFXNode<Pillar>("res://YourMod/scenes/vfx/pillar.tscn");
    Node? parent = NCombatRoom.Instance?.BackCombatVfxContainer;
    if (parent == null) {
        Logger.Warn("[Pillar] No BackCombatVfxContainer available");
        pillar.QueueFree();
        return null;
    }
    
    parent.AddChildSafely(pillar);
    pillar.Create(position); // Trigger animation logic
    return pillar;
}
```


### Scene Caching and Auto-Destroy

Without a cache, every effect stutters the first time it plays.

#### Why a separate mod cache?

STS2's `PreloadManager` cache calls `UnloadAssets()` on scene transitions, keeping only vanilla effects. This unexpectedly clears mod VFX scenes.

We can solve this with HarmonyPatch, but that's complex and not covered here. Instead, we create a simple independent cache:

```csharp
public static readonly ConcurrentDictionary<string, PackedScene> ModSceneCache = new();
```

#### Preloading Scenes

Preload all VFX scenes during mod initialization (in Entry.cs):

```csharp
static void LoadScenes() {
    // Your list of scene paths
    var paths = new List<string> {
        "res://.../my_effect_1.tscn",
        "res://.../my_effect_2.tscn",
        "res://.../my_effect_3.tscn",
        "res://.../my_effect_4.tscn",
    };
    foreach (var path in paths) {
        if (ModSceneCache.ContainsKey(path)) continue;
        var scene = ResourceLoader.Load<PackedScene>(path, null, ResourceLoader.CacheMode.Reuse);
        if (scene != null) {
            ModSceneCache[path] = scene;
        }
    }
}
```

### VFX Position Reference
To understand where to place VFX, you need to know the structure of NCombatRoom in the game.


#### Scene Structure

```
NCombatRoom (Control)
├── %CombatUi                    // UI layer
├── %CombatSceneContainer        // Scene container
│   ├── %AllyContainer           // Ally container (left side)
│   │   └── NCreature (Player)   // Player character node
│   │       ├── Body             // Body/visual node
│       ├── Visuals              // Visual container
│       ├── Hitbox               // Click area
│       ├── IntentContainer      // Intent display
│       └── OrbManager           // Orb manager
│   ├── %EnemyContainer          // Enemy container (right side)
│   │   └── NCreature (Enemy)    // Enemy character node
│   └── EncounterSlots           // Encounter scene slots (if any)
├── %BgContainer                 // Background container (ZIndex = -20)
├── %BackCombatVfxContainer      // Back VFX container
├── %CombatVfxContainer          // Front VFX container (ZIndex = -9)
└── RadialBlur                   // Radial blur effect
```

**Choosing the right container**:

- **Front VFX** (`CombatVfxContainer`): Short-lived attack effects, hit effects, particle bursts. Need to appear above characters.
- **Back VFX** (`BackCombatVfxContainer`): Persistent status effects, background elements. Need to appear behind characters.

If VFX elements also need layered ordering among themselves, adjust ZIndex in code.

```csharp
// Front VFX - throwing knife
Node? parent = NCombatRoom.Instance?.CombatVfxContainer;
parent.AddChildSafely(blade);

// Back VFX - black hole
Node? backVfx = NCombatRoom.Instance?.BackCombatVfxContainer;
backVfx.AddChildSafely(blackhole);
```

#### Getting Character Position

```csharp
// Get the character node
NCreature? ownerNode = NCombatRoom.Instance?.GetCreatureNode(owner);

// Get VFX spawn position (creature's center)
Vector2 spawnPos = ownerNode.VfxSpawnPosition;

// Get character's global position (usually at the character's feet)
Vector2 globalPos = ownerNode.GlobalPosition;

```

#### Getting Character Facing Direction

When fighting the giant crab boss, characters may face left. If your VFX needs to appear in front of / behind the character, you need to dynamically check facing direction.

Here's a utility method for VFXUtil:

```csharp
//VFXUtil.cs
public static bool IsCharacterFacingRight(Creature creature) {
    Node2D? body = NCombatRoom.Instance?.GetCreatureNode(creature)?.Body;
    if (body == null) return true;
    return body.Scale.X > 0;
}

// Get character facing (for mirror flipping)
bool facingRight = VFXUtil.IsCharacterFacingRight(creature);
int xFac = facingRight ? 1 : -1;
// Play VFX in front of the character
Vector2 position = Creature.VfxSpawnPosition + new Vector2(100f * xFac, 0f);
// Play VFX...
```
