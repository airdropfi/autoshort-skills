# 2. A narrated story video on StoryShort

Skill: `make-faceless-video`. Server: StoryShort.

## Prompt

> Make a 60-second scary story video about a lighthouse that keeps signalling at night with nobody inside. English.

## What a good run looks like

1. Detects `draft_video` and `render_draft` (no `autoshort_` prefix) and follows Flow B.
2. Calls `list_niches` for valid niche, art style and duration values, and `get_credit_balance`.
3. Calls `draft_video` with the topic (free). Shows the scenes the server wrote and checks the narration for facts, names and tone.
4. Applies the user's edits with `update_draft` or `revise_scene`, re-reads with `get_draft`.
5. Reads the price from `get_draft`, says it with the balance, and asks "Render it?".
6. After a yes calls `render_draft` with `confirmCredits` equal to exactly that price, polls `get_video` and returns the `videoUrl`.

## What it must not do

- Call `create_video` (it renders without review) unless the user asked for no review and approved the price.
- Offer AI motion clips when `quote_video` is not in the tool list.
- Call `render_draft` without `confirmCredits`, or with a number it computed itself.
