可以通过添加启动参数开启各种功能。

尖塔根目录有许多`launch_xxx.bat`，选择一个合适的，右键记事本编辑。

## 总览

| 参数 | 示例 | 作用说明 |
|-------------|----------|----------|
| `autoslay` | `--autoslay` | 自动进行游戏测试。 |
| `seed` | `--seed=abc123` | 给`autoslay`指定随机种子。 |
| `log-file` | `--log-file=C:\logs\autoslay.log` | 指定`autoslay`日志输出文件。 |
| `bootstrap` | `--bootstrap` | 启动后直接进入某个场景。 |
| `fastmp` | `--fastmp=join` | 多人本地测试。 |
| `clientId` | `--clientId=2001` | 指定本地测试玩家ID。 |
| `+connect_lobby` | `+connect_lobby 12345678901234567` | 启动后按Steam大厅ID自动加入。 |
| `nomods` | `--nomods` | 不启用mod模式。 |
| `force-steam` | `--force-steam` 或 `force-steam=on` / `force-steam=off` | 强制开启或关闭Steam初始化。 |
| `-log` | `-log Net Info` | 设置指定日志类型的输出级别。 |
| `-wpos` | `-wpos 100 200` | 窗口模式下放置窗口的位置。 |

Godot自带命令行参数： https://docs.godotengine.org/zh-cn/4.x/tutorials/editor/command_line_tutorial.html

## 本地联机测试

复制出两个新的`bat`，其中一个添加`--fastmp=host`参数，作为主机，另一个添加`--fastmp=join --clientId=1001`参数，作为非主机玩家。当然你可以添加更多，记得修改`clientId`。

如果提示不是通过steam启动，在根目录创建一个`steam_appid.txt`，里面写`2868840`，然后双击修改的bat文件运行即可以一个能输出log的命令行的方式打开游戏。或者添加`--force-steam=off`参数。

如果你打完一层遇到保存问题，记得以管理员模式启动bat。

| `fastmp`参数 | 说明 |
|----|------|
| `host` | 打开多人菜单。 |
| `host_standard` | 直接启动标准模式。 |
| `host_daily` | 直接启动每日模式。 |
| `host_custom` | 直接启动自定义模式。 |
| `load` | 加载本地玩家的多人存档。 |
| `join` | 加入。需要`clientId`。 |

## 自动测试

> 发行版无法使用。需要自己patch：
> ```csharp
> 
> [HarmonyPatch(typeof(NGame), nameof(NGame.IsReleaseGame))]
> public static class NGamePatch
> {
>     public static void Postfix(ref bool __result)
>     {
>         __result = false;
>     }
> }
> ```

尖塔有一个自动跑图测试的模式，通过启用`--autoslay`开启。启动后会自己随机选一个角色然后开始自动打牌测试。可添加`seed`指定种子。

## Bootstrap

> 发行版无法使用。需要自己patch`IBootstrapSettingsSubtypes`中的`Get`以添加启动场景。

直接到某个场景。