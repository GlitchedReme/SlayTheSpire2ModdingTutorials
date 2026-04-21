将你的`BaseLib`开发的mod与`RitsuLib`开发的mod相互迁移的指南。

## 注册内容

两个库都支持自动注册内容。

`baselib`:

```csharp
[Pool(typeof(TestCardPool))]
public class TestCard : CustomCardModel {} // 其他内容同等换成CustomXXXModel
```

`ritsulib`:

需要先在初始化函数(`Entry.Init`)中调用`ModTypeDiscoveryHub.RegisterModAssembly`。同时也支持显式注册。

```csharp
[RegisterCard(typeof(TestCardPool))] // 其他内容同等换成RegisterXXX
public class TestCard : ModCardTemplate {} // 其他内容同等换成ModXXXTemplate
```

## ID

除了关键词，

`baselib`使用`{命名空间第一段大写}-{原卡牌id}`的写法，例如`TEST-TEST_CARD`。

`ritsulib`使用`{ModId}_{类别}_{原卡牌id}`的写法，例如`TEST_CARD_TEST_CARD`。

## 变量对照

### 注册与基类

| 文字说明 | BaseLib | RitsuLib |
| --- | --- | --- |
| 卡牌注册 | `[Pool(typeof(TestCardPool))]` | `[RegisterCard(typeof(TestCardPool))]` |
| 遗物注册 | `[Pool(typeof(TestRelicPool))]` | `[RegisterRelic(typeof(TestRelicPool))]` |
| 药水注册 | `[Pool(typeof(TestPotionPool))]` | `[RegisterPotion(typeof(TestPotionPool))]` |
| 卡牌基类 | `CustomCardModel` | `ModCardTemplate` |
| 遗物基类 | `CustomRelicModel` | `ModRelicTemplate` |
| 药水基类 | `CustomPotionModel` | `ModPotionTemplate` |
| 能力基类 | `CustomPowerModel` | `ModPowerTemplate` |
| 附魔基类 | `CustomEnchantmentModel` | `ModEnchantmentTemplate` |
| 遭遇基类 | `CustomEncounterModel` | `ModEncounterTemplate` |
| 先古之民基类 | `CustomAncientModel` | `ModAncientEventTemplate` |
| 人物基类 | `PlaceholderCharacterModel` | `ModCharacterTemplate<TestCardPool, TestRelicPool, TestPotionPool>` |

### 关键词、动态变量

| 文字说明 | BaseLib | RitsuLib |
| --- | --- | --- |
| 提示文本 | `ExtraHoverTips` | `AdditionalHoverTips` |
| 自定义关键词 | `CanonicalKeywords` | `RegisteredKeywordIds` |
| 自定义关键词的提示文本生成 | `HoverTipFactory.FromKeyword(MyKeywords.Unique)` | `ModKeywordRegistry.CreateHoverTip(MyKeywords.Unique)` |
| 自定义关键词声明 | `[CustomEnum("UNIQUE")]` | `[RegisterOwnedCardKeyword("Unique", IconPath = "res://icon.svg")]` |
| 动态变量提示文本绑定 | `.WithTooltip` | `.WithSharedTooltip` |

### 人物、卡池

| 文字说明 | BaseLib | RitsuLib |
| --- | --- | --- |
| 人物主视觉场景路径 | `CustomVisualPath` | `CustomVisualsPath` |
| 人物选择背景路径 | `CustomCharacterSelectBg` | `CustomCharacterSelectBgPath` |
| 初始卡组 | `StartingDeck` | `StartingDeckEntries`<br>(或者在初始卡类上加`[RegisterCharacterStarterCard]`) |
| 初始遗物 | `StartingRelics` | `StartingRelicTypes`<br>(或者在初始遗物类上加`[RegisterCharacterStarterRelic]`) |
| 绑定卡牌/遗物/药水池 | `CardPool` / `RelicPool` / `PotionPool` | `ModCharacterTemplate<TestCardPool, TestRelicPool, TestPotionPool>` |
| 卡池 | `CustomCardPoolModel` | `TypeListCardPoolModel` |
| 药水池 | `CustomPotionPoolModel` | `TypeListPotionPoolModel` |
| 遗物池 | `CustomRelicPoolModel` | `TypeListRelicPoolModel` |

### 遗物、药水、能力、充能球

| 文字说明 | BaseLib | RitsuLib |
| --- | --- | --- |
| 药水小图路径 | `CustomPackedImagePath` | `CustomImagePath` |
| 药水描边图路径 | `CustomPackedOutlinePath` | `CustomOutlinePath` |
| 能力小图路径 | `CustomPackedIconPath` | `CustomIconPath` |
| 充能球自定义场景 | `CreateCustomSprite()` | `CustomVisualsScenePath` |
| 怪物自定义场景 | `CreateCustomVisuals()` | `CustomVisualsPath` |

### 事件、遭遇、先古之民

| 文字说明 | BaseLib | RitsuLib |
| --- | --- | --- |
| 遭遇出现章节 | `IsValidForAct(ActModel act)` | `[RegisterActEncounter(typeof(Glory))]` |
| 遭遇房间类型 | `base(RoomType.Monster)` | `public override RoomType RoomType => RoomType.Monster` |
| 自定义遭遇场景路径 | `CustomScenePath` | `CustomEncounterScenePath` |
| 先古之民背景场景路径 | `CustomScenePath` | `CustomBackgroundScenePath` |
| 先古之民出现条件 | `IsValidForAct(ActModel act)` | `IsAllowed(IRunState runState)` |
| 先古之民选项池 | `MakeOptionPools` | `AllPossibleOptions` + `GenerateInitialOptions()` |
| 先古之民创建遗物选项 | `AncientOption<T>()` | `CreateModRelicOption<T>()` |
| 普通事件初始选项创建 | `Option(TakeDamage)` | `new EventOption(this, TakeDamage, InitialOptionKey("TAKE_DAMAGE"))` |
| 普通事件分页选项创建 | `Option(ChoosePotions, "CHOOSE_TYPE")` | `new EventOption(this, ChoosePotions, ModOptionKey("CHOOSE_TYPE", "CHOOSE_POTIONS"))` |
| 事件页面描述文本定位 | `PageDescription("CHOOSE_TYPE")` | `L10NLookup($"{Id.Entry}.pages.CHOOSE_TYPE.description")` |

## 遗物、卡牌升级

`baselib`:

> `古老牙齿`可以把一张初始卡变成先古升级。需要实现`ITranscendenceCard`接口，在你的卡牌类添加以下代码：
> 
> ```csharp
> [Pool(typeof(TestCardPool))]
> public class TestCard : CustomCardModel, ITranscendenceCard // 实现接口
> {
>     // 其余省略
>     public CardModel GetTranscendenceTransformedCard() => ModelDb.Card<TestCard2>(); // 实现方法。自己更改类型。
> }
> ```
> 
> `欧洛巴斯之触`可以把初始遗物升级。
> 
> ```csharp
> [Pool(typeof(TestRelicPool))]
> public class TestRelic : CustomRelicModel
> {
>     // 其余省略
>     public override RelicModel? GetUpgradeReplacement() => ModelDb.Relic<TestRelic2>(); // 实现方法。自己更改类型。
> }
> ```
> 
> `尘封魔典`可以获得一张先古卡。这个结果是从你池子里选出所有先古卡，然后去除`古老牙齿`的那张得到的。所以只需再创建一张先古卡即可。

`ritsulib`:

在你的`Init`初始化函数中加上：

```csharp
public static void Init()
{
    // 其余省略
    RitsuLibFramework.RegisterArchaicToothTranscendenceMapping<TestCard, Shiv>();
    RitsuLibFramework.RegisterTouchOfOrobasRefinementMapping<TestRelic, Akabeko>();
}
```

### 场景

`baselib`已支持大部分场景自动转换，即你不需要挂载任何脚本或唯一化命名。

`ritsulib`不支持场景自动转换。你需要查看一个原版的场景，给你的挂上相同类型的脚本（继承对应类型然后挂上）。具体参考对应的章节。