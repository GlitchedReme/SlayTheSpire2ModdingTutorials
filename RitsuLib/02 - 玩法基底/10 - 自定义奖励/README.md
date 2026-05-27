可以使用 RitsuLib 提供的 `ModCustomReward` 基类来极简地实现自定义奖励。

`ModCustomReward` 在原版基类的基础上进行了封装，它可以帮你：
1. **自动处理图标UI**：不用手写繁琐的 Godot 节点层级，只需提供一个 `res://` 图标资源路径。
2. **自动读取本地化文本**：轻松设置语言表与字符 Key。
3. **辅助存读档**：封装了 `IModSerializableReward` 的系列接口，方便你注入自己的持久化 Payload（比如保存每次随机生成的不固定金币数）。

---

## 编写代码

新建一个类继承 `ModCustomReward`：

```csharp
using MegaCrit.Sts2.Core.Entities.Players;
using MegaCrit.Sts2.Core.Rewards;
using STS2RitsuLib.Combat.Rewards;

namespace MyMod.Scripts.Rewards;

public class MyTokenReward : ModCustomReward
{
    // 必须保留的构造函数，把属于哪位玩家传给底层的 Reward 基类
    public MyTokenReward(Player player) : base(player) { }

    // 【必须】返回你在 Mod 内容加载阶段注册好的自定义奖励类型 (RewardType)
    public override RewardType ModRewardType => MyModRegistry.TokenRewardType;

    // 【可选】设置显示的图标资源路径。
    protected override string? RewardIconPath => "res://MyMod/images/rewards/token.png";

    // 【可选】设置奖励描述用的 LocTable 文件名（默认为 gameplay_ui）
    protected override string DescriptionLocTable => "mymod_ui";

    // 【可选】设置显示的描述文本 Key。如果不设置，它会尝试用你注册时分配的 ID
    protected override string DescriptionLocKey => "reward.mymod_token";

    // 【必须实现】当玩家点击了这个奖励时，你要执行的实际效果
    protected override async Task<bool> OnSelect()
    {
        // ... 例如给玩家某张特定卡牌，或是加各种神奇Buff
        
        // 返回 true 代表领取成功，界面会把它消除。
        // 返回 false 代表领取终止或取消，它的按钮还会留在界面上。
        return true;
    }
}
```

---

## 数据存档

并不是所有奖励都是固定内容的，如果你的奖励上有一个“给 $X$ 枚金币”的随机数量，为了保证玩家在结算界面按 `ESC` 退出游戏然后再读档进来时，奖励数量不会刷新或丢失，你需要把它加入存档。

`ModCustomReward` 提供了便捷的序列化覆写功能：

你可以通过重写 `ToModRewardJson()` 来把你奖励内包含的动态变量以字符串形式返回给存档系统；或者使用基类提供的 `ToSerializable<TPayload>`。

```csharp
public readonly record struct TokenPayload(int TokenCount);

public class MyTokenReward : ModCustomReward
{
    private readonly int _tokenCount;

    // 假设这是通过存档反序列化或者动态生成的
    public MyTokenReward(Player player, int count) : base(player) 
    {
         _tokenCount = count;
    }

    // 将特有状态转为 JSON 字符串挂载到奖励上保存
    public override string? ToModRewardJson()
    {
        return System.Text.Json.JsonSerializer.Serialize(
            new TokenPayload(_tokenCount),
            MyJsonContext.Default.TokenPayload
        );
    }
}
```
Payload 里只能存放可序列化的数据（`int`、`string`等）。

---

## 联机同步的规则

在 `ModCustomReward` 的源码注释中，有这么一句：

> **"Reward-set selection is synchronized by vanilla, but reward-specific side effects must either be deterministic on every client or explicitly synchronized by the derived reward."**
> 
> *（奖励集合中“选择了哪个奖励”是由原版引擎自动网络同步的；但这个奖励自身所带来的“副作用/实际作用”，必须在所有的客户端上确切地执行，否则你需要自己发包显式同步。）*

**它的意思是：**
- 当队伍进行奖励领取时，A 玩家点击了你的 `MyTokenReward` 这个界面事件，原版帮你把这个“点击收取”这个动作告诉了所有人，所以每个玩家都会执行一次你的 `OnSelect()` 代码。
- 但是！如果你在 `OnSelect()` 里面包含**随机数检定**或者**获取仅本地相关的资源**，不同客户端可能会因为结果不一致导致断连。

所以确保你的 `OnSelect()` 中执行的逻辑：
1. **严格确定**：利用原版 `RunState.Rng` 的随机序列，或者所有计算因子两边完全对等。
2. **基于原版同步**：直接派发类似于 `PlayerCmd.GainGold` 的这种已被开发组封装好的带有完整状态分发的网络指令。