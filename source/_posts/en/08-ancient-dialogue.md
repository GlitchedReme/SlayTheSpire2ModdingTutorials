---
title: Ancient Dialogues
date: 2026-03-28 16:27:14
permalink: en/docs/08-ancient-dialogue/
categories:
- Basics
---
## Creating the File

Create `{modId}/localization/{Language}/ancients.json`.

Ancient dialogue IDs follow the format `{AncientID}.talk.{CharacterID}.{DialogueIndex}-{LineIndex}[optional r].{ancient|char|next}`.

Example — Darv talking to the Ironclad:

```json
  "DARV.talk.IRONCLAD.0-0.ancient": "Ah, the fiery warrior returns!\nI've got something just for you!",
  "DARV.talk.IRONCLAD.1-0r.ancient": "Good to see you're still alive and cracking skulls!",
  "DARV.talk.IRONCLAD.2-0.ancient": "I still have your heavy blade... but I couldn't find anyone who could repair it.",
  "DARV.talk.IRONCLAD.2-0.next": "Continue",
  "DARV.talk.IRONCLAD.2-1.char": "[i][font_size=22]The Ironclad stares at Darv.[/font_size][/i]",
  "DARV.talk.IRONCLAD.2-1.next": "Continue",
  "DARV.talk.IRONCLAD.2-2.ancient": "Perhaps the Architect knows something.",
  "DARV.talk.firstVisitEver.0-0.ancient": "...Where did I put that thing... Ah!\nHere to see my collection!? Pick anything from that pile over there, and put it to good use!",
  "DARV.title": "Darv", // Ancient's name
  "DARV.epithet": "The Hoarder", // Ancient's epithet
```

## Dialogue Content

The last segment — `ancient`, `char`, or `next` — indicates who's speaking:
- `ancient`: the Ancient
- `char`: the character
- `next`: the continue button text

The second-to-last segment `X-Y` means dialogue set X, line Y.

The game picks the dialogue set based on encounter count (0-indexed):

* The very first time you ever meet this Ancient across all runs, it triggers `DARV.talk.firstVisitEver.0-0.ancient`.
* After that, the Ironclad's 1st encounter triggers set `0`. He says `DARV.talk.IRONCLAD.0-0.ancient`. If `0-1` exists, it continues to that, then `0-2`, and so on. (For each `Y` in `X-Y`, there can be one line of dialogue and one `next` for the button text.)
* The Ironclad's 2nd encounter triggers set `1`.
* The Ironclad's 3rd encounter — no matching set exists in code (`VisitIndex = 2` is missing). But set `1` is marked `r` (repeatable), so it repeats set `1`.
* The Ironclad's 4th encounter: same logic, repeats set `1`.
* The Ironclad's 5th encounter triggers set `2` (`VisitIndex = 4` exists in code).
* The Ironclad's 6th encounter and beyond: no matching set, so it looks for repeatable ones. Only set `1` is marked `r`, so it keeps repeating set `1`. (If you define set `3r`, it would randomly choose between the two repeatable sets.)

If the Ancient doesn't recognize your character, it falls back to `ANY`:

```json
  "DARV.talk.ANY.0-0r.ancient": "Come, come, here are some forgotten gems — take one!",
  "DARV.talk.ANY.1-0r.ancient": "I'm quite busy today!\nJust grab whatever you want from that pile!!",
```

## Attacking the Architect

The Architect's attack animation is hardcoded in vanilla. Both base libraries let you add an `-attack` suffix in the JSON to specify the attack animation.

Values: `Both`, `Architect`, `Player`, or `None` — indicates who attacks.

```json
  "THE_ARCHITECT.talk.TEST_CHARACTER.0-attack": "Both"
```

Additionally, `-startattack` and `-endattack` can be specified to trigger the attack before or after the dialogue (as the Silent does). Same value options: `Both`, `Architect`, `Player`, or `None`.

## Base Library Extensions

Both libraries let you specify which encounter triggers a dialogue set:

```json
  "TEST_ANCIENT.talk.TEST_CHARACTER.1-visit": "3"
```

RitsuLib supports `.sfx` to play an FMOD sound effect:

```json
  "TEST_ANCIENT.talk.ANY.0-0r.ancient.sfx": "event:/sfx/ui/enchant_simple"
```
