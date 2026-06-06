`RitsuLib`是另一个统一添加新内容行为的基础mod。

https://github.com/BAKAOLC/STS2-RitsuLib

先依赖ritsulib才能查看这里里面的文章。

## 下载

## nuget获取（推荐）

```xml
  <!-- 在上方PropertyGroup里添加 -->
  <PropertyGroup>
    <!-- 其余省略，添加以下这行，可以自动部署到你的mods文件夹 -->
    <RitsuLibDeployDir>$(Sts2Dir)/mods/STS2-RitsuLib/</RitsuLibDeployDir>
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

    <!-- NuGet获取 -->
    <PackageReference Include="STS2.RitsuLib" Version="*" />
    <!-- 如果你在其他版本开发，自由指定兼容版本 -->
    <!-- <PackageReference Include=" STS2.RitsuLib.Compat.0.103.2 " Version="*" /> -->
  </ItemGroup>
```

### 本地

* 前往 https://github.com/BAKAOLC/STS2-RitsuLib/releases 下载稳定版本（不是`Development build`，而是例如`STS2.RitsuLib.X.X.X.github.zip`这样的），解压出来放在`mods`文件夹里。记住你下载的版本。

* 请根据你的游戏版本选择对应的`RitsuLib`版本。例如不带后缀的`STS2.RitsuLib.XXX.github.zip`一般跟随测试版，而例如`STS2.RitsuLib.Compat.0.103.2.XXX.github.zip`这种是兼容`0.103.2`正式版的版本。

* 在`csproj`文件中相应位置引用`STS2-RitsuLib.dll`，如下，两种方式都可。推荐使用nuget。

```xml
  <ItemGroup>
    <Reference Include="sts2">
      <HintPath>$(Sts2DataDir)/sts2.dll</HintPath>
      <Private>false</Private>
    </Reference>

    <Reference Include="0Harmony">
      <HintPath>$(Sts2DataDir)/0Harmony.dll</HintPath>
      <Private>false</Private>
    </Reference>

    <!-- 本地引用，注意路径是否正确 -->
    <Reference Include="STS2-RitsuLib">
      <HintPath>$(Sts2Dir)/mods/RitsuLib/STS2-RitsuLib.dll</HintPath>
      <Private>false</Private>
    </Reference>
  </ItemGroup>
```

* 不要忘了在你`{modid}.json`中填写`dependencies`。

```json
  "dependencies": [
    { "id": "STS2-RitsuLib", "min_version": "0.2.27" }
  ],
```

* 分发时，可以把自己的mod和`STS2-RitsuLib.XXX.variant-pack.zip`解压后的打包给玩家。该版本可以自己检测游戏版本并使用对应的库。

## 初始化函数

```csharp
using System.Reflection;
using MegaCrit.Sts2.Core.Logging;
using MegaCrit.Sts2.Core.Modding;
using STS2RitsuLib;
using STS2RitsuLib.Interop;

namespace Test.Scripts;

[ModInitializer(nameof(Init))]
public class Entry
{
    // 你的modid
    public const string ModId = "test";
    public static readonly Logger Logger = RitsuLibFramework.CreateLogger(ModId);

    public static void Init()
    {
        // harmony可用，但是最好用ritsu的封装patch，见补丁系统一章
        // var harmony = new Harmony("com.example.testmod");
        // harmony.PatchAll();
        var assembly = Assembly.GetExecutingAssembly();
        RitsuLibFramework.EnsureGodotScriptsRegistered(assembly, Logger);
        // 自动注册内容
        ModTypeDiscoveryHub.RegisterModAssembly(ModId, assembly);
    }
}
```

## 注册内容

`RitsuLib`同时支持显式和自动注册。例如自动注册卡牌：

```csharp
// 注册卡牌
[RegisterCard(typeof(TestCardPool))]
// 注册成人物起始卡。不需要删除即可。
[RegisterCharacterStarterCard(typeof(TestCharacter), 5)]
public class TestCard : ModCardTemplate {}
```

或是在初始化函数中显式注册：

```csharp
RitsuLibFramework.CreateContentPack(ModId)
    .Card<TestCardPool, TestCard>()
    .Relic<TestRelicPool, TestRelic>()
    .Character<TestCharacter>()
    .ActEncounter<Glory, TestEncounter>()
    .Apply();
```
