---
title: 04-14 添加新人物
date: 2026-04-21 00:00:00
permalink: docs/04-ritsulib/04-14-add-new-character/
categories:
- Basics
---
添加新人物过于麻烦了，于是单开一章。

> 以下示例默认你已经在`Entry.Init()`中启用了`RitsuLib`的自动注册，否则`[RegisterCharacter]`之类的attribute不会生效（详见第0章）：

```csharp
var assembly = Assembly.GetExecutingAssembly();
RitsuLibFramework.EnsureGodotScriptsRegistered(assembly, Logger);
ModTypeDiscoveryHub.RegisterModAssembly(ModId, assembly);
```

## 创建池子

需要创建人物独有的卡牌、药水、遗物池各一个。

`TestCardPool.cs`:
```csharp
using Godot;
using STS2RitsuLib.Scaffolding.Content;

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
    // 如果你想用原版卡框换色，加这两行。这里是hsv而不是rgb颜色
    private static readonly Material? _poolFrameMaterial = MaterialUtils.CreateHsvShaderMaterial(0.67f, 0.5f, 1f);
    public override Material? PoolFrameMaterial => _poolFrameMaterial;

    // 卡池是否是无色。例如事件、状态等卡池就是无色的。
    public override bool IsColorless => false;
}
```

`TestRelicPool.cs`:

```csharp
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

public class TestRelicPool : TypeListRelicPoolModel
{
    // 描述中使用的能量图标。大小为24x24。
    public override string? TextEnergyIconPath => "res://Test/images/energy_test.png";
    // tooltip和卡牌左上角的能量图标。大小为74x74。
    public override string? BigEnergyIconPath => "res://Test/images/energy_test_big.png";

    public override string EnergyColorName => "test";
}
```

`TestPotionPool.cs`:

```csharp
using STS2RitsuLib.Scaffolding.Content;

namespace Test.Scripts;

public class TestPotionPool : TypeListPotionPoolModel
{
    // 描述中使用的能量图标。大小为24x24。
    public override string? TextEnergyIconPath => "res://Test/images/energy_test.png";
    // tooltip和卡牌左上角的能量图标。大小为74x74。
    public override string? BigEnergyIconPath => "res://Test/images/energy_test_big.png";

    public override string EnergyColorName => "test";
}
```

<b>当你创建你自己人物的池子时，不要忘了把你的卡牌药水遗物等（比如打击）的注册目标改成你的池子</b>，例如：

```csharp
// 加入哪个卡池
[RegisterCard(typeof(TestCardPool))]
public class TestCard : ModCardTemplate
```

## 初始遗物和卡牌升级

`古老牙齿`可以把一张初始卡变成先古升级。在初始化函数(`Entry.Init`)里注册：

```csharp
RitsuLibFramework.RegisterArchaicToothTranscendenceMapping<TestCard, Shiv>();
```

第一个类型参数是你的初始卡，第二个类型参数是被升级成的卡。

`欧洛巴斯之触`可以把初始遗物升级。同样在初始化函数里注册映射：

```csharp
RitsuLibFramework.RegisterTouchOfOrobasRefinementMapping<TestRelic, Akabeko>();
```

`尘封魔典`可以获得一张先古卡。这个结果是从你池子里选出所有先古卡，然后去除`古老牙齿`的那张得到的。所以只需再创建一张先古卡即可。

## 创建人物

人物需要极其大量的资源。`RitsuLib`里直接继承`ModCharacterTemplate<卡池,遗物池,药水池>`即可。你没有的资源直接注释掉以使用原版。教程提供的资源在最下方。

```csharp
using Godot;
using MegaCrit.Sts2.Core.Entities.Characters;
using MegaCrit.Sts2.Core.Models.Relics;
using STS2RitsuLib.Data.Models;
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Scaffolding.Characters;

namespace Test.Scripts;

[RegisterCharacter]
public class TestCharacter : ModCharacterTemplate<TestCardPool, TestRelicPool, TestPotionPool>
{
    // 角色名称颜色
    public override Color NameColor => new(0.5f, 0.5f, 1f);
    // 能量图标轮廓颜色
    public override Color EnergyLabelOutlineColor => new(0.5f, 0.5f, 1f);

    // 人物性别（男女中立）
    public override CharacterGender Gender => CharacterGender.Masculine;

    // 初始血量和金币
    public override int StartingHp => 80;
    public override int StartingGold => 99;

    public override CharacterAssetProfile AssetProfile => CharacterAssetProfiles.Merge(
        CharacterAssetProfiles.Ironclad(),
        new(
            Scenes: new(
                // 人物模型tscn路径。
                VisualsPath: "res://Test/scenes/test_character.tscn",
                // 能量表盘tscn路径。
                EnergyCounterPath: "res://Test/scenes/test_energy_counter.tscn",
                // 商店人物场景。
                MerchantAnimPath: "res://Test/scenes/test_character_merchant.tscn"
                // 篝火休息场景。
                // RestSiteAnimPath: "res://Test/scenes/test_character_rest_site.tscn"
            ),
            Ui: new(
                // 人物头像路径。
                IconTexturePath: "res://icon.svg",
                // 人物头像2号。
                // IconPath: "res://scenes/ui/character_icons/ironclad_icon.tscn",
                // 人物选择背景。
                CharacterSelectBgPath: "res://Test/scenes/test_bg.tscn",
                // 人物选择图标。
                CharacterSelectIconPath: "res://Test/images/char_select_test.png",
                // 人物选择图标-锁定状态。
                CharacterSelectLockedIconPath: "res://Test/images/char_select_test_locked.png"
                // 人物选择过渡动画。
                // CharacterSelectTransitionPath: "res://materials/transitions/ironclad_transition_mat.tres",
                // 地图上的角色标记图标、表情轮盘上的角色头像
                // MapMarkerPath: null
            ),
            Vfx: new(
                // 卡牌拖尾场景。
                // TrailPath: "res://scenes/vfx/card_trail_ironclad.tscn"
            ),
            Audio: new(
                // 攻击音效
                // AttackSfx: null,
                // 施法音效
                // CastSfx: null,
                // 死亡音效
                // DeathSfx: null,
                // 角色选择音效
                // CharacterSelectSfx: null,
                // 过渡音效
                // CharacterTransitionSfx: "event:/sfx/ui/wipe_ironclad"
            ),
            Multiplayer: new(
                // 多人模式-手指。
                // ArmPointingTexturePath: null,
                // 多人模式剪刀石头布-石头。
                // ArmRockTexturePath: null,
                // 多人模式剪刀石头布-布。
                // ArmPaperTexturePath: null,
                // 多人模式剪刀石头布-剪刀。
                // ArmScissorsTexturePath: null
            )));

    // 攻击和施法动画延迟，以对齐动画
    public override float AttackAnimDelay => 0f;
    public override float CastAnimDelay => 0f;

    // 自动转换人物场景，让你不需要手动挂脚本。复制即可。
    protected override NCreatureVisuals? TryCreateCreatureVisuals() => RitsuGodotNodeFactories.CreateFromScenePath<NCreatureVisuals>(AssetProfile.Scenes!.VisualsPath!);

    // 初始卡组，或者在卡牌类上用RegisterCharacterStarterCard就不用写这个
    // protected override IEnumerable<StartingDeckEntry> StartingDeckEntries => [
    //     new(typeof(TestCard), 5)
    // ];

    // 初始遗物，或者在遗物类上用RegisterCharacterStarterRelic就不用写这个
    // protected override IEnumerable<Type> StartingRelicTypes => [
    //     typeof(Akabeko)
    // ];

    // 攻击建筑师的攻击特效列表
    public override List<string> GetArchitectAttackVfx() => [
        "vfx/vfx_attack_blunt",
        "vfx/vfx_heavy_blunt",
        "vfx/vfx_attack_slash",
        "vfx/vfx_bloody_impact",
        "vfx/vfx_rock_shatter"
    ];
}
```

没什么要求，Godot里创建一个新的场景，类型为`Control`，自己搭建场景即可。参考：（根节点大小建议为2560x1200，可从最下方复制tscn资源）

![人物背景](../../images/image17.png)

## 自定义人物

`AssetProfile`里的：

```csharp
Scenes: new(
    VisualsPath: "res://Test/scenes/test_character.tscn"
)
```

新建一个`Node2D`类型的场景，如下：

```
TestCharacter (Node2D)
├── Visuals (Node2D) %
├── Bounds (Control) %
├── IntentPos (Marker2D) %
├── CenterPos (Marker2D) %
└── TalkPos (Marker2D) %
```

<b>其中`Visuals`，`Bounds`，`IntentPos`，`CenterPos`，`TalkPos`需要右键勾选`作为唯一名称访问`，出现`%`即可。名字不要改。</b>

`Bounds`就是你的人物hitbox的大小，如果你觉得血条太短调整一下它的大小。

* 人物显示在x轴上方。
* 如果想使用3d模型，新建`visuals→subviewportcontainer→subviewport`的层级结构，然后在`subviewport`中添加`camera3d`和任意3d模型，在3d视图中调整视角至2d视图正常显示。最后设置`subviewport`的`transparent`为`true`。

![alt text](../../images/image18.png)

### 人物动画

* 其中`Visuals`可以更改成任意继承了`Node2D`的类型，例如`SpineSprite`，`Sprite2D`，`AnimatedSprite2D`或是`AnimationPlayer`，或者在它之下新建节点都可。

* 如果要自然支持Spine播放，需要把`Visuals`改成`SpineSprite`，且你的战斗人物模型需要有`idle_loop`（待机循环），`attack`（攻击动作），`cast`（能力卡动作），`hurt`（受伤），`die`（死亡）这些动画名。（如果你没有`SpineSprite`，参考`卡图&皮肤替换`一章先下载`Spine Godot Extension`。）

* 非Spine需要自己Patch播放动画。（RitsuLib暂不支持，TODO）

## 自定义能量表盘

`AssetProfile`里的：

```csharp
Scenes: new(
    EnergyCounterPath: "res://Test/scenes/test_energy_counter.tscn"
)
```

* 建议从原版或者下面的附赠资源处复制一份tscn快速开始。
创建一个`Control`类型的新场景，设定以下结构（*名字不能改变*）：

```
TestEnergyCounter (Control)
├── EnergyVfxBack (Node2D) %
├── Layers (Control) %
│   ├── Layer1 (TextureRect，或任意)
│   └── RotationLayers (Control) %
├── EnergyVfxFront (Node2D) %
└── Label (Label)
```

* 后面标`%`的需要作为唯一名称访问。名字不要改，label也是。
* RotationLayers里放需要旋转的图层。没有也行。

![alt text](../../images/image19.png)

*仅供参考，我这没挂脚本，需要挂脚本*

## 自定义商店模型

`AssetProfile`里的：

```csharp
Scenes: new(
    MerchantAnimPath: "res://Test/scenes/test_character_merchant.tscn"
)
```

创建一个`Node2D`类型的新场景，设定以下结构：

```
TestCharacterMerchant (Node2D)
```

* 如果你使用Spine模型，第一个子节点放置`SpineSprite`，且动画名是`relaxed_loop`。

* 如果你使用其他动画，创建一个继承了`NMerchantCharacter`的节点，并在`_Ready`函数里播放你自己的动画。

```csharp
using MegaCrit.Sts2.Core.Nodes.Screens.Shops;

namespace Test.Scripts;

public partial class NTestMerchantCharacter : NMerchantCharacter
{
    public override void _Ready()
    {
    }
}
```

## 本地化文件

创建`{modId}/localization/{Language}/characters.json`，填写以下内容：

```json
{
  // 混沌香气事件中的内心独白
  "TEST_CHARACTER_TEST_CHARACTER.aromaPrinciple": "[sine][blue]……等待……[/blue][/sine]",
  // 多人模式：存活时回合结束对白
  "TEST_CHARACTER_TEST_CHARACTER.banter.alive.endTurnPing": "……",
  // 多人模式：死亡后回合结束对白
  "TEST_CHARACTER_TEST_CHARACTER.banter.dead.endTurnPing": "……",
  // 自定义模式文本
  "TEST_CHARACTER_TEST_CHARACTER.cardsModifierDescription": "戈多的卡牌现在会出现在奖励和商店中。",
  // 卡池名字
  "TEST_CHARACTER_TEST_CHARACTER.cardsModifierTitle": "戈多卡牌",
  // 角色选择界面描述
  "TEST_CHARACTER_TEST_CHARACTER.description": "一个在无尽等待中的存在。\n时间对[gold]戈多[/gold]而言，不过是另一种形式的永恒。",
  // 死亡时事件对话
  "TEST_CHARACTER_TEST_CHARACTER.eventDeathPrevention": "我还得继续等下去……",
  // 沉没宝库事件中对金币的独白
  "TEST_CHARACTER_TEST_CHARACTER.goldMonologue": "[sine]这些金币……也许能派上用场……[/sine]",
  // 物主形容词，用于动态文本
  "TEST_CHARACTER_TEST_CHARACTER.possessiveAdjective": "他的",
  // 宾语代词
  "TEST_CHARACTER_TEST_CHARACTER.pronounObject": "他",
  // 所有格代词
  "TEST_CHARACTER_TEST_CHARACTER.pronounPossessive": "他的",
  // 主语代词
  "TEST_CHARACTER_TEST_CHARACTER.pronounSubject": "他",
  // 角色名（标题用）
  "TEST_CHARACTER_TEST_CHARACTER.title": "戈多",
  // 角色名（作宾语用）
  "TEST_CHARACTER_TEST_CHARACTER.titleObject": "戈多",
  // 解锁条件文案，{Prerequisite} 会被替换
  "TEST_CHARACTER_TEST_CHARACTER.unlockText": "用[pink]{Prerequisite}[/pink]进行一局游戏来解锁这个角色。"
}
```

同时还需要先古对话的json。创建`{modId}/localization/{Language}/ancients.json`。详见`先古对话`一章。

```json
{
  "DARV.talk.TEST_CHARACTER_TEST_CHARACTER.0-0.char": "你这里……很吵。但东西很多。我在等的时候，顺便看一眼。",
  "DARV.talk.TEST_CHARACTER_TEST_CHARACTER.0-0.next": "继续",
  "DARV.talk.TEST_CHARACTER_TEST_CHARACTER.0-1.ancient": "那是自然！在这无聊的等待里，随便挑一块被遗忘的宝石去吧！",
  "DARV.talk.TEST_CHARACTER_TEST_CHARACTER.1-0r.ancient": "你还在等啊？我不急——那堆东西你慢挑。你等得起，我也等得起！",
  "DARV.talk.TEST_CHARACTER_TEST_CHARACTER.2-0.ancient": "我这里有无数宝石，但好像没见着你在等的那件啊……",
  "DARV.talk.TEST_CHARACTER_TEST_CHARACTER.2-0.next": "回应",
  "DARV.talk.TEST_CHARACTER_TEST_CHARACTER.2-1.char": "若你真有我要的那一件……它不必闪亮。只要它会在该来的时候出现。\n[i][font_size=22]戈多只是站着，像一根被时间磨钝的钉子。[/font_size][/i]",
  "DARV.talk.TEST_CHARACTER_TEST_CHARACTER.2-1.next": "继续",
  "DARV.talk.TEST_CHARACTER_TEST_CHARACTER.2-2.ancient": "……罢了。把选择留到下次吧。看来你习惯把“下次”等得很久。",

  "NEOW.talk.TEST_CHARACTER_TEST_CHARACTER.0-0.char": "你又把我从沉默里捞起来……这次，要我去哪里等？",
  "NEOW.talk.TEST_CHARACTER_TEST_CHARACTER.0-0.next": "继续",
  "NEOW.talk.TEST_CHARACTER_TEST_CHARACTER.0-1.ancient": "[sine]...去... 塔里... ..继续... 等待.....[/sine]",
  "NEOW.talk.TEST_CHARACTER_TEST_CHARACTER.1-0r.ancient": "[sine]...我听见了... ..你的脚步..... \n...等待... ..从不赶路.....[/sine]",
  "NEOW.talk.TEST_CHARACTER_TEST_CHARACTER.2-0.ancient": "[sine]...你.. 还缺... ..什么...？[/sine]",
  "NEOW.talk.TEST_CHARACTER_TEST_CHARACTER.2-0.next": "祈求",
  "NEOW.talk.TEST_CHARACTER_TEST_CHARACTER.2-1.char": "若你赐我什么……请赐我“还能再等一次”的力气。别的，我都不缺。",
  "NEOW.talk.TEST_CHARACTER_TEST_CHARACTER.2-1.next": "继续",
  "NEOW.talk.TEST_CHARACTER_TEST_CHARACTER.2-2.ancient": "[sine]...去吧... \n..我会... 在你...回头的地方... ..还在.....[/sine]",

  "NONUPEIPE.talk.TEST_CHARACTER_TEST_CHARACTER.0-0.char": "华丽的房间。耀眼的你。可我……只是一件还没被取走的旧外套。",
  "NONUPEIPE.talk.TEST_CHARACTER_TEST_CHARACTER.0-0.next": "继续",
  "NONUPEIPE.talk.TEST_CHARACTER_TEST_CHARACTER.0-1.ancient": "哎呀，就算是旧外套，接受了我的赐福也能变得光彩照人呢。",
  "NONUPEIPE.talk.TEST_CHARACTER_TEST_CHARACTER.1-0r.ancient": "你是在等迟到的胜利么？快过来，让我把你打扮得更像一个赢家。",
  "NONUPEIPE.talk.TEST_CHARACTER_TEST_CHARACTER.2-0.ancient": "哪怕你要将自己系在某个永远不会到来的时刻上，也不该如此灰头土脸呀。",
  "NONUPEIPE.talk.TEST_CHARACTER_TEST_CHARACTER.2-0.next": "婉拒",
  "NONUPEIPE.talk.TEST_CHARACTER_TEST_CHARACTER.2-1.char": "……我不需要好看。我只需要“还没结束”。",
  "NONUPEIPE.talk.TEST_CHARACTER_TEST_CHARACTER.2-1.next": "继续",
  "NONUPEIPE.talk.TEST_CHARACTER_TEST_CHARACTER.2-2.ancient": "真是不懂情趣。拿去吧。让我看着你继续等——穿着我的光，也穿着你的耐心。",

  "OROBAS.talk.TEST_CHARACTER_TEST_CHARACTER.0-0.char": "你在跳。我在等。我们谁更疯一点？",
  "OROBAS.talk.TEST_CHARACTER_TEST_CHARACTER.0-0.next": "继续",
  "OROBAS.talk.TEST_CHARACTER_TEST_CHARACTER.0-1.ancient": "都不疯！！都不疯！！试试这个打发时间！！",
  "OROBAS.talk.TEST_CHARACTER_TEST_CHARACTER.1-0r.ancient": "别急别急！你不要急！等待是……是……很长的闪电！！",
  "OROBAS.talk.TEST_CHARACTER_TEST_CHARACTER.2-0.ancient": "送你东西！！想要什么？“明天还会响”的声音！？",
  "OROBAS.talk.TEST_CHARACTER_TEST_CHARACTER.2-0.next": "回应",
  "OROBAS.talk.TEST_CHARACTER_TEST_CHARACTER.2-1.char": "……我把沉默放在口袋里了。你要不要摸摸看？",
  "OROBAS.talk.TEST_CHARACTER_TEST_CHARACTER.2-1.next": "继续",
  "OROBAS.talk.TEST_CHARACTER_TEST_CHARACTER.2-2.ancient": "好！好！那我们说定了：我继续吵，你继续等！！",

  "PAEL.talk.TEST_CHARACTER_TEST_CHARACTER.0-0.char": "你的鼾声像潮汐……我在潮水里等，不会淹死，只会更安静。",
  "PAEL.talk.TEST_CHARACTER_TEST_CHARACTER.0-0.next": "继续",
  "PAEL.talk.TEST_CHARACTER_TEST_CHARACTER.0-1.ancient": "[thinky_dots]安静的旅人……拿走我的一部分，在潮水里寻找安宁吧……[/thinky_dots]",
  "PAEL.talk.TEST_CHARACTER_TEST_CHARACTER.1-0r.ancient": "[thinky_dots]醒着的人总想赶路，睡着的人才懂停留……你也睡一会儿吧……[/thinky_dots]",
  "PAEL.talk.TEST_CHARACTER_TEST_CHARACTER.2-0.ancient": "[thinky_dots]拿走我的血肉吧……一点“不会催促你”的血肉……[/thinky_dots]",
  "PAEL.talk.TEST_CHARACTER_TEST_CHARACTER.2-0.next": "回答",
  "PAEL.talk.TEST_CHARACTER_TEST_CHARACTER.2-1.char": "……我不怕痛。只怕痛把我从等待里拽走。",
  "PAEL.talk.TEST_CHARACTER_TEST_CHARACTER.2-1.next": "继续",
  "PAEL.talk.TEST_CHARACTER_TEST_CHARACTER.2-2.ancient": "[thinky_dots]收下吧……让你继续躺在这里……等那条还没来的路……[/thinky_dots]",

  "TANX.talk.TEST_CHARACTER_TEST_CHARACTER.0-0.char": "你要战斗。我要等待。我们能不能……各做各的？",
  "TANX.talk.TEST_CHARACTER_TEST_CHARACTER.0-0.next": "继续",
  "TANX.talk.TEST_CHARACTER_TEST_CHARACTER.0-1.ancient": "[b]不能！！拿着这把武器！去变强！！！[/b]",
  "TANX.talk.TEST_CHARACTER_TEST_CHARACTER.1-0r.ancient": "[b]你的血早就凉了！但战斗能让耐心也沸腾起来！！[/b]",
  "TANX.talk.TEST_CHARACTER_TEST_CHARACTER.2-0.ancient": "[b]不要再等那个人了！与我一战，这就是你现在的命运！！[/b]",
  "TANX.talk.TEST_CHARACTER_TEST_CHARACTER.2-0.next": "退让",
  "TANX.talk.TEST_CHARACTER_TEST_CHARACTER.2-1.char": "若一定要打……等我等到那个人来。他会替我还手。\n[i][font_size=22]戈多退半步，像把战场让给未来。[/font_size][/i]",
  "TANX.talk.TEST_CHARACTER_TEST_CHARACTER.2-1.next": "继续",
  "TANX.talk.TEST_CHARACTER_TEST_CHARACTER.2-2.ancient": "[b]懦弱！！但你有无尽的耐心！！收下这把武器去等待吧！[/b]",

  "TEZCATARA.talk.TEST_CHARACTER_TEST_CHARACTER.0-0.char": "火很暖。可我在等的不是暖，是“到点”。",
  "TEZCATARA.talk.TEST_CHARACTER_TEST_CHARACTER.0-0.next": "继续",
  "TEZCATARA.talk.TEST_CHARACTER_TEST_CHARACTER.0-1.ancient": "没到点也没关系呀。快进来吧，让我在等待中把你[jitter][b]温暖[/b][/jitter]一下。",
  "TEZCATARA.talk.TEST_CHARACTER_TEST_CHARACTER.1-0r.ancient": "你背着的唯一行李就是那点[jitter][b]犹豫[/b][/jitter]么？要不要让我帮你烧掉呀？",
  "TEZCATARA.talk.TEST_CHARACTER_TEST_CHARACTER.2-0.ancient": "亲爱的，尝尝我给你做的[jitter][b]点心[/b][/jitter]吧。是那种要慢慢凉、慢慢等的点心哦。",
  "TEZCATARA.talk.TEST_CHARACTER_TEST_CHARACTER.2-0.next": "推辞",
  "TEZCATARA.talk.TEST_CHARACTER_TEST_CHARACTER.2-1.char": "……我不饿。我只是空。空和饿很像。",
  "TEZCATARA.talk.TEST_CHARACTER_TEST_CHARACTER.2-1.next": "继续",
  "TEZCATARA.talk.TEST_CHARACTER_TEST_CHARACTER.2-2.ancient": "好吧，那就尝一口吧。然后我们继续等——等苦味[jitter][b]散尽[/b][/jitter]。",

  "VAKUU.talk.TEST_CHARACTER_TEST_CHARACTER.0-0.char": "恶魔也做交易。那你要我的什么？我的时间？它本来就不值钱。",
  "VAKUU.talk.TEST_CHARACTER_TEST_CHARACTER.0-0.next": "继续",
  "VAKUU.talk.TEST_CHARACTER_TEST_CHARACTER.0-1.ancient": "不值钱的[sine]时间[/sine]积攒起来，也是很可观的呢……",
  "VAKUU.talk.TEST_CHARACTER_TEST_CHARACTER.1-0r.ancient": "我通常把“立刻”卖得很贵。可面对你，我连[sine]“以后”[/sine]都想标上高价。",
  "VAKUU.talk.TEST_CHARACTER_TEST_CHARACTER.2-0.ancient": "如果在契约的底端写上一行小字：允许你[sine]永远等下去[/sine]——你就签么？",
  "VAKUU.talk.TEST_CHARACTER_TEST_CHARACTER.2-0.next": "回应",
  "VAKUU.talk.TEST_CHARACTER_TEST_CHARACTER.2-1.char": "……我的名字不重要。重要的是我还没被叫到。",
  "VAKUU.talk.TEST_CHARACTER_TEST_CHARACTER.2-1.next": "继续",
  "VAKUU.talk.TEST_CHARACTER_TEST_CHARACTER.2-2.ancient": "拿去你的代价。我绝不会叫醒你——除非[sine]那一刻[/sine]真的来临。",

  "THE_ARCHITECT.talk.TEST_CHARACTER_TEST_CHARACTER.0-0r.ancient": "你站在这里，却像哪里都不在。你在等什么？塔顶？结局？还是一句许可？",
  "THE_ARCHITECT.talk.TEST_CHARACTER_TEST_CHARACTER.0-0r.next": "回答",
  "THE_ARCHITECT.talk.TEST_CHARACTER_TEST_CHARACTER.0-1r.char": "……我在等一个名字被念出来。念到之前，我哪儿都不去。",
  "THE_ARCHITECT.talk.TEST_CHARACTER_TEST_CHARACTER.0-1r.next": "继续",
  "THE_ARCHITECT.talk.TEST_CHARACTER_TEST_CHARACTER.0-2r.ancient": "许可？你从来不需要。你只是害怕“等了却等错”。",

  "THE_ARCHITECT.talk.TEST_CHARACTER_TEST_CHARACTER.1-0r.ancient": "你又回来。时间对你而言像走廊——你走不完，是因为你不想走完。",
  "THE_ARCHITECT.talk.TEST_CHARACTER_TEST_CHARACTER.1-0r.next": "继续",
  "THE_ARCHITECT.talk.TEST_CHARACTER_TEST_CHARACTER.1-1r.char": "走廊很好。尽头不好。尽头意味着……不用再等。",
  "THE_ARCHITECT.talk.TEST_CHARACTER_TEST_CHARACTER.1-1r.next": "继续",
  "THE_ARCHITECT.talk.TEST_CHARACTER_TEST_CHARACTER.1-2r.ancient": "愚蠢。你若不走向尽头，就永远只是回声。",

  "THE_ARCHITECT.talk.TEST_CHARACTER_TEST_CHARACTER.2-0r.ancient": "那就站着吧。塔会替你记住：你来过，很多次，却什么也没拿走。",
  "THE_ARCHITECT.talk.TEST_CHARACTER_TEST_CHARACTER.2-0r.next": "继续",
  "THE_ARCHITECT.talk.TEST_CHARACTER_TEST_CHARACTER.2-1r.char": "拿走什么……会让我不等吗？",
  "THE_ARCHITECT.talk.TEST_CHARACTER_TEST_CHARACTER.2-1r.next": "继续",
  "THE_ARCHITECT.talk.TEST_CHARACTER_TEST_CHARACTER.2-2r.ancient": "会。所以别拿。继续等——这是你唯一擅长的武器。"
}
```

![alt text](../../images/image20.png)

## 附赠资源

<div style="display:flex; gap:8px; flex-wrap:nowrap;">
    <img src="../../images/image21.png" alt="image21" style="width:24%;" />
    <img src="../../images/image22.png" alt="image22" style="width:24%;" />
    <img src="../../images/energy_test.png" alt="energy_test" style="width:24px; height:24px; object-fit:contain; max-width:none; flex:0 0 auto;" />
    <img src="../../images/energy_test_big.png" alt="energy_test_big" style="width:74px; height:74px; object-fit:contain; max-width:none; flex:0 0 auto;" />
</div>

`test_bg.tscn`:
```tscn
[gd_scene load_steps=2 format=3 uid="uid://cejqjeipgqe0n"]

[ext_resource type="Texture2D" uid="uid://ddxmxgyyfy8mn" path="res://icon.svg" id="1_c8lhi"]

[node name="TestBg" type="Control"]
layout_mode = 3
anchors_preset = 8
anchor_left = 0.5
anchor_top = 0.5
anchor_right = 0.5
anchor_bottom = 0.5
offset_left = -1790.0
offset_top = -1043.0
offset_right = 1790.0
offset_bottom = 1043.0
grow_horizontal = 2
grow_vertical = 2
metadata/_edit_lock_ = true

[node name="ColorRect" type="ColorRect" parent="."]
layout_mode = 1
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
grow_horizontal = 2
grow_vertical = 2
color = Color(0.44705883, 0.49803922, 1, 1)
metadata/_edit_lock_ = true

[node name="Icon" type="TextureRect" parent="."]
layout_mode = 1
anchors_preset = -1
anchor_right = 1.0
anchor_bottom = 1.0
offset_left = 1774.0
offset_top = 792.0
offset_right = -1259.0
offset_bottom = -747.0
grow_horizontal = 2
grow_vertical = 2
texture = ExtResource("1_c8lhi")

[node name="ash1" type="CPUParticles2D" parent="."]
position = Vector2(1832, -17)
amount = 40
lifetime = 15.0
preprocess = 15.0
local_coords = true
emission_shape = 3
emission_rect_extents = Vector2(2000, 1)
gravity = Vector2(27, 27)
orbit_velocity_max = 0.03
angle_min = 45.0
angle_max = 90.0
scale_amount_min = 10.0
scale_amount_max = 10.0

[node name="ash2" type="CPUParticles2D" parent="."]
position = Vector2(1832, -17)
amount = 40
lifetime = 15.0
preprocess = 15.0
local_coords = true
emission_shape = 3
emission_rect_extents = Vector2(2000, 1)
gravity = Vector2(27, 27)
orbit_velocity_max = 0.03
angle_min = 45.0
angle_max = 90.0
scale_amount_min = 10.0
scale_amount_max = 10.0
color = Color(0.121879734, 0.15283081, 0.33476263, 1)
```

`test_character.tscn`:
```tscn
[gd_scene load_steps=3 format=3 uid="uid://c4dnpxxd6ldei"]

[ext_resource type="Texture2D" uid="uid://hn2nofekpwrp" path="res://icon.svg" id="1_hxav6"]
[ext_resource type="Script" uid="uid://6m0cydgurd52" path="res://Scripts/NTestCharacter.cs" id="1_iwskh"]

[node name="TestCharacter" type="Node2D"]
script = ExtResource("1_iwskh")

[node name="Visuals" type="Sprite2D" parent="."]
unique_name_in_owner = true
position = Vector2(0, -73)
texture = ExtResource("1_hxav6")

[node name="Bounds" type="Control" parent="."]
unique_name_in_owner = true
layout_mode = 3
anchors_preset = 0
offset_left = -70.0
offset_top = -140.0
offset_right = 70.0

[node name="IntentPos" type="Marker2D" parent="."]
unique_name_in_owner = true
position = Vector2(0, -159)

[node name="CenterPos" type="Marker2D" parent="."]
unique_name_in_owner = true
position = Vector2(0, -72)

[node name="TalkPos" type="Marker2D" parent="."]
unique_name_in_owner = true
position = Vector2(0, -144)
```

`test_energy_counter.tscn`:

```tscn
[gd_scene load_steps=5 format=3 uid="uid://cs3a5onikvhi4"]

[ext_resource type="Texture2D" uid="uid://hn2nofekpwrp" path="res://icon.svg" id="1_85qf2"]
[ext_resource type="Script" uid="uid://b4eaf7kin174o" path="res://Scripts/NTestEnergyCounter.cs" id="1_moaty"]
[ext_resource type="Script" uid="uid://b8vmh6070x38m" path="res://Scripts/NTestParticlesContainer.cs" id="2_sphyw"]
[ext_resource type="Script" uid="uid://camgj4bhk5dps" path="res://Scripts/TestMegaLabel.cs" id="4_ea8ix"]

[node name="TestEnergyCounter" type="Control"]
layout_mode = 3
anchors_preset = 0
offset_right = 128.0
offset_bottom = 128.0
script = ExtResource("1_moaty")
metadata/_edit_lock_ = true

[node name="EnergyVfxBack" type="Node2D" parent="."]
unique_name_in_owner = true
position = Vector2(64, 64)
script = ExtResource("2_sphyw")

[node name="Layers" type="Control" parent="."]
unique_name_in_owner = true
layout_mode = 1
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
grow_horizontal = 2
grow_vertical = 2

[node name="RotationLayers" type="Control" parent="Layers"]
unique_name_in_owner = true
anchors_preset = 0
offset_right = 40.0
offset_bottom = 40.0

[node name="Layer1" type="TextureRect" parent="Layers"]
layout_mode = 1
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
grow_horizontal = 2
grow_vertical = 2
texture = ExtResource("1_85qf2")
expand_mode = 1

[node name="EnergyVfxFront" type="Node2D" parent="."]
unique_name_in_owner = true
position = Vector2(64, 64)
script = ExtResource("2_sphyw")

[node name="Label" type="Label" parent="."]
layout_mode = 1
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
offset_left = 16.0
offset_top = -29.0
offset_right = -16.0
offset_bottom = 29.0
grow_horizontal = 2
grow_vertical = 2
theme_override_colors/font_color = Color(1, 0.9647059, 0.8862745, 1)
theme_override_colors/font_shadow_color = Color(0, 0, 0, 0.1882353)
theme_override_colors/font_outline_color = Color(0.1, 0.1, 0.8, 1)
theme_override_constants/shadow_offset_x = 3
theme_override_constants/shadow_offset_y = 2
theme_override_constants/outline_size = 16
theme_override_constants/shadow_outline_size = 16
theme_override_font_sizes/font_size = 36
text = "3/3"
horizontal_alignment = 1
vertical_alignment = 1
script = ExtResource("4_ea8ix")
```
