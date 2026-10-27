# AutoShort Skills

Portable [Agent Skills](https://agentskills.io/specification) for making faceless short videos with the **AutoShort** or **StoryShort** MCP server from Claude Code, Codex, Gemini CLI, Antigravity, Cursor and any other client that reads `SKILL.md` folders.

The skills do not render anything themselves. They tell your agent how to use the MCP server you have connected, and they keep you in control: you review the script first, the agent shows the credit price **as the server returns it**, and nothing that costs credits runs until you have said yes.

| Skill | What it does |
|---|---|
| [`make-faceless-video`](skills/make-faceless-video/SKILL.md) | Idea, script, free draft, price check, render after your yes, poll, return the video link. Detects whether AutoShort or StoryShort is connected and follows that server's flow. Has a decision table for which one fits. |
| [`plan-a-video-series`](skills/plan-a-video-series/SKILL.md) | Plan before produce. AutoShort: season plan saved, reviewed and confirmed, then one quoted episode at a time. StoryShort: plan in chat, create the series paused, resume only after you approve the cost. |
| [`research-winning-formats`](skills/research-winning-formats/SKILL.md) | Reads your own post performance and the product's niches or templates, studies reference Shorts you name, and returns format cards and a small test plan. Read-only. |

## Which server?

- **AutoShort** (`https://autoshort.org/api/mcp`): faceless shorts where the agent writes the script scene by scene, character series and short dramas with a season plan, product ads, UGC-style app campaigns, AI motion clips, your own pictures, several publishing platforms, an agent spending cap.
- **StoryShort** (`https://storyshort.app/api/mcp`): narrated story videos from a topic (scary stories, history, facts, motivation, Reddit-style) where the server writes the script and you edit it, and a schedule that makes one story video every N days. Publishes to YouTube and to TikTok Drafts.

Each has its own account, credits and sign-in. The skill checks which tools your client lists and never uses a tool that is not there. Both servers are live as of 2026-10-27: AutoShort lists 54 tools and StoryShort 21 (the tables in [`references/`](references) say which are which). Features that are switched off on a server are marked in the tables and the skills do not offer them.

## Install

```bash
npx skills add airdropfi/autoshort-skills
```

Claude Code plugin marketplace:

```text
/plugin marketplace add airdropfi/autoshort-skills
/plugin install autoshort-skills@autoshort-skills
```

Codex, Gemini CLI, Antigravity, Cursor, claude.ai and the rest: see [docs/install.md](docs/install.md), which also shows how to connect the MCP servers. Five prompts to try are in [`examples/`](examples).

You need an account on AutoShort or StoryShort (neither has a free plan; new accounts start with no credits). Drafts are free, renders spend credits from your own balance.

## What the skills will and will not do

- Every price, balance and limit comes from a tool answer. The skills contain no prices, and the agent must not write one from memory.
- Paid steps wait for a clear yes to the exact price in the conversation. A yes to the script is not a yes to the render.
- The skills never buy credits, set up auto-recharge or change spending limits for you.
- No promises about views, monetisation or income. The agent declines such claims.
- Videos use AI-generated images and voice: switch on the platform's AI-content label when you post.
- Real or famous people, lookalikes, protected characters, sexual content and children's faces are refused, by the servers and by the skills.

## Repository layout

```text
skills/<name>/SKILL.md        the three skills (each folder is self-contained, with its own references/)
references/                   tool tables for both servers: kind (read-only, spends credits, ...), status, which skill uses it
examples/                     five prompts and what a good run looks like
docs/install.md               connect the MCP servers and install the skills per client
.claude-plugin/marketplace.json   makes this repo a Claude Code plugin marketplace
.cursor/rules/autoshort-video.mdc a short Cursor rule
scripts/validate.mjs          the validator
registry/tools.json           snapshot of the tool names of both servers (written by the validator)
```

## Validate

```bash
node scripts/validate.mjs --live          # frontmatter, tools exist, tables complete, promises kept, live server lists compared
node scripts/validate.mjs --cli           # also runs `claude plugin validate --strict` if the claude CLI is installed
```

The validator checks `SKILL.md` frontmatter against the Agent Skills specification (name equals the folder name, description at most 1024 characters, only the allowed keys), that every tool name the skills, examples and tables mention exists in the server registries (it fails when one is missing or retired), that the two tables list every tool, that skills never pre-approve tools and never hard-code a price, and that price-before-render and plan-before-produce are in the right order. Maintainers with the two app repositories checked out run it against their `origin/main` (`--autoshort-repo`, `--storyshort-repo`); everyone else uses the snapshot in `registry/` plus `--live`, which compares against what the public servers list today.

## Links

AutoShort https://autoshort.org (MCP docs https://autoshort.org/en/developers) and StoryShort https://storyshort.app (https://storyshort.app/en/developers). The AutoShort-only Claude Code plugin: https://github.com/airdropfi/autoshort-claude-plugin. Gemini CLI extension: https://github.com/airdropfi/autoshort-gemini-extension. Support: support@autoshort.org.

## License

MIT, see [LICENSE](LICENSE). The AutoShort and StoryShort services are governed by their own terms.
