---
title: 04 BaseLib
date: 2026-03-15 00:00:00
permalink: docs/04-baselib/
categories:
- Basics
---

`BaseLib`是统一添加新内容行为的基础mod，类似于塔1的`basemod`和`stslib`。

https://github.com/Alchyr/BaseLib-StS2

> 由于目前（2026.3.14）`BaseLib`尚处于开发阶段，如果只打patch不添加新内容可以不使用。

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

## 添加新卡牌

参考上一章添加卡牌的过程，只需要修改：

1. 添加一个`Pool`的attribute，并指定要添加的颜色卡池，然后会自动注册，不需要`ModHelper.AddModelToPool`了。
2. 继承`CustomCardModel`而不是`CardModel`。
3. <b>注意</b>：通过`baselib`添加卡牌，其id会变成`{命名空间第一段大写}-{原卡牌id}`，例如`namespace Test.Scripts;`取`TEST`，最后变成`TEST-TEST_CARD2`。
4. 卡图参考上一章，注意写法已经修改（2026.3.12）。另外还有一个自定义卡框的功能，override即可：`public override Texture2D? CustomFrame => GD.Load<Texture2D>("res://images/icon_1024.png");`

```csharp
[Pool(typeof(ColorlessCardPool))]
public class TestCard2 : CustomCardModel {}
```

```json
    "TEST-TEST_CARD2.title": "测试卡牌2",
    "TEST-TEST_CARD2.description": "造成{Damage:diff()}点伤害。"
```

## 自定义模组配置

* 要使用此功能，需要先放一张图片到`{modId}\mod_image.png`作为mod图标，尺寸任意，否则会由于报错不显示配置。
* 添加一个继承`SimpleModConfig`（或者是`ModConfig`如果你想要更复杂的设置）的类，在其中添加`public static bool`变量。目前只支持`bool`。
* 在初始化函数调用`ModConfigRegistry.Register`。字符串写你的`modId`。

```csharp
[ModInitializer("Init")]
public class Entry
{
    public static void Init()
    {
        ModConfigRegistry.Register("test", new ModConfig());
    }
}

public class ModConfig : SimpleModConfig
{
    public static bool Test1 { get; set; } = true;
    public static bool Test2 { get; set; } = false;
    public static bool Test3 { get; set; } = true;
}
```

![示例配置](../../images/image12.png)

## 添加新遗物
TODO：和添加卡牌类似。

## 添加新怪物
TODO

## 添加新能力
TODO

## 添加新事件
TODO

## 添加新药水
TODO

## 添加新附魔
TODO

## 添加先古卡
TODO

## 添加先古之民
TODO
