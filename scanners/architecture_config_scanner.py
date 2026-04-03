"""Scanner that verifies generated TypeScript/JS code follows a target architecture.

Uses hardcoded Python config defining architecture rules extracted from
architecture-reference.md and testing-architecture.md. Checks:
1. Domain orientation (purity, no forbidden imports)
2. Layer completeness (all required layers present with correct patterns)
3. Required files (per domain concept)

Accepts an arbitrary code folder path to scan via `code_folder` parameter.
Uses esprima AST to inspect TypeScript/JavaScript files.
"""

from typing import List, Dict, Any, Optional, Set, Tuple, TYPE_CHECKING
from pathlib import Path
import re
from scanners.base_scanner import BaseScanner, ScanFilesContext, FileScanContext
from scanners.violation import Violation

if TYPE_CHECKING:
    from scanners.rule import Rule


# --------------------------------------------------------------------------- #
#  Architecture configuration (hardcoded from architecture-reference.md)      #
# --------------------------------------------------------------------------- #

LAYER_DOMAIN = 'domain'
LAYER_SERVER_DOMAIN = 'server_domain'
LAYER_SERVER_VIEW = 'server_view'
LAYER_CLIENT_VIEW = 'client_view'
LAYER_CLI_ADAPTER = 'cli_adapter'

ARCHITECTURE_CONFIG: Dict[str, Any] = {
    'layers': {
        LAYER_DOMAIN: {
            'description': 'Pure TS — no DOM, no VS Code, no Node APIs, no persistence',
            'file_pattern': r'^(?P<concept>[a-z_]+)\.ts$',
            'forbidden_imports': [
                'fs', 'path', 'os', 'child_process', 'net', 'http', 'https',
                'vscode', 'document', 'window', 'HTMLElement',
                'localStorage', 'sessionStorage',
            ],
            'required_patterns': {
                'interface': r'export\s+interface\s+I(?P<name>\w+)',
                'class': r'export\s+class\s+(?P<name>\w+)',
            },
        },
        LAYER_SERVER_DOMAIN: {
            'description': 'Extends domain; adds persistence (_load, _save)',
            'file_pattern': r'^(?P<concept>[a-z_]+)_server\.ts$',
            'required_extends': True,
            'required_methods': ['_load', '_save'],
            'forbidden_imports': [
                'vscode', 'document', 'window', 'HTMLElement',
                'localStorage', 'sessionStorage',
            ],
        },
        LAYER_SERVER_VIEW: {
            'description': 'Handles postMessage routing; uses server domain',
            'file_pattern': r'^(?P<concept>[a-z_]+)_view\.ts$',
            'location': 'view',
            'required_patterns': {
                'postMessage': r'postMessage|onDidReceiveMessage|_onMessage',
            },
        },
        LAYER_CLIENT_VIEW: {
            'description': 'Domain + DOM only; imports from domain, not server',
            'file_pattern': r'^(?P<concept>[a-z_]+)_client\.ts$',
            'location': 'view',
            'forbidden_imports': [
                'fs', 'path', 'os', 'child_process', 'net', 'http', 'https',
                'vscode',
            ],
        },
        LAYER_CLI_ADAPTER: {
            'description': 'CLI output adapters implementing adapter interface',
            'file_pattern': r'^(?P<concept>[a-z_]+)_adapter\.ts$',
            'location': 'adapters',
            'required_patterns': {
                'interface': r'export\s+interface\s+I\w+OutputAdapter',
            },
        },
    },

    'cli_output_formats': ['tty', 'json', 'markdown'],

    'test_files': {
        'base_test': '{concept}_test.ts',
        'domain_test': '{concept}.test.ts',
        'server_view_test': '{concept}_view.test.ts',
        'client_view_test': '{concept}_client.test.ts',
    },

    'test_patterns': {
        'template_method': r'registerTests\s*\(',
        'abstract_create': r'(abstract\s+)?createCounter|create\w+\s*\(',
        'assert_hook': r'assert\w+\s*\(',
    },
}


# --------------------------------------------------------------------------- #
#  Scanner                                                                    #
# --------------------------------------------------------------------------- #

class ArchitectureConfigScanner(BaseScanner):
    """Verifies generated TS/JS code follows the target architecture using
    hardcoded Python configuration rules.

    Usage:
        scanner = ArchitectureConfigScanner(rule, code_folder='/path/to/src/counter')
        violations = scanner.scan_with_context(context)

    Or supply ``code_folder`` in the rule's extra config.
    """

    def __init__(self, rule: 'Rule', code_folder: Optional[str] = None):
        super().__init__(rule)
        self._code_folder: Optional[Path] = Path(code_folder) if code_folder else None
        self._concept_cache: Optional[List[str]] = None

    # ------------------------------------------------------------------ #
    #  Entry points                                                       #
    # ------------------------------------------------------------------ #

    def scan_with_context(self, context: 'ScanFilesContext') -> List[Dict[str, Any]]:
        self.story_graph = context.story_graph
        violations: List[Dict[str, Any]] = []

        code_folder = self._resolve_code_folder(context)
        if not code_folder or not code_folder.is_dir():
            return violations

        concepts = self._detect_concepts(code_folder)
        if not concepts:
            violations.append(self._make_violation(
                'No domain concepts detected. Expected at least one '
                '{concept}_server.ts in the code folder.',
                location=str(code_folder),
                severity='error',
            ))
            return violations

        for concept in concepts:
            violations.extend(self._check_required_files(code_folder, concept))
            violations.extend(self._check_domain_files(code_folder, concept))

        return violations

    def scan_file_with_context(self, context: 'FileScanContext') -> List[Dict[str, Any]]:
        """Per-file AST checks (called by the base class loop)."""
        if not context.exists:
            return []

        file_path = context.file_path
        suffix = file_path.suffix.lower()
        if suffix not in ('.ts', '.js', '.mjs', '.cjs'):
            return []

        parsed = self._parse_js_file(file_path)
        if not parsed:
            return []

        content, ast_dict, lines = parsed

        violations: List[Dict[str, Any]] = []
        layer = self._classify_file_layer(file_path)

        if layer == LAYER_DOMAIN:
            violations.extend(self._check_domain_purity(content, lines, file_path))
            violations.extend(self._check_domain_class_and_interface(content, lines, file_path))

        elif layer == LAYER_SERVER_DOMAIN:
            violations.extend(self._check_server_domain_extends(content, lines, file_path))
            violations.extend(self._check_server_domain_methods(content, lines, file_path))
            violations.extend(self._check_forbidden_imports(
                content, lines, file_path,
                ARCHITECTURE_CONFIG['layers'][LAYER_SERVER_DOMAIN]['forbidden_imports'],
            ))

        elif layer == LAYER_SERVER_VIEW:
            violations.extend(self._check_view_message_routing(content, lines, file_path))

        elif layer == LAYER_CLIENT_VIEW:
            violations.extend(self._check_forbidden_imports(
                content, lines, file_path,
                ARCHITECTURE_CONFIG['layers'][LAYER_CLIENT_VIEW]['forbidden_imports'],
            ))
            violations.extend(self._check_client_imports_domain_not_server(content, lines, file_path))

        elif layer == LAYER_CLI_ADAPTER:
            violations.extend(self._check_adapter_interface(content, lines, file_path))

        return violations

    # ------------------------------------------------------------------ #
    #  Concept detection                                                  #
    # ------------------------------------------------------------------ #

    def _resolve_code_folder(self, context: 'ScanFilesContext') -> Optional[Path]:
        if self._code_folder:
            return self._code_folder

        all_files = context.files.all_files if context.files else []
        if all_files:
            first = all_files[0]
            return first.parent

        return None

    def _detect_concepts(self, code_folder: Path) -> List[str]:
        if self._concept_cache is not None:
            return self._concept_cache

        concepts: List[str] = []
        server_pattern = re.compile(r'^([a-z_]+)_server\.ts$')

        for item in code_folder.iterdir():
            if item.is_file():
                m = server_pattern.match(item.name)
                if m:
                    concepts.append(m.group(1))

        self._concept_cache = concepts
        return concepts

    # ------------------------------------------------------------------ #
    #  Check 3 — Required files                                           #
    # ------------------------------------------------------------------ #

    def _check_required_files(self, code_folder: Path, concept: str) -> List[Dict[str, Any]]:
        violations: List[Dict[str, Any]] = []

        expected_src_files = {
            f'{concept}.ts': LAYER_DOMAIN,
            f'{concept}_server.ts': LAYER_SERVER_DOMAIN,
        }
        expected_view_files = {
            f'{concept}_view.ts': LAYER_SERVER_VIEW,
            f'{concept}_client.ts': LAYER_CLIENT_VIEW,
        }
        expected_adapter_files = {
            f'{concept}_adapter.ts': LAYER_CLI_ADAPTER,
        }
        for fmt in ARCHITECTURE_CONFIG['cli_output_formats']:
            expected_adapter_files[f'{concept}_{fmt}.ts'] = LAYER_CLI_ADAPTER

        # Source files in root
        for filename, layer in expected_src_files.items():
            fp = code_folder / filename
            if not fp.exists():
                violations.append(self._make_violation(
                    f'Missing required file "{filename}" for layer '
                    f'"{layer}" (concept: {concept}).',
                    location=str(code_folder),
                    severity='error',
                ))

        # View files
        view_dir = code_folder / 'view'
        for filename, layer in expected_view_files.items():
            fp = view_dir / filename
            if not fp.exists():
                violations.append(self._make_violation(
                    f'Missing required file "view/{filename}" for layer '
                    f'"{layer}" (concept: {concept}).',
                    location=str(view_dir),
                    severity='error',
                ))

        # Adapter files
        adapters_dir = code_folder / 'adapters'
        for filename, layer in expected_adapter_files.items():
            fp = adapters_dir / filename
            if not fp.exists():
                violations.append(self._make_violation(
                    f'Missing required file "adapters/{filename}" for layer '
                    f'"{layer}" (concept: {concept}).',
                    location=str(adapters_dir),
                    severity='error',
                ))

        # Test files
        violations.extend(self._check_test_files(code_folder, concept))

        return violations

    def _check_test_files(self, code_folder: Path, concept: str) -> List[Dict[str, Any]]:
        violations: List[Dict[str, Any]] = []

        test_dir = self._find_test_dir(code_folder, concept)
        if test_dir is None:
            violations.append(self._make_violation(
                f'No test directory found for concept "{concept}". '
                f'Expected test/{concept}/ relative to project root.',
                location=str(code_folder),
                severity='info',
            ))
            return violations

        for label, pattern in ARCHITECTURE_CONFIG['test_files'].items():
            filename = pattern.format(concept=concept)
            fp = test_dir / filename
            if not fp.exists():
                violations.append(self._make_violation(
                    f'Missing test file "{filename}" ({label}) for '
                    f'concept "{concept}".',
                    location=str(test_dir),
                    severity='info',
                ))

        return violations

    def _find_test_dir(self, code_folder: Path, concept: str) -> Optional[Path]:
        """Walk upward from code_folder to find test/{concept}/."""
        current = code_folder
        for _ in range(5):
            candidate = current / 'test' / concept
            if candidate.is_dir():
                return candidate
            parent = current.parent
            if parent == current:
                break
            current = parent
        return None

    # ------------------------------------------------------------------ #
    #  Check 1 — Domain orientation (AST / regex on content)              #
    # ------------------------------------------------------------------ #

    def _check_domain_files(self, code_folder: Path, concept: str) -> List[Dict[str, Any]]:
        """Run per-file AST checks for all files belonging to *concept*."""
        violations: List[Dict[str, Any]] = []
        ts_files = self._collect_concept_files(code_folder, concept)

        for fp in ts_files:
            parsed = self._parse_js_file(fp)
            if not parsed:
                continue
            content, ast_dict, lines = parsed
            layer = self._classify_file_layer(fp)

            if layer == LAYER_DOMAIN:
                violations.extend(self._check_domain_purity(content, lines, fp))
                violations.extend(self._check_domain_class_and_interface(content, lines, fp))
            elif layer == LAYER_SERVER_DOMAIN:
                violations.extend(self._check_server_domain_extends(content, lines, fp))
                violations.extend(self._check_server_domain_methods(content, lines, fp))
                violations.extend(self._check_forbidden_imports(
                    content, lines, fp,
                    ARCHITECTURE_CONFIG['layers'][LAYER_SERVER_DOMAIN]['forbidden_imports'],
                ))
            elif layer == LAYER_SERVER_VIEW:
                violations.extend(self._check_view_message_routing(content, lines, fp))
            elif layer == LAYER_CLIENT_VIEW:
                violations.extend(self._check_forbidden_imports(
                    content, lines, fp,
                    ARCHITECTURE_CONFIG['layers'][LAYER_CLIENT_VIEW]['forbidden_imports'],
                ))
                violations.extend(self._check_client_imports_domain_not_server(content, lines, fp))
            elif layer == LAYER_CLI_ADAPTER:
                violations.extend(self._check_adapter_interface(content, lines, fp))

        return violations

    def _collect_concept_files(self, code_folder: Path, concept: str) -> List[Path]:
        files: List[Path] = []
        patterns = [
            code_folder / f'{concept}.ts',
            code_folder / f'{concept}_server.ts',
            code_folder / 'view' / f'{concept}_view.ts',
            code_folder / 'view' / f'{concept}_client.ts',
            code_folder / 'adapters' / f'{concept}_adapter.ts',
        ]
        for fmt in ARCHITECTURE_CONFIG['cli_output_formats']:
            patterns.append(code_folder / 'adapters' / f'{concept}_{fmt}.ts')

        for fp in patterns:
            if fp.exists():
                files.append(fp)
        return files

    # -- Domain purity ------------------------------------------------- #

    def _check_domain_purity(
        self, content: str, lines: List[str], file_path: Path,
    ) -> List[Dict[str, Any]]:
        forbidden = ARCHITECTURE_CONFIG['layers'][LAYER_DOMAIN]['forbidden_imports']
        return self._check_forbidden_imports(content, lines, file_path, forbidden)

    def _check_forbidden_imports(
        self,
        content: str,
        lines: List[str],
        file_path: Path,
        forbidden: List[str],
    ) -> List[Dict[str, Any]]:
        violations: List[Dict[str, Any]] = []
        import_re = re.compile(
            r'''(?:import\s+.*?\s+from\s+['"]([^'"]+)['"]'''
            r'''|require\s*\(\s*['"]([^'"]+)['"]\s*\))''',
        )

        for line_num, line in enumerate(lines, start=1):
            m = import_re.search(line)
            if not m:
                continue
            module_path = m.group(1) or m.group(2)
            module_parts = set(module_path.replace('/', '.').replace('\\', '.').split('.'))
            module_lower = module_path.lower()

            for fb in forbidden:
                fb_lower = fb.lower()
                if fb_lower in module_parts or fb_lower == module_lower or module_lower.startswith(fb_lower):
                    violations.append(self._make_violation(
                        f'Forbidden import "{module_path}" in '
                        f'{self._classify_file_layer(file_path)} layer '
                        f'(forbidden: {fb}).',
                        location=str(file_path),
                        line_number=line_num,
                        severity='error',
                    ))
        return violations

    # -- Domain class & interface -------------------------------------- #

    def _check_domain_class_and_interface(
        self, content: str, lines: List[str], file_path: Path,
    ) -> List[Dict[str, Any]]:
        violations: List[Dict[str, Any]] = []
        cfg = ARCHITECTURE_CONFIG['layers'][LAYER_DOMAIN]['required_patterns']

        if not re.search(cfg['interface'], content):
            violations.append(self._make_violation(
                f'Domain file is missing an exported interface '
                f'(expected pattern: export interface I<Name>).',
                location=str(file_path),
                severity='warning',
            ))

        if not re.search(cfg['class'], content):
            violations.append(self._make_violation(
                f'Domain file is missing an exported class '
                f'(expected pattern: export class <Name>).',
                location=str(file_path),
                severity='warning',
            ))

        return violations

    # -- Server domain extends ----------------------------------------- #

    def _check_server_domain_extends(
        self, content: str, lines: List[str], file_path: Path,
    ) -> List[Dict[str, Any]]:
        violations: List[Dict[str, Any]] = []
        extends_re = re.compile(
            r'export\s+class\s+\w+Server\s+extends\s+\w+',
        )
        if not extends_re.search(content):
            violations.append(self._make_violation(
                f'Server domain class must extend the domain class '
                f'(expected: export class <Name>Server extends <Name>).',
                location=str(file_path),
                severity='error',
            ))
        return violations

    # -- Server domain _load / _save ----------------------------------- #

    def _check_server_domain_methods(
        self, content: str, lines: List[str], file_path: Path,
    ) -> List[Dict[str, Any]]:
        violations: List[Dict[str, Any]] = []
        for method in ARCHITECTURE_CONFIG['layers'][LAYER_SERVER_DOMAIN]['required_methods']:
            method_re = re.compile(
                rf'(?:async\s+)?(?:private\s+|protected\s+)?{re.escape(method)}\s*\(',
            )
            if not method_re.search(content):
                violations.append(self._make_violation(
                    f'Server domain is missing required method '
                    f'"{method}()".',
                    location=str(file_path),
                    severity='warning',
                ))
        return violations

    # ------------------------------------------------------------------ #
    #  Check 2 — Layer completeness                                       #
    # ------------------------------------------------------------------ #

    # -- Server view postMessage routing -------------------------------- #

    def _check_view_message_routing(
        self, content: str, lines: List[str], file_path: Path,
    ) -> List[Dict[str, Any]]:
        violations: List[Dict[str, Any]] = []
        pattern = ARCHITECTURE_CONFIG['layers'][LAYER_SERVER_VIEW]['required_patterns']['postMessage']
        if not re.search(pattern, content):
            violations.append(self._make_violation(
                f'Server view is missing postMessage / '
                f'onDidReceiveMessage handling.',
                location=str(file_path),
                severity='warning',
            ))
        return violations

    # -- Client imports domain, not server ----------------------------- #

    def _check_client_imports_domain_not_server(
        self, content: str, lines: List[str], file_path: Path,
    ) -> List[Dict[str, Any]]:
        violations: List[Dict[str, Any]] = []
        import_re = re.compile(
            r'''import\s+.*?\s+from\s+['"]([^'"]+)['"]''',
        )
        for line_num, line in enumerate(lines, start=1):
            m = import_re.search(line)
            if not m:
                continue
            module_path = m.group(1)
            if '_server' in module_path:
                violations.append(self._make_violation(
                    f'Client view imports from server domain '
                    f'("{module_path}"). Client should import from '
                    f'the shared domain layer only.',
                    location=str(file_path),
                    line_number=line_num,
                    severity='error',
                ))
        return violations

    # -- CLI adapter interface ----------------------------------------- #

    def _check_adapter_interface(
        self, content: str, lines: List[str], file_path: Path,
    ) -> List[Dict[str, Any]]:
        violations: List[Dict[str, Any]] = []
        if file_path.stem.endswith('_adapter'):
            pattern = ARCHITECTURE_CONFIG['layers'][LAYER_CLI_ADAPTER]['required_patterns']['interface']
            if not re.search(pattern, content):
                violations.append(self._make_violation(
                    f'CLI adapter file is missing an exported '
                    f'output adapter interface '
                    f'(expected: export interface I<Name>OutputAdapter).',
                    location=str(file_path),
                    severity='warning',
                ))
        return violations

    # ------------------------------------------------------------------ #
    #  File layer classification                                          #
    # ------------------------------------------------------------------ #

    def _classify_file_layer(self, file_path: Path) -> str:
        name = file_path.name
        parent_name = file_path.parent.name

        if parent_name == 'adapters':
            return LAYER_CLI_ADAPTER
        if parent_name == 'view':
            if '_client' in name:
                return LAYER_CLIENT_VIEW
            if '_view' in name:
                return LAYER_SERVER_VIEW
        if '_server' in name:
            return LAYER_SERVER_DOMAIN
        return LAYER_DOMAIN

    # ------------------------------------------------------------------ #
    #  Violation helper                                                   #
    # ------------------------------------------------------------------ #

    def _make_violation(
        self,
        message: str,
        location: Optional[str] = None,
        line_number: Optional[int] = None,
        severity: str = 'error',
    ) -> Dict[str, Any]:
        return Violation(
            rule=self.rule,
            violation_message=message,
            location=location,
            line_number=line_number,
            severity=severity,
        ).to_dict()
