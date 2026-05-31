`RitsuLib`提供了一套自定义卡牌堆系统。

## 注册卡牌堆

在初始化函数（`Entry.Init`）中注册，并把牌堆类型存为静态变量方便后续引用：

```csharp
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Logging;
using MegaCrit.Sts2.Core.Modding;
using STS2RitsuLib;
using STS2RitsuLib.CardPiles;

namespace Test.Scripts;

[ModInitializer(nameof(Init))]
public class Entry
{
    public const string ModId = "Test";
    public static readonly Logger Logger = RitsuLibFramework.CreateLogger(ModId);

    public static PileType VoidPile;

    public static void Init()
    {
        var registry = ModCardPileRegistry.For(ModId);
        VoidPile = registry.RegisterOwned("void_pile", new ModCardPileSpec
        {
            // CombatOnly：每次战斗创建，战斗结束时销毁
            // RunPersistent：同一局游戏内可跨战斗保留（仅存于内存，需自行写入存档）
            Scope = ModCardPileScope.CombatOnly,
            // Headless：不可见
            // TopBarDeck：顶栏牌组按钮旁
            // BottomLeft：战斗UI左下（抽牌堆附近）
            // BottomRight：战斗UI右下（消耗堆附近）
            // ExtraHand：额外手牌容器
            Style = ModCardPileUiStyle.BottomLeft,
            Anchor = ModCardPileAnchor.Default,
            IconPath = "res://Test/images/void_pile.png",
            // 点击打开
            OnOpen = ctx => ctx.ShowDefaultPileScreen(),
            VisibleWhen = ctx => ctx.Player != null,
        }).PileType;
    }
}
```

* `RegisterOwned` 返回 `ModCardPileDefinition`，其 `.PileType` 是运行时操作牌堆的标识。
* RitsuLib 用 Harmony patch 拦截了原版 `CardPile.Get(PileType, Player)`，所以用你的 `PileType` 可以直接拿到牌堆对象。

## 使用卡牌堆

注册后通过 `CardPileCmd.Add` 把卡牌移入自定义牌堆：

```csharp
using MegaCrit.Sts2.Core.Commands;
using MegaCrit.Sts2.Core.Entities.Cards;
using MegaCrit.Sts2.Core.Entities.Players;

// 单张移入
await CardPileCmd.Add(card, Entry.VoidPile);

// 获取玩家的牌堆对象，手动读写
var pile = Entry.VoidPile.GetPile(player);
foreach (var c in pile.Cards)
{
    Logger.Info($"虚空堆中的卡牌: {c.Id}");
}

// 其他参考原版api即可
```

## Anchor（锚点）

- `Anchor` 和 `Style` 一起决定按钮或 ExtraHand 挂在哪。不写时等价于 `ModCardPileAnchor.Default`。

### 写法一：Default

```csharp
// 不手写坐标，由 Style 决定位置
Anchor = ModCardPileAnchor.Default,
```

### 写法二： new ModCardPileAnchor

#### 方式一：预设位置

只填 `Kind` 与 `Offset`。

```csharp
using Godot;
using STS2RitsuLib.CardPiles;

Anchor = new ModCardPileAnchor(
    // 预设槽类型，见下表
    ModCardPileAnchorKind.BottomLeftSecondary,
    // 在算好的位置上再偏移，正向右下
    new Vector2(0, -2)),
```

#### 方式二：自定义坐标

`Kind` 须为 `Custom`，四个参数都写上。

```csharp
Anchor = new ModCardPileAnchor(
    // 固定为 Custom
    ModCardPileAnchorKind.Custom,
    // 在 CustomPosition 基础上再偏移
    Offset: new Vector2(4, 4),
    // 父节点坐标系里的锚点
    CustomPosition: new Vector2(200, 150),
    // 锚点对齐控件哪条边，如 PivotCenter
    CustomAuthoringPivot: ModCardPileAnchor.PivotCenter),
```

这种方式下，控件在对应牌堆的父节点（不是在整个屏幕的位置）最左上角的位置为 `CustomPosition + Offset - 名义尺寸 * CustomAuthoringPivot`。

### 静态工厂

等价于 `new ModCardPileAnchor(ModCardPileAnchorKind.Custom, ...)`，已写好 `Offset` 与 pivot。

```csharp
Anchor = ModCardPileAnchor.AtPosition(
    // 该点对齐控件左上角
    new Vector2(120, 80)),

Anchor = ModCardPileAnchor.AtCenter(
    // 该点对齐控件中心
    new Vector2(200, 150)),

Anchor = ModCardPileAnchor.AtPivot(
    // 父节点坐标系里的锚点
    new Vector2(200, 150),
    // pivot（中心偏移），如 1,0 为右上
    new Vector2(1f, 0f)),
```

### 锚点种类

须与 `Style` 搭配；不匹配时可能排不到预期位置。

| Kind                    | 搭配的 Style  | 说明                                          |
| ----------------------- | ------------- | --------------------------------------------- |
| `StyleDefault`          | 任意          | 用该 Style 默认规则自动排版；`Default` 即此项 |
| `BottomLeftPrimary`     | `BottomLeft`  | 从抽牌堆按钮右侧起向右叠                      |
| `BottomLeftSecondary`   | `BottomLeft`  | 从弃牌堆按钮右侧起向右叠                      |
| `BottomRightPrimary`    | `BottomRight` | 从消耗堆按钮左侧起向左叠                      |
| `BottomRightSecondary`  | `BottomRight` | 从消耗堆按钮左侧起向右叠                 |
| `TopBarAfterDeck`       | `TopBarDeck`  | 顶栏原版牌组按钮右侧                          |
| `TopBarBeforeModifiers` | `TopBarDeck`  | 顶栏右侧每日效果按钮组左侧                        |
| `ExtraHandAbove`        | `ExtraHand`   | 手牌区域上方，再加 `Offset`                   |
| `ExtraHandBelow`        | `ExtraHand`   | 手牌区域下方，再加 `Offset`                   |
| `Custom`                | 任意          | 完全自定像素位置，不参与左下/右下自动排队     |

## 本地化文本

在`{modId}/localization/{lang}/static_hover_tips.json`中添加文本。

ID格式为`{MODID}_CARDPILE_{LOCALSTEM}`，例如这里会变成`TEST_CARDPILE_VOID_PILE`。

```json
{
  "TEST_CARDPILE_VOID_PILE.title": "虚空堆",
  "TEST_CARDPILE_VOID_PILE.description": "将卡牌移出战斗的区域。",
  "TEST_CARDPILE_VOID_PILE.empty": "虚空堆是空的。"
}
```
