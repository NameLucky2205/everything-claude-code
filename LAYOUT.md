# Repository layout

What each top-level directory **is**, so it's clear which files are edited by hand and which
are produced from those. The rule of thumb: **edit the canonical sources; never hand-edit a
generated adapter or a translation.**

## 1. Canonical sources (edit these)

The single hand-maintained surface. Everything else is derived from here.

| Path | Contents |
| --- | --- |
| `agents/` | 60 subagent definitions (Markdown + frontmatter) |
| `skills/` | 229 skills, each `skills/<name>/SKILL.md` |
| `commands/` | 75 slash commands |
| `rules/` | Governance rules — `common/` + per-language layers scoped by `paths:` |
| `hooks/` | Hook definitions (JSON) |
| `mcp-configs/` | MCP server configurations |
| `manifests/` | Install manifests: `install-modules`, `install-profiles`, `install-components` |
| `schemas/` | JSON schemas validating the above |

Browsable index of all three component types: [CATALOG.md](CATALOG.md) (generated).

## 2. Generated harness adapters (do not hand-edit)

Per-harness mirrors of the canonical surface, produced by the adapter scripts in `scripts/`
(`build-opencode.js`, `gemini-adapt-agents.js`, `harness-adapter-compliance.js`, …). These
should be regenerated, never edited directly — a drift check guards them (see §6).

| Path | Harness |
| --- | --- |
| `.claude-plugin/` | Claude Code plugin manifest + marketplace |
| `.cursor/` | Cursor |
| `.codex/`, `.codex-plugin/` | Codex |
| `.opencode/` | OpenCode |
| `.gemini/` | Gemini |
| `.qwen/` | Qwen |
| `.agents/` | Generic `AGENTS.md`-style consumers |
| `.codebuddy/`, `.kiro/`, `.trae/` | CodeBuddy / Kiro / Trae |

## 3. Runtime config (not a mirror)

| Path | Purpose |
| --- | --- |
| `.claude/` | This repo's **own** Claude Code runtime config (settings, local hooks) — it is not a generated harness mirror |
| `.github/` | CI workflows |
| `.vscode/` | Editor settings |
| `config/`, `contexts/`, `agent.yaml` | Runtime configuration and context bundles |

## 4. Docs and translations

| Path | Contents |
| --- | --- |
| `docs/architecture`, `docs/business`, `docs/examples`, `docs/releases`, `docs/security`, `docs/fixes` | Real documentation |
| `docs/<locale>/` (`ja-JP`, `ko-KR`, `pt-BR`, `ru`, `tr`, `vi-VN`, `zh-CN`, `zh-TW`) | **Translated copies** of skills/agents/docs — derived, must not be counted as new components |
| `assessments/` | Point-in-time reviews + improvement roadmap |
| `archive/` | Superseded/dated session notes kept for history |
| Root `*.md` guides | `README`, `INSTALL`, `CONTRIBUTING`, `SECURITY`, `TROUBLESHOOTING`, the three `the-*-guide.md`, `MODEL-ROUTING`, etc. |

## 5. Subprojects (own toolchains — candidates to split out)

| Path | What | Toolchain |
| --- | --- | --- |
| `src/llm/` | LLM-abstraction library | JS/TS |
| `ecc2/` | Rust control-plane experiment | Cargo |
| `ecc_dashboard.py` | Standalone dashboard script (~930 lines) | Python |
| `research/`, `examples/`, `plugins/` | Ancillary material |

These have nothing to do with the plugin surface and inflate the root. Long-term they belong in
tagged subdirectories or separate repos; short-term, this section is where they live.

## 6. Build / CI tooling

| Path | Purpose |
| --- | --- |
| `scripts/` | Node utilities: installer (`install-plan.js`, `install-apply.js`, `ecc.js`), harness adapters, `doctor.js` |
| `scripts/ci/` | Validators run in CI: `validate-*.js`, `catalog.js` (count check), `catalog-index.js` (CATALOG.md), and the drift guard |
| `tests/` | Test suite (`node tests/run-all.js`) |
| `package.json`, `yarn.lock` | Node package (`ecc-universal`), Yarn 4 via Corepack |
| `pyproject.toml`, `eslint.config.js`, `commitlint.config.js` | Python/lint/commit tooling |

---

**Invariant:** a change to a canonical source in §1 is not complete until the §2 adapters and
§4 translations are regenerated. That is what the CI drift guard enforces — see
`scripts/ci/` and `assessments/IMPROVEMENT-PLAN.md` Phase 2.
