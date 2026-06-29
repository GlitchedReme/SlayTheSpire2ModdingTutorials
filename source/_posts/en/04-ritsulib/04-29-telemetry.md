---
title: Data Telemetry
date: 2026-05-27 15:36:11
permalink: en/docs/04-ritsulib/04-29-telemetry/
author: alkaid616
categories:
- Basics
---
RitsuLib's telemetry system provides a convenient interface for collecting data for backend analysis.

However, it only provides the sending system — it does not provide the collection service, server setup, etc.

When you register with this system, the player will receive a request asking whether they accept sending data; data is only sent if they accept.

## Registering an Applicant

An applicant corresponds to a fixed backend and a set of user-visible authorization requests. Typically, set `ApplicantId` to your own Mod id.

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
                    ModSettingsText.Literal("Send version, platform, language, and anonymous installation ID to estimate the scope of compatibility issues.")),
                TelemetryRequest.RunHistory(
                    ModSettingsText.Literal("Send vanilla run-history of completed runs for balance analysis."),
                    sharedContributionSubscriptions:
                    [
                        "other.mod/challenge_context",
                    ],
                    captureFilter: evt => !evt.IsAbandoned),
                TelemetryRequest.Diagnostics(
                    ModSettingsText.Literal("Send exceptions and diagnostic context for crash localization.")),
                TelemetryRequest.Custom(
                    "balance_event",
                    ModSettingsText.Literal("Send this Mod's balance events, such as challenge selections and reroll counts.")),
            ],
        });

        Client = TelemetryApi.GetClient(ApplicantId);
    }
}
```

RitsuLib will generate a settings page and authorization entry for the applicant. `Description` or `DescriptionText` is the authorization note the player sees; don't write vague phrases like "improve experience" — directly describe the data categories and purposes.

Available request categories:

| Factory Method | request id | Category |
| - | - | - |
| `TelemetryRequest.BasicUsage(...)` | `basic_usage` | `TelemetryDataCategory.BasicUsage` |
| `TelemetryRequest.ModInventory(...)` | `mod_inventory` | `TelemetryDataCategory.ModInventory` |
| `TelemetryRequest.RunHistory(...)` | `run_history` | `TelemetryDataCategory.RunHistory` |
| `TelemetryRequest.Diagnostics(...)` | `diagnostics` | `TelemetryDataCategory.Diagnostics` |
| `TelemetryRequest.Custom(...)` | Your provided id | `TelemetryDataCategory.Custom` |

## Sending Custom Events

Once you have `ITelemetryClient`, use the request id to send events. If not registered, not authorized, or authorization has been revoked, RitsuLib will log and discard the event.

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

`properties` are flat fields, suitable for backend indexing; `payload` is structured JSON, suitable for preserving full context. Do not stuff local paths, player nicknames, account identifiers, complete log files, or untrimmed large objects into `payload`.

## Capturing Exceptions

After diagnostics request authorization, you can hand exceptions to `CaptureException`. It uses the fixed `diagnostics` request.

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

If the player has not authorized diagnostics, this call is a no-op. Do not bypass the authorization system to "ensure reporting".

## Automatic Run Data Upload

After registering `TelemetryRequest.RunHistory(...)`, RitsuLib will collect the vanilla `SerializableRun` JSON for authorized applicants at the end of a run. `captureFilter` can control which runs enter the queue, e.g., skip abandoned runs or only collect a specific challenge mode.

To manually upload run-history JSON, use `TelemetryApi.CaptureVanillaRunHistory`:

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

This method internally also goes through the `run_history` authorization and queue. It is suitable for cases where "you already have the vanilla run-history JSON"; do not pass arbitrary custom objects pretending to be a vanilla run.

## Contribution Provider

Contributions are plugin points that add context to telemetry events. Private contributions are only attached to your own applicant's requests; shared contributions can be subscribed to by other applicants, but still require the player to separately authorize the source.

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

Register during initialization:

```csharp
TelemetryRegistry.RegisterContributionProvider(new TestBalanceContribution());
```

If another Mod wants to subscribe to your shared contribution, its request must contain `"test/balance_context"` or `"test:balance_context"`. Shared data appears in the envelope's `shared_contributions`; private data appears in `private_contributions`.

## Backend and Batch Format

`HttpJsonTelemetryAdapter` POSTs a batch of events to a fixed endpoint:

```json
{
  "schema": "ritsulib.telemetry.batch.v1",
  "applicant_id": "test",
  "events": []
}
```

Each event envelope contains `schema`, `applicantId`, `eventName`, `requestId`, `category`, `timestampUtc`, `properties`, and `payload`. The backend should first validate `schema`, `applicant_id`, and event count, then save the raw JSON. To connect PostHog, you can use `PostHogTelemetryAdapter`, but publishing the project API key will expose it in the Mod package; for official release, your own backend proxy is more recommended.

## Setting Up a Simple Telemetry Service with PostHog + Cloudflare

`PostHog` offers a 1 million events/month free tier with data retained for one year, which is more than sufficient for a mod.

(Optional) You also need a `Cloudflare` proxy (also has a free tier). Otherwise, your API key would be exposed in the code and requests, visible to others who could steal it and potentially pollute your database. However, for free-tier and small-scale mods, you can skip this if you don't care.

(Optional) Another issue is that Cloudflare's default assigned domain may fail direct connections, meaning players with direct connections might not be able to send information to you. You can purchase a cheap custom ***overseas*** domain; skip this if you don't care.

### Step 1: Sign Up

First, sign up for [PostHog](https://posthog.com/) and [Cloudflare](https://dash.cloudflare.com/sign-up) accounts.

Go to your PostHog default project settings, find `Settings - General - Project token`, and copy it.

### Step 2: Proxy (Optional)

Skip to Step 3 if you don't need it.

#### Installation

First, install [Node](https://nodejs.org/en/download) and the wrangler CLI tool. Install via npm:

```bash
npm install -g wrangler
```

Verify after installation:

```bash
wrangler --version
```

Then log in:

```bash
wrangler login
```

A browser will open to authorize wrangler to access your Cloudflare account. After successful authorization, the terminal will display `Successfully logged in`.

#### Create the Project

Find an empty folder and enter:

```bash
wrangler init
```

Then it will ask many questions; follow the selections below:

```
╭ Create an application with Cloudflare Step 1 of 3
│
├ In which directory do you want to create your application?
│ Enter your telemetry project name
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
│ no agents (any)
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
│ no deploy via `npm run deploy` (choose no first)
│
╰ Done
```

#### Modify the JS Code

**Importantly**, open your `src/index.js` and modify it. You can refer to the code below (AI-generated; report any issues).

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

Then deploy in your project:

```bash
wrangler deploy
```

After successful deployment, you'll see output similar to:

```
Your worker has been deployed to https://telemetry-proxy.yourname.workers.dev
```

**If you don't have a custom domain, this is the `host` address to fill in your mod.**

#### Set Secret Environment Variable

To prevent leaking your API key, set it using wrangler secret:

```bash
wrangler secret put POSTHOG_API_KEY
# Then paste your key, press Enter or Ctrl+D to confirm
```

After setting, verify the secret exists (the value won't be shown):

```bash
wrangler secret list
```

You should see `POSTHOG_API_KEY` in the list.

#### (Optional) Custom Domain

If you need a custom domain, look up the relevant tutorials.

### Step 3: Mod-Side Code

Replace the following parameters with your own.

If you don't care about your API key being leaked, set `host` to `https://us.i.posthog.com` (or `https://eu.i.posthog.com`; check your PostHog settings under `Region` to decide), and set `projectApiKey` to your key.

If using a proxy, write it like this:

```csharp
TelemetryRegistry.RegisterApplicant(new()
{
    ApplicantId = "author.modid", // ID, prevents collisions
    OwnerModId = ModId,
    DisplayName = "My Mod",
    // DisplayNameText = ModSettingsText.LocString("settings_ui", "TEST_MOD_NAME", "Better Console"), // Or provide localized text
    Adapter = new PostHogTelemetryAdapter(
        host: "https://replace-with-your-url.workers.dev", // Or your custom domain
        projectApiKey: "proxy" // ⚠️ Do not fill in the real PostHog key! The Worker will replace it server-side
    ),
    // Telemetry data to collect. The text is a custom description; you can also use ModSettingsText.LocString.
    // Use TelemetryRequest.Custom to register your own.
    Requests =
    [
        TelemetryRequest.BasicUsage("Session and version info"),
        TelemetryRequest.ModInventory("Mod list"),
        TelemetryRequest.Diagnostics("Diagnostic info"),
        TelemetryRequest.RunHistory("Run history")
    ],
});
```

### Step 4: Analyze Data

Once users who accepted sending telemetry data start sending, their information will appear in your PostHog. How exactly to analyze data is beyond the scope of this tutorial.

In short, in the PostHog console, click `Apps - Product analytics - My insights - New insight` on the left, select the event type under `Series`, add `Country name` under `Breakdown`, and select `Bar chart` for chart type in the top right — this will show you the country distribution of users launching your mod daily. You can save this chart to quickly launch this analysis later.
