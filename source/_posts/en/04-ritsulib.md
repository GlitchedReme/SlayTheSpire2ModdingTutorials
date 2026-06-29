---
title: RitsuLib
date: 2026-04-21 19:17:14
permalink: en/docs/04-ritsulib/
categories:
- Basics
---
`RitsuLib` is another base library that standardizes adding new content.

https://github.com/BAKAOLC/STS2-RitsuLib

You must depend on RitsuLib first before the articles in this section apply.

## Download

## NuGet (Recommended)

```xml
  <!-- Add inside the upper PropertyGroup -->
  <PropertyGroup>
    <!-- Other entries omitted; add the following line to auto-deploy to your mods folder -->
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

    <!-- NuGet retrieval -->
    <PackageReference Include="STS2.RitsuLib" Version="*" />
    <!-- If you are developing against a different version, freely specify a compatible version -->
    <!-- <PackageReference Include=" STS2.RitsuLib.Compat.0.103.2 " Version="*" /> -->
  </ItemGroup>
```

### Local

* Go to https://github.com/BAKAOLC/STS2-RitsuLib/releases and download a stable release (not `Development build`, but something like `STS2.RitsuLib.X.X.X.github.zip`), extract it, and place it in your `mods` folder. Remember the version you downloaded.

* Choose the `RitsuLib` version matching your game version. For example, builds without a suffix like `STS2.RitsuLib.XXX.github.zip` typically track the beta branch, while builds like `STS2.RitsuLib.Compat.0.103.2.XXX.github.zip` are compatible with the `0.103.2` stable version.

* Reference `STS2-RitsuLib.dll` at the appropriate location in your `csproj` file as shown below. Either approach works. NuGet is recommended.

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

    <!-- Local reference; verify that the path is correct -->
    <Reference Include="STS2-RitsuLib">
      <HintPath>$(Sts2Dir)/mods/RitsuLib/STS2-RitsuLib.dll</HintPath>
      <Private>false</Private>
    </Reference>
  </ItemGroup>
```

* Don't forget to fill in `dependencies` in your `{modid}.json`.

```json
  "dependencies": [
    { "id": "STS2-RitsuLib", "min_version": "0.2.27" }
  ],
```

* When distributing, you can pack your mod together with the extracted contents of `STS2-RitsuLib.XXX.variant-pack.zip` for players. This variant automatically detects the game version and uses the matching library.

## Initialization

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
    // Your mod id
    public const string ModId = "test";
    public static readonly Logger Logger = RitsuLibFramework.CreateLogger(ModId);

    public static void Init()
    {
        // Harmony is usable, but using Ritsu's wrapper Patch is preferred — see the Patching System chapter
        // var harmony = new Harmony("com.example.testmod");
        // harmony.PatchAll();
        var assembly = Assembly.GetExecutingAssembly();
        RitsuLibFramework.EnsureGodotScriptsRegistered(assembly, Logger);
        // Auto-register content
        ModTypeDiscoveryHub.RegisterModAssembly(ModId, assembly);
    }
}
```

## Registering Content

`RitsuLib` supports both explicit and automatic registration. For example, auto-registering a card:

```csharp
// Register a card
[RegisterCard(typeof(TestCardPool))]
// Register as a character starter card. Remove this line if not needed.
[RegisterCharacterStarterCard(typeof(TestCharacter), 5)]
public class TestCard : ModCardTemplate {}
```

Or explicitly register in the initialization function:

```csharp
RitsuLibFramework.CreateContentPack(ModId)
    .Card<TestCardPool, TestCard>()
    .Relic<TestRelicPool, TestRelic>()
    .Character<TestCharacter>()
    .ActEncounter<Glory, TestEncounter>()
    .Apply();
```
