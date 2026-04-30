## 方法一：使用Fmod加载

使用塔2使用的fmod工具进行加载。

### 下载fmod

前往官网 https://www.fmod.com/download#fmodstudio ，下载2.03.06版本的fmod studio。

![alt text](../../images/image35.png)

安装完毕后打开。

### 下载原版工程

先下载一个拥有原版音频guid对应的工程，可以下载ritsulib作者制作的音频示例工程（整个一起下载）： https://github.com/BAKAOLC/SwarmTheSpire-FModProject ，或者网盘： https://pan.baidu.com/s/1yuxPkDpCV8EVLkDubqiirg?pwd=apar 。

下载完毕后打开。

### 导入音频

点击左侧的`Assets`栏，将你的音频拖入其中或者右键`Import Assets`。

![alt text](../../images/image36.png)

### 重命名bank

点击中间的`Banks`栏，将两个bank重命名为你的项目的名字，最好也是`XXX`和`XXXMaster`。

* `XXX`最好删除重建一个，但是``XXXMaster`不能删除然后重建，不能叫`Master`。

![alt text](../../images/image37.png)

### 新建event

点击左侧的`Events`栏，可以右键新建文件夹，套一些文件夹改名防止你和别人的id撞上。然后右键新建event。

![alt text](../../images/image38.png)

右键你的event，点击`Assgin To Bank`，选择`Test`或者你重命名的那个。（*不是Master那个*）

![alt text](../../images/image39.png)

### 新建sheet

然后点击你刚才的event，中间会出现sheet界面。在其中右键新建一个任意类型的sheet。

* 简单来说，timeline可以实现音频拼接或者延迟触发，action可以多个音频随机触发一个，parameter可以调整音频的参数等。

![alt text](../../images/image42.png)

例如我们新建一个timeline sheet，然后点击assets将音频素材拖到轨道里。

![alt text](../../images/image40.png)

### 构建

* 点击菜单栏的`File`，点击`Build`，然后再点击`Export GUIDs`。

* 从你保存的项目的根目录找到`Build`这个文件夹，复制`GUIDs.txt`和`Desktop/Test.bank`（或者你的命名的bank，不是任何其他带有Master的bank）到你的mod项目中，例如复制到`Test/audios`里。

* 你也可以设置自动构建的路径，点击`Edit - Preference - Build`选择构建路径。

![alt text](../../images/image43.png)

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
        FmodStudioServer.TryLoadBank("res://Test/audios/Test.bank");
        FmodStudioServer.TryWaitForAllLoads();
        FmodStudioServer.TryLoadStudioGuidMappings("res://Test/audios/GUIDs.txt");
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
