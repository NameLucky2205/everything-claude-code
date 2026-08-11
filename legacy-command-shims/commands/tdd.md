---
description: Legacy slash-entry shim for the tdd-workflow skill. Prefer the skill directly.
---

# TDD Command (Legacy Shim)

Use this only if you still invoke `/tdd`. The maintained workflow lives in the
`tdd-workflow` skill (`skills/tdd-workflow/SKILL.md`) — do not duplicate the playbook here.

## Delegation

Apply the `tdd-workflow` skill, passing `$ARGUMENTS` through. Stay strict on
RED → GREEN → REFACTOR, tests first, coverage explicit, checkpoint evidence clear.
