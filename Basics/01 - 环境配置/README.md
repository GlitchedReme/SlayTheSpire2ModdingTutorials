以防你有网络问题下载工具：https://pan.baidu.com/s/1yuxPkDpCV8EVLkDubqiirg?pwd=apar

## 编程基础

阅读本教程你至少需要：

* C#语言基础（或者其他语言的基础） https://learn.microsoft.com/zh-cn/dotnet/csharp/tour-of-csharp/
* json文本基础 https://developer.mozilla.org/zh-CN/docs/Learn_web_development/Core/Scripting/JSON
* 使用Godot编辑器的简单功能
* 图片编辑处理能力
* 懂得使用电脑

## 其他教程和mod模板

https://github.com/freude916/sts2-quickRestart/blob/main/README.md

`ritsulib`模板：https://github.com/alkaid616/RitsuLibModTemplate

`baselib`模板：https://github.com/Alchyr/ModTemplate-StS2

## 安装Godot 4.5.1 Mono

《杀戮尖塔2》是用`Godot4.5.1 Mono`开发的，所以你需要安装`Godot4.5.1 Mono`版本的编辑器。

进入[Godot下载界面](https://godotengine.org/download/archive/4.5.1-stable/)，下载并安装编辑器。注意选择`.NET`版本。
![alt text](../../images/image1.webp)

或者，你也可以下载制作组自己使用的Godot修改版本[MegaDot](https://megadot.megacrit.com/)。由于暂不清楚这个版本和官方版本的区别，所以建议直接使用官方版本。

## 安装.NET SDK

下载一个[.NET SDK](https://dotnet.microsoft.com/zh-cn/download)，下载.NET 9以上版本。

## 选择文本编辑器

选择一个文本编辑器。可以使用[Visual Studio Code](https://code.visualstudio.com/)或者[Rider](https://www.jetbrains.com/zh-cn/rider/download/?section=windows)（<b>强烈推荐</b>新手使用Rider）。另外也可以使用Visual Studio等其他 IDE。以下只介绍 VS Code 的配置方法。

<b>强烈推荐</b>新手使用Rider

<b>强烈推荐</b>新手使用Rider

<b>强烈推荐</b>新手使用Rider

## 安装VS Code插件（可选）

安装[C# Dev Kit](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csdevkit)。你还可以安装[Godot Tools](https://marketplace.visualstudio.com/items?itemName=geequlim.godot-tools)等插件。

记得打开设置把自动保存开了。

![alt text](../../images/image2.webp)

## 参考官方文档

如有问题可以参考Godot的官方文档：[C#开发环境配置](https://docs.godotengine.org/zh-cn/4.x/tutorials/scripting/c_sharp/c_sharp_basics.html)。

## 创建Godot项目

打开`Godot`创建一个新项目。渲染器尽量使用`Mobile/移动`，以和游戏保持一致。记住你的项目名。

![alt text](../../images/image3.webp)

## 创建C#解决方案

点击左上角的“创建C#解决方案”按钮。

![alt text](../../images/image4.webp)

## 创建{modid}.json

用你的IDE（VSCode、Rider、VS等）打开项目文件夹。创建一个新文件（双击资源管理器或者右键新建文件），名字为`{modid}.json`。`modid`建议和项目名以及其中内容相同。填写以下内容。

* <b>不是创建`{modid}.json`这么一个文件，而是把`{modid}`替换成你的项目名，例如`Test.json`。之后提到的`{}` `[]`都是替换。</b>

```json
{
  "id": "MyMod",           // 必填，唯一 ID，建议和项目名一致
  "name": "我的 Mod",
  "author": "作者名",
  "description": "Mod 描述",
  "version": "0.1.0",
  "min_game_version": "0.107.1", // 你的mod兼容的最小游戏版本
  "has_pck": true,         // 是否有 .pck 资源包
  "has_dll": true,        // 是否有 .dll 代码
  "dependencies": [],     // 依赖的其他mod id
  "affects_gameplay": true // 多人模式时是否影响内容，如果是替换模型和优化等不影响内容的mod可填false，默认true
}
```

* 所有版本的字符串必须符合[标准版本语义](https://semver.org/)。简单来说必须是`X.X.X`三段，而不能是两段了。

依赖的写法：

> ```json
>   "dependencies": [
>     { "id": "STS2-RitsuLib", "min_version": "0.2.27" }
>   ],
> ```

## 修改.csproj

打开你的`.csproj`文件，<b>*修改*</b>并换成以下内容：

* `Rider`为右键你的项目，点击`Edit - Edit csproj`。

* `VSCode`直接找你项目里的`.csproj`文件编辑。

![alt text](../../images/image44.webp)

```xml
<Project Sdk="Godot.NET.Sdk/4.5.1">
  <PropertyGroup>
    <!-- 如果你安装了10.0并遇到问题，改下这里 -->
    <TargetFramework>net9.0</TargetFramework>
    <ImplicitUsings>true</ImplicitUsings>
    <LangVersion>13.0</LangVersion>
    <Nullable>enable</Nullable>
    <AllowUnsafeBlocks>true</AllowUnsafeBlocks>

    <!-- 改成你的杀戮尖塔2目录 -->
    <Sts2Dir>D:\xxx\Steam\steamapps\common\Slay the Spire 2</Sts2Dir>
    <Sts2DataDir>$(Sts2Dir)\data_sts2_windows_x86_64</Sts2DataDir>
  </PropertyGroup>

  <ItemGroup>
    <Reference Include="sts2">
      <HintPath>$(Sts2DataDir)\sts2.dll</HintPath>
      <Private>false</Private>
    </Reference>

    <Reference Include="0Harmony">
      <HintPath>$(Sts2DataDir)\0Harmony.dll</HintPath>
      <Private>false</Private>
    </Reference>
  </ItemGroup>

  <!-- 自动复制dll和json -->
  <Target Name="Copy Mod" AfterTargets="PostBuildEvent">
    <Message Text="Copying mod to Slay the Spire 2 mods folder..." Importance="high" />
    <MakeDir Directories="$(Sts2Dir)\mods\" />
    <Copy SourceFiles="$(TargetPath)" DestinationFolder="$(Sts2Dir)\mods\$(MSBuildProjectName)\" />
    <Copy SourceFiles="$(MSBuildProjectName).json" DestinationFolder="$(Sts2Dir)/mods/$(MSBuildProjectName)/" />
  </Target>
</Project>
```

## 创建Entry.cs

创建一个`Scripts`文件夹，创建一个`Entry.cs`文件（两者命名随意，为了整洁美观）。内容改成以下：

> 建议命名空间第一段改成你自己的，不要用`Test`以免后续更改麻烦。另外不要忘记每个文件都加上`namespace`！

```csharp
using Godot.Bridge;
using HarmonyLib;
using MegaCrit.Sts2.Core.Logging;
using MegaCrit.Sts2.Core.Modding;

namespace Test.Scripts;

// 必须要加的属性，用于注册Mod。字符串和初始化函数命名一致。
[ModInitializer(nameof(Init))]
public class Entry
{
    // 初始化函数
    public static void Init()
    {
        // 打patch（即修改游戏代码的功能）用
        // 传入参数随意，只要不和其他人撞车即可
        var harmony = new Harmony("sts2.reme.testmod");
        harmony.PatchAll();
        // 使得tscn可以加载自定义脚本
        ScriptManagerBridge.LookupScriptsInAssembly(typeof(Entry).Assembly);
        Log.Info("Mod initialized!");
    }
}

```

## 构建DLL

终端命令行里（找到`Terminal`按钮，或者快捷键，`VSCode`为按下`ctrl+~`，`Rider`为按下`Alt+F12`）输入`dotnet build`（或者vscode按下`ctrl+shift+b`选择`dotnet: build`，rider点击菜单构建）创建dll文件。由于之前`.csproj`文件的配置，dll文件自动复制到游戏根目录的`mods`文件夹里了。

## 导出PCK

回到Godot编辑器，点击项目→导出，点击上方的`添加`一个windows预设，然后

* 点击`导出pck/zip`，把文件名字改成`[项目名].pck`。
* 文件夹选择你之前导出的dll同名目录。
* <b>注意一定得是pck！！！</b>
* 可选：由于现在不需要pck里包含`mod_manifest.json`了，在导出选项里点击`资源`，`从项目中排除文件或目录`，填写`{modid}.json`，`modid`填你自己的，不要写`{modid}`。

* 建议之后通过之后的自动打包进行。如果要兼容mac平台见下：

> 用文本编辑器打开`export_presets.cfg`，将`binary_format/architecture="x86_64"`改为`binary_format/architecture="msil"`。

![alt text](../../images/image5.webp)

![alt text](../../images/image6.webp)

## 了解导出结果

现在你的`mods`文件夹里有一个你的mod命名的文件夹，里面有一个dll文件、一个pck文件和一个json文件，这三个文件是构成一个mod的组件。

* dll文件是mod的代码。如果你没有代码，可以不要。如果你之后改动了代码，只要重新build一下就行。
* pck文件是mod的素材资源。如果你没有素材，可以不要。如果你没有素材上的变动，不需要重新打包一次pck。
* json文件是mod的配置文件，是必须的。

## 运行并验证

运行游戏。第一次会提示是否开启mod，选择是，然后游戏会关闭，打开第二次即可，如果右下角显示“已加载模组”即加载成功。如果发现存档丢失，看下一章。

## Rider不启动Godot打包（可选）

Godot支持命令行导出pck（首先你需要添加一个导出配置），例如使用终端命令：`"{你的godot.exe的路径}" --headless --export-pack "{你的导出配置的名字，例如Windows Desktop}" "{杀戮尖塔根目录}/mods/{你的modid}/{你的modid}.pck"`，参考 https://docs.godotengine.org/zh-cn/4.x/tutorials/editor/command_line_tutorial.html#exporting 。你可以把这个命令保存成一个cmd或者csproj里的target。

打开你的`csproj`并新增以下内容：

```xml
<Project Sdk="Godot.NET.Sdk/4.5.1">
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <ImplicitUsings>true</ImplicitUsings>
    <LangVersion>13.0</LangVersion>
    <Nullable>enable</Nullable>
    <AllowUnsafeBlocks>true</AllowUnsafeBlocks>

    <Sts2Dir>D:/Files/Softwares/Steam/steamapps/common/Slay the Spire 2</Sts2Dir>
      <!-- 新增 -->
    <GodotExe>D:/Files/Projects/godot/Godot_v4.5.1-stable_mono_win64/Godot_v4.5.1-stable_mono_win64/Godot_v4.5.1-stable_mono_win64.exe</GodotExe>
    <Sts2DataDir>$(Sts2Dir)/data_sts2_windows_x86_64</Sts2DataDir>
  </PropertyGroup>

  <ItemGroup>
    <Reference Include="sts2">
      <HintPath>$(Sts2DataDir)/sts2.dll</HintPath>
      <Private>false</Private>
    </Reference>

    <Reference Include="0Harmony">
      <HintPath>$(Sts2DataDir)/0Harmony.dll</HintPath>
      <Private>false</Private>
    </Reference>
  </ItemGroup>

  <Target Name="Copy Mod" AfterTargets="PostBuildEvent">
    <Message Text="Copying mod to Slay the Spire 2 mods folder..." Importance="high" />
    <MakeDir Directories="$(Sts2Dir)/mods/" />
    <Copy SourceFiles="$(TargetPath)" DestinationFolder="$(Sts2Dir)/mods/$(MSBuildProjectName)/" />
    <Copy SourceFiles="$(MSBuildProjectName).json" DestinationFolder="$(Sts2Dir)/mods/$(MSBuildProjectName)/" />
  </Target>

  <!-- 新增 -->
  <Target Name="ExportPck" AfterTargets="Publish">
    <Message Text="Copying PCK to Slay the Spire 2 mods folder..." Importance="high" />
    <Exec Command="&quot;$(GodotExe)&quot; --headless --export-pack &quot;Windows Desktop&quot; &quot;$(Sts2Dir)/mods/$(MSBuildProjectName)/$(MSBuildProjectName).pck&quot;"
      EnvironmentVariables="IsInnerGodotExport=true;MSBUILDDISABLENODEREUSE=1"
      ContinueOnError="WarnAndContinue" />
  </Target>
</Project>
```

然后右键你的项目点击`Publish`即可。一路点OK就行。

![alt text](../../images/image45.webp)

## VSCode不启动Godot打包（可选）

例如在你的`.csproj`文件里添加`GodoExe`和`ExportPck`的内容：

```xml
<Project Sdk="Godot.NET.Sdk/4.5.1">
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <ImplicitUsings>true</ImplicitUsings>
    <LangVersion>13.0</LangVersion>
    <Nullable>enable</Nullable>
    <AllowUnsafeBlocks>true</AllowUnsafeBlocks>

    <Sts2Dir>D:/Files/Softwares/Steam/steamapps/common/Slay the Spire 2</Sts2Dir>
      <!-- 新增 -->
    <GodotExe>D:/Files/Projects/godot/Godot_v4.5.1-stable_mono_win64/Godot_v4.5.1-stable_mono_win64/Godot_v4.5.1-stable_mono_win64.exe</GodotExe>
    <Sts2DataDir>$(Sts2Dir)/data_sts2_windows_x86_64</Sts2DataDir>
  </PropertyGroup>

  <ItemGroup>
    <Reference Include="sts2">
      <HintPath>$(Sts2DataDir)/sts2.dll</HintPath>
      <Private>false</Private>
    </Reference>

    <Reference Include="0Harmony">
      <HintPath>$(Sts2DataDir)/0Harmony.dll</HintPath>
      <Private>false</Private>
    </Reference>
  </ItemGroup>

  <Target Name="Copy Mod" AfterTargets="PostBuildEvent">
    <Message Text="Copying mod to Slay the Spire 2 mods folder..." Importance="high" />
    <MakeDir Directories="$(Sts2Dir)/mods/" />
    <Copy SourceFiles="$(TargetPath)" DestinationFolder="$(Sts2Dir)/mods/$(MSBuildProjectName)/" />
    <Copy SourceFiles="$(MSBuildProjectName).json" DestinationFolder="$(Sts2Dir)/mods/$(MSBuildProjectName)/" />
  </Target>

  <!-- 新增 -->
  <Target Name="ExportPck">
    <Message Text="Copying PCK to Slay the Spire 2 mods folder..." Importance="high" />
    <Exec Command="&quot;$(GodotExe)&quot; --headless --export-pack &quot;Windows Desktop&quot; &quot;$(Sts2Dir)/mods/$(MSBuildProjectName)/$(MSBuildProjectName).pck&quot;"
      EnvironmentVariables="IsInnerGodotExport=true;MSBUILDDISABLENODEREUSE=1"
      ContinueOnError="WarnAndContinue" />
  </Target>
</Project>
```

然后控制台输入`dotnet build -t:ExportPck`即可连PCK一起导出。输入`dotnet build`仅编译dll。

方法不限。你也可以使用`tasks.json`和`publish`（modtemplate使用的）。

## mac支持（可选）

用文本编辑器打开`export_presets.cfg`，将`binary_format/architecture="x86_64"`改为`binary_format/architecture="msil"`。