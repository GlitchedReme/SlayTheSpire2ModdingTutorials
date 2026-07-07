https://github.com/BAKAOLC/STS2-RitsuLib/blob/main/Docs/zh/FmodAndAudio.md

## 方法一：使用fmod加载bank

使用塔2使用的fmod工具进行加载。一些通过event加载的音频（比如角色选择等）通过bank方式加载会方便一些不用修改代码。

### 下载fmod

前往官网 https://www.fmod.com/download#fmodstudio ，下载2.03.06版本的fmod studio。

![alt text](../../../images/image35.webp)

安装完毕后打开。

### 下载原版工程

先下载一个拥有原版音频guid对应的工程，可以下载ritsulib作者制作的音频示例工程（整个一起下载）： https://github.com/BAKAOLC/STS2_FModProject_Minimal ，或者网盘： https://pan.baidu.com/s/1yuxPkDpCV8EVLkDubqiirg?pwd=apar 。

下载完毕后打开。

### 导入音频

点击左侧的`Assets`栏，将你的音频拖入其中或者右键`Import Assets`。

![alt text](../../../images/image36.webp)

### 重命名bank

点击中间的`Banks`栏，新建一个bank，命名为`Test`或者你喜欢的名字。

* 不要对原来有的`Master`做任何操作。

![alt text](../../../images/image37.webp)

### 新建event

点击左侧的`Events`栏，可以右键新建文件夹，套一些文件夹改名防止你和别人的id撞上。然后右键新建event。

![alt text](../../../images/image38.webp)

右键你的 event，点击 `Assign To Bank`，选择 `Test` 或者你重命名的那个。（*不是 Master 那个*）

![alt text](../../../images/image39.webp)

接着点击`Window - Mixer Routing`，需要创建和原版一致的routing，这里是`master/sfx`，然后把你的音频放在此处。

例如原版游戏代码中的路径为`event:/sfx/heal`、`event:/music/act3_a1_v1`之类，那么你就需要分别放在`master/sfx`和`master/music`组下。

这一步会让你的音频受到游戏的音量与效果影响，例如`sfx`受到音响音量影响`music`受到音乐音量影响。

![alt text](../../../images/image41.webp)

### 新建sheet

然后点击你刚才的event，中间会出现sheet界面。在其中右键新建一个任意类型的sheet。

* 简单来说，timeline可以实现音频拼接或者延迟触发，action可以多个音频随机触发一个（右键add multi instrument）等，parameter可以调整音频的参数等。

![alt text](../../../images/image42.webp)

例如我们新建一个timeline sheet，然后点击assets将音频素材拖到轨道里。

![alt text](../../../images/image40.webp)

### 构建

* 点击菜单栏的`File`，点击`Build`，然后再点击`Export GUIDs`。

* 从你保存的项目的根目录找到`Build`这个文件夹，复制`GUIDs.txt`和`Desktop/Test.bank`（或者你的命名的bank，不是任何其他带有Master的bank）到你的mod项目中，例如复制到`Test/audios`里。

* 你也可以设置自动构建的路径，点击`Edit - Preference - Build`选择构建路径。

![alt text](../../../images/image43.webp)

### 导出预设

Godot 里通常不会直接导入`.bank`和`GUIDs.txt`，这可能会导致打包的 .pck 文件中缺失这些文件，导致游戏运行时无法加载这些音频。
请确保你的导出设置里 “资源” 选项卡中 “筛选导出非资源文件或文件夹” 中包含了`.bank`和`GUIDs.txt`（或其他任何你需要的文件）。

![alt text](../../../images/fmod_export_hint.webp)

### 代码加载

在你的初始化函数中加载：

```csharp
using STS2RitsuLib.Audio;

namespace Test.Scripts;

[ModInitializer(nameof(Init))]
public class Entry
{
    public static void Init()
    {
        // 其余省略
        FmodStudioDeferredBankRegistration.RegisterBank("res://Test/audios/Test.bank");
        FmodStudioDeferredBankRegistration.RegisterStudioGuidMappings("res://Test/audios/GUIDs.txt");
    }
}
```

然后你指定的fmod就被加载到游戏里了。例如使用：

* 人物音频：

```csharp
Audio: new(
    // AttackSfx: null,
    // CastSfx: null,
    // DeathSfx: null,
    CharacterSelectSfx: "event:/sfx/kokodayo"
    // CharacterTransitionSfx: "event:/sfx/ui/wipe_ironclad"
),
```

* 卡牌音效：

```csharp
await DamageCmd.Attack(DynamicVars.Damage.BaseValue)
    .FromCard(this)
    .WithHitFx(sfx: "event:/sfx/sword_slash") // 伤害音效
    .Targeting(cardPlay.Target!)
    .Execute(choiceContext);
```
和
```csharp
    SfxCmd.Play("event:/sfx/block_gain");
```

## 方法二：使用fmod加载音频文件（wav, ogg, mp3）

如果你想自由播放音频，可以通过这种形式。

### 准备工作

* 由于fmod只能加载 *未经godot处理过的音频* ，有三种方式（选一种即可），推荐第方法1和2：

1. 安装[fmod插件 6.1.0-4.5.0](https://github.com/utopia-rise/fmod-gdextension/releases/tag/6.1.0-4.5.0)，点击`addons.zip`下载（或者网盘 https://pan.baidu.com/s/1yuxPkDpCV8EVLkDubqiirg?pwd=apar ），把解压出来的`addons`复制到你的项目里，然后在编辑器菜单点击`项目 - 项目设置 - 插件`启用它。

2. 禁用对你需要通过fmod加载的音频的导入，原样导出。如下操作。

![alt text](../../../images/image46.webp)

3. 把音频复制到和你mod同级目录内加载。

### 导入资源

如果你是方法1和2，把你的音频文件放到你喜欢的位置，例如`Test/audios/test.ogg`。

如果你是方法3，把音频复制到和你mod同级目录内。

### 加载并播放

（可选）首先找个地方预载你的音频，例如你的初始化函数`Entry.Init`里：

```csharp
 public static void Init()
    {
        // 其余省略
        FmodStudioStreamingFiles.TryPreloadAsSound("res://Test/audios/waveform.ogg");
    }
```

在你需要播放音频的地方播放：

```csharp
FmodStudioStreamingFiles.TryPlaySoundFile("res://Test/audios/waveform.ogg");
```