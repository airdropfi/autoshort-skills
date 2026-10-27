# 4. A short-drama season on AutoShort (plan before produce)

Skill: `plan-a-video-series`. Server: AutoShort (season-plan tools enabled).

## Prompt

> Plan a six-episode mystery season about a lighthouse keeper who finds a message in a bottle every morning. Animated look, English narration.

## What a good run looks like

1. Confirms `autoshort_save_season_plan` is in the tool list. If it is not, says the feature is not available on this connection and stops.
2. Calls `autoshort_plan_drama_season` (free) and shows the cast and an episode table with the cliffhanger line of each.
3. `autoshort_create_series` with `startPaused: true`; `autoshort_get_character_sheet` shows the sheet price; makes a sheet only after a yes to that price.
4. Saves the plan with `autoshort_save_season_plan`, runs `review: true`, shows every failed check and the season price, fixes and reviews again.
5. Asks "Confirm this season plan?" and, after a yes, confirms with `confirm: true` and the exact `planHash`.
6. For each episode: `autoshort_quote_character_episode`, ask, yes, `autoshort_create_character_episode` with `expectedCredits` equal to the quote, poll `autoshort_get_video`.

## What it must not do

- Quote or make an episode before the plan is reviewed and confirmed.
- Make several episodes on one yes.
- Resume the series on a schedule unless the user asks.
