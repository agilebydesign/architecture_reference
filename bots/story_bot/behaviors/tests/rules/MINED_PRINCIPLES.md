# Principles Mined from BDD & Clean Code Sources

This document shows how principles were extracted from BDD and Clean Code rulesets and adapted for pytest Given When Then story-based testing (orchestrator pattern).

## Source Rules

- **`agile_bot/bots/bdd_bot/rules/bdd-rule.mdc`** - Framework-agnostic BDD testing practices (800 lines) - principles adapted for story-based testing
- **`agile_bot/bots/clean_code_bot/rules/clean-code-rule.mdc`** - Universal clean code principles (458 lines)
- **`agile_bot/bots/clean_code_bot/rules/specializations/python/clean-code-python-rule.mdc`** - Python-specific patterns (778 lines)

## Mining Results: 8 New Rules + 5 Enhanced Rules

### NEW RULES CREATED

#### 1. `business_readable_test_names.json`
**Source:** BDD Rule 1 (Business Readable Language)

**Key Principles Extracted:**
- Use domain language stakeholders understand
- Test names read naturally when spoken aloud
- Describe WHAT happens (behavior), not HOW (implementation)
- Use "when" for conditions in test names

**Examples:**
```python
# ✅ Mined principle applied
def test_agent_loads_configuration_when_file_exists(self):
    """Agent loads configuration when file exists."""

# ❌ Violates principle
def test_agent_constructor_calls_load_method(self):
    """Technical jargon and implementation details."""
```

---

#### 2. `consistent_vocabulary.json`
**Source:** Clean Code 2.2 (Consistency) + BDD Rule 1

**Key Principles Extracted:**
- Use ONE word per concept across entire codebase
- Pick consistent vocabulary: create (not build/make), verify (not check/assert), load (not fetch/get)
- Document vocabulary choices in test file

**Examples:**
```python
# ✅ Consistent vocabulary
def create_agent(...): ...
def create_config(...): ...
def verify_agent_initialized(...): ...
def verify_config_valid(...): ...

# ❌ Mixed vocabulary
def create_agent(...): ...
def build_config(...):  # WRONG - use create_config
def check_agent(...):  # WRONG - use verify_agent
```

---

#### 3. `cover_all_behavior_paths.json`
**Source:** BDD Rule 3 (Comprehensive and Brief Coverage)

**Key Principles Extracted:**
- Test normal (happy path), edge cases, and failure scenarios
- Each distinct behavior needs its own focused test
- Tests must be independent (can run in any order)
- Tests must be deterministic and repeatable

**Examples:**
```python
# ✅ Covers all paths
def test_loads_valid_configuration(self):  # Normal path
def test_loads_empty_configuration(self):  # Edge case
def test_raises_error_when_config_missing(self):  # Failure path

# ❌ Only happy path
def test_loads_config(self):  # Missing edge and failure cases
```

---

#### 4. `mock_only_boundaries.json`
**Source:** BDD Rule 8.2 (Proper Mocking)

**Key Principles Extracted:**
- Mock ONLY external dependencies: APIs, network, uncontrollable services
- DON'T mock: Internal business logic, classes under test, file operations
- Use real temp files instead of mocking file I/O
- Extract mock setup to fixtures when repeated

**Examples:**
```python
# ✅ Mock external API
with patch('requests.get') as mock_get:  # External boundary
    agent = Agent.from_remote_config('http://api.com')

# ❌ Mock business logic
with patch.object(Agent, 'validate_config'):  # Internal logic
    # Defeats purpose of test!
```

---
```python
# ✅ Automatic initialization
class Agent:
    def __init__(self, name: str, workspace: Path):
        self._config = self._load_config()  # Automatic!
        self._initialized = True  # Ready immediately!

# ❌ Manual initialization
class Agent:
    def __init__(self, name: str):
        self._config = None  # Not initialized
    
    def load_config(self):  # Must call manually
        self._config = ...
```

---

#### 6. `helper_extraction_and_reuse.json`
**Source:** BDD Rule 8.3 (Helper Extraction) + BDD Rule 4 (Balance Context Sharing)

**Key Principles Extracted:**
- Extract duplicate test setup to reusable helper functions
- Create factory functions for test data creation
- Use fixtures for shared setup across tests
- Balance shared context with test-specific setup
- Group related helpers by purpose (create/verify/build)
- Keep test bodies focused on specific behavior

**Examples:**
```python
# ✅ Extract to helpers
def create_agent_with_config(name, workspace, config):
    agent = Agent(name, workspace)
    agent.set_config(config)
    return agent

# Tests reuse helper - no duplication
def test_scenario_1(self, workspace):
    agent = create_agent_with_config('bot', workspace, {...})

def test_scenario_2(self, workspace):
    agent = create_agent_with_config('bot', workspace, {...})

# ❌ Duplicate setup in every test
def test_scenario_1(self):
    agent = Agent('bot', workspace)
    agent.set_config({...})  # Duplicated

def test_scenario_2(self):
    agent = Agent('bot', workspace)  
    agent.set_config({...})  # Duplicated again
```

---

### ENHANCED EXISTING RULES

#### 7. `call_production_code_directly.json` (ENHANCED)
**Added from:** BDD Rule 8.4 (Natural Test Failures)

**New Principles Added:**
- Call production code directly - let tests fail with clear errors
- Don't comment out production code calls
- AttributeError/NameError shows what to implement next
- Tests drive code through RED-GREEN-REFACTOR

---

#### 8. `use_real_implementations.json` (ENHANCED)
**Added from:** BDD Rule 8.2 (Proper Mocking)

**New Principles Added:**
- Use pytest `tmp_path` fixture for real temp files
- Only mock truly external dependencies (network, APIs)
- Create real files in tests, not mocks
- Use fixtures for real test data

---

#### 9. `test_observable_behavior.json` (ENHANCED)
**Added from:** BDD Rule 11.7 (Test Observable Behavior)

**New Principles Added:**
- Test from user perspective
- Verify public API, not private state
- Tests make refactoring safe
- Don't assert on internal data structures

---

#### 10. `use_arrange_act_assert.json` (ENHANCED)
**Added from:** BDD Rule 8.1 (Arrange-Act-Assert Structure)

**New Principles Added:**
- Clear Given-When-Then sections with comments
- Keep each section under 5 lines
- Extract complex setup to helpers
- Balance shared context with test-specific setup

---

#### 11. `use_exact_variable_names.json` (ENHANCED)
**Updated for pytest context**

**Changes:**
- Removed feature file Examples table references
- Updated to match specification scenarios in pytest
- Added consistency across test and production code examples

---

## Mapping: BDD/Clean Code Rules → pytest Rules

| Source Rule | Destination Rule | Key Concepts |
|-------------|------------------|--------------|
| BDD Rule 1 | `business_readable_test_names.json` | Domain language, natural sentences |
| BDD Rule 3 | `cover_all_behavior_paths.json` | Normal/edge/failure paths, independence |
| BDD Rule 8.1 | `use_arrange_act_assert.json` | Given-When-Then structure |
| BDD Rule 8.2 | `mock_only_boundaries.json` | Mock boundaries only |
| BDD Rule 8.3 | `helper_extraction_and_reuse.json` | Helper extraction, factory functions |
| BDD Rule 4 | `helper_extraction_and_reuse.json` | Balance shared/local context |
| BDD Rule 8.4 | `call_production_code_directly.json` | Natural test failures |
| BDD Rule 10 | `use_ascii_only.json` | ASCII only (Windows) |
| BDD Rule 11.7 | `test_observable_behavior.json` | Observable behavior |
| Clean Code 2.2 | `consistent_vocabulary.json` | One word per concept |
| Clean Code 2.3 | `production_code_small_functions.json` | Magic numbers to constants |
| Clean Code 3.1 | Helper pattern | DRY principle |
| Clean Code 3.2 | `production_code_single_responsibility.json` | Separate logic from side effects |
| Clean Code 3.3 | Orchestrator pattern | Abstraction levels |

## Top 10 Mined Principles (Quick Reference)

1. **Business-Readable Test Names** - Domain language, reads naturally aloud
2. **Consistent Vocabulary** - One word per concept (create/verify/load)
3. **Cover All Paths** - Normal, edge, failure scenarios
4. **Mock Only Boundaries** - External APIs only, not business logic
5. **Automatic Initialization** - Objects ready immediately after construction
6. **Ask Don't Tell** - Objects manage their own state
7. **Test Observable Behavior** - Public API only, no private state
8. **Natural Test Failures** - Call real code, let it fail clearly
9. **Independent Tests** - No execution order dependencies
10. **Properties Over Methods** - Properties for state, methods for actions

## Benefits of Mined Principles

### Before Mining
- Generic "write good tests" guidance
- No specific vocabulary conventions
- Unclear when to mock
- No API design guidance for production code
- Missing coverage requirements

### After Mining
- ✅ **Specific actionable rules** from proven BDD/Clean Code practices
- ✅ **Consistent vocabulary** documented and enforced
- ✅ **Clear mocking boundaries** - when and what to mock
- ✅ **API design principles** for production code
- ✅ **Comprehensive coverage** requirements (normal/edge/failure)
- ✅ **Business-readable language** in all test names
- ✅ **Observable behavior focus** through public API

## Integration Complete

All 7 new rules + 5 enhanced rules are now part of the pytest orchestrator pattern ruleset in:

```
agile_bot/bots/story_bot/behaviors/8_specification_tests/rules/
```

Total: **21 rules** covering every aspect of pytest orchestrator pattern testing with BDD and Clean Code principles fully integrated.

## See Also

- **`README.md`** - Complete guide to all rules with examples
- **`pytest_bdd_orchestrator_pattern.json`** - Master rule with complete example
- **BDD source**: `agile_bot/bots/bdd_bot/rules/bdd-rule.mdc`
- **Clean Code source**: `agile_bot/bots/clean_code_bot/rules/clean-code-rule.mdc`

