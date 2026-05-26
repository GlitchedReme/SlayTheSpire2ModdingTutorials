RitsuLib 的遥测系统只负责用户授权、本地队列、事件封装和发送路由；你的 Mod 仍然要自己决定收集什么、说明为什么收集，以及把数据发到哪个后端。默认情况下，未授权的请求会被 `ITelemetryClient` 静默丢弃，不需要你再写一层开关。

## 注册申请方

一个申请方对应一个固定后端和一组用户可见的授权请求。通常把 `ApplicantId` 设成自己的 Mod id。

```csharp
using STS2RitsuLib.Settings;
using STS2RitsuLib.Telemetry;

namespace Test.Scripts.Telemetry;

public static partial class TestTelemetry
{
    private const string ApplicantId = Entry.ModId;
    private static ITelemetryClient Client = null!;

    public static void Register()
    {
        TelemetryRegistry.RegisterApplicant(new TelemetryApplicant
        {
            ApplicantId = ApplicantId,
            OwnerModId = Entry.ModId,
            DisplayName = "Test Mod",
            DisplayNameText = ModSettingsText.Literal("Test Mod"),
            Adapter = new HttpJsonTelemetryAdapter("https://example.invalid/v1/ingest"),
            Requests =
            [
                TelemetryRequest.BasicUsage(
                    ModSettingsText.Literal("发送版本、平台、语言和匿名安装 ID，用来估算兼容性问题范围。")),
                TelemetryRequest.RunHistory(
                    ModSettingsText.Literal("发送已结束跑局的原版 run-history，用来分析平衡性。"),
                    sharedContributionSubscriptions:
                    [
                        "other.mod/challenge_context",
                    ],
                    captureFilter: evt => !evt.IsAbandoned),
                TelemetryRequest.Diagnostics(
                    ModSettingsText.Literal("发送异常和诊断上下文，用来定位崩溃。")),
                TelemetryRequest.Custom(
                    "balance_event",
                    ModSettingsText.Literal("发送本 Mod 的平衡性事件，例如挑战选择和重掷次数。")),
            ],
        });

        Client = TelemetryApi.GetClient(ApplicantId);
    }
}
```

RitsuLib 会为申请方生成设置页和授权入口。`Description` 或 `DescriptionText` 是玩家看到的授权说明，不要写成“改进体验”这种空话；应该直接说明数据类别和用途。

可用请求类别：

| 工厂方法 | request id | 类别 |
| - | - | - |
| `TelemetryRequest.BasicUsage(...)` | `basic_usage` | `TelemetryDataCategory.BasicUsage` |
| `TelemetryRequest.ModInventory(...)` | `mod_inventory` | `TelemetryDataCategory.ModInventory` |
| `TelemetryRequest.RunHistory(...)` | `run_history` | `TelemetryDataCategory.RunHistory` |
| `TelemetryRequest.Diagnostics(...)` | `diagnostics` | `TelemetryDataCategory.Diagnostics` |
| `TelemetryRequest.Custom(...)` | 你传入的 id | `TelemetryDataCategory.Custom` |

## 发送自定义事件

拿到 `ITelemetryClient` 后，用 request id 发送事件。未注册、未授权或授权被撤销时，RitsuLib 会记录日志并丢弃事件。

```csharp
using System.Text.Json.Nodes;
using STS2RitsuLib.Telemetry;

namespace Test.Scripts.Telemetry;

public static partial class TestTelemetry
{
    public static void CaptureChallengeSelected(string challengeId, bool hardMode)
    {
        Client.CapturePayload(
            eventName: "challenge.selected",
            requestId: "balance_event",
            payload: new JsonObject
            {
                ["challenge_id"] = challengeId,
                ["hard_mode"] = hardMode,
            },
            properties: new Dictionary<string, object?>
            {
                ["challenge_id"] = challengeId,
                ["hard_mode"] = hardMode,
            });
    }

    public static void CaptureDraftReroll(int rerollIndex)
    {
        Client.Capture(
            eventName: "draft.rerolled",
            requestId: "balance_event",
            properties: new Dictionary<string, object?>
            {
                ["reroll_index"] = rerollIndex,
            });
    }
}
```

`properties` 是扁平字段，适合后端建索引；`payload` 是结构化 JSON，适合保存完整上下文。不要把本地路径、玩家昵称、账号标识、完整日志文件或未裁剪的大对象塞进 payload。

## 捕获异常

诊断请求授权后，可以把异常交给 `CaptureException`。它使用固定的 `diagnostics` request。

```csharp
public static void RunToolSafely(Action action)
{
    try
    {
        action();
    }
    catch (Exception ex)
    {
        Client.CaptureException(
            ex,
            new Dictionary<string, object?>
            {
                ["tool"] = "challenge_preview",
            });
        throw;
    }
}
```

如果玩家没有授权 diagnostics，这次调用也是 no-op。不要为了“确保上报”绕过授权系统。

## 自动 run-history

注册了 `TelemetryRequest.RunHistory(...)` 后，RitsuLib 会在跑局结束时为已授权申请方采集原版 `SerializableRun` JSON。`captureFilter` 可以控制哪些跑局进入队列，例如跳过放弃的跑局、只采集某个挑战模式。

需要手动上传 run-history JSON 时，用 `TelemetryApi.CaptureVanillaRunHistory`：

```csharp
using System.Text.Json.Nodes;
using STS2RitsuLib.Telemetry;

public static void CaptureImportedRun(JsonNode runHistory, string source)
{
    TelemetryApi.CaptureVanillaRunHistory(
        Entry.ModId,
        runHistory,
        applicantPayload: new JsonObject
        {
            ["source"] = source,
        },
        properties: new Dictionary<string, object?>
        {
            ["payload_kind"] = "imported_run_history",
        });
}
```

这个方法内部同样走 `run_history` 授权和队列。它适合“你已经拿到了原版 run-history JSON”的情况，不要拿任意自定义对象冒充原版跑局。

## contribution provider

Contribution 是给遥测事件补上下文的插件点。私有 contribution 只会附加到自己申请方的请求；共享 contribution 可以被别的申请方订阅，但还需要玩家对来源单独授权。

```csharp
using System.Text.Json.Nodes;
using STS2RitsuLib.Telemetry;

namespace Test.Scripts.Telemetry;

public sealed class TestBalanceContribution : ITelemetryContributionProvider
{
    public string ContributorModId => Entry.ModId;
    public string ContributionId => "balance_context";
    public TelemetryDataCategory Category => TelemetryDataCategory.RunHistory;
    public TelemetryContributionVisibility Visibility =>
        TelemetryContributionVisibility.PrivateToApplicant;

    public JsonNode? Build(TelemetryContributionContext context)
    {
        return new JsonObject
        {
            ["ruleset"] = TestBalanceState.CurrentRuleset,
            ["season"] = TestBalanceState.Season,
            ["event_name"] = context.EventName,
        };
    }
}
```

初始化时注册：

```csharp
TelemetryRegistry.RegisterContributionProvider(new TestBalanceContribution());
```

如果另一个 Mod 想订阅你的共享 contribution，它的请求里要写 `"test/balance_context"` 或 `"test:balance_context"`。共享数据会出现在 envelope 的 `shared_contributions`；私有数据会出现在 `private_contributions`。

## 后端和批量格式

`HttpJsonTelemetryAdapter` 会向固定 endpoint POST 一批事件：

```json
{
  "schema": "ritsulib.telemetry.batch.v1",
  "applicant_id": "test",
  "events": []
}
```

每个事件 envelope 都包含 `schema`、`applicantId`、`eventName`、`requestId`、`category`、`timestampUtc`、`properties` 和 `payload`。后端建议先校验 `schema`、`applicant_id` 和事件数量，再把原始 JSON 保存下来。需要接 PostHog 时可以用 `PostHogTelemetryAdapter`，但公开项目 API key 会进 Mod 包；正式发布更推荐你自己的后端代理。

## 验证

1. 首次进游戏，打开 RitsuLib 遥测设置页，确认能看到申请方、请求说明和 endpoint。
2. 未授权时调用 `Client.Capture(...)`，日志应显示事件被丢弃，不应出现网络请求。
3. 授权 `balance_event` 后触发挑战选择，后端应收到 `challenge.selected`。
4. 授权 run-history 后结束一局，后端应收到 `run_history.completed`。
5. 撤销授权，再触发同样事件，确认队列不再发送。
