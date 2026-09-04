---
title: Console Commands
date: 2026-05-08 12:58:19
permalink: en/docs/09-console-commands/
categories:
- Basics
---
## Usage

STS2 has a built-in console. With mods loaded, press `~` to open it.

* `Tab` autocompletes based on your current input. Use `↑` `↓` arrow keys to select a suggestion, then `Enter` to confirm.

* `↑` recalls the previous command. Use `↑` `↓` to scroll through history.

* When the most recent command is selected, `↓` clears the current input.

## All Commands

All commands listed below.

* `<X>` means required parameter, `[X]` means optional.

* `target index` starts at 0 (the player you control). In single player, 1 and up are enemies (ordered by spawn). In multiplayer, 0 is Host, 1 and up are other players first.

### Combat

| Name | Command Format | Description |
|:---:|:---|:---|
| **Damage** | `damage <value> [target index]` | Deal damage to all enemies. Specify an index to target a single one. |
| **Block** | `block <value> [target index]` | Add Block to the player. Specify an index to target a specific creature. |
| **Kill** | `kill [target index\|all]` | Kill the specified target. `all` kills all enemies. Defaults to the first enemy. |
| **Die** | `die` | Lose immediately. |
| **Win** | `win` | Win immediately. |
| **Heal** | `heal <value> [index]` | Restore player HP. Specify an index to heal another creature. |
| **God Mode** | `godmode` | Toggle god mode — grants powerful buffs. Enter again to disable. |
| **Power** | `power <ID> <stacks> <target index>` | Apply a power to the specified target. |
| **Energy** | `energy <value>` | Add energy to the player. Can be positive or negative. |
| **Gold** | `gold <value>` | Add gold to the player. Can be positive or negative. |
| **Stars** | `stars <value>` | Add the specified number of Stars to the player. |
| **Relic** | `relic [add\|remove] <relic ID>` | Add or remove a relic from the player. Defaults to add. |
| **Potion** | `potion <ID>` | Add a potion with the specified ID. |

### Cards

| Name | Command Format | Description |
|:---:|:---|:---|
| **Get Card** | `card <card ID> [pile name]` | Generate a card in the specified pile: `hand` (default), `draw`, `discard`, `exhaust`, `master_deck`. |
| **Remove Card** | `remove_card <ID> [pile name]` | Remove a card from the specified pile. |
| **Upgrade Card** | `upgrade <hand position>` | Upgrade the card at the specified hand position (0 = leftmost). |
| **Enchant** | `enchant <ID> [stacks] [hand position]` | Apply the specified enchantment to a card in hand. Stacks default to 1. Defaults to leftmost card. |
| **Afflict** | `afflict <ID> [stacks] [hand position]` | Apply the specified curse to a card in hand. Stacks default to 1. Defaults to leftmost card. |
| **Draw** | `draw <count>` | Draw the specified number of cards. |

## Map

| Name | Command Format | Description |
|:---:|:---|:---|
| **Skip to Act** | `act <number\|name>` | Jump to the specified act. Use an integer or the act's ID. |
| **Skip to Room** | `room <ID>` | Jump to the room node with the specified ID. (e.g. `BOSS`, `SHOP` — check tab completion) |
| **Skip to Event** | `event <ID>` | Jump to the event node with the specified ID. |
| **Skip to Fight** | `fight <ID>` | Jump to the monster encounter with the specified ID. |
| **Map Teleport** | `travel` | Toggle map teleport mode — click any room to jump directly there. |
| **Ancient** | `ancient <ID> [relic ID]` | Jump to the specified Ancient. Add an optional parameter to guarantee a specific relic option appears. |

## Other

| Name | Command Format | Description |
|:---:|:---|:---|
| **Help** | `help [command name]` | List all available commands, or view detailed help and usage examples for a specific command, e.g. `help card`. |
| **Open Path** | `open <logs\|saves\|root\|build-logs\|loc-override>` | Open common directories in file explorer: logs, saves, game root, build logs, localization overrides. |
| **Unlock Content** | `unlock <type>` | Mark the specified content type as discovered: `cards`, `potions`, `relics`, `monsters`, `events`, `epochs`, `ascensions`. `all` unlocks everything. |
| **Achievements** | `achievement <action> [ID]` | Unlock (`unlock`) or revoke (`revoke`) achievements. No ID operates on all achievements. |
| **Leaderboard** | `leaderboard [option] [name] <score> [count]` | Submit a score to the leaderboard. Options: `upload`, `random` (generate random scores for testing). |
| **Get Logs** | `getlogs [test-feedback] <name>` | Collect logs and pack them into a zip, then open its directory. `test-feedback` packages only key files (meant for the dev team, not mod developers). |
| **Print IDs** | `dump` | Output all model IDs to the console and log file. |
| **Log Level** | `log [type] <level>` | Set log output level. Levels: `verydebug`, `debug`, `info`, `warn`, `error`. |
| **Missing Art** | `art <type>` | List content that is missing art assets. Types: `card`, `relic`, `potion`, `enchant`, etc. |
| **Speed Mode** | `instant` | Enable speed mode, skipping all animation delays. |
| **Bestiary** | `bestiary` | Open the monster bestiary interface. |
| **Sentry Test** | `sentry <test\|message\|exception\|crash\|status> [text]` | Test Sentry error reporting. |
| **Trailer Mode** | `trailer` | Toggle trailer mode. When enabled, use number keys 0-9 to show/hide UI elements — useful for recording trailers and screenshots. |
| **Cloud Save** | `cloud delete` | Delete all save files on Steam Cloud. Steam only. |
| **Multiplayer** | `multiplayer` | Open the multiplayer menu. Add `test` to open the test scene. |
