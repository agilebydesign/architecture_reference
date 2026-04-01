# pytest Given When Then Orchestrator Pattern - Test Rules

## Overview

These rules define how to write **story-based tests** using **pytest with orchestrator pattern** - NO FEATURE FILES. Tests read like stories using Given-When-Then structure.

### Core Philosophy

1. **Orchestrator Pattern**: Test methods show the flow; helper functions do the work
2. **Given-When-Then**: Clear story structure in every test
3. **Test-Driven Development**: RED-GREEN-REFACTOR cycle drives production code
4. **Clean Code**: Both tests AND production code follow clean code principles

## Quick Start

### Basic Test Structure

```python
# ============================================================================
# HELPER FUNCTIONS - Reusable operations (under 20 lines each)
# ============================================================================

def create_agent_with_config(name: str, workspace: Path) -> Agent:
    """Helper: Create agent with configuration."""
    agent = Agent(name=name, workspace_root=workspace)
    agent.initialize()
    return agent

# ============================================================================
# FIXTURES - Test setup
# ============================================================================

@pytest.fixture
def workspace_root(tmp_path):
    """Fixture: Temporary workspace directory."""
    workspace = tmp_path / "workspace"
    workspace.mkdir()
    return workspace

# ============================================================================
# ORCHESTRATOR TESTS - Readable test flows
# ============================================================================

class TestAgentInitialization:
    """Agent initialization scenarios."""
    
    def test_agent_initializes_with_config(self, workspace_root):
        """
        SCENARIO: Agent initializes with configuration
        GIVEN: Configuration file exists
        WHEN: Agent is initialized
        THEN: Agent is ready
        """
        # Given
        config = create_config_file(workspace_root, "story_bot")
        
        # When
        agent = create_agent_with_config("story_bot", workspace_root)
        
        # Then
        assert agent.is_initialized
        assert agent.config_path.exists()
```

## Rule Categories

### Test Structure Rules

1. **`pytest_bdd_orchestrator_pattern.json`** - MASTER RULE with complete example
2. **`test_file_and_class_naming.json`** - File per sub-epic (test_sub_epic_name.py), class per story (TestStoryName)
3. **`use_class_based_organization.json`** - Organize tests in classes with helpers
4. **`use_arrange_act_assert.json`** - Given-When-Then structure in every test
5. **`test_observable_behavior.json`** - Test behavior through public API

### Test Quality Rules (Core)

6. **`ubiquitous_language.json`** - Use SAME language in domain model, stories, AND code (DDD Ubiquitous Language)
7. **`self_documenting_tests.json`** - Tests are self-documenting through code (no verbose "TEST WILL FAIL" comments)
8. **`business_readable_test_names.json`** - Test names read like plain English stories (from BDD Rule 1)
9. **`consistent_vocabulary.json`** - One word per concept: create/verify/load (Clean Code 2.2)
10. **`use_descriptive_function_names.json`** - Intention-revealing names
11. **`match_specification_scenarios.json`** - Match specification scenarios exactly

### Test Implementation Rules

12. **`design_api_through_failing_tests.json`** - Write tests against real expected API before implementation (no dummies/placeholders)
13. **`call_production_code_directly.json`** - Call real code, let tests fail naturally (from BDD Rule 8.4)
14. **`cover_all_behavior_paths.json`** - Test normal, edge, and failure paths (from BDD Rule 3)
15. **`mock_only_boundaries.json`** - Mock external APIs only, not business logic (from BDD Rule 8.2)
16. **`use_real_implementations.json`** - Use real temp files, not mocks
17. **`helper_extraction_and_reuse.json`** - Extract duplicate setup to helpers/factories (from BDD Rules 8.3 & 4)
18. **`test_driven_development.json`** - RED-GREEN-REFACTOR cycle
19. **`object_oriented_test_helpers.json`** - Use shared helper objects (e.g., BotTestHelper test hopper) to build complete domain fixtures instead of spreading primitives across parametrize blocks
20. **`standard_test_data_sets.json`** - Reuse canonical test data sets instead of recreating ad-hoc values
21. **`assert_full_results.json`** - Assert full domain results/logs/state objects instead of cherry-picking single fields

### Production Code Rules

19. **`production_code_single_responsibility.json`** - Each function does ONE thing
20. **`production_code_explicit_dependencies.json`** - Constructor injection
21. **`production_code_small_functions.json`** - Functions under 20 lines

### Utility Rules

23. **`define_fixtures_in_test_file.json`** - Fixtures in test file, not conftest
24. **`use_ascii_only.json`** - ASCII characters only (Windows compatibility)
25. **`use_exact_variable_names.json`** - Use exact variable names from specification consistently

## Principles Mined from BDD & Clean Code Sources

These rules incorporate principles mined from:
- **BDD Rule (bdd-rule.mdc)**: Business-readable language, comprehensive coverage, observable behavior, API design (principles adapted for Given When Then story-based testing)
- **Clean Code (clean-code-rule.mdc)**: Consistent vocabulary, DRY, separation of concerns, meaningful names
- **Clean Code Python (clean-code-python-rule.mdc)**: Python-specific implementations

### Key Principles Applied (from source materials):

1. **Ubiquitous Language (DDD Core Principle)** → `ubiquitous_language.json`
2. **API Design Through Tests (TDD + BDD)** → `design_api_through_failing_tests.json`
3. **Business-Readable Language (from BDD Rule 1)** → `business_readable_test_names.json`
4. **Consistent Vocabulary (Clean Code 2.2)** → `consistent_vocabulary.json`
5. **Comprehensive Coverage (from BDD Rule 3)** → `cover_all_behavior_paths.json`
6. **Helper Extraction (from BDD Rules 8.3 & 4)** → `helper_extraction_and_reuse.json`
7. **Mock Only Boundaries (from BDD Rule 8.2)** → `mock_only_boundaries.json`
8. **Natural Test Failures (from BDD Rule 8.4)** → `call_production_code_directly.json`
9. **ASCII Only (from BDD Rule 10)** → `use_ascii_only.json`

## Key Principles

### 0. Test File and Class Naming (Organization)

**Test files are named after sub-epics. Test classes MUST be named EXACTLY after stories (not generic, not abbreviated). All stories in a sub-epic go in the same file.**

✅ **DO**: One file per sub-epic, one class per EXACT story name

**Story Hierarchy:**
```
Epic: Build Agile Bots
  Sub-epic: Generate Bot Server And Tools
    Story: Generate MCP Bot Server
    Story: Generate Tool Definitions  
    Story: Register Tools With Server
  Sub-epic: Invoke Behavior Actions
    Story: Route Tool Call To Behavior
    Story: Load Action Instructions
```

**Test Structure:**
```python
# File: test_generate_bot_server_and_tools.py
"""
Generate Bot Server And Tools Tests

Tests for all stories in 'Generate Bot Server And Tools' sub-epic:
- Generate MCP Bot Server
- Generate Tool Definitions
- Register Tools With Server
"""

# ============================================================================
# STORY: Generate MCP Bot Server
# ============================================================================

class TestGenerateMCPBotServer:
    """Story: Generate MCP Bot Server - Tests server generation."""
    
    def test_server_generates_with_configuration(self, workspace_root):
        # Test implementation
        pass

# ============================================================================
# STORY: Generate Tool Definitions
# ============================================================================

class TestGenerateToolDefinitions:
    """Story: Generate Tool Definitions - Tests tool generation."""
    
    def test_tools_generated_for_each_behavior(self, workspace_root):
        # Test implementation
        pass

# File: test_invoke_behavior_actions.py
class TestRouteToolCallToBehavior:
    # Tests for second sub-epic
    pass
```

❌ **DON'T**: One file per story or generic/abbreviated class names

```python
# DON'T: Too many files (one per story)
# File: test_generate_mcp_bot_server.py
# File: test_generate_tool_definitions.py  
# File: test_register_tools_with_server.py

# DON'T: Generic class names not matching exact story names
# Story: 'Inject Guardrails as Part of Clarify Requirements'
class TestGuardrailsInjection:  # WRONG: Generic topic name!
    pass

# Story: 'Inject Validation Rules for Validate Rules Action'
class TestValidationRules:  # WRONG: Abbreviated!
    pass

# Story: 'Inject Load Rendered Content Instructions'
class TestContentLoading:  # WRONG: Generic technical name!
    pass

# CORRECT should be:
class TestInjectGuardrailsAsPartOfClarifyRequirements:  # Exact story name!
class TestInjectValidationRulesForValidateRulesAction:  # Exact story name!
class TestInjectLoadRenderedContentInstructions:  # Exact story name!
```

**Naming Convention:**
- File: `test_sub_epic_name.py` (sub-epic in snake_case)
- Class: `TestStoryName` (story in PascalCase with Test prefix)
- Clear 1-to-1 mapping: Sub-epic → File, Story → Class

**Reference:** `test_file_and_class_naming.json`

### 0A. Ubiquitous Language - DDD Core Principle (CRITICAL)

**Use the SAME language in domain model, stories, acceptance criteria, scenarios, AND code.**

✅ **DO**: Use domain entities for classes, domain responsibilities for methods

```python
# Domain Model Entity: 'Gather Context Action'
# Domain Model Responsibility: 'Inject questions and evidence: Behavior, Guardrails, Key Questions, Evidence'

class GatherContextAction:
    def inject_questions_and_evidence(self) -> Instructions:
        """Inject questions and evidence into instructions."""
        pass
    
    def inject_gather_context_instructions(self) -> Instructions:
        """Inject gather context instructions."""
        pass

# Domain Model Entity: 'Planning Action'
# Domain Model Responsibility: 'Inject decision criteria and assumptions'

class PlanningAction:
    def inject_decision_criteria_and_assumptions(self) -> Instructions:
        """Inject decision criteria and assumptions into instructions."""
        pass

# Domain Model Entity: 'Validate Rules Action'
# Domain Model Responsibility: 'Inject behavior specific and Bot rules'

class ValidateRulesAction:
    def inject_behavior_specific_and_bot_rules(self) -> Instructions:
        """Inject behavior-specific and bot rules into instructions."""
        pass
    
    def inject_common_bot_rules(self) -> Instructions:
        """Inject common bot rules into instructions."""
        pass
```

❌ **DON'T**: Use generic technical terms not in domain

```python
# DON'T: Generic class names
class Action:  # Which action? Use GatherContextAction!
class Loader:  # Not in domain! Use specific action entity!
class Manager:  # Not in domain!
class Service:  # Not in domain!
class Handler:  # Not in domain!

# DON'T: Generic method names
def execute_with_guardrails():  # Domain says 'inject_questions_and_evidence'!
def execute_with_templates():  # Domain says 'inject_story_graph_template'!
def process():  # What does it process? Use domain verb!
def handle_request():  # 'handle' not in domain!
```

**Why This Matters:**
- **Same vocabulary** between business and technical teams
- **No translation** needed between domain model, stories, and code
- **Code reads like domain model** - business stakeholders can understand it
- **Traceability** from stories to domain model to code is obvious
- **Precision** - domain language is more specific than generic technical terms

**Sources for Names:**
- Classes → Domain entities/nouns (GatherContextAction, BotConfig, Guardrails)
- Methods → Domain responsibilities/verbs (inject, load, merge, route)
- Story nouns → Classes (MCP Server Generator, Tool Generator)
- Story steps → Methods (load_trigger_words_from_behavior_folder)

**Reference:** `ubiquitous_language.json`

### 1. Design API Through Failing Tests (CRITICAL)

**Write tests against the REAL expected API BEFORE implementing code. Tests MUST fail initially.**

✅ **DO**: Write test with complete real API, let it fail

```python
def test_project_initializes_with_agent_config(self, tmp_path):
    """Project initializes by loading agent configuration from file."""
    # Given: Real test workspace with config file
    project_path = tmp_path / 'projects' / 'test-project'
    project_path.mkdir(parents=True)
    
    agent_config_path = tmp_path / 'agents' / 'base' / 'agent.json'
    agent_config_path.parent.mkdir(parents=True)
    agent_config_path.write_text(json.dumps({
        'name': 'story_bot',
        'behaviors': ['shape', 'discovery']
    }))
    
    # When: Call REAL expected API (doesn't exist yet!)
    project = Project(
        project_path=project_path,
        agent_config_path=agent_config_path,
        workspace_root=tmp_path
    )
    project.initialize()
    
    # Then: Verify real behavior
    assert project.agent.name == 'story_bot'
    assert project.agent.behaviors == ['shape', 'discovery']
    assert project.is_initialized is True
    
    # TEST FAILS: AttributeError - Project doesn't have 'initialize' method
    # GOOD! Now we know the complete API design:
    # - Project.__init__(project_path, agent_config_path, workspace_root)
    # - Project.initialize() method
    # - Project.agent property
    # - Project.is_initialized property
    # - Agent.name and Agent.behaviors attributes
```

❌ **DON'T**: Use dummy variables or placeholders

```python
def test_project_initializes():
    # DON'T: Use placeholders that hide real API
    project = None  # Placeholder - hides real API!
    agent = None    # Placeholder - hides real API!
    
    # Test passes but reveals NOTHING about real API
    assert project is None  # USELESS!
    assert agent is None    # USELESS!
```

**Why This Matters:**
- Failing test reveals complete API design (parameters, config, dependencies, return types)
- Test serves as executable API documentation before implementation exists
- Real test data shows how production code will actually be used
- Validates that test is testing something real (not dummy values)
- Forces thinking about API usability before implementation
- Only mock I/O boundaries (file access, network) when explicitly necessary

**Reference:** `design_api_through_failing_tests.json`

### 1A. Self-Documenting Tests (Keep Tests Clean)

**Tests are self-documenting through code. Do NOT add verbose comments explaining what will fail or what API is needed.**

✅ **DO**: Let code document the API

```python
def test_generator_creates_server_for_test_bot(self, workspace_root):
    # Given: Bot config exists
    config_file = create_bot_config(workspace_root, 'test_bot', ['shape'])
    
    # When: Call REAL MCPServerGenerator API
    from agile_bot.bots.base_bot.src.mcp_server_generator import MCPServerGenerator
    generator = MCPServerGenerator(
        bot_name='test_bot',
        config_path=config_file,
        workspace_root=workspace_root
    )
    server_file = generator.generate_server()
    
    # Then: Server file created
    assert server_file.exists()
    assert server_file.name == 'test_bot_server.py'
```

**Code shows everything:**
- Import reveals `MCPServerGenerator` class is needed
- Constructor shows parameters: `bot_name`, `config_path`, `workspace_root`
- Method call shows `generate_server()` returns a `Path`
- Assertions show expected file properties

❌ **DON'T**: Add verbose "TEST WILL FAIL" comments

```python
    # Then: Server created
    assert server_file.exists()
    
    # DON'T: Redundant verbose comments
    # TEST WILL FAIL: ImportError or MCPServerGenerator doesn't exist yet
    # Shows API needs: MCPServerGenerator(bot_name, config_path, workspace_root)
    # Shows API needs: generator.generate_server() returns Path
    # WRONG: The code above already shows all of this!
```

**What to comment:**
- ✅ Complex business rules not obvious from code
- ✅ Why specific test approach was chosen
- ❌ That test will fail (obvious for unimplemented code)
- ❌ What classes/methods are needed (imports show this)
- ❌ What parameters constructors take (constructor shows this)
- ❌ What methods return (assertions show this)

**Reference:** `self_documenting_tests.json`

### 2. Orchestrator Pattern

✅ **DO**: Test methods orchestrate, helpers execute

```python
def test_agent_loads_config(self, workspace_root):
    # Given
    config_file = create_config_file(workspace_root, "bot")
    
    # When
    agent = create_agent_with_config("bot", workspace_root)
    
    # Then
    verify_agent_configured(agent, "bot")
```

❌ **DON'T**: Monolithic tests with inline logic

```python
def test_agent(self, tmp_path):
    # DON'T: Everything inline
    workspace = tmp_path / "workspace"
    workspace.mkdir()
    config_dir = workspace / "agents" / "base"
    config_dir.mkdir(parents=True)
    config_file = config_dir / "agent.json"
    config_file.write_text('{"name": "bot"}')
    agent = Agent("bot", workspace)
    # ... 30 more lines ...
```

### 3. Small Functions

✅ **DO**: Keep everything under 20 lines

- Test methods: under 20 lines
- Helper functions: under 20 lines  
- Production methods: under 20 lines
- Test classes: under 300 lines

### 4. Test Observable Behavior

✅ **DO**: Test through public API

```python
# Test public API
assert agent.is_initialized
assert agent.get_config_value("name") == "bot"
assert agent.has_domain_graph
```

❌ **DON'T**: Test private implementation

```python
# DON'T: Test private details
assert agent._initialized == True
assert agent._setup_called == True
assert len(agent._internal_steps) == 5
```

### 5. Explicit Dependencies

✅ **DO**: Constructor injection

```python
class Agent:
    def __init__(
        self,
        agent_name: str,
        workspace_root: Path,
        config_loader: ConfigLoader,  # Injected
        domain_graph: DomainGraph     # Injected
    ):
        self.name = agent_name
        self.workspace_root = workspace_root
        self._config_loader = config_loader
        self._domain_graph = domain_graph
```

❌ **DON'T**: Hidden dependencies

```python
class Agent:
    def __init__(self, agent_name: str):
        self.name = agent_name
        # WRONG: Creates dependencies internally
        self._loader = ConfigLoader()
        self._graph = DomainGraph.get_instance()
```

### 5. Single Responsibility

✅ **DO**: Each method does ONE thing

```python
def load_config(self, path: Path) -> dict:
    """Load configuration from file."""
    return json.loads(path.read_text())

def validate_config(self, config: dict) -> bool:
    """Validate configuration structure."""
    return all(key in config for key in ['name', 'workspace'])

def initialize_from_config(self, path: Path):
    """Initialize from configuration file."""
    config = self.load_config(path)
    if not self.validate_config(config):
        raise ValueError("Invalid config")
    self._apply_config(config)
```

❌ **DON'T**: Methods that do multiple things

```python
def setup(self, path: Path):
    # WRONG: Loads, validates, initializes, AND logs
    config = json.loads(path.read_text())
    if 'name' not in config:
        raise ValueError("Invalid")
    self.name = config['name']
    logger.info(f"Initialized {self.name}")
    self._send_metrics()
```

### 6. Test-Driven Development

✅ **DO**: RED-GREEN-REFACTOR cycle

```python
# RED: Write failing test first
def test_agent_loads_config(self, tmp_path):
    config_file = tmp_path / "config.json"
    config_file.write_text('{"name": "bot"}')
    agent = Agent()
    config = agent.load_config(config_file)  # Doesn't exist yet!
    assert config["name"] == "bot"

# GREEN: Implement minimal code
class Agent:
    def load_config(self, path: Path) -> dict:
        return json.loads(path.read_text())

# REFACTOR: Improve while tests stay green
class Agent:
    def load_config(self, path: Path) -> dict:
        self._validate_file_exists(path)
        return self._parse_json(path)
```

## File Organization

```
tests/
├── test_agent_initialization.py      # Agent initialization tests
├── test_agent_configuration.py       # Configuration tests
└── test_domain_graph_loading.py      # Domain graph tests

Each test file contains:
1. Docstring explaining test suite
2. Helper functions section
3. Fixtures section
4. Test classes (organized by feature)
```

## Example Test File Template

```python
"""
Agent Configuration Tests

Tests agent configuration loading and validation behavior.
Uses orchestrator pattern with Given-When-Then structure.
"""
import pytest
from pathlib import Path

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def create_config_file(workspace: Path, name: str) -> Path:
    """Helper: Create configuration file."""
    config_dir = workspace / "agents" / "base"
    config_dir.mkdir(parents=True, exist_ok=True)
    config_file = config_dir / "agent.json"
    config_file.write_text(f'{{"name": "{name}"}}')
    return config_file

# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture
def workspace_root(tmp_path):
    """Fixture: Temporary workspace."""
    workspace = tmp_path / "workspace"
    workspace.mkdir()
    return workspace

# ============================================================================
# TESTS
# ============================================================================

class TestAgentConfiguration:
    """Agent configuration behavior tests."""
    
    def test_agent_loads_config_when_file_exists(self, workspace_root):
        """
        SCENARIO: Agent loads configuration when file exists
        GIVEN: Configuration file exists
        WHEN: Agent is initialized
        THEN: Agent loads configuration
        """
        # Given
        config_file = create_config_file(workspace_root, "story_bot")
        
        # When
        agent = Agent(agent_name="story_bot", workspace_root=workspace_root)
        agent.initialize()
        
        # Then
        assert agent.is_initialized
        assert agent.config_path == config_file
```

## Integration with Clean Code Rules

These test rules work alongside clean code rules from `/agile_bot/bots/clean_code_bot/rules/clean-code-rule.mdc`:

- **Functions**: Single responsibility, small (under 20 lines), clear parameters
- **Naming**: Intention-revealing, consistent, meaningful context
- **Error Handling**: Exceptions properly used, isolated from logic
- **State Management**: Minimize mutable state, encapsulation, explicit dependencies
- **Classes**: Single responsibility, small (under 300 lines), open/closed principle

## Running Tests

```bash
# Run all tests
pytest tests/

# Run with verbose output
pytest tests/ -v

# Run specific test file
pytest tests/test_agent_configuration.py

# Run specific test class
pytest tests/test_agent_configuration.py::TestAgentConfiguration

# Run specific test
pytest tests/test_agent_configuration.py::TestAgentConfiguration::test_agent_loads_config
```

## Benefits of This Approach

1. ✅ **Readable**: Test flow is clear and linear (BDD business-readable principle)
2. ✅ **Maintainable**: Changes to helpers don't break all tests (DRY principle)
3. ✅ **Fast to write**: Reuse helpers across tests (helper extraction)
4. ✅ **Easy to debug**: Step through orchestrator, inspect helpers
5. ✅ **No feature files**: No disconnected step definitions
6. ✅ **Full pytest power**: Fixtures, parametrize, plugins all available
7. ✅ **Drives design**: Tests drive clean production code design (TDD + API design principles)
8. ✅ **Comprehensive**: Covers normal, edge, and failure paths (BDD coverage principle)
9. ✅ **Observable**: Tests verify public API behavior only (BDD observable behavior)
10. ✅ **Consistent**: Single vocabulary across all tests (Clean Code consistency)

## Summary

- **NO FEATURE FILES** - Everything in Python
- **Orchestrator pattern** - Test shows flow, helpers do work
- **Given-When-Then** - Clear BDD structure with comments
- **Small functions** - Everything under 20 lines
- **Test behavior** - Public API, not implementation
- **Real implementations** - Use temp files, not mocks
- **Explicit dependencies** - Constructor injection
- **TDD cycle** - RED-GREEN-REFACTOR drives development

