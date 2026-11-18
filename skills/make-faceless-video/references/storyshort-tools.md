# StoryShort MCP tools used and avoided by these skills

Server: `https://storyshort.app/api/mcp` (remote MCP over Streamable HTTP, OAuth 2.1 with PKCE and dynamic client registration, or an API key as `Authorization: Bearer sk_live_...`). Tool names have no prefix. Source of truth: the tool list the connected server returns; the public discovery card is https://storyshort.app/api/mcp/server-card. The tools below were checked against the live `tools/list` of the StoryShort server on 2026-11-18 (33 tools) by `scripts/validate.mjs`.

Prices are never listed here: a price is whatever `draft_video`, `get_draft`, `quote_video`, `list_series` or the refusal of a render returns at the time you ask.

Tool status on production on 2026-11-18, from the live `tools/list`: 33 tools are live (`Status` = live), including the three prompt-to-motion tools that were switched off on 2026-10-27, and the season-plan, character-sheet and character-episode tools that were not listed on that date. Do not call a tool that is not in your tool list. `quote_video` is behind a feature switch; if it is missing from your tool list, AI motion clips are not available on the connection and you must not offer them.

## Draft, review, render

| Tool | Status | Kind | What it does | Skill |
|---|---|---|---|---|
| `draft_video` | live | free write | Writes the script and scenes from a topic without rendering or charging; returns `draftId` and the exact render price. Hourly cap. | make-faceless-video |
| `get_draft` | live | read-only | Reads a draft: scenes, whether the narration fills the target length, the exact price against the balance. | make-faceless-video |
| `update_draft` | live | free write | Changes the title and/or replaces all scenes of a draft. The narration sent is what is spoken. | make-faceless-video |
| `revise_scene` | live | free write | Changes one scene (narration, visual prompt, duration) of a draft. | make-faceless-video |
| `render_draft` | live | spends credits | Renders an approved draft; the only step that costs credits, charged once after the render succeeds. Needs `confirmCredits` equal to the approved price; without it the answer is `QUOTE_REQUIRED` with the price. | make-faceless-video |
| `cancel_video` | live | destructive | Cancels a draft or a queued video before it renders; refunds anything charged. | make-faceless-video |
| `create_video` | live | spends credits | Enqueues a render straight from a topic with no review. Use only when the user asked for no review and approved the price. | make-faceless-video (only on request) |
| `quote_video` | live | read-only | Exact price of a video with AI motion scenes before it is made. Present only when the motion switch is on. | make-faceless-video |
| `get_video` | live | read-only | Status and details of one video; `videoUrl` when COMPLETED; `blockedReason` when blocked. | all three |
| `list_videos` | live | read-only | Lists the user's videos, newest first, optional status filter. | make-faceless-video, research-winning-formats |
| `list_niches` | live | read-only | Niches, art styles, qualities and durations the create/draft tools accept. | make-faceless-video, plan-a-video-series, research-winning-formats |
| `get_credit_balance` | live | read-only | Balance, monthly allocation, plan. | make-faceless-video, plan-a-video-series |

## Series (autopilot schedule)

| Tool | Status | Kind | What it does | Skill |
|---|---|---|---|---|
| `list_series` | live | read-only | Lists series with schedule, active or paused, credits per video and an estimate per month. | plan-a-video-series, research-winning-formats |
| `create_series` | live | free write | Creates a series (free). `startPaused: true` creates it without generating. Refused with `SERIES_NEEDS_CREDITS` when the balance cannot pay one video. | plan-a-video-series |
| `update_series` | live | free write | Changes interval, YouTube auto-post, `madeForKids` or language. A faster active schedule is re-checked against the balance. | plan-a-video-series |
| `pause_series` | live | free write | Stops a series from generating and charging. | plan-a-video-series |
| `resume_series` | live | starts spending | Restarts a paused series; each video is charged when it renders. | plan-a-video-series |
| `get_series_performance` | live | read-only | Own posted YouTube Shorts performance per series. | plan-a-video-series, research-winning-formats |

## Publish

| Tool | Status | Kind | What it does | Skill |
|---|---|---|---|---|
| `list_social_accounts` | live | read-only | Connected YouTube and TikTok accounts and today's platform limits. | make-faceless-video |
| `get_connection_status` | live | read-only | Is a platform connected; if not, returns the `connectUrl` for the user to open once. | make-faceless-video, plan-a-video-series |
| `publish_video` | live | posts to a platform | Publishes a COMPLETED video to YouTube, or sends it to the creator's TikTok Drafts (needs `userConsent: true` after the user agreed). Idempotent per video and platform. | make-faceless-video, plan-a-video-series |

## Price list, season plan and character episodes

| Tool | Status | Kind | What it does | Skill |
|---|---|---|---|---|
| `list_pricing` | live | read-only | The price list: plans, one-time credit packs, the first-purchase offer when the account gets it, and what a video or clip costs in credits. Free; nothing is created or charged. | make-faceless-video |
| `plan_drama_season` | live | read-only | Drama Studio writers room: a one-line premise to a character bible and 2-8 episode scripts, each with a spoken cliffhanger line. Saves nothing. | plan-a-video-series |
| `get_season_plan` | live | read-only | Reads a series' season plan, its hash, its status (none, saved, reviewed, confirmed) and the recorded season review. Free. | plan-a-video-series |
| `save_season_plan` | live | free write | Saves a whole-season plan, runs the review and confirms it before any episode is made. Free (no credits). | plan-a-video-series |
| `get_character_sheet` | live | read-only | Reads a series' character sheets (AI images of one fictional character), which one is chosen, how many more may be made, and the exact price of a new sheet. Free. | plan-a-video-series |
| `create_character_sheet` | live | spends credits | Makes a character sheet of 4-6 AI images from a text description. Refuses unless `confirm` is true and the price was shown to the human first. | plan-a-video-series |
| `select_character_image` | live | free write | Chooses which character sheet a series uses and which image is the main reference. Free. | plan-a-video-series |
| `quote_character_episode` | live | read-only | Prices one planned episode (12-60 seconds, 3-8 shots) of a series with a confirmed season plan and returns the shot plan. Free; nothing is started. | plan-a-video-series |
| `create_character_episode` | live | spends credits | Makes the episode (3-8 shots, same character in every shot, narrated with captions). Refuses unless `confirm` is true and `expectedCredits` matches the quote. | plan-a-video-series |

## Prompt-to-motion tools (live on 2026-11-18)

| Tool | Status | Kind | What it does | Skill |
|---|---|---|---|---|
| `generate_motion_clip` | live | spends credits | One AI motion clip (Seedance 2.0 Mini) from a prompt or template, sent exactly as written. | not used by these skills |
| `quote_motion_clip` | live | read-only | Exact price of one motion clip before it is made, and whether the account may start it. | not used by these skills |
| `list_motion_templates` | live | read-only | The AI motion clip templates, each with its full prompt and genre. | not used by these skills |

## What StoryShort does not have

No cost-estimate tool (the price comes from the draft or a quote tool), no webhooks, no buy-credits or auto-recharge tools, no per-key daily spending cap (`pause_series` is the brake for series). Publishing covers YouTube and TikTok Drafts only. Do not describe a StoryShort feature the tool list does not show.
