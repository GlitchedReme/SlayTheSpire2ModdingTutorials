---
title: 02 安装、看源码、修改
date: 2026-03-07 00:00:00
permalink: docs/02-install-view-source-and-patch/
categories:
- Basics
---

## 安装模组

在尖塔2游戏根目录下的 `mods` 文件夹里（`xxx\Steam\steamapps\common\Slay the Spire 2\mods`），放置模组提供的 `dll` 和 `pck` 文件各一个。可以套一个文件夹方便管理。

由于尖塔2不安装模组和安装模组的存档是分开的，当你玩模组版时需要复制一份非模组版的存档。

前往 `C:\Users\[用户名]\AppData\Roaming\SlayTheSpire2\steam\[你的 steamid]`，如果看不到 `AppData` 在哪问搜索引擎。把 `profile1` 等复制到 `modded` 里即可。

## 查看源码

任选其一：

## gdsdecomp（反编译整个游戏）

项目地址：[gdsdecomp](https://github.com/GDRETools/gdsdecomp)

1. 点击右侧 `Releases` 下载最新版。

2. 打开 `gdre_tools.exe`，点击 `RE Tools` -> `Recover Project...`，选择 `xxx\Steam\steamapps\common\Slay the Spire 2\SlayTheSpire2.pck`，点击 `Extract` 即可。

3. 如果你遇到网络问题，点击 `Export Settings...` 把 `Download Plugins` 关了。

![gdsdecomp 设置](/images/image7.png)

4. 等项目导出完，使用 Godot 导入 `project.godot` 即可。

## ILSpy 或 dnSpy（仅反编译游戏代码）

项目地址：[ILSpy](https://github.com/icsharpcode/ILSpy) / [dnSpy](https://github.com/dnSpy/dnSpy)

按说明安装软件，然后打开游戏根目录的 `data_sts2_windows_x86_64\sts2.dll` 即可查看代码。

## 修改代码

使用 `Harmony` 库进行代码修改，生态位类似于尖塔1的 patch。

参考官方文档即可：https://harmony.pardeike.net/articles/basics.html

简单参考：

![Harmony 示例](/images/image8.png)

相当于对源码：

![源码对应关系](/images/image9.png)

## 控制台

似乎开启了模组，按下 `~`（Tab 上方那个键）即可打开控制台。输入 `help` 即可查看命令。例如 `card SURVIVOR` 是把一张生存者加入手中。
