RitsuLib 的遥测系统提供一个方便收集数据的接口，供后台分析数据。

但是，其本身只提供发送系统，不提供收集服务，以及服务器搭建等。

当你注册该系统时，玩家会收到是否接受发送数据的请求，只有接受了才会发送给你。

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
```

如果玩家没有授权 diagnostics，这次调用也是 no-op。不要为了“确保上报”绕过授权系统。

## 自动上传一局数据

注册了 `TelemetryRequest.RunHistory(...)` 后，RitsuLib 会在游戏结束时为已授权申请方采集原版 `SerializableRun` JSON。`captureFilter` 可以控制哪些跑局进入队列，例如跳过放弃的跑局、只采集某个挑战模式。

需要手动上传 run-history JSON 时，用 `TelemetryApi.CaptureVanillaRunHistory`：

```csharp
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

## 使用 PostHog+Cloudflare 搭建简单遥测服务

`posthog`提供100万事件/月的免费额度，并且数据会保留一年，对于mod来说绰绰有余。

（可选）另外还需要一个`cloudflare`转发（同样有免费额度）。不然的话你的apikey会暴露在代码和请求中能被别人看到后窃取，然后可能会被污染数据库。但是对于免费版和小规模mod来说，如果你不在乎这个可以不用。

（可选）还有问题是Cloudflare默认分配的域名可能会直连失败，导致直连玩家可能无法发送信息给你。你可以付极低费用购买一个不常用的***海外***自定义域名，不在乎的话也不用。

### 第一步：注册

先注册[posthog](https://posthog.com/)和[cloudflare](https://dash.cloudflare.com/sign-up)账号。

来到`posthog`默认项目的设置里，找到`Settings - General - Project token`，把它复制下来。

### 第二步：代理（可选）

不需要的话直接跳到第三步。

#### 安装

先安装[Node](https://nodejs.org/en/download) 和 wrangler 命名行工具。用 npm 安装：

```bash
npm install -g wrangler
```

安装后验证：

```bash
wrangler --version
```

然后登录：

```bash
wrangler login
```

会弹出浏览器，授权 wrangler 访问你的 Cloudflare 账号。授权成功后终端会显示 `Successfully logged in`。

#### 创建项目

找一个空的文件夹，输入：

```bash
wrangler init
```

然后他会问很多问题，参照下面选择：

```
╭ Create an application with Cloudflare Step 1 of 3
│
├ In which directory do you want to create your application?
│ 输入你的遥测项目名
│
├ What would you like to start with?
│ category Hello World example
│
├ Which template would you like to use?
│ type Worker only
│
├ Which language do you want to use?
│ lang JavaScript
│
├ Do you want to add an AGENTS.md file to help AI coding tools understand Cloudflare APIs?
│ no agents （任意）
│
╰ Application created

╭ Configuring your application for Cloudflare Step 2 of 3
│
├ Do you want to use git for version control?
│ yes git
│
│
╰ Application configured

╭ Deploy with Cloudflare Step 3 of 3
│
├ Do you want to deploy your application?
│ no deploy via `npm run deploy` （先选no）
│
╰ Done
```

然后部署：

```bash
wrangler deploy
```

部署成功后会输出类似：

```
Your worker has been deployed to https://telemetry-proxy.yourname.workers.dev
```

**如果没有自定义域名，这就是你 mod 里要填的 `host` 地址。**

#### 修改js代码

很**重要**的一点，打开你的`src/index.js`进行修改。可以参考下方提供的代码（AI编写，如有错误请提出）。

```js
const POSTHOG_HOST = 'https://us.i.posthog.com';
const MAX_BODY_BYTES = 5 * 1024 * 1024;
const MAX_BATCH_SIZE = 1000;
const REQUEST_TIMEOUT_MS = 9000;
const JSON_HEADER = { 'Content-Type': 'application/json' };

const BODIES = {
	method_not_allowed: JSON.stringify({ error: 'method_not_allowed', message: 'Only POST is accepted' }),
	unsupported_media_type: JSON.stringify({ error: 'unsupported_media_type', message: 'Content-Type must be application/json' }),
	invalid_json: JSON.stringify({ error: 'invalid_json', message: 'Failed to parse body as JSON' }),
};

const RESPONSES = {
	method_not_allowed: () => new Response(BODIES.method_not_allowed, { status: 405, headers: { Allow: 'POST', ...JSON_HEADER } }),
	unsupported_media_type: () => new Response(BODIES.unsupported_media_type, { status: 415, headers: JSON_HEADER }),
	invalid_json: () => new Response(BODIES.invalid_json, { status: 400, headers: JSON_HEADER }),
	payload_too_large: (size) =>
		new Response(JSON.stringify({ error: 'payload_too_large', message: `Body exceeds ${MAX_BODY_BYTES} bytes` }), {
			status: 413,
			headers: JSON_HEADER,
		}),
	invalid_format: (msg) => new Response(JSON.stringify({ error: 'invalid_format', message: msg }), { status: 400, headers: JSON_HEADER }),
	batch_too_large: (count) =>
		new Response(JSON.stringify({ error: 'batch_too_large', message: `Max ${MAX_BATCH_SIZE} events per batch, got ${count}` }), {
			status: 400,
			headers: JSON_HEADER,
		}),
	upstream_unreachable: (msg) =>
		new Response(JSON.stringify({ error: 'upstream_unreachable', message: msg }), { status: 502, headers: JSON_HEADER }),
	upstream_failed: (status, body) =>
		new Response(JSON.stringify({ error: 'upstream_failed', message: `PostHog returned ${status}`, upstream_body: body }), {
			status: 502,
			headers: JSON_HEADER,
		}),
};

function validateEvent(evt, index) {
	if (!evt || typeof evt !== 'object') return `batch[${index}] is not an object`;

	if (typeof evt.event !== 'string' || evt.event.length === 0) return `batch[${index}].event is missing or empty`;

	if (evt.properties !== undefined && typeof evt.properties !== 'object') return `batch[${index}].properties must be an object`;

	if (evt.timestamp !== undefined && evt.timestamp !== null && typeof evt.timestamp !== 'string')
		return `batch[${index}].timestamp must be a string or null`;

	return null;
}

function injectGeoIP(batch, clientIP) {
	if (!clientIP) return batch;

	for (const evt of batch) {
		if (!evt.properties) evt.properties = {};
		if (!('$ip' in evt.properties)) evt.properties.$ip = clientIP;
	}
	return batch;
}

export default {
	async fetch(request, env, ctx) {
		if (request.method !== 'POST') return RESPONSES.method_not_allowed();

		const ct = request.headers.get('content-type') || '';
		if (!ct.includes('application/json')) return RESPONSES.unsupported_media_type();

		const cl = parseInt(request.headers.get('content-length') || '0', 10);
		if (cl > MAX_BODY_BYTES) return RESPONSES.payload_too_large(cl);

		let body;
		try {
			body = await request.json();
		} catch {
			return RESPONSES.invalid_json();
		}

		if (!body || typeof body !== 'object') return RESPONSES.invalid_format('Body must be a JSON object');

		if (!Array.isArray(body.batch) || body.batch.length === 0) return RESPONSES.invalid_format('Missing or empty batch array');

		if (body.batch.length > MAX_BATCH_SIZE) return RESPONSES.batch_too_large(body.batch.length);

		for (let i = 0; i < body.batch.length; i++) {
			const err = validateEvent(body.batch[i], i);
			if (err) return RESPONSES.invalid_format(err);
		}

		const clientIP = request.headers.get('CF-Connecting-IP') || '';
		injectGeoIP(body.batch, clientIP);

		const cleanBody = {
			api_key: env.POSTHOG_API_KEY,
			batch: body.batch,
		};

		if (typeof body.historical_migration === 'boolean') cleanBody.historical_migration = body.historical_migration;
		if (typeof body.sentAt === 'string') cleanBody.sentAt = body.sentAt;

		const forwardHeaders = { ...JSON_HEADER };
		if (clientIP) {
			forwardHeaders['X-Forwarded-For'] = clientIP;
		}

		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

		let phResponse;
		try {
			phResponse = await fetch(`${POSTHOG_HOST}/batch/`, {
				method: 'POST',
				headers: forwardHeaders,
				body: JSON.stringify(cleanBody),
				signal: controller.signal,
			});
		} catch (err) {
			clearTimeout(timer);
			return RESPONSES.upstream_unreachable(err.message);
		} finally {
			clearTimeout(timer);
		}

		if (phResponse.ok) {
			ctx.waitUntil(
				(async () => {
					console.log(`[ok] ${body.batch.length} events → PostHog ${phResponse.status}`);
				})(),
			);

			return new Response(
				JSON.stringify({
					ok: true,
					accepted: body.batch.length,
					rejected: 0,
				}),
				{ status: 200, headers: JSON_HEADER },
			);
		}

		const errorText = await phResponse.text();

		ctx.waitUntil(
			(async () => {
				console.error(`[fail] PostHog ${phResponse.status}: ${errorText.slice(0, 500)}`);
			})(),
		);

		return RESPONSES.upstream_failed(phResponse.status, errorText.slice(0, 200));
	},
};
```

#### 设置机密环境变量

为了防止泄露你的apikey，用 wrangler secret 设置：

```bash
wrangler secret put POSTHOG_API_KEY
# 然后粘贴你的 key，回车或ctrl+d确认
```

设置后可以用以下命令验证 secret 是否存在（不会显示值）：

```bash
wrangler secret list
```

应该看到 `POSTHOG_API_KEY` 在列表中。

#### （可选）修改域名

如果你需要自定义域名请查询相关教程。

### 模组端代码

以下对应参数换成你自己的。

如果你不在乎apikey被泄露，`host`填写`https://us.i.posthog.com`（或者`https://eu.i.posthog.com`,打开posthog的设置查看`Region`以决定），`projectApiKey`就填写你的key。

如果使用代理就这么写：

```csharp
TelemetryRegistry.RegisterApplicant(new()
{
    ApplicantId = "author.modid", // ID，防撞
    OwnerModId = ModId,
    DisplayName = "My Mod",
    // DisplayNameText = ModSettingsText.LocString("settings_ui", "TEST_MOD_NAME", "Better Console"), // 或者提供本地化文本
    Adapter = new PostHogTelemetryAdapter(
        host: "https://换成你的网址.workers.dev", // 或者你的自定义域名
        projectApiKey: "proxy" // ⚠️ 不要填真实的 PostHog key！Worker 会在服务端替换
    ),
    // 会收集的遥测数据。文本是自定义的说明，也可以用ModSettingsText.LocString。
    // 使用TelemetryRequest.Custom注册自己的。
    Requests =
    [
        TelemetryRequest.BasicUsage("会话和版本信息"),
        TelemetryRequest.ModInventory("模组列表"),
        TelemetryRequest.Diagnostics("诊断信息"),
        TelemetryRequest.RunHistory("历史记录")
    ],
});
```

### 分析数据

然后接受发送遥测数据的用户的信息就能来到你的posthog里了。具体怎么分析数据不在本教程范畴内。

简单来说，在posthog控制台左侧点击`Apps - Product analytics - My insights - New insight`，`Series`选择事件类型，`Breakdown`添加`Country name`，右上角图表类型选择`Bar chart`即可查看每日启动你的mod的用户的国家分布。
