---
description: Legacy slash-entry shim for the e2e-testing skill. Prefer the skill directly.
---

# E2E Command (Legacy Shim)

Use this only if you still invoke `/e2e`. The maintained workflow lives in the
`e2e-testing` skill (`skills/e2e-testing/SKILL.md`) — do not duplicate the playbook here.

## Delegation

Apply the `e2e-testing` skill, passing `$ARGUMENTS` through. Prefer the Page Object Model,
quarantine flaky tests, and attach artifacts (screenshots, videos, traces) on failure.
