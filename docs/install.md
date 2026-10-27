# Install the skills in each client

The skills are plain Agent Skills ([agentskills.io specification](https://agentskills.io/specification)): a folder with a `SKILL.md`. Every client below reads the same three folders under `skills/`. The skills only instruct the agent. The agent needs the **AutoShort** or **StoryShort** MCP server connected as well, and you need an account on that product: rendering spends credits from your own balance.

Last checked against each client's docs on 2026-10-27. Client paths change; if one stops working, check the client's own skills page (linked per section).

## 1. Connect an MCP server (one or both)

| Product | MCP URL | Sign-in |
|---|---|---|
| AutoShort | `https://autoshort.org/api/mcp` | OAuth (browser), or an API key as `Authorization: Bearer <key>` |
| StoryShort | `https://storyshort.app/api/mcp` | OAuth (browser), or an API key as `Authorization: Bearer sk_live_...` |

Both are remote Streamable HTTP servers. An unauthenticated request returns `401` with a `WWW-Authenticate` header that points clients at the OAuth metadata, which is how OAuth-capable clients sign in without a key.

### Claude Code

```bash
claude mcp add --transport http autoshort https://autoshort.org/api/mcp
claude mcp add --transport http storyshort https://storyshort.app/api/mcp
```

Then run `/mcp`, pick the server and choose Authenticate.

### Codex (CLI, IDE extension, desktop app)

Add to `~/.codex/config.toml` (or a trusted project's `.codex/config.toml`):

```toml
[mcp_servers.autoshort]
url = "https://autoshort.org/api/mcp"

[mcp_servers.storyshort]
url = "https://storyshort.app/api/mcp"
```

Then `codex mcp login autoshort` (and `storyshort`). Docs: https://learn.chatgpt.com/docs/extend/mcp

### Gemini CLI

Add to `~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "autoshort": { "httpUrl": "https://autoshort.org/api/mcp" },
    "storyshort": { "httpUrl": "https://storyshort.app/api/mcp" }
  }
}
```

Then `/mcp auth autoshort`. Leave `trust` unset (false): with `trust: true` Gemini CLI skips the confirmation before render tools. Docs: https://geminicli.com/docs/tools/mcp-server/

### Cursor

Add to `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (user):

```json
{
  "mcpServers": {
    "autoshort": { "url": "https://autoshort.org/api/mcp" },
    "storyshort": { "url": "https://storyshort.app/api/mcp" }
  }
}
```

Then sign in from Cursor's MCP settings.

## 2. Install the skills

### Any client: the `skills` CLI

```bash
npx skills add airdropfi/autoshort-skills            # asks which skills and which agents
npx skills add airdropfi/autoshort-skills --list     # list the skills without installing
npx skills add airdropfi/autoshort-skills --skill make-faceless-video
npx skills add airdropfi/autoshort-skills -g -a claude-code -a codex -y   # global, two agents, no prompts
```

The CLI ([vercel-labs/skills](https://github.com/vercel-labs/skills), needs a current Node) copies the folders to the right place for each agent it supports. It also sends anonymous install telemetry to the skills.sh directory.

### Claude Code: plugin marketplace (this repo is one)

```text
/plugin marketplace add airdropfi/autoshort-skills
/plugin install autoshort-skills@autoshort-skills
```

From a shell: `claude plugin marketplace add airdropfi/autoshort-skills`, then `claude plugin install autoshort-skills@autoshort-skills`. The skills appear as `/autoshort-skills:make-faceless-video` and so on. This marketplace is not reviewed or listed by Anthropic; it is a public repo you add yourself. If you only use AutoShort, the [AutoShort plugin](https://github.com/airdropfi/autoshort-claude-plugin) bundles the MCP server and the AutoShort-only skills.

Or copy by hand: `cp -R skills/* ~/.claude/skills/` (all projects) or into `.claude/skills/` (one project).

### claude.ai (upload)

Zip one skill folder so the folder is the top level of the zip, for example `cd skills && zip -r make-faceless-video.zip make-faceless-video`. In claude.ai open Customize, Skills, `+`, Upload a skill. The MCP server must also be connected in that surface as a connector; the skill alone cannot call out. Each user does this for themselves.

### Codex

Skills are read from `.agents/skills/` in the repo (and parents) and from `~/.agents/skills/` for you. Copy:

```bash
mkdir -p ~/.agents/skills && cp -R skills/* ~/.agents/skills/
```

Or ask Codex: `$skill-installer install https://github.com/airdropfi/autoshort-skills/tree/main/skills/make-faceless-video`. Restart Codex afterwards. Docs: https://learn.chatgpt.com/docs/build-skills

### Gemini CLI

```bash
gemini skills install https://github.com/airdropfi/autoshort-skills.git --consent
```

Use `--scope workspace` for one project or `--path skills/make-faceless-video` for one skill. Or copy folders into `~/.gemini/skills/` or `~/.agents/skills/`. Docs: https://geminicli.com/docs/cli/skills/

### Antigravity

Workspace: copy into `<workspace>/.agents/skills/`. Global (app and IDE): `~/.gemini/config/skills/`. CLI (`agy`): `agy plugin install https://github.com/airdropfi/autoshort-skills`, or copy into `~/.gemini/antigravity-cli/skills/`. Docs: https://antigravity.google/docs/skills

### Cursor

Cursor reads skills from `.agents/skills/`, `.cursor/skills/`, `~/.agents/skills/` and `~/.cursor/skills/` (and `.claude/skills/`, `.codex/skills/`). Copy the folders there, or use `npx skills add`. A short always-available **rule** is also provided: copy `.cursor/rules/autoshort-video.mdc` into your project's `.cursor/rules/`. The rule points at the skills and repeats the spending rules. Docs: https://cursor.com/docs/skills and https://cursor.com/docs/rules

### Other clients

GitHub Copilot (`.github/skills/` or `gh skill install airdropfi/autoshort-skills make-faceless-video`), OpenCode (`.opencode/skills/`, `~/.config/opencode/skills/`), Goose and Amp (`.agents/skills/`), Roo (`.roo/skills/`), Kiro (`.kiro/skills/`; the importer wants a GitHub URL to a subfolder, for example `https://github.com/airdropfi/autoshort-skills/tree/main/skills/make-faceless-video`). Each skill folder is self-contained, including its `references/`.

## 3. Try it

Use the prompts in [`examples/`](../examples). For the first run use a short topic and read the price the server returns before you say yes.

## Verify an install

Ask the agent: "Which tools do you have from AutoShort or StoryShort?" It should list the connected server's tools. If it lists none, the MCP server is not connected or not signed in; the skill will say so and stop.
