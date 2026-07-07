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

## 未讲解内容

以下公开 API 在 RitsuLib 源码中存在，但本教程暂无对应文章。

### RitsuLibFramework 中的公开方法

1. `GetModelCloneRegistry()` — 模型复制监听
2. `GetCardTransformRegistry()` / `ModCardTransformRegistry` — 卡牌转换监听
3. `RegisterHealHookListener()` / `IHealHookListener` / `HealHook` — 全局治疗事件钩子
4. `RegisterCardOnPlayHookListener()` / `ICardOnPlayHookListener` — 全局卡牌打出钩子
5. `RegisterFreePlayBinding()` — 免费打出检测器
6. `RegisterAncientOption<T>()` — 给已有的先古之民注入选项
7. `RegisterModSettingsSidebarOrder()` / `RegisterModSettingsPageOrder()` — 设置页排序
8. `GetModRunRng()` / `GetModPlayerRng()` — 额外的独立随机数生成器
9. `RegisterRelicVisibilityRule()` — 遗物可见性控制
10. `RegisterDustyTomeCard()` — 尘封魔典卡牌注册
11. `I18N` 实例创建：`CreateLocalization()` / `CreateModLocalizationWithFallback()` — 和游戏独立的本地化系统

### 接口

12. `IAttackHitHookListener` / `AttackHitHook` — 攻击命中全局监听
13. `IPlayerResourceHookListener` / `PlayerResourceHook` — 能量/辉星变化全局监听
14. `IRitsuGodotNodeFactory<TNode>` — 类型化节点工厂
15. `IModCharacterCardLibraryCompendiumPlacement` — 图鉴卡池放置规则

### 公开静态工具类

16. `DynamicVarTooltipRegistry` — 动态变量提示文本注册
17. `RitsuGodotNodeFactories` — 节点工厂帮助类
18. `CombatBackgroundAssetsFactory` — 战斗背景资源工厂
19. `ModAncientStageVisuals` — 先古之民场景构造器
20. `CharacterAssetPathHelper` — 角色资源路径辅助
21. `CharacterOwnedVanillaRelicModelId` — 原版遗物 ID 常量

### 注册注解

22. `[RegisterSmartFormatter]` — SmartFormat 格式化器注册
23. `[RegisterSmartFormatSource]` — SmartFormat 数据源注册
24. `[RegisterDefaultModelCapability]` — 默认组件配置
25. `[RegisterMutuallyExclusiveModifierGroup]` — 互斥每日特效组
26. `[AutoTimelineSlotBeforeEpochColumn]` / `[AutoTimelineSlotAfterEpochColumn]` / `[AutoTimelineSlotInEpochColumn]` — 时间线定位
27. `[RegisterEpochRelicsFromPool]` — 将指定遗物池里的所有遗物注册为该时期的解锁内容
28. `[RequireAllCardsInPool]` — 要求整个池的卡都被发现才能解锁该时期
