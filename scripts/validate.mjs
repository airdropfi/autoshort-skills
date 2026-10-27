#!/usr/bin/env node
/**
 * Validates the skill pack. No dependencies (Node 20+).
 *
 *   node scripts/validate.mjs                       check the pack against the registry sources it can find
 *   node scripts/validate.mjs --live                also compare the tables with the tool lists the two public servers return today
 *   node scripts/validate.mjs --cli                 also run `claude plugin validate` (needs the claude CLI)
 *   node scripts/validate.mjs --sync                copy references/*.md into every skill folder, then validate
 *   node scripts/validate.mjs --write-snapshot      rewrite registry/tools.json from the git sources (maintainers)
 *
 * Registry sources (first one that is available wins, for each server):
 *   --autoshort-repo <dir>   git checkout of the AutoShort app; reads src/app/api/mcp/tools*.ts at --ref (default origin/main) with `git show`
 *   --storyshort-repo <dir>  same for the StoryShort app
 *   registry/tools.json      checked-in snapshot (written by --write-snapshot), used when no checkout is given
 *   Default checkouts: AUTOSHORT_REPO / STORYSHORT_REPO env vars, else the maintainers' paths below.
 *
 * What it checks: SKILL.md frontmatter against https://agentskills.io/specification (name = folder name, description <= 1024,
 * compatibility <= 500, metadata strings, only the six allowed keys, no "claude"/"anthropic" in the name, no XML tags), that every tool
 * named in a skill, example or table exists in the registry of its server (fails when one is missing), that the two tool tables list every
 * registry tool, that the skills keep their promises (price before render, plan before produce, no hard-coded prices, no earnings claims,
 * no pre-approved tools), and that each skill folder carries the same references/ files as the top-level references/ folder.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

let ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PACK_ROOT = ROOT;
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);

const REF = opt('--ref', 'origin/main');
const AUTOSHORT_REPO = opt('--autoshort-repo', process.env.AUTOSHORT_REPO || '/Users/kienpt/workspace/web3/autoshorts');
const STORYSHORT_REPO = opt('--storyshort-repo', process.env.STORYSHORT_REPO || '/Users/kienpt/workspace/web3/storyshort');
const SNAPSHOT = path.join(PACK_ROOT, 'registry/tools.json');

const ALLOWED_FIELDS = ['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools'];
const EXPECTED_SKILLS = ['make-faceless-video', 'plan-a-video-series', 'research-winning-formats'];
const TABLES = { autoshort: 'references/autoshort-tools.md', storyshort: 'references/storyshort-tools.md' };
const RESERVED_MARKETPLACE_NAMES = ['claude-code-marketplace', 'claude-code-plugins', 'claude-plugins-official', 'anthropic-marketplace', 'anthropic-plugins', 'agent-skills', 'anthropic-agent-skills', 'knowledge-work-plugins', 'claude-community', 'claude-plugins-community'];
/** A backticked snake_case word that starts with one of these is read as a StoryShort tool name and must exist. */
const TOOL_VERBS = ['get', 'list', 'create', 'update', 'pause', 'resume', 'publish', 'render', 'draft', 'revise', 'cancel', 'quote', 'generate'];

const errors = [];
const warnings = [];
const notes = [];
const error = (m) => errors.push(m);
const warn = (m) => warnings.push(m);
const rel = (p) => path.relative(ROOT, p);
const read = (p) => fs.readFileSync(p, 'utf8');

// ── registry ─────────────────────────────────────────────────────────────────

function git(repo, argv) {
  const r = spawnSync('git', ['-C', repo, ...argv], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return r.status === 0 ? r.stdout : null;
}

function gitToolSources(repo) {
  if (!fs.existsSync(repo)) return null;
  const list = git(repo, ['ls-tree', '-r', '--name-only', REF, '--', 'src/app/api/mcp']);
  if (list === null) return null;
  const files = list.split('\n').filter((f) => /\/tools[a-z-]*\.ts$/.test(f));
  if (!files.length) return null;
  return files.map((f) => git(repo, ['show', `${REF}:${f}`]) ?? '').join('\n');
}

function sha(repo) {
  return (git(repo, ['rev-parse', '--short', REF]) ?? '').trim();
}

function autoshortRegistry(src) {
  const names = new Set([...src.matchAll(/name: '(autoshort_[a-z0-9_]+)'/g)].map((m) => m[1]));
  const retiredBlock = src.match(/RETIRED_TOOLS: McpTool\[\] = \[([\s\S]*?)\n\];/);
  const retired = new Set(retiredBlock ? [...retiredBlock[1].matchAll(/name: '(autoshort_[a-z0-9_]+)'/g)].map((m) => m[1]) : []);
  for (const r of retired) names.delete(r);
  return { tools: [...names].sort(), retired: [...retired].sort() };
}

function storyshortRegistry(src) {
  const names = new Set([...src.matchAll(/name: '([a-z][a-z0-9_]*)',\s*\n\s*(?:description:|get description)/g)].map((m) => m[1]));
  return { tools: [...names].sort(), retired: [] };
}

function loadRegistry() {
  const out = { autoshort: null, storyshort: null, source: {} };
  const as = gitToolSources(AUTOSHORT_REPO);
  if (as) {
    out.autoshort = autoshortRegistry(as);
    out.source.autoshort = `git ${AUTOSHORT_REPO} ${REF}@${sha(AUTOSHORT_REPO)}`;
  }
  const ss = gitToolSources(STORYSHORT_REPO);
  if (ss) {
    out.storyshort = storyshortRegistry(ss);
    out.source.storyshort = `git ${STORYSHORT_REPO} ${REF}@${sha(STORYSHORT_REPO)}`;
  }
  if (flag('--write-snapshot')) {
    if (!out.autoshort || !out.storyshort) {
      console.error('--write-snapshot needs both git checkouts');
      process.exit(2);
    }
    fs.mkdirSync(path.dirname(SNAPSHOT), { recursive: true });
    fs.writeFileSync(SNAPSHOT, JSON.stringify({ generatedFrom: out.source, autoshort: out.autoshort, storyshort: out.storyshort }, null, 2) + '\n');
    console.log(`wrote ${rel(SNAPSHOT)}`);
  }
  if ((!out.autoshort || !out.storyshort) && fs.existsSync(SNAPSHOT)) {
    const snap = JSON.parse(read(SNAPSHOT));
    for (const k of ['autoshort', 'storyshort']) {
      if (!out[k]) {
        out[k] = snap[k];
        out.source[k] = `snapshot registry/tools.json (${snap.generatedFrom?.[k] ?? 'unknown'})`;
      }
    }
  }
  return out;
}

async function liveLists() {
  const get = async (url) => {
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    return res.json();
  };
  const a = await get('https://autoshort.org/.well-known/mcp.json');
  const s = await get('https://storyshort.app/api/mcp/server-card');
  return {
    autoshort: a.tools.map((t) => t.name).sort(),
    storyshort: s._meta['app.storyshort/tools'].map((t) => t.name).sort(),
  };
}

// ── front matter ─────────────────────────────────────────────────────────────

/** The subset of YAML the Agent Skills spec uses: top-level `key: value` lines and one level of `key:` + indented `k: v` lines. */
export function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return null;
  const fields = {};
  const quoted = {};
  let current = null;
  for (const raw of m[1].split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    const indented = /^\s+/.test(raw);
    const kv = raw.trim().match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!kv) return { fields, error: `unparseable line: ${raw}` };
    const unq = (v) => (/^(".*"|'.*')$/.test(v) ? v.slice(1, -1) : v);
    if (indented && current) {
      fields[current][kv[1]] = unq(kv[2]);
      quoted[`${current}.${kv[1]}`] = /^(".*"|'.*')$/.test(kv[2]);
    } else if (kv[2] === '') {
      fields[kv[1]] = {};
      current = kv[1];
    } else {
      fields[kv[1]] = unq(kv[2]);
      quoted[kv[1]] = /^(".*"|'.*')$/.test(kv[2]);
      current = null;
    }
  }
  return { fields, quoted, body: text.slice(m[0].length) };
}

function checkSkillFrontmatter(dirName, file) {
  const label = rel(file);
  const parsed = parseFrontmatter(read(file));
  if (!parsed || parsed.error) {
    error(`${label}: front matter missing or unparseable (${parsed?.error ?? 'no --- block on line 1'})`);
    return null;
  }
  const { fields, quoted } = parsed;
  for (const k of Object.keys(fields)) if (!ALLOWED_FIELDS.includes(k)) error(`${label}: field "${k}" is not in the Agent Skills spec (allowed: ${ALLOWED_FIELDS.join(', ')}); claude.ai upload rejects it`);
  const { name, description, compatibility, metadata } = fields;
  if (typeof name !== 'string' || !name) error(`${label}: name is required`);
  else {
    if (name.length > 64) error(`${label}: name is ${name.length} characters (max 64)`);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) error(`${label}: name "${name}" must be lowercase letters, digits and single hyphens, not starting or ending with a hyphen`);
    if (name !== dirName) error(`${label}: name "${name}" differs from the directory name "${dirName}"`);
    if (/claude|anthropic/.test(name)) error(`${label}: name "${name}" contains a word Claude reserves ("claude", "anthropic")`);
    if (/[<>]/.test(name)) error(`${label}: name contains an XML tag`);
  }
  if (typeof description !== 'string' || !description.trim()) error(`${label}: description is required`);
  else {
    if (description.length > 1024) error(`${label}: description is ${description.length} characters (max 1024)`);
    if (/<[a-zA-Z/][^>]*>/.test(description)) error(`${label}: description contains an XML tag`);
    if (!/\b[Uu]se when\b/.test(description)) warn(`${label}: description should say when to use the skill ("Use when ...")`);
  }
  if (compatibility !== undefined && (typeof compatibility !== 'string' || compatibility.length < 1 || compatibility.length > 500)) error(`${label}: compatibility must be 1-500 characters`);
  if (metadata !== undefined) {
    if (typeof metadata !== 'object') error(`${label}: metadata must be a map of string keys to string values`);
    else for (const [k, v] of Object.entries(metadata)) if (typeof v !== 'string' || (/^[\d.]+$/.test(v) && !quoted[`metadata.${k}`])) error(`${label}: metadata.${k} must be a quoted string`);
  }
  if (fields.license !== 'MIT') error(`${label}: license must be MIT (this repo's license)`);
  if ('allowed-tools' in fields) error(`${label}: allowed-tools pre-approves tools, so a spending tool would run without asking; remove it`);
  const lines = read(file).split('\n').length;
  if (lines > 500) error(`${label}: ${lines} lines (the spec recommends under 500)`);
  return { fields, body: parsed.body };
}

// ── tool tables ──────────────────────────────────────────────────────────────

function parseTable(file) {
  const rows = [];
  let header = null;
  for (const line of read(file).split('\n')) {
    if (!line.startsWith('|')) {
      header = null;
      continue;
    }
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.every((c) => /^-+$/.test(c))) continue;
    if (!header) {
      header = cells.map((c) => c.toLowerCase());
      continue;
    }
    const row = Object.fromEntries(header.map((h, i) => [h, cells[i]]));
    const tool = (row.tool ?? '').match(/^`([a-z0-9_]+)`$/);
    if (tool) rows.push({ name: tool[1], kind: row.kind, status: row.status, skill: row.skill });
  }
  return rows;
}

function toolTokens(text) {
  // Code spans only: tool names in the skills are always written in backticks.
  return [...new Set([...text.matchAll(/`([a-z][a-z0-9_]*)`/g)].map((m) => m[1]))];
}

// ── main ─────────────────────────────────────────────────────────────────────

/**
 * Validates the pack in `root` against `registry` ({ autoshort: { tools, retired }, storyshort: { tools, retired }, source }).
 * Pure apart from reading files (and, with opts.sync, copying references/ into each skill; with opts.live, two public GETs).
 * The AutoShort app repository calls this from a vitest with its own tool registry.
 */
export async function validatePack(root, registry, opts = {}) {
  ROOT = root;
  errors.length = 0;
  warnings.length = 0;
  notes.length = 0;
  for (const k of ['autoshort', 'storyshort']) notes.push(`registry ${k}: ${registry[k].tools.length} tools from ${registry.source?.[k] ?? 'caller'}`);
  const AS = new Set(registry.autoshort.tools);
  const SS = new Set(registry.storyshort.tools);
  const RETIRED = new Set(registry.autoshort.retired);

  // layout
  const skillsDir = path.join(ROOT, 'skills');
  const skillDirs = fs.existsSync(skillsDir) ? fs.readdirSync(skillsDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort() : [];
  if (JSON.stringify(skillDirs) !== JSON.stringify([...EXPECTED_SKILLS].sort())) error(`skills/ must contain exactly ${EXPECTED_SKILLS.join(', ')}; found ${skillDirs.join(', ') || 'nothing'}`);

  // references: top-level is canonical, each skill carries a copy so that `npx skills add --skill <name>` is self-contained
  for (const f of Object.values(TABLES)) if (!fs.existsSync(path.join(ROOT, f))) error(`${f} is missing`);
  for (const s of skillDirs) {
    for (const f of Object.values(TABLES)) {
      const copy = path.join(skillsDir, s, f);
      const canon = path.join(ROOT, f);
      if (opts.sync && fs.existsSync(canon)) {
        fs.mkdirSync(path.dirname(copy), { recursive: true });
        fs.copyFileSync(canon, copy);
      }
      if (!fs.existsSync(copy)) error(`skills/${s}/${f} is missing (run node scripts/validate.mjs --sync)`);
      else if (fs.existsSync(canon) && read(copy) !== read(canon)) error(`skills/${s}/${f} differs from ${f} (run node scripts/validate.mjs --sync)`);
    }
  }

  // skills
  const skillText = {};
  for (const s of skillDirs) {
    const file = path.join(skillsDir, s, 'SKILL.md');
    if (!fs.existsSync(file)) {
      error(`skills/${s}/SKILL.md is missing`);
      continue;
    }
    const parsed = checkSkillFrontmatter(s, file);
    skillText[s] = read(file);
    for (const m of skillText[s].matchAll(/\]\(((?!https?:|#)[^)]+)\)/g)) if (!fs.existsSync(path.join(skillsDir, s, m[1]))) error(`skills/${s}/SKILL.md links to ${m[1]}, which does not exist`);
    if (!parsed) continue;
  }

  // tool tables against the registries
  const asRows = fs.existsSync(path.join(ROOT, TABLES.autoshort)) ? parseTable(path.join(ROOT, TABLES.autoshort)) : [];
  const ssRows = fs.existsSync(path.join(ROOT, TABLES.storyshort)) ? parseTable(path.join(ROOT, TABLES.storyshort)) : [];
  for (const r of asRows) {
    if (RETIRED.has(r.name)) error(`${TABLES.autoshort}: ${r.name} is retired in the AutoShort registry`);
    else if (!AS.has(r.name)) error(`${TABLES.autoshort}: ${r.name} is not an AutoShort tool`);
  }
  for (const r of ssRows) if (!SS.has(r.name)) error(`${TABLES.storyshort}: ${r.name} is not a StoryShort tool`);
  const asTable = new Set(asRows.map((r) => r.name));
  const ssTable = new Set(ssRows.map((r) => r.name));
  for (const t of AS) if (!asTable.has(t)) error(`${TABLES.autoshort}: registry tool ${t} is not in the table`);
  for (const t of SS) if (!ssTable.has(t)) error(`${TABLES.storyshort}: registry tool ${t} is not in the table`);
  for (const [label, rows] of [['autoshort', asRows], ['storyshort', ssRows]]) {
    const seen = new Set();
    for (const r of rows) {
      if (seen.has(r.name)) error(`${TABLES[label]}: ${r.name} appears twice`);
      seen.add(r.name);
    }
  }
  const kindOf = { ...Object.fromEntries(asRows.map((r) => [r.name, r.kind])), ...Object.fromEntries(ssRows.map((r) => [r.name, r.kind])) };

  // live comparison
  if (opts.live) {
    try {
      const live = await liveLists();
      const liveAS = new Set(live.autoshort);
      const liveSS = new Set(live.storyshort);
      for (const t of liveAS) if (!asTable.has(t)) error(`live AutoShort tool ${t} is not in ${TABLES.autoshort}`);
      for (const t of asTable) if (!liveAS.has(t)) warn(`${TABLES.autoshort}: ${t} is in the table but not in the live AutoShort tool list`);
      for (const t of liveSS) if (!ssTable.has(t)) error(`live StoryShort tool ${t} is not in ${TABLES.storyshort}`);
      for (const r of ssRows) {
        if (r.status === 'live' && !liveSS.has(r.name)) error(`${TABLES.storyshort}: ${r.name} is marked live but the public StoryShort card does not list it`);
        if (r.status === 'off' && liveSS.has(r.name)) error(`${TABLES.storyshort}: ${r.name} is marked off but the public StoryShort card lists it`);
      }
      notes.push(`live: AutoShort ${liveAS.size} tools (https://autoshort.org/.well-known/mcp.json), StoryShort ${liveSS.size} tools (https://storyshort.app/api/mcp/server-card)`);
    } catch (e) {
      error(`--live: ${e.message}`);
    }
  }

  // every tool named anywhere must exist
  const proseFiles = [
    ...skillDirs.map((s) => ({ label: `skills/${s}/SKILL.md`, file: path.join(skillsDir, s, 'SKILL.md'), skill: s })),
    ...(fs.existsSync(path.join(ROOT, 'examples')) ? fs.readdirSync(path.join(ROOT, 'examples')).filter((f) => f.endsWith('.md')).map((f) => ({ label: `examples/${f}`, file: path.join(ROOT, 'examples', f) })) : []),
    ...['README.md', 'docs/install.md', '.cursor/rules/autoshort-video.mdc'].filter((f) => fs.existsSync(path.join(ROOT, f))).map((f) => ({ label: f, file: path.join(ROOT, f) })),
  ].filter((f) => fs.existsSync(f.file));
  for (const { label, file } of proseFiles) {
    const text = read(file);
    for (const t of toolTokens(text)) {
      if (t === 'autoshort_') continue;
      if (t.startsWith('autoshort_')) {
        if (RETIRED.has(t)) error(`${label}: ${t} is a retired tool`);
        else if (!AS.has(t)) error(`${label}: \`${t}\` is not an AutoShort tool`);
      } else if (t.includes('_') && TOOL_VERBS.includes(t.split('_')[0]) && !SS.has(t)) {
        error(`${label}: \`${t}\` looks like a tool name but is not a StoryShort tool`);
      }
    }
    // prose that says "autoshort_x" without backticks (tables, headings)
    for (const m of text.matchAll(/\bautoshort_[a-z0-9_]+\b(?!\*)/g)) {
      if (!AS.has(m[0]) && !RETIRED.has(m[0]) && !/_$/.test(m[0])) error(`${label}: ${m[0]} is not an AutoShort tool`);
    }
  }

  // promises
  const SKILL_AND_DOCS = proseFiles;
  for (const { label, file } of [...SKILL_AND_DOCS, ...Object.values(TABLES).map((f) => ({ label: f, file: path.join(ROOT, f) })).filter((f) => fs.existsSync(f.file))]) {
    const body = read(file);
    for (const m of body.matchAll(/\b\d[\d,.]*\s*(credits?|USD)\b/gi)) error(`${label}: hard-coded price "${m[0]}" (prices come only from tool output)`);
    for (const m of body.matchAll(/\$\s?\d[\d,.]*/g)) error(`${label}: hard-coded dollar amount "${m[0]}"`);
    const claim = /\b(earn(ing|ings|s)?|income|make money|get rich|passive|revenue|profit(s|able)?|guaranteed (views|results|income))\b/i;
    for (const line of body.split('\n')) if (claim.test(line) && !/\b(do not|don't|never|no |not |decline|cannot)\b/i.test(line)) error(`${label}: earnings or guarantee claim: ${line.trim().slice(0, 120)}`);
  }

  const mk = skillText['make-faceless-video'];
  if (mk) {
    const at = (needle, from = 0) => {
      const i = mk.indexOf(needle, from);
      if (i < 0) error(`make-faceless-video: expected "${needle}"`);
      return i;
    };
    const a4 = at('### A4. Price, approval, render');
    const estimate = at('`autoshort_estimate_cost`', a4);
    const ask = at('wait for a clear yes', a4);
    const render = at('`autoshort_render_draft`', ask);
    if (!(a4 < estimate && estimate < ask && ask < render)) error('make-faceless-video A4: order must be estimate_cost, then ask and wait for yes, then autoshort_render_draft');
    const onYes = /\b(on yes|after a (clear )?yes)\b/i;
    const stepWith = (section, tool) => section.split('\n').find((l) => l.includes(tool)) ?? '';
    const a4Section = mk.slice(a4, mk.indexOf('\n## ', a4));
    if (!onYes.test(stepWith(a4Section.slice(a4Section.indexOf('wait for a clear yes')), '`autoshort_render_draft`'))) error('make-faceless-video A4: the step that calls autoshort_render_draft must start from "On yes"');
    const b3 = at('### B3. Price, approval, render');
    const bAsk = at('wait for a clear yes', b3);
    const bRender = at('`render_draft`', bAsk);
    if (!(b3 < bAsk && bAsk < bRender)) error('make-faceless-video B3: ask and wait for yes must come before render_draft');
    const b3Section = mk.slice(b3, mk.indexOf('\n## ', b3));
    if (!onYes.test(stepWith(b3Section.slice(b3Section.indexOf('wait for a clear yes')), '`render_draft`'))) error('make-faceless-video B3: the step that calls render_draft must start from "On yes"');
    for (const needle of ['confirmCredits', 'QUOTE_REQUIRED', 'PRICE_CHANGED', '`quote_video`', 'Never call a tool that renders or spends credits', '`autoshort_get_capabilities`', '## 0. Which server is connected?', 'decision']) at(needle);
    if (!/Neither/.test(mk)) error('make-faceless-video: the "neither server connected" case is missing');
  }
  const pl = skillText['plan-a-video-series'];
  if (pl) {
    const idx = (n) => {
      const i = pl.indexOf(n);
      if (i < 0) error(`plan-a-video-series: expected "${n}"`);
      return i;
    };
    const save = idx('autoshort_save_season_plan');
    const review = idx('`review: true`');
    const confirm = idx('`confirm: true`');
    const quote = idx('autoshort_quote_character_episode');
    const create = idx('autoshort_create_character_episode');
    if (!(save < review && review < confirm && confirm < quote && quote < create)) error('plan-a-video-series: order must be save, review, confirm, quote, create');
    for (const n of ['planHash', '`expectedCredits`', '`startPaused: true`', 'plan before you produce', 'Path B', 'Create series paused']) if (!pl.toLowerCase().includes(n.toLowerCase())) error(`plan-a-video-series: expected "${n}"`);
    const b = pl.slice(pl.indexOf('## Path B'));
    const pCreate = b.indexOf('`create_series`');
    const pResume = b.indexOf('`resume_series`');
    const pAsk = b.indexOf('Ask: "Resume it?"');
    if (!(pCreate >= 0 && pAsk > pCreate && pResume > pAsk)) error('plan-a-video-series Path B: create_series (paused), then ask "Resume it?", then resume_series');
  }
  const rs = skillText['research-winning-formats'];
  if (rs) {
    for (const t of toolTokens(rs)) {
      if (!(AS.has(t) || SS.has(t))) continue;
      if (!/read-only/.test(kindOf[t] ?? '')) error(`research-winning-formats names ${t}, whose kind is "${kindOf[t]}", not read-only`);
    }
    if (!/no format-presets/i.test(rs) && !/no format-presets endpoint/i.test(rs)) error('research-winning-formats must say there is no format-presets endpoint');
  }
  // the skills must never tell the agent to buy credits or set limits
  for (const [s, text] of Object.entries(skillText)) {
    for (const line of text.split('\n')) {
      if (/autoshort_(buy_credits|setup_auto_recharge|set_limits|disable_auto_recharge)/.test(line) && !/\b(do not|never)\b/i.test(line)) error(`skills/${s}: line names a billing tool without forbidding it: ${line.trim().slice(0, 100)}`);
    }
  }

  // repo files
  if (!fs.existsSync(path.join(ROOT, 'LICENSE')) || !/^MIT License/.test(read(path.join(ROOT, 'LICENSE')))) error('LICENSE (MIT) is missing');
  const examples = fs.existsSync(path.join(ROOT, 'examples')) ? fs.readdirSync(path.join(ROOT, 'examples')).filter((f) => /^\d\d-.*\.md$/.test(f)) : [];
  if (examples.length !== 5) error(`examples/ must hold exactly 5 numbered prompt files; found ${examples.length}`);
  for (const f of examples) if (!/^## Prompt/m.test(read(path.join(ROOT, 'examples', f)))) error(`examples/${f}: needs a "## Prompt" section`);
  const mpFile = path.join(ROOT, '.claude-plugin/marketplace.json');
  if (!fs.existsSync(mpFile)) error('.claude-plugin/marketplace.json is missing');
  else {
    let mp;
    try {
      mp = JSON.parse(read(mpFile));
    } catch (e) {
      error(`.claude-plugin/marketplace.json: invalid JSON: ${e.message}`);
    }
    if (mp) {
      if (RESERVED_MARKETPLACE_NAMES.includes(mp.name)) error(`marketplace name "${mp.name}" is reserved`);
      if (!mp.owner?.name) error('marketplace.owner.name is required');
      const entry = mp.plugins?.[0];
      if (!entry) error('marketplace.plugins must not be empty');
      else {
        const listed = (entry.skills ?? []).map((p) => p.replace(/^\.\/skills\//, '')).sort();
        if (JSON.stringify(listed) !== JSON.stringify([...EXPECTED_SKILLS].sort())) error(`marketplace entry lists skills ${listed.join(', ')}; expected ${EXPECTED_SKILLS.join(', ')}`);
        for (const p of entry.skills ?? []) if (!fs.existsSync(path.join(ROOT, p, 'SKILL.md'))) error(`marketplace skill path ${p} has no SKILL.md`);
      }
    }
  }
  const cursor = path.join(ROOT, '.cursor/rules/autoshort-video.mdc');
  if (!fs.existsSync(cursor)) error('.cursor/rules/autoshort-video.mdc is missing');
  else {
    const fm = parseFrontmatter(read(cursor));
    if (!fm || typeof fm.fields.description !== 'string' || !('alwaysApply' in fm.fields)) error('.cursor/rules/autoshort-video.mdc: needs description and alwaysApply front matter');
  }
  for (const f of ['README.md', 'docs/install.md']) if (!fs.existsSync(path.join(ROOT, f))) error(`${f} is missing`);

  if (opts.cli) {
    const r = spawnSync('claude', ['plugin', 'validate', '--strict', ROOT], { encoding: 'utf8' });
    if (r.error) error(`--cli: could not run claude: ${r.error.message}`);
    else if (r.status !== 0) error(`--cli: claude plugin validate failed:\n${r.stdout}${r.stderr}`);
    else notes.push('claude plugin validate --strict: passed');
  }

  return { errors: [...errors], warnings: [...warnings], notes: [...notes], skills: skillDirs, counts: { autoshort: AS.size, storyshort: SS.size } };
}

async function main() {
  const registry = loadRegistry();
  for (const k of ['autoshort', 'storyshort']) {
    if (!registry[k]) {
      console.error(`No registry for ${k}: pass --${k}-repo <checkout> or keep registry/tools.json`);
      process.exit(2);
    }
  }
  const r = await validatePack(PACK_ROOT, registry, { live: flag('--live'), sync: flag('--sync'), cli: flag('--cli') });
  for (const n of r.notes) console.log(`note: ${n}`);
  for (const w of r.warnings) console.log(`warning: ${w}`);
  for (const e of r.errors) console.log(`error: ${e}`);
  console.log(`\n${r.errors.length} error(s), ${r.warnings.length} warning(s); ${r.skills.length} skills, ${r.counts.autoshort} AutoShort tools, ${r.counts.storyshort} StoryShort tools in the registries`);
  process.exit(r.errors.length || (flag('--strict') && r.warnings.length) ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
