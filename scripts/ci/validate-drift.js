#!/usr/bin/env node
/**
 * Drift guard for derived surfaces.
 *
 * The canonical sources are agents/, skills/, commands/. Translations live under
 * docs/<locale>/{skills,agents} and are derived copies. They have no generator today,
 * so they drift. This guard catches the unambiguous, zero-false-positive form of drift:
 *
 *   ORPHAN  — a translated skill/agent whose canonical source no longer exists.
 *             (Someone deleted/renamed a canonical component but left the translation.)
 *
 * ORPHANs fail the build. Untranslated canonical components are reported as info only
 * (translating everything is optional; shipping a translation for a deleted component is not).
 *
 * Usage:
 *   node scripts/ci/validate-drift.js          # report + exit 1 on any orphan
 *   node scripts/ci/validate-drift.js --json    # machine-readable
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const JSON_MODE = process.argv.includes('--json');

function dirs(p) {
  const abs = path.join(ROOT, p);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name);
}
function mdFiles(p) {
  const abs = path.join(ROOT, p);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs).filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, ''));
}

// Canonical sets
const canonSkills = new Set(dirs('skills').filter(n => fs.existsSync(path.join(ROOT, 'skills', n, 'SKILL.md'))));
const canonAgents = new Set(mdFiles('agents'));

// Locale dirs = docs/* that carry a skills/ or agents/ subtree
const localeDirs = dirs('docs').filter(l =>
  fs.existsSync(path.join(ROOT, 'docs', l, 'skills')) || fs.existsSync(path.join(ROOT, 'docs', l, 'agents')));

const report = [];
let orphanTotal = 0;

for (const locale of localeDirs) {
  const trSkills = dirs(path.join('docs', locale, 'skills'))
    .filter(n => fs.existsSync(path.join(ROOT, 'docs', locale, 'skills', n, 'SKILL.md')));
  const trAgents = mdFiles(path.join('docs', locale, 'agents'));

  const orphanSkills = trSkills.filter(n => !canonSkills.has(n));
  const orphanAgents = trAgents.filter(n => !canonAgents.has(n));
  const untransSkills = [...canonSkills].filter(n => !trSkills.includes(n)).length;
  const untransAgents = [...canonAgents].filter(n => !trAgents.includes(n)).length;

  orphanTotal += orphanSkills.length + orphanAgents.length;
  report.push({ locale, trSkills: trSkills.length, trAgents: trAgents.length,
    orphanSkills, orphanAgents, untransSkills, untransAgents });
}

if (JSON_MODE) {
  console.log(JSON.stringify({ orphanTotal, locales: report }, null, 2));
} else {
  console.log(`Drift guard — canonical: ${canonSkills.size} skills, ${canonAgents.size} agents\n`);
  for (const r of report) {
    const flag = (r.orphanSkills.length + r.orphanAgents.length) ? '✗' : '✓';
    console.log(`${flag} docs/${r.locale}: ${r.trSkills} skills, ${r.trAgents} agents translated ` +
      `(untranslated: ${r.untransSkills} skills, ${r.untransAgents} agents)`);
    for (const n of r.orphanSkills) console.log(`    ORPHAN skill: docs/${r.locale}/skills/${n} (no canonical skills/${n})`);
    for (const n of r.orphanAgents) console.log(`    ORPHAN agent: docs/${r.locale}/agents/${n}.md (no canonical agents/${n}.md)`);
  }
  console.log(`\n${orphanTotal} orphan(s).`);
}

if (orphanTotal > 0) {
  if (!JSON_MODE) console.error('\nDrift detected: translations exist for deleted canonical components. ' +
    'Remove the stale translations or restore the canonical source.');
  process.exit(1);
}
