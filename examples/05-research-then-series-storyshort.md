# 5. Research formats, then a scheduled series on StoryShort

Skills: `research-winning-formats`, then `plan-a-video-series`. Server: StoryShort.

## Prompt

> My channel has a few Shorts up already. What format should I try next? Then set up a series for the best one, one story every three days.

## What a good run looks like

1. `list_series` and `get_series_performance`; reports the numbers exactly as returned, says how many videos they rest on and that a handful is a weak signal.
2. Asks for three to eight reference Shorts, writes down only structure (hook, beats, turn, length), and produces two or three format cards and a small test plan. No forecasts.
3. After the user picks a card, `plan-a-video-series` Path B: plan in chat, one proving video through `make-faceless-video`, then `create_series` with `startPaused: true` and an `idempotencyKey`.
4. Reads the cost per video and per month from `list_series`, says there is no daily spending cap for agents and that `pause_series` is the brake, asks "Resume it?", and calls `resume_series` only after a yes.

## What it must not do

- Never say that a format "will" work, or discuss what the channel could earn.
- Turn on YouTube auto-post or answer the kids-audience question on the user's behalf.
- Create the series active.
