`BaseLib`是统一添加新内容行为的基础mod，类似于塔1的`basemod`和`stslib`。

https://github.com/Alchyr/BaseLib-StS2

> 由于目前`BaseLib`尚处于开发阶段，如果只打patch不添加新内容可以不使用。
> 以下内容使用baselib0.3.0，游戏测试分支。

先依赖baselib才能查看这里里面的文章。

## 下载

* 前往 https://github.com/Alchyr/BaseLib-StS2/releases 下载`dll`，`pck`和`json`三个文件，把他们放在`mods`文件夹里。记住你下载的版本。

* 在`csproj`文件中相应位置引用`BaseLib.dll`，如下，两种方式都可。

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
    <Reference Include="BaseLib">
      <HintPath>$(Sts2Dir)/mods/BaseLib/BaseLib.dll</HintPath>
      <Private>false</Private>
    </Reference>
    <!-- NuGet获取，注意版本是否一致，不一致手动更改Version -->
    <!-- <PackageReference Include="Alchyr.Sts2.BaseLib" Version="*" /> -->
  </ItemGroup>
```

* 不要忘了在你`{modid}.json`中填写`dependencies`。

```json
  "dependencies": ["BaseLib"],
```