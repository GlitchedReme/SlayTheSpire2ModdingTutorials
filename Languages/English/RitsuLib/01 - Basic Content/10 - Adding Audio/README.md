https://github.com/BAKAOLC/STS2-RitsuLib/blob/main/Docs/zh/FmodAndAudio.md

## Method 1: Loading banks with FMOD

Use the FMOD tool that STS2 uses for loading. Some audio loaded via events (such as character selection, etc.) is more convenient to load via bank without modifying code.

### Download FMOD

Go to the official site https://www.fmod.com/download#fmodstudio and download FMOD Studio version 2.03.06.

![alt text](../../../images/image35.webp)

After installation, open it.

### Download the vanilla project

First download a project that has the vanilla audio GUID mappings. You can download the minimal audio example project made by the RitsuLib author (download the whole thing): https://github.com/BAKAOLC/STS2_FModProject_Minimal , or BaiduPan: https://pan.baidu.com/s/1yuxPkDpCV8EVLkDubqiirg?pwd=apar .

After downloading, open it.

### Import audio

Click the `Assets` tab on the left, drag your audio into it or right-click `Import Assets`.

![alt text](../../../images/image36.webp)

### Create a new bank

Click the `Banks` tab in the middle, create a new bank and name it `Test` or whatever you like.

* Do not modify the existing `Master` bank.

![alt text](../../../images/image37.webp)

### Create events

Click the `Events` tab on the left. You can right-click to create a new folder, nest some folders and rename them to prevent collisions with other people's IDs. Then right-click to create a new event.

![alt text](../../../images/image38.webp)

Right-click your event, click `Assign To Bank`, and select `Test` or the one you renamed (*not the Master one*).

![alt text](../../../images/image39.webp)

Next click `Window - Mixer Routing`. You need to create routing that matches the vanilla game. Here it is `master/sfx`, and place your audio there.

For example, paths in the vanilla game code are like `event:/sfx/heal`, `event:/music/act3_a1_v1`, etc., so you need to place them under the `master/sfx` and `master/music` groups respectively.

This step makes your audio affected by the game's volume and effects — for example, `sfx` is affected by the sound effects volume and `music` is affected by the music volume.

![alt text](../../../images/image41.webp)

### Create sheets

Then click the event you just created and a sheet interface will appear in the middle. Right-click to create a new sheet of any type.

* In simple terms, a timeline can implement audio splicing or delayed triggering, an action can randomly trigger one of multiple audio clips (right-click add multi instrument), a parameter can adjust audio parameters, etc.

![alt text](../../../images/image42.webp)

For example, create a timeline sheet, then click Assets and drag audio assets into the track.

![alt text](../../../images/image40.webp)

### Build

* Click `File` in the menu bar, click `Build`, then click `Export GUIDs`.

* From the root directory of your saved project, find the `Build` folder and copy `GUIDs.txt` and `Desktop/Test.bank` (or your named bank, not any other bank with Master in the name) to your mod project. For example, copy them to `Test/audios`.

* You can also set the auto-build path by clicking `Edit - Preference - Build` and selecting a build path.

![alt text](../../../images/image43.webp)

### Export presets

Godot typically does not directly import `.bank` and `GUIDs.txt`, which may cause these files to be missing from the packaged .pck file, preventing the game from loading the audio at runtime.
Make sure your export settings under the "Resources" tab have "Filters to export non-resource files/folders" include `.bank` and `GUIDs.txt` (or any other files you need).

![alt text](../../../images/fmod_export_hint.webp)

### Loading in code

Load in your initialization function:

```csharp
using STS2RitsuLib.Audio;

namespace Test.Scripts;

[ModInitializer(nameof(Init))]
public class Entry
{
    public static void Init()
    {
        // rest omitted
        FmodStudioDeferredBankRegistration.RegisterBank("res://Test/audios/Test.bank");
        FmodStudioDeferredBankRegistration.RegisterStudioGuidMappings("res://Test/audios/GUIDs.txt");
    }
}
```

Then your specified FMOD is loaded into the game. For example, usage:

* Character audio:

```csharp
Audio: new(
    // AttackSfx: null,
    // CastSfx: null,
    // DeathSfx: null,
    CharacterSelectSfx: "event:/sfx/kokodayo"
    // CharacterTransitionSfx: "event:/sfx/ui/wipe_ironclad"
),
```

* Card sound effects:

```csharp
await DamageCmd.Attack(DynamicVars.Damage.BaseValue)
    .FromCard(this)
    .WithHitFx(sfx: "event:/sfx/sword_slash") // damage sound effect
    .Targeting(cardPlay.Target!)
    .Execute(choiceContext);
```
and
```csharp
    SfxCmd.Play("event:/sfx/block_gain");
```

## Method 2: Loading audio files with FMOD (wav, ogg, mp3)

If you want to freely play audio files, use this approach.

### Preparation

* Since FMOD can only load audio *not processed by Godot*, there are three methods (pick one), recommended methods 1 and 2:

1. Install the [FMOD plugin 6.1.0-4.5.0](https://github.com/utopia-rise/fmod-gdextension/releases/tag/6.1.0-4.5.0), click `addons.zip` to download (or BaiduPan: https://pan.baidu.com/s/1yuxPkDpCV8EVLkDubqiirg?pwd=apar ), extract the `addons` folder and copy it to your project, then in the editor menu click `Project - Project Settings - Plugins` and enable it.

2. Disable the import for audio you want to load via FMOD, export them as-is. Do the following:

![alt text](../../../images/image46.webp)

3. Copy the audio to a directory at the same level as your mod and load it.

### Import resources

For methods 1 and 2, place your audio files wherever you like, e.g. `Test/audios/test.ogg`.

For method 3, copy the audio to a directory at the same level as your mod.

### Load and play

(Optional) First preload your audio somewhere, e.g. in your initialization function `Entry.Init`:

```csharp
 public static void Init()
    {
        // rest omitted
        FmodStudioStreamingFiles.TryPreloadAsSound("res://Test/audios/waveform.ogg");
    }
```

Play the audio wherever you need it:

```csharp
FmodStudioStreamingFiles.TryPlaySoundFile("res://Test/audios/waveform.ogg");
```
