`BaseLib` is a base library that standardizes adding new content, similar to STS1's `basemod` plus `stslib`.

https://github.com/Alchyr/BaseLib-StS2

> `BaseLib` is still in development. If you're only patching without adding new content, you can skip it.
> The following content uses BaseLib 3.1.2.

Add BaseLib as a dependency before reading the articles here.

## Download

* Go to https://github.com/Alchyr/BaseLib-StS2/releases and download the `dll`, `pck`, and `json` files. Place them in your `mods` folder. Note the version you downloaded.

* Reference `BaseLib.dll` in your `csproj` as shown below. Either method works. NuGet is the current recommendation.

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

    <!-- Local reference — make sure the path is correct -->
    <!-- <Reference Include="BaseLib">
      <HintPath>$(Sts2Dir)/mods/BaseLib/BaseLib.dll</HintPath>
      <Private>false</Private>
    </Reference> -->
    <!-- NuGet — check the version matches, or change it manually -->
    <PackageReference Include="Alchyr.Sts2.BaseLib" Version="*" />
  </ItemGroup>
```

* Don't forget to fill in `dependencies` in your `{modid}.json`.

```json
  "dependencies": [
    { "id": "BaseLib", "min_version": "3.1.2" }
  ],
```
