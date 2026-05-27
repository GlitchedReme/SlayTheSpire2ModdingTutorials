`RitsuLib`提供了一套通知提示服务，用于向玩家显示非侵入式消息。框架会在 `GameReadyEvent` 之后把 Toast 挂到游戏根节点，建议在局内/UI 就绪后再调用。

## 使用方式

```csharp
using MegaCrit.Sts2.Core.Logging;
using MegaCrit.Sts2.Core.Modding;
using STS2RitsuLib;
using STS2RitsuLib.Ui.Toast;

namespace Test.Scripts;

[ModInitializer(nameof(Init))]
public class Entry
{
    public const string ModId = "Test";
    public static readonly Logger Logger = RitsuLibFramework.CreateLogger(ModId);

    public static void Init()
    {
        RitsuLibFramework.SubscribeLifecycle<GameReadyEvent>(_ =>
        {
            // 显示 Toast 信息。
            // ShowInfo：普通提示，参数为正文, 标题（可选），点击动作（可选）
            RitsuToastService.ShowInfo("Mod 已加载");

            // ShowWarning：警告，更改了标题
            RitsuToastService.ShowWarning("生命值过低", "警告");

            // ShowError：错误，包含一个点击回调
            RitsuToastService.ShowError(
                "保存失败。",
                onClick: () => Logger.Info("用户点击了 Toast"));
        });
    }
}
```

需要完全控制样式与动画时，构造 `RitsuToastRequest` 并交给 `Show`：

```csharp
using Godot;
using STS2RitsuLib.Ui.Toast;

RitsuToastService.Show(new RitsuToastRequest(
    // 正文，必填
    body: "新配方已解锁！",
    // 标题，可空
    title: "配方",
    // 左侧图片，可空
    image: myTexture,
    // 级别。
    // Info：普通提示
    // Warning：警告
    // Error：错误
    level: RitsuToastLevel.Info,
    // 显示秒数，null 用默认 3.5 秒
    durationSeconds: 5.0,
    // 点击正文时触发，可空
    onClick: () => Logger.Info("打开配方界面"),
    // 动画。
    // Fade：仅淡入淡出
    // FadeSlide：淡入淡出并滑动，全局默认
    // FadeScale：淡入淡出并缩放
    animationOverride: RitsuToastAnimationPreset.FadeScale));
```