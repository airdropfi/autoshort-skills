# AutoShort MCP tools used and avoided by these skills

Server: `https://autoshort.org/api/mcp` (remote MCP, OAuth or API key). Tool names all start with `autoshort_`. Source of truth: the tool list the connected server returns, mirrored at https://autoshort.org/.well-known/mcp.json. This table was checked against the server registry on 2026-10-27 (54 tools) by `scripts/validate.mjs`; the Kind column comes from each tool's own annotations and descriptions.

Prices are never listed here: a price is whatever `autoshort_estimate_cost`, `autoshort_get_draft`, a quote tool or the render answer returns at the time you ask.

Some tools only appear when the server has the feature switched on (motion tools, Character Studio). If a tool is not in your tool list, the feature is not available on that connection: say so and do not try to call it.

## Discover and limits (free, read-only)

| Tool | Kind | What it does | Skill |
|---|---|---|---|
| `autoshort_get_capabilities` | read-only | Start here: the end-to-end agent workflow, the human-only steps and the limits. | make-faceless-video |
| `autoshort_list_options` | read-only | Voices (with extra credits), art styles, niches, durations and other enums the tools accept. | make-faceless-video, plan-a-video-series, research-winning-formats |
| `autoshort_list_niches` | read-only | Niches, art styles, qualities and durations the generation tools accept. | make-faceless-video, research-winning-formats |
| `autoshort_list_templates` | read-only | Template gallery (video; motion and episode kinds when enabled). | make-faceless-video, plan-a-video-series, research-winning-formats |
| `autoshort_get_limits` | read-only | Balance, this key's daily agent spending cap, auto-recharge status, platform publishing limits. | make-faceless-video |
| `autoshort_estimate_cost` | read-only | Prices a paid call before it is made (`{tool, arguments}` or `{draftId}`); nothing is charged. | make-faceless-video |
| `autoshort_quote_video` | read-only | Exact price of a video with AI motion before it is made (only when motion tools are enabled). | not used by these skills |

## Draft, review, render

| Tool | Kind | What it does | Skill |
|---|---|---|---|
| `autoshort_draft_video` | free write | Saves a script as scenes (narration plus visual each). Renders and charges nothing. | make-faceless-video |
| `autoshort_get_draft` | read-only | Reads a draft: scenes, timing, estimated credits, warnings. | make-faceless-video |
| `autoshort_update_draft` | free write | Edits a draft before render. | make-faceless-video |
| `autoshort_revise_scene` | free write | Creates a new draft from a rendered video with one scene changed. | make-faceless-video |
| `autoshort_render_draft` | spends credits | Renders an approved draft. Charges at this call; retry-safe. | make-faceless-video |
| `autoshort_cancel_video` | destructive | Cancels a video that has not started rendering and refunds what was charged. Destructive. | make-faceless-video |
| `autoshort_get_video` | read-only | Status and details of one video; the video link when COMPLETED. | all three |
| `autoshort_list_videos` | read-only | Lists the user's videos, newest first. | make-faceless-video, research-winning-formats |

## Generate without a script review (paid; price first with `autoshort_estimate_cost`)

| Tool | Kind | What it does | Skill |
|---|---|---|---|
| `autoshort_generate_video` | spends credits | Video from a topic; AutoShort writes the script. | make-faceless-video (only on request) |
| `autoshort_generate_chat_video` | spends credits | Video from a natural-language brief, optional own images. | make-faceless-video (only on request) |
| `autoshort_generate_product_ad` | spends credits | Product marketing video from a public product page. | not used by these skills |
| `autoshort_generate_image_to_video` | spends credits | Animates one reference image into a short silent clip. | not used by these skills |
| `autoshort_generate_motion_clip` | spends credits | One AI motion clip from a prompt or template. | not used by these skills |

## Series and Character Studio

| Tool | Kind | What it does | Skill |
|---|---|---|---|
| `autoshort_list_series` | read-only | Lists the user's series. | plan-a-video-series, research-winning-formats |
| `autoshort_create_series` | free write | Creates a series (free; use `startPaused: true`). | plan-a-video-series |
| `autoshort_update_series` | free write | Changes a series' brief, schedule or auto-post flags. | not used by these skills |
| `autoshort_pause_series` | free write | Stops a series from generating and charging. | plan-a-video-series |
| `autoshort_resume_series` | starts spending | Starts a paused series; each video is charged when made. | plan-a-video-series |
| `autoshort_get_series_performance` | read-only | Own posted YouTube Shorts performance per series. | plan-a-video-series, research-winning-formats |
| `autoshort_plan_drama_season` | read-only | Writers room: premise to character bible and episode drafts. Saves nothing. | plan-a-video-series |
| `autoshort_get_character_sheet` | read-only | Reads a series' character sheets and the exact sheet price. | plan-a-video-series |
| `autoshort_create_character_sheet` | spends credits | Makes a character sheet (AI images). Spends credits. | plan-a-video-series |
| `autoshort_select_character_image` | free write | Chooses the sheet and main image a series uses. | plan-a-video-series |
| `autoshort_get_season_plan` | read-only | Reads the season plan and its status (none, saved, reviewed, confirmed). | plan-a-video-series |
| `autoshort_save_season_plan` | free write | Saves a plan, runs `review: true`, confirms with `confirm: true` and `planHash`. | plan-a-video-series |
| `autoshort_quote_character_episode` | read-only | Prices one planned episode. | plan-a-video-series |
| `autoshort_create_character_episode` | spends credits | Makes the episode with `confirm: true` and `expectedCredits`. Spends credits. | plan-a-video-series |

## Publish

| Tool | Kind | What it does | Skill |
|---|---|---|---|
| `autoshort_list_social_accounts` | read-only | Connected publishing accounts and today's platform limits. | make-faceless-video |
| `autoshort_get_connection_status` | free (may return a link) | Is a platform connected; returns the connect link if not. | make-faceless-video, plan-a-video-series |
| `autoshort_publish_video` | posts to a platform | Publishes a COMPLETED video to a connected platform. | make-faceless-video, plan-a-video-series |

## Account, billing and webhooks (the skills never call the billing tools for the user)

| Tool | Kind | What it does | Skill |
|---|---|---|---|
| `autoshort_get_credit_balance` | read-only | Balance, monthly allocation, bonus credits, plan. | make-faceless-video |
| `autoshort_get_usage_stats` | read-only | API usage and recent credit transactions. | not used by these skills |
| `autoshort_get_subscription` | read-only | Plan, status and credit allocation. | not used by these skills |
| `autoshort_get_buy_credits_url` | read-only | Checkout link for the human to open and pay. | make-faceless-video (only if the user asks how to add credits) |
| `autoshort_set_limits` | changes limits | Sets this key's daily agent spending cap. | never called by these skills |
| `autoshort_setup_auto_recharge` | billing change | Proposes auto-recharge. | never called by these skills |
| `autoshort_buy_credits` | moves money | Buys a credit pack on the saved card when auto-recharge is active. | never called by these skills |
| `autoshort_disable_auto_recharge` | billing change | Turns auto-recharge off. | never called by these skills |
| `autoshort_create_webhook` | free write | Registers a signed video.completed / video.failed webhook. | not used by these skills |
| `autoshort_list_webhooks` | read-only | Lists webhooks. | not used by these skills |
| `autoshort_delete_webhook` | destructive | Deletes a webhook. | not used by these skills |

## Silent UGC campaigns (app promo videos)

| Tool | Kind | What it does | Skill |
|---|---|---|---|
| `autoshort_ugc_upload_recording` | free write | Uploads an app screen recording. | not used by these skills |
| `autoshort_ugc_create_campaign` | spends credits | Creates a Silent UGC campaign. | not used by these skills |
| `autoshort_ugc_suggest_hooks` | free write | Proposes hooks for a campaign. | not used by these skills |
| `autoshort_ugc_preview` | spends credits | Previews one variant's first scene. | not used by these skills |
| `autoshort_ugc_render_batch` | spends credits | Approves and renders a batch of variants. | not used by these skills |
| `autoshort_ugc_get_campaign` | read-only | Reads a campaign and its variants. | not used by these skills |

## Retired and deprecated names

`autoshort_list_api_keys` is retired (API keys are managed in the AutoShort dashboard). The unprefixed names `create_video`, `get_video`, `list_videos`, `list_niches` and `get_credit_balance` are deprecated aliases that AutoShort still accepts but does not list; do not use them on AutoShort. On StoryShort, tools with those names are the real tools, see [storyshort-tools.md](storyshort-tools.md).
