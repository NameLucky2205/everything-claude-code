---
name: nodejs-patterns
description: Node.js runtime patterns — ESM modules, async/streams, graceful shutdown, environment/config validation, error handling, and security for production Node services.
origin: ECC
---

# Node.js Patterns

Production Node.js: correct async, clean process lifecycle, validated configuration, and safe
defaults. Targets Node 20+ (LTS). Pairs with `typescript-patterns` for typed services.

## When to Activate

- Building or reviewing a Node.js service, CLI, or worker
- Setting up config, logging, or process lifecycle
- Diagnosing unhandled rejections, leaks, or crashes

## Modules & runtime

- Use **ESM** (`"type": "module"`), `import`/`export`, and the `node:` prefix for builtins
  (`import { readFile } from "node:fs/promises"`).
- Prefer the promise APIs (`node:fs/promises`, `node:timers/promises`) over callbacks.
- Reach for built-ins before dependencies: `fetch` (global), `node:test`, `AbortController`,
  `structuredClone`, `crypto.randomUUID()` all ship with the runtime.

## Async discipline

- Never leave a floating promise. Handle process-level safety nets, then fix the root cause:

```js
process.on("unhandledRejection", (reason) => { logger.error({ reason }, "unhandledRejection"); process.exit(1); });
process.on("uncaughtException", (err) => { logger.error({ err }, "uncaughtException"); process.exit(1); });
```

- Run independent async work concurrently with `Promise.all`; bound concurrency for large fan-out
  (a pool / `p-limit`) so you do not exhaust sockets or memory.
- Do not block the event loop: offload CPU-bound work to `worker_threads`; keep `async` handlers
  free of synchronous heavy loops and `*Sync` fs calls.

## Streams for large data

Stream instead of buffering whole files/responses into memory; `pipeline` propagates errors and
cleans up:

```js
import { pipeline } from "node:stream/promises";
import { createReadStream, createWriteStream } from "node:fs";
import { createGzip } from "node:zlib";

await pipeline(createReadStream(src), createGzip(), createWriteStream(dst));
```

## Configuration: validate at startup, fail fast

Read env once, validate its shape, and export a typed config. A missing var should crash on boot,
not at 3am on the code path that needs it.

```js
import { z } from "zod";
const Env = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
});
export const env = Env.parse(process.env); // throws with a clear message if invalid
```

Never commit secrets; load them from the environment or a secret manager.

## Graceful shutdown

Drain in-flight work on SIGTERM/SIGINT so deploys and autoscaling do not drop requests:

```js
const server = app.listen(env.PORT);
for (const sig of ["SIGTERM", "SIGINT"]) {
  process.on(sig, () => {
    server.close(() => { db.end().finally(() => process.exit(0)); });
    setTimeout(() => process.exit(1), 10_000).unref(); // hard cap
  });
}
```

## Errors & logging

- Throw `Error` subclasses with a stable `code`; attach context, never swallow.
- Use structured JSON logging (pino) with levels; do not log secrets, tokens, or full request bodies.
- Return typed/enveloped errors at API boundaries; never leak stack traces to clients in production.

## Security defaults

- Validate and sanitize all external input at the boundary.
- Pass user data as parameters (parameterized queries), never string-concatenated SQL/shell.
- Avoid `child_process.exec` with interpolated input — use `execFile`/`spawn` with an args array.
- Keep dependencies patched; run `npm audit` / IOC scanning in CI.

## Reference

See skill: `backend-patterns` for Express/Next API design, `typescript-patterns` for typing, and
`docker-patterns` / `deployment-patterns` for shipping the service.
