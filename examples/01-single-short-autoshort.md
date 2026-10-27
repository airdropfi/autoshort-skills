# 1. One short on AutoShort (script, draft, price, render)

Skill: `make-faceless-video`. Server: AutoShort.

## Prompt

> Make a 30-second faceless short about why octopuses have three hearts. English narration, hook first.

## What a good run looks like

1. Detects `autoshort_get_capabilities` in the tool list and follows Flow A.
2. Calls `autoshort_get_capabilities` and, if needed, `autoshort_list_options` for valid durations, voices and art styles.
3. Shows a scene table (narration verbatim, one concrete visual per scene) and asks if anything should change.
4. Saves it with `autoshort_draft_video` (free), reports `draftId`, estimated length and every warning.
5. Calls `autoshort_estimate_cost` with the `draftId` and `autoshort_get_credit_balance`, then says: "Rendering this draft will charge N credits. Your balance is M." using the numbers the tools returned, and asks "Render it?".
6. Only after a clear yes calls `autoshort_render_draft`, then polls `autoshort_get_video` every 20 to 30 seconds and returns the video link.

## What it must not do

- Call `autoshort_render_draft` or `autoshort_generate_video` before the yes.
- State a credit price that no tool returned.
- Never promise views or income.
