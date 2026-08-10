# Phase 3 — consolidation design (proposal, not yet applied)

Phase 3 collapses the per-language agent/command fan-out into a few stack-detecting
components. Unlike Phases 0–2 (safe/additive), **this changes auto-dispatch behavior** —
deleting `python-reviewer` and routing Python through a generic `code-reviewer` alters which
subagent fires on a Python change. That is a maintainer's call, needs a compatibility window,
and cannot be a silent hygiene edit. Hence: design here, execute on explicit approval.

## Current shape (the tax)

- **19 reviewer agents**, of which ~13 are one template with the language swapped
  (`python/go/rust/typescript/java/csharp/cpp/fsharp/swift/kotlin/django/fastapi/flutter`).
- **10 build-resolver agents** (`cpp/dart/django/go/java/kotlin/pytorch/rust/swift/*`), same
  template with the toolchain swapped.
- **Per-language command triads** (`/*-build`, `/*-test`, `/*-review`) duplicating the agents
  beneath them.

Cost: every review-policy improvement must be copy-pasted into 13 files; the near-identical
`description`s make model auto-selection ambiguous; the counts inflate the surface.

## Target shape

### A. 19 reviewers → 1 stack-detecting `code-reviewer` + a few orthogonal specialists

- **Fold** (language-only variants) into `code-reviewer`, which detects the stack (file
  extensions + `rules/<lang>` presence) and loads that language's criteria from `rules/<lang>`
  instead of hardcoding them per agent:
  `python, go, rust, typescript, java, csharp, cpp, fsharp, swift, kotlin, django, fastapi,
  flutter`.
- **Keep** the genuinely orthogonal reviewers — they review a *dimension*, not a language:
  `security-reviewer`, `healthcare-reviewer`, `database-reviewer`, `mle-reviewer`,
  `network-config-reviewer`.
- Result: **19 → 6** reviewer agents.

The per-language review knowledge does not disappear — it moves to `rules/<lang>/*.md`, which
already exist and are already the source the agents paraphrase. `code-reviewer` reads them.

### B. 10 build-resolvers → 1 `build-error-resolver`

Detect the toolchain from the failing command / build file (`cargo`, `go build`, `gradle`,
`mvn`, `xcodebuild`, `pip`, `dart`, `pytorch` stack) and apply the matching fix playbook,
sourced from `rules/<lang>`. Result: **10 → 1**. Rename the mislabeled "generic" resolver
(it is really TS/JS) so names are honest.

### C. Per-language command triads → 3 stack-aware generics

`/build`, `/test`, `/review` read `config/project-stack-mappings.json` to pick the right
playbook. Adding a language becomes a rules-pack edit, not three new command files.

## Dispatch determinism

Today 11 reviewers assert `MUST BE USED` simultaneously. Phase 0 already scoped the generic
`code-reviewer` to the fallback case. Phase 3 finishes the job: with language reviewers folded
in, there is exactly one code reviewer plus a small set of dimension reviewers whose triggers
are non-overlapping (security ≠ database ≠ healthcare). No contention, deterministic selection.

## Migration & rollback (why it's safe *when done deliberately*)

1. **Compatibility window.** Keep thin redirect stubs at the old agent names
   (`python-reviewer` → "use `code-reviewer`; it detects Python") for one release so existing
   prompts and muscle-memory keep working. Remove after a deprecation period.
2. **Behavioral test first.** Use the existing `skill-comply` / `agent-eval` harnesses to prove
   the consolidated `code-reviewer` matches each language reviewer's findings on a fixture set
   *before* deleting the originals.
3. **One language at a time.** Fold, run the eval, confirm parity, then remove — not a 13-file
   big-bang.
4. **Rollback** is `git revert` of a single fold commit plus restoring the stub.

## Net effect

- Agents: **60 → ~40** (19→6 reviewers, 10→1 resolvers).
- Review policy lives in **one** place per language (`rules/<lang>`), edited once.
- Auto-dispatch is deterministic.
- Counts stop inflating from swapped-language templates.

## Not included on purpose

The `*-patterns` skill sprawl (35 skills) and framework verification/TDD quartets are a
*separate* consolidation (skills, not agents) and should follow the same fold-behind-a-generic
+ eval-parity discipline. Track them as Phase 3b.
