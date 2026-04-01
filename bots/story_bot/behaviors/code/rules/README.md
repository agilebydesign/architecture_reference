# Clean Code Rules (JSON Format)

This directory contains clean code principles converted to JSON format, following the naming structure pattern used in story_bot behaviors.

## Structure

Each JSON rule file contains:
- **description**: Overview of the principle (marked CRITICAL for important rules)
- **examples**: Array with `do` and `dont` objects
  - **do.description**: What to do
  - **do.content**: Array of best practices and examples
  - **dont.description**: What not to do
  - **dont.content**: Array of anti-patterns and refactoring guidance

## Rules by Category

### 1. Functions (4 rules)
- `keep_functions_single_responsibility.json` - Functions should do one thing well
- `keep_functions_small_focused.json` - Keep functions under 20 lines
- `use_clear_function_parameters.json` - Prefer 0-2 parameters, use objects for more
- `simplify_control_flow.json` - Minimize nesting, use guard clauses

### 2. Naming (3 rules)
- `use_intention_revealing_names.json` - Names should answer "why does this exist?"
- `use_consistent_naming.json` - One word per concept across codebase
- `provide_meaningful_context.json` - Appropriate context without redundancy

### 3. Code Structure (3 rules)
- `eliminate_duplication.json` - DRY principle - single source of truth
- `separate_concerns.json` - Separate pure logic from side effects
- `maintain_abstraction_levels.json` - High-level concepts to details

### 4. Error Handling (3 rules)
- `use_exceptions_properly.json` - Exceptions for exceptional situations
- `isolate_error_handling.json` - Separate error handling from business logic
- `classify_exceptions_by_caller_needs.json` - Design exceptions for how they'll be handled

### 5. State Management (3 rules)
- `minimize_mutable_state.json` - Prefer immutable data structures
- `enforce_encapsulation.json` - Hide implementation, expose behavior
- `use_explicit_dependencies.json` - Constructor injection for dependencies

### 6. Classes and Objects (3 rules)
- `keep_classes_single_responsibility.json` - One reason to change
- `keep_classes_small_compact.json` - Under 200-300 lines, no dead code
- `follow_open_closed_principle.json` - Open for extension, closed for modification

### 7. Comments (3 rules)
- `prefer_code_over_comments.json` - Express intent in code first
- `write_good_comments.json` - Business rules, warnings, TODOs with context
- `remove_bad_comments.json` - Delete commented code and misleading comments

### 8. Formatting (3 rules)
- `enforce_team_formatting_consensus.json` - Automated formatters, team agreement
- `maintain_vertical_density.json` - Related code close together
- `use_consistent_indentation.json` - Consistent spaces/tabs, reasonable line length

### 9. Testing (3 rules)
- `maintain_test_quality.json` - FIRST principles (Fast, Independent, Repeatable, Self-validating, Timely)
- `test_one_concept_per_test.json` - Single behavior per test
- `practice_test_driven_development.json` - Red-Green-Refactor cycle

### 10. System Boundaries (2 rules)
- `isolate_third_party_code.json` - Wrap external APIs behind your interfaces
- `test_boundary_behavior.json` - Learning tests for third-party dependencies

### 11. Refactoring (2 rules)
- `refactor_tests_with_production_code.json` - Update tests immediately during refactoring
- `handle_backward_compatibility.json` - Provide migration paths for interface changes

## Total: 31 Rules

## Source Material

These rules were extracted from `clean-code-rule.mdc` which is based on Robert C. Martin's "Clean Code" principles, adapted for modern development practices.

## Usage

These JSON rules can be:
- Loaded by automated code quality tools
- Used by AI agents for code review and generation
- Referenced in CI/CD pipelines
- Integrated into development workflows

## Naming Convention

Files follow snake_case naming pattern:
- Verb-first for actions: `use_*`, `keep_*`, `maintain_*`, `enforce_*`
- Clear, descriptive names matching the principle
- Consistent with story_bot behavior naming structure

























