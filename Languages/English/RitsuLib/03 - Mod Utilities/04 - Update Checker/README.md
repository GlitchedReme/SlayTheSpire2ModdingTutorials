RitsuLib's update checker is used to display a notification when a new version is found.

It is not responsible for downloading, installing, or replacing files — it only handles "telling the player there is an update and taking them to the release page".

You need to provide your own hosting endpoint.

## Registering the Check

The following registers an update check and displays a toast on the main menu when a new version is detected.

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

`ReleasePageUri` is a fallback release page used when the manifest does not specify `release_page_url`. If a new version is detected but neither side has a release page, the result will be `InvalidData` and no update toast will be displayed.

`manifestUri` must be an absolute `https` URL.

## Manifest JSON Format

The update manifest is a small JSON file. RitsuLib only reads the version, release page, and toast copy.

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

Toast copy supports these placeholders:

| Placeholder | Meaning |
| - | - |
| `{display_name}` | The `DisplayName` from registration |
| `{current_version}` | The currently installed version |
| `{latest_version}` | The latest version from the manifest |

## Custom Check

`CheckForModUpdateAsync(...)` does not display UI, and is suitable if you want to decide how to present feedback yourself.

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
            result.Message ?? $"New version {result.LatestVersion} found.",
            result.Title ?? "Test Mod Update Available",
            result.ReleasePageUri == null ? null : () => OS.ShellOpen(result.ReleasePageUri.ToString()));
        break;

    case ModUpdateCheckStatus.UpToDate:
        RitsuToastService.ShowInfo("You are already on the latest version.", "Test Mod");
        break;

    case ModUpdateCheckStatus.InvalidData:
    case ModUpdateCheckStatus.RequestFailed:
        RitsuToastService.ShowWarning(
            result.Message ?? "Update check failed.",
            "Test Mod");
        break;
}
```

## Setting Up a Simple Update Check with GitHub Pages

You can use GitHub Pages to host the JSON for free; the only caveat is that access from within China may have issues.

You can follow this workflow and then use `Cloudflare` to proxy it, or find another hosting provider for your file.

### Step 1: Create the Project

First, host your project on GitHub. Look up relevant tutorials for this yourself. The repository access must be `public`.

Then create an `update.template.json` file in the project root (or wherever you prefer, but adjust the path below accordingly) with the following content (modify the `release_page_url` and `localized` fields yourself):

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

### Step 2: Enable GitHub Pages

1. Repository → **Settings** → **Pages**
2. Source select **Deploy from a branch**, branch select `main`, directory select `/ (root)`
3. Click **Save**

Wait some time for deployment until a blue status shows deployment success. After that, `update.json` will be accessible at: `https://<your-lowercase-username>.github.io/<repo-name>/update.json`.

### Step 3: Workflow

Use a workflow to automatically read the version number from your `{modid}.json`, so you don't need to manually fill in `update.json`.

Create a `tools/generate-update-manifest.mjs` file (refer to RitsuLib):

```js
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const templatePath = resolve(repoRoot, 'update.template.json') // Change to your update.template.json location; if at root, keep this
const modManifestPath = resolve(repoRoot, 'BetterConsole.json') // Change to the json name the game uses to read your mod
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

Then create the directory and file `.github/workflows/deploy.yml`:

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

### Step 4: Push & Verify

Don't forget to register the update check in your initialization function. You can also write logic to read the version number from your json, which is omitted here.

For each future update, all you need to do is change the version number in your `{modId}.json` and the `CurrentVersion` here, then `pull` into your repository.

```csharp
using STS2RitsuLib;
using STS2RitsuLib.Updates;

RitsuLibFramework.RegisterModUpdateCheck(new()
{
    ModId = Entry.ModId,
    DisplayName = "Test Mod",
    CurrentVersion = "1.2.0",
    ManifestUri = new Uri("https://<your-lowercase-username>.github.io/<repo-name>/update.json"),
    ReleasePageUri = new Uri("https://github.com/<username>/<repo-name>/releases"),
});
```

> Reminder: the release page also needs to be set up by you. If you don't need `ReleasePageUri` for now, just put your repo's homepage.
