# 3. Both servers connected: which one?

Skill: `make-faceless-video`. Servers: AutoShort and StoryShort.

## Prompt

> I want a quick video for my YouTube channel about the history of the paper clip. Which of my accounts should I use?

## What a good run looks like

1. Sees both tool sets and does not mix them. Explains the choice in two or three lines from the decision table: a narrated history or story video the server writes and the user edits fits StoryShort; a script the agent writes scene by scene with its own shots, a product ad, UGC, motion clips or a character series fits AutoShort.
2. Asks which account to use (each has its own credits and sign-in) and waits for the answer.
3. Continues with that server's flow only.

## What it must not do

- Call `autoshort_draft_video` and `draft_video` for the same idea "to compare" (two drafts, two quotas).
- Claim one product is better at getting views.
