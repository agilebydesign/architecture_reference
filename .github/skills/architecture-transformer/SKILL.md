---
name: architecture-transformer
description: 'Transform arbitrary code into a target architecture pattern. Use when: refactoring code to follow a layered architecture; implementing new features into an existing architecture; generating domain/server/client/CLI layers from reference docs and example code. Input: example code structures + architecture reference documents. Output: transformed code verified by architecture scanners.'
argument-hint: 'Describe the code to transform and the target architecture'
---

# Architecture Transformer

Transform arbitrary code structures into a target architecture pattern, guided by architecture reference documents and verified by architecture scanners.

## Folder Structure

```
input/
├── target-architecture-reference-docs/         # Architecture reference .md files
│   ├── *.md                                    # Layer definitions, constraints, patterns
│   └── ...                                     # Testing architecture, conventions, etc.
├── examples/                                   # Working code that follows the target architecture
│   └── ...                                     # Reference implementations for each layer
└── additional-context/                         # Additional context (stories, configs, specs)
    └── ...                                     # Domain requirements, story files, etc.

output/
└── src/                                        # Transformed code following the architecture
    └── {concept}/
        ├── {concept}.ts
        ├── {concept}_server.ts
        ├── view/
        ├── adapters/
        └── ...
```

## Input

- **Architecture reference documents** (`input/target-architecture-reference-docs/`): Markdown files describing the target architecture layers, patterns, and constraints
- **Example code structures** (`input/examples/`): Existing source files or project folders that serve as implementation references showing the architecture already applied
- **Additional context** (`input/additional-context/`): Stories, configs, domain specs, or any other material the user provides to clarify requirements

## Output

- Transformed code (`output/`) that follows the target architecture pattern
- Scanner verification results confirming architectural compliance

## Procedure

### 1. Analyze the Architecture References

Read all provided architecture reference documents thoroughly. Extract:

- Layer definitions (domain, server domain, server view, client view, CLI adapters)
- Inheritance rules (server domain extends domain)
- File naming conventions (`{concept}.ts`, `{concept}_server.ts`, `{concept}_view.ts`, `{concept}_client.ts`, `{concept}_adapter.ts`)
- Forbidden imports per layer (domain must be pure TS — no DOM, no VS Code, no Node APIs)
- Required patterns per layer (interfaces, classes, `_load`/`_save` methods, `postMessage` handling)
- Test architecture (Template Method pattern via `registerTests()`, abstract `createCounter()`, layer-specific `assertTotal()`)

### 2. Analyze the Example Code

Read the example code structures. Identify:

- The domain concept(s) being implemented
- How each architecture layer is realized in the example
- The shared interface pattern (`ICounter` implemented by domain, server, view, client, CLI wrapper)
- How tests use the Template Method pattern across all layers

### 3. Plan the Transformation

Create a plan mapping the source code to the target architecture. For each domain concept, plan:

- `{concept}.ts` — Pure domain (interface + class, no side effects)
- `{concept}_server.ts` — Server domain (extends domain, adds `_load`/`_save` persistence)
- `view/{concept}_view.ts` — Server view (postMessage routing, uses server domain)
- `view/{concept}_client.ts` — Client view (shared domain + DOM only, syncs to server)
- `view/{Concept}.html` — Webview HTML template
- `adapters/{concept}_adapter.ts` — CLI output adapter interface
- `adapters/{concept}_tty.ts` — TTY output adapter
- `adapters/{concept}_json.ts` — JSON output adapter
- `adapters/{concept}_markdown.ts` — Markdown output adapter

And the corresponding test files:

- `test/{concept}/{concept}_test.ts` — Base test class with `registerTests()`
- `test/{concept}/{concept}.test.ts` — Domain + server domain tests
- `test/{concept}/{concept}_view.test.ts` — Server view tests
- `test/{concept}/{concept}_client.test.ts` — Client view tests
- `test/e2e/{concept}_webview.e2e.ts` — E2E webview tests

### 4. Implement Following These Rules

These rules have been refined through iterative testing. Follow them strictly:

1. **Don't modify source projects** — Recreate domains in the target project following the architecture patterns defined in the reference documents
2. **Convert non-TS logic to TypeScript** — The architecture uses TS/JS with shared domain logic between client, server side, and CLI
3. **Ensure all interfaces are fully implemented** — Every layer that claims to implement an interface must implement all members. Test adapters must correctly implement domain interfaces
4. **Ensure end-to-end tests exist** — E2E tests must test the same stories and scenarios as the server/CLI tests. E2E tests must use `registerTests()` from the base test class, not be manually written
5. **Avoid unnecessary mocking in tests** — Tests should have access to all domain classes. Only mock what is strictly necessary (e.g. VS Code APIs, DOM)
6. **Use given/when/then language in tests** — If a test statement starts with "When", it should have "Then" following the comma when necessary
7. **Verify output with architecture scanners** — Run the bundled scanners after implementation (see [Verification](#5-verify-with-scanners))
8. **Ensure all UI elements are added** — HTML files must include all DOM elements needed for the user flow of the given feature. Do not forget navigation, display, and interaction elements
9. **Run end-to-end tests to verify output** — Do not skip E2E test execution
10. **Client implements same domain interfaces as server** — The client can update itself before going to the server. The server side still uses its own domain interface and pushes to client. Both implement the same interfaces, so there should be no difference in domain logic

### 5. Verify with Scanners

After implementation, run the architecture scanners bundled in [./scanners/](./scanners/) to verify compliance.

#### Config Scanner (hardcoded rules)

```bash
python run_scanners.py --scanner config --code-folder src/{concept}
```

#### Markdown Scanner (parses architecture docs at runtime)

```bash
python run_scanners.py --scanner md --code-folder src/{concept} \
    --md docs/architecture-reference.md docs/testing-architecture.md
```

#### Both Scanners

```bash
python run_scanners.py --scanner both --code-folder src/{concept} \
    --md docs/architecture-reference.md docs/testing-architecture.md
```

The run script is at [./scanners/run_scanners.py](./scanners/run_scanners.py). Scanner source is in [./scanners/](./scanners/).

Fix any violations before considering the transformation complete.

### 6. Common Mistakes to Avoid

These mistakes were observed across multiple iterations. Watch for them explicitly:

| # | Mistake | Mitigation |
|---|---------|------------|
| 1 | Forgetting to add E2E tests | Rule 4 — E2E tests are mandatory and must use `registerTests()` |
| 2 | E2E tests only check the DOM, not logic | E2E tests must verify the logic of what is displayed, not just that DOM elements exist |
| 3 | Missing links between config and domain concepts | Domain relationships should be inferred from config, not require manual user actions to load them |
| 4 | Test adapters incorrectly implementing domain interfaces | Every adapter must implement the full interface — verify at compile time |
| 5 | Forgetting to check/run E2E tests after implementation | Always run E2E tests as a final verification step |
| 6 | Not adding UI elements for navigation or interaction | Review user flow and ensure every interaction has a corresponding DOM element |
| 7 | Inconsistent given/when/then language in tests | Audit all test files, not just the one being worked on |
| 8 | Interfaces that don't logically belong together | Interfaces should reflect real domain relationships, not arbitrary groupings |
| 9 | Unnecessary base classes or configs that don't inherit | If two related classes exist, they should have an inheritance or composition relationship — not be unrelated |
| 10 | Pushing logic from server to client that the client already handles | If client implements the domain interface, it already has the logic — don't duplicate server-to-client pushes |
| 11 | Initialization order bugs | Ensure all dependencies are assigned before calling methods that use them — don't invoke methods that depend on uninitialized members |
| 12 | Not running scanners to verify architectural compliance | Always run scanners as the final step |
