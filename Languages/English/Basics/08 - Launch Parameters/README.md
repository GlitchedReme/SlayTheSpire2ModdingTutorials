Add launch parameters to enable various features.

The Spire root directory has several `launch_xxx.bat` files. Pick one, right-click → edit with Notepad.

## Overview

| Parameter | Example | Description |
|-------------|----------|----------|
| `autoslay` | `--autoslay` | Run automated gameplay testing. |
| `seed` | `--seed=abc123` | Specify a random seed for `autoslay`. |
| `log-file` | `--log-file=C:\logs\autoslay.log` | Specify `autoslay` log output file. |
| `bootstrap` | `--bootstrap` | Jump directly into a scene on launch. |
| `fastmp` | `--fastmp=join` | Local multiplayer testing. |
| `clientId` | `--clientId=2001` | Specify local test player ID. |
| `+connect_lobby` | `+connect_lobby 12345678901234567` | Auto-join a Steam lobby by ID after launch. |
| `nomods` | `--nomods` | Disable mod mode. |
| `force-steam` | `--force-steam` or `force-steam=on` / `force-steam=off` | Force Steam initialization on or off. |
| `-log` | `-log Net Info` | Set log output level for specified log types. |
| `-wpos` | `-wpos 100 200` | Place the window at the given position in windowed mode. |

Godot built-in command-line arguments: https://docs.godotengine.org/en/4.x/tutorials/editor/command_line_tutorial.html

## Local Multiplayer Testing

Make two copies of a bat file. Add `--fastmp=host` to one (host). Add `--fastmp=join --clientId=1001` to the other (non-host). You can add more players — just change the `clientId`.

If it says it's not launching through Steam, create a `steam_appid.txt` in the root directory with `2868840` inside, then double-click the modified bat. Or add the `--force-steam=off` parameter.

If you run into save issues after clearing a floor, run the bat as administrator.

| `fastmp` parameter | Description |
|----|------|
| `host` | Open multiplayer menu. |
| `host_standard` | Start Standard mode directly. |
| `host_daily` | Start Daily mode directly. |
| `host_custom` | Start Custom mode directly. |
| `load` | Load local player's multiplayer save. |
| `join` | Join. Requires `clientId`. |

## Automated Testing

> Not available in release builds. You need to patch it yourself:
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

Spire has an automated run-through test mode, enabled with `--autoslay`. On launch, it randomly picks a character and starts playing cards automatically. You can add `seed` to specify a seed.

## Bootstrap

> Not available in release builds. You need to patch `Get` in `IBootstrapSettingsSubtypes` yourself to add launch scenes.

Jumps directly into a scene.
