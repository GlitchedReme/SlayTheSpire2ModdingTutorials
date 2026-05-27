`AssetProfile` 是 RitsuLib 管理贴图、场景、材质和音效路径的统一入口。能写在 profile 里的资源，优先写在 profile 里，不要为了换一张图就 patch UI 节点。

## 基本写法

以卡牌为例，继承模板后覆写 `AssetProfile`：

```csharp
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Models.Cards;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

public sealed class TestCard
    : ModCardTemplate(1, CardType.Attack, CardRarity.Common, TargetType.AnyEnemy)
{
    public override CardAssetProfile AssetProfile => new(
        PortraitPath: "res://Test/images/cards/test_card.png",
        EnergyIconPath: "res://Test/images/ui/energy_orange.png",
        FrameMaterialPath: "res://Test/materials/card_frame_orange.tres"
    );
}
```

RitsuLib 只读取你填了的字段。没有填写的字段会继续使用原版、模板或占位角色的回退值。

## 常见 Profile

| 内容 | Profile |
| - | - |
| 卡牌 | `CardAssetProfile` |
| 遗物 | `RelicAssetProfile` |
| 能力 | `PowerAssetProfile` |
| 充能球 | `OrbAssetProfile` |
| 药水 | `PotionAssetProfile` |
| Affliction | `AfflictionAssetProfile` |
| 附魔 | `EnchantmentAssetProfile` |
| Modifier | `ModifierAssetProfile` |
| Act | `ActAssetProfile` |
| 怪物 | `MonsterAssetProfile` |
| 遭遇 | `EncounterAssetProfile` |
| 事件 | `EventAssetProfile` |
| 先古地图与历史记录表现 | `AncientEventPresentationAssetProfile` |
| 休息点选项 | `RestSiteOptionAssetProfile` |
| 时间线 Epoch | `EpochAssetProfile` |
| 角色 | `CharacterAssetProfile` |

已有的基础内容教程会在各自章节里给最小例子；这一章重点是统一规则和回退顺序。

## 角色资源

角色资源最多，`CharacterAssetProfile` 按用途分组。这样比散落很多 override 更容易检查：

```csharp
using STS2RitsuLib.Scaffolding.Characters;

namespace Test.Scripts;

public sealed class TestCharacter : ModCharacterTemplate<TestCardPool, TestRelicPool, TestPotionPool>
{
    public override CharacterAssetProfile AssetProfile => new()
    {
        Scenes = new()
        {
            VisualsPath = "res://Test/scenes/characters/test_visuals.tscn",
            EnergyCounterPath = "res://Test/scenes/ui/test_energy_counter.tscn",
            MerchantAnimPath = "res://Test/scenes/characters/test_merchant.tscn",
            RestSiteAnimPath = "res://Test/scenes/characters/test_rest.tscn",
        },
        Ui = new()
        {
            CharacterSelectIconPath = "res://Test/images/character/select_icon.png",
            CharacterSelectBgPath = "res://Test/images/character/select_bg.png",
            MapMarkerPath = "res://Test/images/character/map_marker.png",
        },
        Vfx = new()
        {
            TrailPath = "res://Test/images/character/trail.png",
        },
        Audio = new()
        {
            AttackSfx = "event:/Test/character_attack",
            CastSfx = "event:/Test/character_cast",
            DeathSfx = "event:/Test/character_death",
        },
    };
}
```

开发期可以先从原版角色借缺失资源：

```csharp
public override string? PlaceholderCharacterId => VanillaCharacterIds.Ironclad;
```

或显式合并：

```csharp
public override CharacterAssetProfile AssetProfile =>
    CharacterAssetProfiles.Merge(
        CharacterAssetProfiles.Ironclad(),
        new CharacterAssetProfile
        {
            Ui = new()
            {
                CharacterSelectIconPath = "res://Test/images/character/select_icon.png",
            },
        });
```

占位回退适合开发期，不适合发布时偷懒。角色选择图、战斗模型、地图标记、能量 UI 这类明显资源最好发布前都换成自己的。

## 覆盖原版角色资源

如果你的 Mod 不是新增角色，而是替换或补充已有角色资源，可以用内容注册器：

```csharp
using STS2RitsuLib;
using STS2RitsuLib.Scaffolding.Characters;

namespace Test.Scripts;

public static class CharacterSkins
{
    public static void Register()
    {
        RitsuLibFramework.GetContentRegistry(Entry.ModId)
            .RegisterCharacterAssetReplacement(
                VanillaCharacterIds.Ironclad,
                new CharacterAssetProfile
                {
                    Ui = new()
                    {
                        CharacterSelectIconPath = "res://Test/images/ironclad/select_icon.png",
                    },
                    Scenes = new()
                    {
                        VisualsPath = "res://Test/scenes/ironclad/visuals.tscn",
                    },
                });
    }
}
```

也可以只覆盖某个角色拿到某张原版牌、遗物、药水时的视觉：

```csharp
var content = RitsuLibFramework.GetContentRegistry(Entry.ModId);

content.RegisterCharacterOwnedRelicVisualOverride(
    characterEntry: VanillaCharacterIds.Ironclad,
    relicModelIdEntry: "BURNING_BLOOD",
    assets: new RelicAssetProfile(
        IconPath: "res://Test/images/relics/burning_blood_skin.png"));
```

这类覆盖会触发运行时资源刷新，适合皮肤、兼容补丁或外部资源包。

## 程序生成场景

大多数情况直接写 `res://...tscn`。如果资源要根据配置或运行时状态决定，再覆写模板里的 factory 方法。

```csharp
using Godot;
using MegaCrit.Sts2.Core.Scenes;
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

public sealed class TestEvent : ModEventTemplate
{
    public override EventAssetProfile AssetProfile => new(
        LayoutScenePath: "res://Test/scenes/events/test_event.tscn",
        BackgroundScenePath: "res://Test/scenes/events/test_event_bg.tscn"
    );

    protected override PackedScene? TryCreateLayoutPackedScene()
    {
        // 返回 null 就继续用 AssetProfile.LayoutScenePath。
        return Entry.UseHolidayLayout ? HolidayScenes.EventLayout : null;
    }
}
```

角色、怪物、遭遇、事件、休息点选项等模板都有类似入口。先用静态路径，静态路径表达不了时再写 factory。

## 路径规则

* Mod 自己的资源写 `res://{ModId}/...`，其中 `{ModId}` 是打进 pck 的资源目录名。
* 文件必须真的被导出进 pck。`.bank`、`GUIDs.txt`、自定义 `.json`、`.tres` 等非 Godot 资源需要检查导出预设。
* 路径大小写要和实际文件一致，尤其是发给非 Windows 玩家时。
* 不要写编辑器临时路径，也不要写你电脑上的绝对路径。
* 场景里挂了 C# 脚本时，初始化阶段要调用 `RitsuLibFramework.EnsureGodotScriptsRegistered(...)`。

## 发布前检查

资源路径缺失时，RitsuLib 会尽量记录警告并使用可用回退。卡牌、遗物这类通常有比较安全的回退；角色、怪物、场景类资源回退更少，缺失时应当视为发布阻断问题。

建议每次发布前检查：

* 进一场战斗，确认卡牌、能力、遗物、药水图标都显示。
* 进入角色选择、地图、商店、篝火、战斗、死亡或胜利界面，确认角色资源没有漏。
* 开启控制台或查看日志，搜索 `Asset`、`missing`、`path`、`RitsuLib` 等关键字。
* 用干净的打包文件测试一次，不要只在 Godot 编辑器或开发目录里测试。
