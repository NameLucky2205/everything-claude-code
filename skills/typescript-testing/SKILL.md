---
name: typescript-testing
description: TypeScript testing patterns with Vitest and Jest — typed test doubles, async and timer control, contract tests at boundaries, and coverage. Follows TDD with idiomatic TypeScript practices.
origin: ECC
---

# TypeScript Testing Patterns

Testing TypeScript so the tests are as type-safe as the code. Prefer Vitest for new projects
(ESM-native, fast); Jest patterns are equivalent where noted. Follow TDD: red → green → refactor,
80%+ coverage on real behavior, not lines.

## When to Activate

- Writing or reviewing TypeScript tests
- Setting up Vitest/Jest for a TS project
- Diagnosing flaky, slow, or type-unsafe tests

## Structure: Arrange–Act–Assert, behavior-named

```ts
import { describe, it, expect } from "vitest";

describe("parsePrice", () => {
  it("returns cents as an integer for a dollar string", () => {
    // Arrange
    const input = "$12.34";
    // Act
    const cents = parsePrice(input);
    // Assert
    expect(cents).toBe(1234);
  });

  it("throws on a non-numeric string", () => {
    expect(() => parsePrice("free")).toThrow(/invalid price/i);
  });
});
```

Name tests by the behavior under test, not the function name: `"falls back to cache when the
API times out"` beats `"test getUser 2"`.

## Typed test doubles

Keep mocks type-checked so a signature change breaks the test, not production.

```ts
import { vi, type Mocked } from "vitest";

const repo: Mocked<UserRepo> = {
  findById: vi.fn(),
  save: vi.fn(),
};
repo.findById.mockResolvedValue({ id: "1", name: "A" }); // return type is checked
```

Prefer injecting a small interface over `vi.mock()` of a whole module — dependency injection
keeps the seam explicit and the double fully typed. Reserve module mocks for code you cannot
refactor to take its dependencies.

## Async and time

- Return or `await` every async assertion; a forgotten `await` makes a test pass that should fail.
- Use `await expect(promise).rejects.toThrow(...)` for async errors.
- Control time deterministically instead of sleeping:

```ts
vi.useFakeTimers();
const p = debounced();
vi.advanceTimersByTime(500);
await p;
vi.useRealTimers();
```

## Test at the boundary (contract tests)

Where typed code meets untyped data (HTTP, DB rows, JSON), assert the runtime shape, not just the
compile-time type — the compiler cannot see the wire.

```ts
it("rejects a payload missing required fields", () => {
  expect(() => UserSchema.parse({ id: "1" })).toThrow();
});
```

Mock the network at the HTTP layer (e.g. MSW) rather than stubbing your own fetch wrapper, so the
test exercises real serialization.

## Coverage that means something

```bash
vitest run --coverage        # v8 provider; set thresholds in vitest.config
```

Gate on branch coverage for logic-heavy modules; 100% line coverage with no assertions on the
important branches is a false signal. Cover the error and edge paths, not just the happy path.

## Anti-patterns to flag

- Untyped `any` mocks that silently drift from the real signature.
- Snapshot tests over large objects — they assert "unchanged", not "correct", and rot fast.
- Tests coupled to implementation detail (private call order) instead of observable behavior.
- Shared mutable state between tests; each test must set up and tear down its own world.

## Reference

See skill: `typescript-patterns` for the type design the tests verify, and `tdd-workflow` for
the red-green-refactor loop and coverage policy.
