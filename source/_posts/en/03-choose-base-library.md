---
title: Choosing a Base Library
date: 2026-04-21 19:17:14
permalink: en/docs/03-choose-base-library/
categories:
- Basics
---
> If you're making a character mod, using a base library cuts down on patches and workload. It also improves compatibility with other mods.

Two common base libraries right now: [BaseLib](https://github.com/Alchyr/BaseLib-StS2) and [RitsuLib](https://github.com/BAKAOLC/STS2-RitsuLib).

There is also a specialized minion library: [MinionLib](https://github.com/FuYnAloft/MinionLib).

See the respective sections for each.

## Comparison

Feature support as of 2026.07.16:

| Feature | BaseLib | RitsuLib | Notes |
|-----------|------|------|------|
| Basic content registration | ✅ | ✅ | - |
| In-run data saving | ✅ | ✅ | - |
| Hand size limit control | ✅ | ✅ | - |
| Mod Interop | ✅ | ✅ | - |
| Config options | ✅ | ✅ | RitsuLib has richer options and supports mirroring BaseLib configs |
| Vanilla placeholder assets | ✅ | ✅ | - |
| DynamicVar tooltip text | ✅ | ✅ | - |
| Keyword registration | ✅ | ✅ | - |
| Health bar overlay (Poison/Doom) | ✅ | ✅ | - |
| Scene transitions without script attachment | ✅ | ✅ | - |
| Non-spine character animation compatibility | ✅ | ✅ | - |
| New card piles | ✅ | ✅ | - |
| Missing asset placeholder warning | ✅ | ✅ | - |
| Extra badges | ✅ | ✅ | BaseLib only shows dual-number power display |
| Custom rewards | ✅ | ✅ | - |
| Node attachment | ✅ | ✅ | - |
| Components | ✅ | ✅ | - |
| STS1 localization symbols | ✅ | ❌ | - |
| FMOD audio | ❌ | ✅ | BaseLib uses native Godot audio; RitsuLib supports FMOD |
| Diagnostic/debug tools | 🚧 | ✅ | Export card images, patch dump, etc. |
| Data persistence | ❌ | ✅ | - |
| Top bar buttons | ❌ | ✅ | - |
| Notification prompts | ❌ | ✅ | - |
| Custom goals | ❌ | ✅ | - |
| Data telemetry | ❌ | ✅ | - |
| Mod update checker | ❌ | ✅ | - |
| Timeline registration | ❌ | ✅ | In-game timeline vignettes |
| Event pipeline | ❌ | ✅ | Subscribe to events, trigger on firing |
| Lifecycle events | ❌ | ✅ | - |
| Card glow management | ❌ | ✅ | - |
| Hotkey binding | ❌ | ✅ | - |
| Animation state machine | ❌ | ✅ | BaseLib accepts vanilla animation names but can't customize |
| Secondary resources | ❌ | ✅ | Similar to the Sovereign's starlight resource system |
| Networking | CustomMessage | Sideload network management | - |
| Content IDs | Namespace first segment uppercase, e.g. `TEST-TEST_CARD` | modid + category, e.g. `TEST_CARD_TEST_CARD` | - |
| Patching | Raw Harmony | Raw Harmony + wrapped patch system | - |

## Important Notes

* Objectively speaking, for features that both libraries support, RitsuLib's implementation is generally more polished. Additionally, some features were contributed to BaseLib by the RitsuLib author.

* If you're not adding gameplay content, you don't need a base library. But for character mods and similar, using one saves work and improves compatibility.
