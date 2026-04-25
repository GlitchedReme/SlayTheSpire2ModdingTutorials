`RitsuLib`是另一个统一添加新内容行为的基础mod。

https://github.com/BAKAOLC/STS2-RitsuLib

> 以下内容使用ritsulib0.2.3。

先依赖ritsulib才能查看这里里面的文章。

## 下载

* 前往 https://github.com/BAKAOLC/STS2-RitsuLib/releases 下载`dll`，和`json`两个文件，把他们放在`mods`文件夹里。记住你下载的版本。

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
    <!-- <Reference Include="STS2-RitsuLib">
      <HintPath>$(Sts2Dir)/mods/RitsuLib/STS2-RitsuLib.dll</HintPath>
      <Private>false</Private>
    </Reference> -->
    <!-- NuGet获取，注意版本是否一致，不一致手动更改Version -->
    <PackageReference Include="STS2.RitsuLib" Version="*" />
  </ItemGroup>
```

* 不要忘了在你`{modid}.json`中填写`dependencies`。

```json
  "dependencies": ["STS2-RitsuLib"],
```

下面展示`RitsuLib`的各种功能。如果你想马上做出一张卡牌，先看`初始化函数`就行。

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