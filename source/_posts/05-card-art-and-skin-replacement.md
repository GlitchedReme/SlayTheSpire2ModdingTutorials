---
title: 卡图&Spine
date: 2026-03-13 00:00:00
permalink: docs/05-card-art-and-skin-replacement/
categories:
- Visuals
---
## 卡图替换

一个简单的方式是直接打patch，如下。这样只能替换原版卡图。

```csharp
    [HarmonyPatch(typeof(CardModel), nameof(CardModel.PortraitPath), MethodType.Getter)]
    public static class CardModel_GetPortrait_Patch
    {
        // 按照类名和资源路径配对即可
        private static readonly Dictionary<string, string> CustomPortraits = new(StringComparer.OrdinalIgnoreCase)
        {
            [nameof(StrikeIronclad)] = "res://test/images/image.png",
            [nameof(DefendIronclad)] = "res://test/images/image.png",
        };

        static void Postfix(CardModel __instance, ref string __result)
        {
            var className = __instance?.GetType().Name;
            if (string.IsNullOrEmpty(className)) return;
            if (!CustomPortraits.TryGetValue(className, out var path)) return;
            if (!ResourceLoader.Exists(path)) return;
            __result = path;
        }
    }
```

## Spine导入

尖塔使用`4.2.43`版本的Spine，在这之下版本的不能直接使用。（神秘链接或网盘：https://github.com/wang606/SpineSkeletonDataConverter ）

* 第一步，安装一个`Spine Godot Extension`，建议直接下载我编译好的：https://pan.baidu.com/s/1yuxPkDpCV8EVLkDubqiirg?pwd=apar 。参考 https://zh.esotericsoftware.com/spine-godot 。把里面的文件放到你的项目根目录，然后~~可能需要~~重启一下Godot。

* 把spine中导出的atlas,skel,png文件放入项目你自己指定的位置，能在Godot文件系统中看到就算成功。

* 右键godot文件系统创建资源，创建一个`SpineSkeletonDataResource`，并把`Atlas Res`和`SkeletonFile Res`分别设置为atlas和skel文件。

* 你的战斗人物模型需要有`idle_loop`（待机循环），`attack`（攻击动作），`cast`（能力卡动作），`hurt`（受伤），`die`（死亡）这些动画名。

![1](../../images/image14.png)

![2](../../images/image15.png)

* 如果遇到问题，打开`项目→项目设置`，把`将文本资源转换为二进制`禁用。

![3](../../images/image16.png)

~~然后可以参考这段替换角色：（此处仅替换战斗人物且不播放初始动画，仅供参考）~~ 以前的代码功能太少，为了不误导新人这里删了

## 任意模型替换思路
 
* 只需patch`CharacterModel.CreateVisuals`返回继承`NCreatureVisuals`自制节点，就可以使用任意的场景替换人物。
* ~~创建一个继承`NCreatureVisuals`的类，把它挂载到你新建的`Node2D`场景中。~~参考`添加新人物`的`自定义人物背景`这一节。现在不需要脚本了
* 该场景需要有唯一化命名（%）的`Visuals(Node2D)`，`Bounds(Control)`，`IntentPos(Marker2D)`，`CenterPos(Marker2D)`。
* 如果想使用3d模型，新建`subviewportcontainer→subviewport`的层级结构，然后在`subviewport`中添加`camera3d`和任意3d模型，在3d视图中调整视角至2d视图正常显示。最后设置`subviewport`的`transparent`为`true`。
