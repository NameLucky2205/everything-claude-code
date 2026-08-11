---
name: typescript-patterns
description: Idiomatic TypeScript patterns, strict-mode type design, discriminated unions, async correctness, and error handling for building robust, maintainable TypeScript applications.
origin: ECC
---

# TypeScript Development Patterns

Idiomatic TypeScript for building robust, maintainable applications. Prefer the compiler as a
correctness tool: make illegal states unrepresentable, and let types carry the invariants.

## When to Activate

- Writing new TypeScript code
- Reviewing or refactoring TypeScript
- Designing library/module public types
- Tightening a loosely-typed (`any`-heavy) codebase

## Compiler configuration

Start from `strict: true`. Add the checks that catch real bugs the base strict set misses:

```jsonc
// tsconfig.json — compilerOptions
{
  "strict": true,
  "noUncheckedIndexedAccess": true,   // arr[i] is T | undefined, not T
  "exactOptionalPropertyTypes": true, // { a?: string } ≠ { a: string | undefined }
  "noImplicitOverride": true,
  "noFallthroughCasesInSwitch": true,
  "verbatimModuleSyntax": true
}
```

`noUncheckedIndexedAccess` is the single highest-value non-default: it turns silent
`undefined`-at-runtime bugs into compile errors.

## Make illegal states unrepresentable

Model data so the wrong combination cannot be constructed. Discriminated unions beat a bag of
optional booleans.

```ts
// Bad: 8 representable states, most invalid
interface Req { loading: boolean; data?: User; error?: Error }

// Good: exactly 3 valid states, exhaustively checkable
type Req =
  | { status: "idle" }
  | { status: "ok"; data: User }
  | { status: "error"; error: Error };

function render(r: Req) {
  switch (r.status) {
    case "idle":  return spinner();
    case "ok":    return view(r.data);      // r.data is narrowed, no ?.
    case "error": return banner(r.error);
    default:      return assertNever(r);     // compile error if a case is added
  }
}
const assertNever = (x: never): never => { throw new Error(`unreachable: ${JSON.stringify(x)}`); };
```

## Prefer `unknown` over `any`, and narrow at the boundary

`any` disables the compiler; `unknown` forces a check. Validate external data (API, JSON, env)
at the edge and keep the interior fully typed.

```ts
async function loadUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  const raw: unknown = await res.json();
  return UserSchema.parse(raw); // zod/valibot — throws on shape mismatch
}
```

Do not trust a cast (`as User`) on external data — a cast is a promise to the compiler, not a
check.

## Type-level building blocks

- `as const` for literal inference and readonly tuples: `const ROLES = ["admin","user"] as const`.
- Derive, don't duplicate: `type Role = typeof ROLES[number]`.
- `satisfies` to check a value against a type without widening it:
  `const config = {...} satisfies Config`.
- Use the utility types (`Pick`, `Omit`, `Partial`, `Readonly`, `Record`) instead of re-declaring shapes.

## Async correctness

- Type async functions as `Promise<T>`; never leave a floating promise — `await` it or explicitly
  `void` it.
- Run independent awaits concurrently with `Promise.all`; use `Promise.allSettled` when partial
  failure is acceptable.
- Reject with `Error` instances only, so `catch (e: unknown)` can `instanceof Error` narrow.

```ts
const [user, orders] = await Promise.all([loadUser(id), loadOrders(id)]);
```

## Error handling

- `catch` binds `unknown` (with `useUnknownInCatchVariables`, the strict default) — narrow before use.
- For expected failures, prefer a typed result over throwing:

```ts
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };
```

## Anti-patterns to flag in review

- `any`, unchecked `as`, and `@ts-ignore` (prefer `@ts-expect-error` with a reason).
- Enums for simple string sets — use `as const` unions (smaller output, structural).
- `Function`, `object`, `{}` as types — they mean almost nothing; be specific.
- Non-null assertion `!` on values that can genuinely be null at runtime.

## Reference

See skill: `typescript-testing` for test patterns, and `frontend-patterns` / `backend-patterns`
for framework-specific TypeScript guidance.
