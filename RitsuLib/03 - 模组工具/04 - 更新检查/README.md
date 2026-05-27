RitsuLib 的更新检查用于在发现新版本时显示通知提示。

它不负责下载、安装或替换文件，只负责“告诉玩家有更新，并把玩家带到发布页”。

你需要自己提供资源站点。（TODO：简单搭建）

## 注册一次性检查

最常见的用法是在初始化阶段注册。RitsuLib 会等第一次主菜单就绪后执行一次网络请求，同一个 `ModId` 每个游戏会话只安排一次。

```csharp
RitsuLibFramework.RegisterModUpdateCheck(
    Entry.ModId,
    "Test Mod",
    CurrentVersion,
    "https://example.com/test-mod/update.json",
    "https://example.com/test-mod/releases");
```

`manifestUrl` 必须是 `http` 或 `https` 的绝对 URL。

## manifest json 格式

更新 manifest 是一个小 JSON 文件。RitsuLib 只读取版本、发布页和 Toast 文案。

```json
{
  "schema": "ritsulib.update.v1",
  "latest_version": "1.2.3",
  "release_page_url": "https://example.com/test-mod/releases/tag/v1.2.3",
  "title": "Test Mod 有更新",
  "message": "Test Mod {latest_version} 已发布，点击打开发布页。",
  "localized": {
    "eng": {
      "title": "Test Mod update available",
      "message": "Test Mod {latest_version} is available. Click to open the release page."
    },
    "zhs": {
      "title": "Test Mod 有更新",
      "message": "Test Mod {latest_version} 已发布，点击打开发布页。"
    }
  }
}
```

Toast 文案支持这些占位符：

| 占位符 | 含义 |
| - | - |
| `{display_name}` | 注册时的 `DisplayName` |
| `{current_version}` | 当前安装版本 |
| `{latest_version}` | manifest 中的最新版本 |

## 使用完整选项

镜像站需要请求头、超时或自定义 Toast 文案时，使用 `ModUpdateCheckOptions`。

```csharp
using STS2RitsuLib;
using STS2RitsuLib.Updates;

RitsuLibFramework.RegisterModUpdateCheck(new ModUpdateCheckOptions
{
    ModId = Entry.ModId,
    DisplayName = "Test Mod",
    CurrentVersion = "1.2.0",
    ManifestUri = new Uri("https://cdn.example.com/test-mod/update.json"),
    ReleasePageUri = new Uri("https://example.com/test-mod/releases"),
    Headers = new Dictionary<string, string>
    {
        ["X-Mod-Channel"] = "stable",
    },
    Timeout = TimeSpan.FromSeconds(5),
    ToastDurationSeconds = 8,
    ToastTitle = "{display_name} 有新版本",
    ToastBody = "当前 {current_version}，最新 {latest_version}。",
});
```

`ReleasePageUri` 是 manifest 没写 `release_page_url` 时的备用发布页。如果检查到新版本但两边都没有发布页，结果会是 `InvalidData`，不会显示更新 Toast。

## 立即检查

设置页里的“检查更新”按钮可以直接运行检查。`CheckForModUpdateAsync(...)` 不显示 UI，适合自己决定怎么反馈。

```csharp
using Godot;
using STS2RitsuLib;
using STS2RitsuLib.Updates;
using STS2RitsuLib.Ui.Toast;

var result = await RitsuLibFramework.CheckForModUpdateAsync(
    Entry.ModId,
    "Test Mod",
    "1.2.0",
    "https://example.com/test-mod/update.json",
    "https://example.com/test-mod/releases");

switch (result.Status)
{
    case ModUpdateCheckStatus.UpdateAvailable:
        RitsuToastService.ShowInfo(
            result.Message ?? $"发现新版本 {result.LatestVersion}。",
            result.Title ?? "Test Mod 有更新",
            result.ReleasePageUri == null ? null : () => OS.ShellOpen(result.ReleasePageUri.ToString()));
        break;

    case ModUpdateCheckStatus.UpToDate:
        RitsuToastService.ShowInfo("当前已经是最新版本。", "Test Mod");
        break;

    case ModUpdateCheckStatus.InvalidData:
    case ModUpdateCheckStatus.RequestFailed:
        RitsuToastService.ShowWarning(
            result.Message ?? "更新检查失败。",
            "Test Mod");
        break;
}
```