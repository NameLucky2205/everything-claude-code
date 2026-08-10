# Installing ECC

There is **one canonical way to install**, plus a few alternatives for specific setups.
The single most common broken setup is **stacking two install methods** — pick one path
and stop.

## Canonical: the `ecc` CLI

```bash
# 1. See what a profile would install (dry run — changes nothing)
npx ecc install --profile developer --target claude --dry-run

# 2. Apply it
npx ecc install --profile developer --target claude
```

- `--profile` selects a bundle of modules (see table below).
- `--target` selects the harness whose directories get written (see targets below).
- `--dry-run` prints the plan without touching the filesystem — always run it first.
- Compatibility alias: `npx ecc-install --profile <p> --target <t>` behaves the same.

### Profiles

| Profile | For | Modules |
| --- | --- | --- |
| `minimal` | Low-context Claude Code: rules, agents, commands, platform configs, quality — no hook runtime | 5 |
| `core` | Minimal harness baseline: commands, hooks, platform configs, quality | 6 |
| `developer` | **Default** for most users — app code across languages/frameworks | 9 |
| `security` | Security-heavy: baseline runtime + security agents/rules | 7 |
| `research` | Research/content: investigation, synthesis, writing | 9 |
| `full` | Everything currently classified | 21 |

Not sure? Use `developer`. Want the smallest always-on context? Use `minimal`.

### Targets (harnesses)

`claude` · `cursor` · `codex` · `gemini` · `opencode` · `antigravity` · `codebuddy` ·
`joycode` · `qwen`

Install to more than one by repeating `--target`.

### Add a capability on top

```bash
# Discover which components match a need
npx ecc consult "mlops training model deployment" --target claude
# Install a profile plus a capability bundle
npx ecc install --profile developer --target claude --with capability:machine-learning
```

## Decision tree

```
Do you use Claude Code as a plugin marketplace?
├── Yes → install via /plugin (the plugin already loads ECC skills/commands/hooks).
│         DO NOT also run the CLI or install.sh afterward — that duplicates everything.
└── No  → npx ecc install --profile <minimal|developer|full> --target <harness>
          ├── Want a guided, interactive picker instead of flags?
          │     → run the configure-ecc skill (wizard with merge/overwrite detection).
          └── On a machine without npx on PATH?
                → ./install.sh --profile <p> --target <t>   (POSIX)
                  .\install.ps1 --profile <p> --target <t>  (Windows)
```

## ⚠️ Do not stack install methods

If you installed via `/plugin install`, **do not** also run `./install.sh --profile full`,
`.\install.ps1 --profile full`, or `npx ecc-install --profile full`. The plugin already loads
ECC surfaces; running the full installer on top copies the same skills/commands/hooks into your
user directories and produces duplicate components and duplicated runtime behavior.

To check what is currently installed and detect duplication:

```bash
npx ecc doctor
```

## Alternatives, ranked

1. **`npx ecc install` (CLI)** — canonical; scriptable, dry-runnable, multi-target.
2. **`/plugin install` (Claude marketplace)** — best if you live in Claude Code and want zero flags.
3. **`configure-ecc` skill** — interactive wizard; good for a guided first-time setup.
4. **`install.sh` / `install.ps1`** — thin wrappers over the same Node installer; use only when
   `npx` is inconvenient.

Pick exactly one. All four write the same component set; the difference is ergonomics, not content.
