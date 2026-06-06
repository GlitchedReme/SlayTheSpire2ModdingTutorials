RitsuLib 的更新检查用于在发现新版本时显示通知提示。

它不负责下载、安装或替换文件，只负责“告诉玩家有更新，并把玩家带到发布页”。

你需要自己提供资源站点。

## 注册检查

以下会注册一个更新检查，并在检测到新版本时在主菜单弹出toast。

```csharp
using STS2RitsuLib;
using STS2RitsuLib.Updates;

RitsuLibFramework.RegisterModUpdateCheck(new()
{
    ModId = Entry.ModId,
    DisplayName = "Test Mod",
    CurrentVersion = "1.2.0",
    ManifestUri = new Uri("https://cdn.example.com/test-mod/update.json"),
    ReleasePageUri = new Uri("https://example.com/test-mod/releases"),
});
```

`ReleasePageUri` 是 manifest 没写 `release_page_url` 时的备用发布页。如果检查到新版本但两边都没有发布页，结果会是 `InvalidData`，不会显示更新 Toast。

`manifestUri` 必须是 `https` 的绝对 URL。

## manifest json 格式

更新 manifest 是一个小 JSON 文件。RitsuLib 只读取版本、发布页和 Toast 文案。

```json
{
  "schema": "ritsulib.update.v1",
  "latest_version": "1.2.3",
  "release_page_url": "https://example.com/test-mod/releases/tag/v1.2.3",
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

## 自定义检查

`CheckForModUpdateAsync(...)` 不显示 UI，适合自己决定怎么反馈。

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

## 使用Github Pages搭建简单更新检查

可以使用pages搭建免费的托管json，唯一的问题是国内访问也许会有问题。

可以参考流程，然后使用`cloudflare`转发或者自己找其他运营商托管你的文件。

### 第一步：创建项目

先把你的项目托管到github上，这方面自行查找相关教程。需要仓库访问性为`public`。

然后在项目根目录（或者你喜欢的地方，但下面自行更改地址）下创建一个`update.template.json`文件，内容如下：（自行修改`release_page_url`和`localized`字段）

```json
{
  "$schema": "https://sts2-ritsulib.ritsukage.com/ritsulib-update.schema.json",
  "schema": "ritsulib.update.v1",
  "latest_version": "",
  "release_page_url": "https://github.com/test-mod/releases/",
  "localized": {
    "eng": {
      "title": "Test Mod update available",
      "message": "Test Mod {latest_version} is available. Current version: {current_version}. Click to open the release page."
    },
    "zhs": {
      "title": "Test Mod 有更新",
      "message": "Test Mod {latest_version} 已发布。当前版本：{current_version}。点击打开发布页。"
    }
  }
}
```

### 第二步：启用 GitHub Pages

1. 仓库 → **Settings** → **Pages**
2. Source 选 **Deploy from a branch**，分支选 `main`，目录选 `/ (root)`
3. 点 **Save**

等待一些时间部署，直到出现蓝色状态部署成功。之后 `update.json` 就能在以下地址访问：`https://<你的用户名小写>.github.io/<仓库名>/update.json`。

### 第三步：工作流

使用工作流自动从你的`mod_manifest.json`读取版本号，不用手动填写`update.json`。

创建一个`tools/generate-update-manifest.mjs`文件（参考ritsulib）：

```js
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const templatePath = resolve(repoRoot, 'update.template.json') // 修改为你的update.template.json的位置，如果放在根目录就保持这样
const modManifestPath = resolve(repoRoot, 'BetterConsole.json') // 修改为游戏用来读取你的mod的json名字
const outputPath = resolve(repoRoot, 'public', 'update.json')

const [templateText, modManifestText] = await Promise.all([
  readFile(templatePath, 'utf8'),
  readFile(modManifestPath, 'utf8'),
])

const template = JSON.parse(templateText)
const modManifest = JSON.parse(modManifestText)

if (typeof modManifest.version !== 'string' || modManifest.version.trim().length === 0) {
  throw new Error('mod_manifest.json must contain a non-empty version string.')
}

const output = {
  ...template,
  latest_version: modManifest.version.trim(),
}

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
```

然后创建`.github/workflows/deploy.yml`这些文件夹和文件：

```yml
name: Deploy update manifest

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v6
      - name: Generate update manifest
        run: node tools/generate-update-manifest.mjs
      - name: Configure Pages
        uses: actions/configure-pages@v6
      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v5
        with:
          path: public
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v5
```

### 第四步：推送&验收

不要忘了在你的初始化函数里注册更新检查。你也可以写个逻辑读取你的json里的版本号，这里不再编写。

之后每次更新，你要做的就是更改你的`{modId}.json`里的版本号和这里的`CurrentVersion`，然后`pull`到你的仓库里。

```csharp
using STS2RitsuLib;
using STS2RitsuLib.Updates;

RitsuLibFramework.RegisterModUpdateCheck(new()
{
    ModId = Entry.ModId,
    DisplayName = "Test Mod",
    CurrentVersion = "1.2.0",
    ManifestUri = new Uri("https://<你的用户名小写>.github.io/<仓库名>/update.json"),
    ReleasePageUri = new Uri("https://github.com/<用户名>/<仓库名>/releases"),
});
```

> 提醒：release page也需要自己写，如果你暂时不需要`ReleasePageUri`就写自己仓库主页。