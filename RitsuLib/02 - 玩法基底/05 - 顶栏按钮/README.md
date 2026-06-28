> 以下示例默认已经在 `Entry.Init()` 中调用了 `ModTypeDiscoveryHub.RegisterModAssembly(...)`，否则自动注册不会生效。

`RitsuLib` 提供自定义顶栏按钮注册。

## 使用方式

在你管理顶栏按钮的类中（新的类，或者singleton等）实现 `IModTopBarButtonHandler` 接口，并用 `[RegisterOwnedTopBarButton]`：

```csharp
using STS2RitsuLib.Interop.AutoRegistration;
using STS2RitsuLib.Screens;
using STS2RitsuLib.TopBar;
using STS2RitsuLib.Ui.Toast;

namespace Test.Scripts;

[RegisterOwnedTopBarButton(
    // ID，生成本地化键 {ModId}_TOPBARBUTTON_{ID}
    "recipes",
    // 按钮图标（可选）
    IconPath = "res://Test/images/recipe_icon.png",
    // 排序，数值越小越靠近原版牌组按钮（可选）
    ButtonOrder = 0,
    // 相对自动排布槽位的额外像素偏移（可只写其一）（可选）
    OffsetX = 0,
    OffsetY = 0)]
public class RecipeButtonHandler : IModTopBarButtonHandler
{
    // 点击时触发（必须实现）
    public void OnClick(ModTopBarButtonContext ctx)
    {
        // 可打开/切换界面：
        // ctx.OpenCapstoneScreen(myScreen);
        // ctx.ToggleCapstoneScreen(myScreen);
        // ctx.CloseCapstoneScreen();
    }

    public bool IsVisible(ModTopBarButtonContext ctx)
    {
        // 是否显示按钮
        return ctx.Player != null;
    }

    public bool IsOpen(ModTopBarButtonContext ctx)
    {
        // 关联界面是否已打开。如果打开，按钮会持续动态摆动
        return ModScreenService.CurrentCapstoneScreen is MyRecipeScreen;
    }

    public int GetCount(ModTopBarButtonContext ctx)
    {
        // 角标数字；返回 -1 表示不显示
        return -1;
    }
}
```

## 本地化

在`{modId}/localization/{lang}/static_hover_tips.json`中添加文本。

ID格式为`{MODID}_TOPBARBUTTON_{LOCALSTEM}`，例如这里会变成`TEST_TOPBARBUTTON_RECIPES`。

```json
{
    "TEST_TOPBARBUTTON_RECIPES.title": "配方",
    "TEST_TOPBARBUTTON_RECIPES.description": "查看已解锁的配方。"
}
```

## 显式注册

需要在初始化里动态注册时，可在 `Entry.Init` 中调用 `ModTopBarButtonRegistry.For(ModId).RegisterOwned(...)：

```csharp
using STS2RitsuLib.TopBar;

ModTopBarButtonRegistry.For(ModId).RegisterOwned("recipes", new ModTopBarButtonSpec
{
    IconPath = "res://Test/images/recipe_icon.png",
    OnClick = ctx => RitsuToastService.ShowInfo("配方按钮已点击"),
    VisibleWhen = ctx => ctx.Player != null,
});
```
