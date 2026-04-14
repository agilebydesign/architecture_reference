---
name: architecture-transformer-generic
description: 'Transform arbitrary code into a target architecture pattern. Use when: refactoring code to follow a layered architecture; implementing new features into an existing architecture; separating code into shared domain layers from reference docs and example code. Input: example code structures + architecture reference documents. Output: transformed code with shared domain logic across architectural layers, verified by scanners.'
argument-hint: 'Describe the code to transform and the target architecture'
---

# Architecture Transformer

Transform arbitrary code structures into a target architecture pattern, guided by architecture reference documents and verified by architecture scanners. The core principle is separating code into **shared domain layers** so that business logic is defined once and reused across all architectural layers (presentation, persistence, CLI, testing, etc.).

## Folder Structure

```
input/
├── architecture/       # Architecture reference documents
│   ├── *.md            # Layer definitions, constraints, patterns
│   └── ...             # Testing architecture, conventions, etc.
├── examples/           # Working code that already follows the target architecture
│   └── ...             # Reference implementations for each layer
└── context/            # Additional context (stories, configs, specs, source code to transform)
    └── ...             # Domain requirements, story files, existing code, etc.

output/
└── {concept}/          # One folder per domain concept, structured per the architecture
    └── ...             # Layers, adapters, views, tests as defined by the architecture
```

## Input

- **Architecture reference documents** (`input/architecture/`): Documents describing the target architecture — layer definitions, constraints, naming conventions, inheritance rules, and patterns
- **Example code structures** (`input/examples/`): Working implementations that already follow the target architecture, serving as concrete references for how each layer should be realized
- **Additional context** (`input/context/`): Source code to transform, stories, configs, domain specifications, or any other material clarifying requirements

## Output

- Transformed code (`output/`) organized into domain concepts, each following the target architecture's layer structure
- Verification results confirming architectural compliance

## Core Concepts

### Shared Domain Layers

The key architectural idea: **business logic is defined once in a pure domain layer, then extended or composed by other layers** (persistence, presentation, CLI, etc.). Each layer adds only its specific concerns:

| Concern | What the layer adds |
|---------|-------------------|
| **Domain** | Pure business logic — no I/O, no framework dependencies, no side effects |
| **Persistence layer** | Extends or wraps domain — adds load/save/storage |
| **Presentation layer(s)** | Extends or wraps domain — adds UI binding, message routing, rendering |
| **CLI / API layer** | Wraps domain — adds argument parsing, output formatting |
| **Test layers** | Each layer gets its own tests, but all share the same scenarios via a base test class |

### Shared Interface Contract

All layers for a given domain concept implement or extend the same interface. This means:

- Domain, persistence, presentation, CLI adapters, and test wrappers are **interchangeable** at the interface level
- Business logic never needs to be duplicated across layers
- Any layer can be tested with the same scenarios, differing only in setup and assertions

## Procedure

### 1. Analyze the Architecture References

Read all provided architecture reference documents. Extract:

- **Layer definitions**: What layers exist, what each layer is responsible for, what it is not allowed to do
- **Purity constraints**: Which layers must be free of specific dependencies (I/O, frameworks, DOM, etc.)
- **Inheritance/composition rules**: How layers relate (e.g. persistence extends domain, presentation composes domain)
- **File/module naming conventions**: How files and modules should be named per layer
- **Required patterns**: Interfaces, base classes, methods, or structural patterns each layer must include
- **Test architecture**: How tests are structured across layers (shared scenarios, base test classes, layer-specific assertions)

### 2. Analyze the Example Code

Read the example code structures that already follow the target architecture. Identify:

- The domain concept(s) implemented in the examples
- How each architecture layer is realized concretely (file names, class structure, imports)
- The shared interface pattern — one interface implemented across all layers
- How tests share scenarios across layers while varying setup and assertions

### 3. Plan the Transformation

Create a plan mapping the source code to the target architecture. For each domain concept:

1. **Identify the pure domain** — Extract business logic that has no dependencies on I/O, frameworks, or presentation
2. **Map to layers** — Determine which source code maps to which architectural layer, following the naming conventions and file structure from the architecture reference
3. **Design the shared interface** — Define the interface that all layers will implement or extend for this concept
4. **Plan the test structure** — Design a base test class with shared scenarios; plan layer-specific test subclasses that override setup and assertions
5. **Plan layer-specific additions** — For each non-domain layer, identify what it adds (persistence methods, UI binding, output formatting, etc.)

### 4. Implement Following These Rules

These rules have been refined through iterative testing. Follow them strictly:

1. **Don't modify source projects** — Implement in the target project following the architecture patterns defined in the reference documents
2. **Convert to the target language/framework if needed** — Match the language and tooling specified by the architecture reference. Shared domain logic should work across all layers
3. **Ensure all interfaces are fully implemented** — Every layer that claims to implement an interface must implement all members. Test adapters must correctly implement domain interfaces
4. **Ensure end-to-end tests exist and reuse shared scenarios** — E2E tests must test the same scenarios as other layer tests. E2E tests must use the base test class, not be manually written separately
5. **Avoid unnecessary mocking in tests** — Tests should have access to all domain classes. Only mock what is strictly necessary (framework APIs, external services)
6. **Use given/when/then language in tests** — If a test statement starts with "When", it should have "Then" following the comma when necessary
7. **Verify output with architecture scanners** — Run scanners after implementation if available (see [Verification](#5-verify-with-scanners))
8. **Ensure all presentation elements are added** — UI/view layers must include all elements needed for the user flow of the given feature. Do not forget navigation, display, and interaction elements
9. **Run end-to-end tests to verify output** — Do not skip E2E test execution
10. **All layers implement the same domain interfaces** — Presentation layers can use domain logic locally before syncing to the persistence layer. The persistence layer uses its own domain interface independently. Both sides implement the same interfaces, so there should be no difference in domain logic

### 5. Verify with Scanners

If architecture scanners are available, run them after implementation to verify compliance. Scanners can check:

- **Layer purity** — Domain layer has no forbidden imports
- **Structural completeness** — All required files, classes, interfaces, and methods exist per layer
- **Inheritance rules** — Persistence layer extends domain; presentation layers compose or extend correctly
- **Naming conventions** — Files and modules follow the architecture's naming patterns
- **Test coverage** — Required test files exist for each layer

Bundled scanners are in [./scanners/](./scanners/). See the [reference skill](../architecture-transformer/SKILL.md) for scanner invocation examples.

Fix any violations before considering the transformation complete.

### 6. Common Mistakes to Avoid

These mistakes were observed across multiple iterations of architecture transformations. Watch for them explicitly:

| # | Mistake | Mitigation |
|---|---------|------------|
| 1 | Forgetting to add E2E tests | Rule 4 — E2E tests are mandatory and must reuse the base test class scenarios |
| 2 | E2E tests only check presentation output, not logic | E2E tests must verify the logic of what is displayed, not just that elements exist |
| 3 | Missing links between config and domain concepts | Domain relationships should be inferred from config, not require manual user actions to load them |
| 4 | Test adapters incorrectly implementing domain interfaces | Every adapter must implement the full interface — verify at compile time |
| 5 | Forgetting to run E2E tests after implementation | Always run E2E tests as a final verification step |
| 6 | Not adding presentation elements for navigation or interaction | Review user flow and ensure every interaction has a corresponding element |
| 7 | Inconsistent given/when/then language in tests | Audit all test files, not just the one being worked on |
| 8 | Interfaces that don't logically belong together | Interfaces should reflect real domain relationships, not arbitrary groupings |
| 9 | Unnecessary base classes or configs that don't inherit | If two related classes exist, they should have an inheritance or composition relationship — not be unrelated |
| 10 | Duplicating logic across layers that share the same interface | If a layer implements the domain interface, it already has the logic — don't duplicate it from another layer |
| 11 | Initialization order bugs | Ensure all dependencies are assigned before calling methods that use them — don't invoke methods that depend on uninitialized members |
| 12 | Not running scanners to verify architectural compliance | Always run scanners as the final step |
