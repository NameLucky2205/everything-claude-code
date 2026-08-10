---
description: Legacy slash-entry shim for dmux-workflows and autonomous-agent-harness. Prefer the skills directly.
---

# Orchestrate Command (Legacy Shim)

Use this only if you still invoke `/orchestrate`. The maintained workflows live in the
`dmux-workflows` and `autonomous-agent-harness` skills — do not duplicate the playbook here.

## Delegation

Apply the `dmux-workflows` skill for multi-agent tmux orchestration, or
`autonomous-agent-harness` for autonomous loops, passing `$ARGUMENTS` through.
