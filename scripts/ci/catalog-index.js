#!/usr/bin/env node
/**
 * Generate CATALOG.md — a browsable, categorized index of every canonical agent,
 * skill, and command, built from their frontmatter. This is the discoverability
 * surface: 229 skills are useless if you cannot find the right one.
 *
 * Categories are derived from the component name (there is no category field in
 * frontmatter yet), matched against an ordered rule list — first match wins.
 *
 * Usage:
 *   node scripts/ci/catalog-index.js            # print CATALOG.md to stdout
 *   node scripts/ci/catalog-index.js --write    # write CATALOG.md
 *   node scripts/ci/catalog-index.js --check     # exit 1 if CATALOG.md is stale
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const OUT = path.join(ROOT, 'CATALOG.md');

// Ordered [regex, category]; first match wins. Keep specific before generic.
const CATEGORY_RULES = [
  [/^(typescript|javascript|nodejs|node|bun|nextjs|nuxt|frontend|react|vue|coding-standards)/, 'TypeScript / JavaScript / Web'],
  [/^(python|django|fastapi|pytorch|mle|regex-vs-llm)/, 'Python'],
  [/^go(lang)?-/, 'Go'],
  [/^rust-/, 'Rust'],
  [/^(java|jpa|springboot|spring)/, 'Java / JVM'],
  [/^(kotlin|compose-multiplatform|android)/, 'Kotlin / Android'],
  [/^(swift|swiftui|foundation-models|liquid-glass|ios)/, 'Swift / Apple'],
  [/^cpp-/, 'C / C++'],
  [/^(csharp|dotnet)/, 'C# / .NET'],
  [/^fsharp-/, 'F#'],
  [/^(flutter|dart)/, 'Dart / Flutter'],
  [/^(laravel|php)/, 'PHP / Laravel'],
  [/^ruby|rails/, 'Ruby / Rails'],
  [/^perl-/, 'Perl'],
  [/^harmonyos|arkts/, 'HarmonyOS / ArkTS'],
  [/^(database|postgres|clickhouse|kotlin-exposed)/, 'Databases'],
  [/^(docker|deployment|git-workflow|canary|benchmark|safety-guard|plankton)/, 'DevOps / Delivery'],
  [/^(security|django-security|laravel-security|springboot-security|perl-security)/, 'Security'],
  [/^(tdd|e2e|.*-testing|.*-tdd|.*-verification|verification-loop|eval|ai-regression|browser-qa|pr-test)/, 'Testing / QA'],
  [/^(agent|agentic|ai-|autonomous|continuous|iterative|cost-aware|enterprise-agent|santa|blueprint|team-builder|loop|ralphinho|nanoclaw|dmux|observer|eval-harness|prompt-optimizer|context-budget|strategic-compact|harness)/, 'AI / Agents / LLM tooling'],
  [/^(claude-api|claude-code|mcp-|documentation-lookup|docs-lookup|deep-research|exa|market-research|search-first)/, 'Docs / Research / MCP'],
  [/^(content|crosspost|article|frontend-slides|video|videodb|fal-ai|x-api|seo)/, 'Content / Media'],
  [/^(network|homelab)/, 'Networking / Homelab'],
  [/^healthcare/, 'Healthcare'],
  [/^(carrier|customs|energy|inventory|logistics|production|quality|returns)/, 'Operations / Supply-chain verticals'],
  [/^(design-system|a11y|liquid-glass|product-lens)/, 'Design / Accessibility / Product'],
  [/^(architecture|codebase-onboarding|repo-scan|rules-distill|skill-|type-design|comment-|conversation-|code-explorer|refactor|silent-failure|code-simplifier|code-architect|architect|planner|performance)/, 'Architecture / Code understanding'],
  [/^(investor|opensource|content-hash|regex)/, 'Misc tooling'],
];

function categoryFor(name) {
  for (const [re, cat] of CATEGORY_RULES) {
    if (re.test(name)) return cat;
  }
  return 'General';
}

function frontmatter(file) {
  const text = fs.readFileSync(file, 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const fm = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([a-zA-Z_-]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^["'\[]|["'\]]$/g, '').trim();
  }
  return fm;
}

function listDirMd(dir) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs)
    .filter(f => f.endsWith('.md'))
    .map(f => ({ name: f.replace(/\.md$/, ''), file: path.join(abs, f) }));
}

function listSkills() {
  const abs = path.join(ROOT, 'skills');
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs, { withFileTypes: true })
    .filter(e => e.isDirectory() && fs.existsSync(path.join(abs, e.name, 'SKILL.md')))
    .map(e => ({ name: e.name, file: path.join(abs, e.name, 'SKILL.md') }));
}

function grouped(items) {
  const by = new Map();
  for (const it of items) {
    const fm = frontmatter(it.file);
    const cat = categoryFor(it.name);
    if (!by.has(cat)) by.set(cat, []);
    by.get(cat).push({ name: it.name, description: fm.description || '', model: fm.model });
  }
  return [...by.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([cat, rows]) => [cat, rows.sort((a, b) => a.name.localeCompare(b.name))]);
}

function renderSection(title, items, withModel) {
  const groups = grouped(items);
  let out = `## ${title} (${items.length})\n\n`;
  for (const [cat, rows] of groups) {
    out += `### ${cat}\n\n`;
    out += withModel ? '| Name | Model | Description |\n| --- | --- | --- |\n'
                     : '| Name | Description |\n| --- | --- |\n';
    for (const r of rows) {
      const desc = r.description.replace(/\|/g, '\\|');
      out += withModel
        ? `| \`${r.name}\` | ${r.model || '—'} | ${desc} |\n`
        : `| \`${r.name}\` | ${desc} |\n`;
    }
    out += '\n';
  }
  return out;
}

function build() {
  const agents = listDirMd('agents');
  const skills = listSkills();
  const commands = listDirMd('commands');
  let md = '# Catalog\n\n';
  md += '> Generated by `scripts/ci/catalog-index.js` — do not edit by hand. ';
  md += 'Run `node scripts/ci/catalog-index.js --write` after adding components.\n\n';
  md += `Canonical surface: **${agents.length} agents · ${skills.length} skills · ${commands.length} commands**. `;
  md += 'Categories are derived from component names; pick the entry whose description fits your task.\n\n';
  md += renderSection('Agents', agents, true);
  md += renderSection('Skills', skills, false);
  md += renderSection('Commands', commands, false);
  return md;
}

function main() {
  const md = build();
  if (process.argv.includes('--check')) {
    const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
    if (cur.trim() !== md.trim()) {
      console.error('CATALOG.md is stale. Run: node scripts/ci/catalog-index.js --write');
      process.exit(1);
    }
    console.log('CATALOG.md is up to date.');
    return;
  }
  if (process.argv.includes('--write')) {
    fs.writeFileSync(OUT, md);
    console.log(`Wrote ${path.relative(ROOT, OUT)}`);
    return;
  }
  process.stdout.write(md);
}

main();
