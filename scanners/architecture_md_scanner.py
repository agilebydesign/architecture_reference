"""Scanner that verifies generated TypeScript/JS code follows a target architecture
by dynamically parsing .md architecture documentation at runtime.

Parses architecture-reference.md and testing-architecture.md (or any supplied .md
files) to extract:
1. Layer definitions and their constraints (purity, inheritance, required methods)
2. File naming conventions per layer
3. Required class/interface patterns
4. Test structure expectations

Accepts an arbitrary code folder path to scan.  Uses esprima AST to inspect
TypeScript/JavaScript files.
"""

from typing import List, Dict, Any, Optional, Set, Tuple, TYPE_CHECKING
from pathlib import Path
import re
from scanners.base_scanner import BaseScanner, ScanFilesContext, FileScanContext
from scanners.violation import Violation

if TYPE_CHECKING:
    from scanners.rule import Rule


# --------------------------------------------------------------------------- #
#  Parsed architecture model                                                  #
# --------------------------------------------------------------------------- #

class ArchitectureLayer:
    """A single architecture layer extracted from markdown documentation."""

    def __init__(self, name: str, description: str = ''):
        self.name = name
        self.description = description
        self.file_suffix: Optional[str] = None
        self.location: Optional[str] = None          # subdirectory (e.g. 'view', 'adapters')
        self.extends_layer: Optional[str] = None      # name of parent layer
        self.forbidden_imports: List[str] = []
        self.required_methods: List[str] = []
        self.required_patterns: Dict[str, str] = {}   # label → regex
        self.is_pure: bool = False


class ParsedArchitecture:
    """Full architecture model parsed from one or more .md files."""

    def __init__(self):
        self.layers: Dict[str, ArchitectureLayer] = {}
        self.cli_output_formats: List[str] = []
        self.test_files: Dict[str, str] = {}           # label → filename pattern
        self.test_patterns: Dict[str, str] = {}         # label → regex
        self.inheritance_rules: List[Tuple[str, str]] = []  # (child_pattern, parent_pattern)
        self.file_patterns: Dict[str, str] = {}         # layer_name → filename regex


# --------------------------------------------------------------------------- #
#  Markdown parser                                                            #
# --------------------------------------------------------------------------- #

class ArchitectureMdParser:
    """Extracts architecture rules from markdown documentation."""

    def parse(self, md_paths: List[Path]) -> ParsedArchitecture:
        arch = ParsedArchitecture()
        for md_path in md_paths:
            if not md_path.exists():
                continue
            content = md_path.read_text(encoding='utf-8')
            self._parse_content(content, arch)
        self._apply_defaults(arch)
        return arch

    # -- top-level dispatch -------------------------------------------- #

    def _parse_content(self, content: str, arch: ParsedArchitecture) -> None:
        self._parse_layers_from_tables(content, arch)
        self._parse_layers_from_diagram(content, arch)
        self._parse_forbidden_imports(content, arch)
        self._parse_inheritance_rules(content, arch)
        self._parse_required_methods(content, arch)
        self._parse_file_patterns(content, arch)
        self._parse_cli_output_formats(content, arch)
        self._parse_test_files(content, arch)
        self._parse_test_patterns(content, arch)

    # -- layer extraction from principle tables ------------------------ #

    def _parse_layers_from_tables(self, content: str, arch: ParsedArchitecture) -> None:
        table_row_re = re.compile(
            r'\|\s*\*\*([^*]+)\*\*\s*\|\s*(.+?)\s*\|',
        )
        layer_keywords = {
            'domain': ('domain', None),
            'server domain': ('server_domain', None),
            'server view': ('server_view', 'view'),
            'client': ('client_view', 'view'),
            'cli': ('cli_adapter', 'adapters'),
        }
        for m in table_row_re.finditer(content):
            principle = m.group(1).strip().lower()
            meaning = m.group(2).strip()

            for keyword, (layer_name, location) in layer_keywords.items():
                if keyword in principle:
                    if layer_name not in arch.layers:
                        layer = ArchitectureLayer(layer_name, meaning)
                        layer.location = location
                        arch.layers[layer_name] = layer
                    else:
                        if not arch.layers[layer_name].description:
                            arch.layers[layer_name].description = meaning
                    break

    # -- layer extraction from ASCII diagrams -------------------------- #

    def _parse_layers_from_diagram(self, content: str, arch: ParsedArchitecture) -> None:
        diagram_labels = {
            'SERVER VIEW': 'server_view',
            'CLIENT': 'client_view',
            'CLI': 'cli_adapter',
            'SERVER DOMAIN': 'server_domain',
            'DOMAIN': 'domain',
        }
        for label, layer_name in diagram_labels.items():
            if label in content and layer_name not in arch.layers:
                arch.layers[layer_name] = ArchitectureLayer(layer_name)

    # -- forbidden imports --------------------------------------------- #

    def _parse_forbidden_imports(self, content: str, arch: ParsedArchitecture) -> None:
        purity_pattern = re.compile(
            r'(?:Pure\s+TS|no\s+DOM|no\s+VS\s*Code|no\s+Node\s+APIs?|no\s+persistence)',
            re.IGNORECASE,
        )
        no_pattern = re.compile(r'no\s+([\w\s,/]+?)(?:\.|;|\||\n)', re.IGNORECASE)

        for m in purity_pattern.finditer(content):
            start = max(0, m.start() - 200)
            region = content[start:m.end() + 200]

            for nm in no_pattern.finditer(region):
                items = [x.strip().lower() for x in re.split(r'[,/]', nm.group(1)) if x.strip()]
                forbidden_map = {
                    'dom': ['document', 'window', 'HTMLElement', 'localStorage', 'sessionStorage'],
                    'vs code': ['vscode'],
                    'vscode': ['vscode'],
                    'node apis': ['fs', 'path', 'os', 'child_process', 'net', 'http', 'https'],
                    'node': ['fs', 'path', 'os', 'child_process'],
                    'persistence': ['fs'],
                }
                for item in items:
                    if item in forbidden_map:
                        if 'domain' in arch.layers:
                            arch.layers['domain'].forbidden_imports.extend(forbidden_map[item])
                            arch.layers['domain'].is_pure = True

        # Server domain: allow Node APIs but not DOM/vscode
        if 'server_domain' in arch.layers:
            arch.layers['server_domain'].forbidden_imports.extend(
                ['vscode', 'document', 'window', 'HTMLElement',
                 'localStorage', 'sessionStorage']
            )
        # Client view: no Node APIs, no vscode
        if 'client_view' in arch.layers:
            arch.layers['client_view'].forbidden_imports.extend(
                ['fs', 'path', 'os', 'child_process', 'net',
                 'http', 'https', 'vscode']
            )

    # -- inheritance rules --------------------------------------------- #

    def _parse_inheritance_rules(self, content: str, arch: ParsedArchitecture) -> None:
        extends_re = re.compile(
            r'(\w+Server)\s+extends\s+(\w+)',
        )
        for m in extends_re.finditer(content):
            child, parent = m.group(1), m.group(2)
            pair = (child, parent)
            if pair not in arch.inheritance_rules:
                arch.inheritance_rules.append(pair)

        if 'server_domain' in arch.layers:
            arch.layers['server_domain'].extends_layer = 'domain'

    # -- required methods ---------------------------------------------- #

    def _parse_required_methods(self, content: str, arch: ParsedArchitecture) -> None:
        load_save_re = re.compile(
            r'_(?:load|save)\s*\(\s*\)',
        )
        if load_save_re.search(content) and 'server_domain' in arch.layers:
            for method in ['_load', '_save']:
                if method not in arch.layers['server_domain'].required_methods:
                    arch.layers['server_domain'].required_methods.append(method)

        post_msg_re = re.compile(r'postMessage|onDidReceiveMessage', re.IGNORECASE)
        if post_msg_re.search(content) and 'server_view' in arch.layers:
            arch.layers['server_view'].required_patterns['postMessage'] = (
                r'postMessage|onDidReceiveMessage|_onMessage'
            )

    # -- file naming patterns ------------------------------------------ #

    def _parse_file_patterns(self, content: str, arch: ParsedArchitecture) -> None:
        file_ref_re = re.compile(
            r'`?(\w+(?:_\w+)*)\.ts`?',
        )
        seen_suffixes: Dict[str, str] = {}
        for m in file_ref_re.finditer(content):
            name = m.group(1)
            if name.endswith('_server'):
                seen_suffixes['server_domain'] = '_server'
            elif name.endswith('_view'):
                seen_suffixes['server_view'] = '_view'
            elif name.endswith('_client'):
                seen_suffixes['client_view'] = '_client'
            elif name.endswith('_adapter'):
                seen_suffixes['cli_adapter'] = '_adapter'
            elif name.endswith('_tty') or name.endswith('_json') or name.endswith('_markdown'):
                pass  # CLI output format files

        for layer_name, suffix in seen_suffixes.items():
            if layer_name in arch.layers:
                arch.layers[layer_name].file_suffix = suffix
                arch.file_patterns[layer_name] = rf'^(?P<concept>[a-z_]+){re.escape(suffix)}\.ts$'

        if 'domain' in arch.layers and 'domain' not in arch.file_patterns:
            arch.file_patterns['domain'] = r'^(?P<concept>[a-z_]+)\.ts$'

    # -- CLI output formats -------------------------------------------- #

    def _parse_cli_output_formats(self, content: str, arch: ParsedArchitecture) -> None:
        format_re = re.compile(r'TTY\s*\|\s*JSON\s*\|\s*(?:HTML|Markdown)', re.IGNORECASE)
        if format_re.search(content):
            arch.cli_output_formats = ['tty', 'json', 'markdown']

        adapter_file_re = re.compile(r'`?\w+_(tty|json|markdown)\.ts`?')
        for m in adapter_file_re.finditer(content):
            fmt = m.group(1).lower()
            if fmt not in arch.cli_output_formats:
                arch.cli_output_formats.append(fmt)

    # -- test file patterns -------------------------------------------- #

    def _parse_test_files(self, content: str, arch: ParsedArchitecture) -> None:
        test_file_re = re.compile(r'`?(\w+)(?:_test|\.test|_view\.test|_client\.test)\.ts`?')
        seen_test_patterns: Set[str] = set()
        for m in test_file_re.finditer(content):
            full = m.group(0).strip('`')
            if '_test.ts' in full and '_view' not in full and '_client' not in full:
                seen_test_patterns.add('base_test')
            elif '.test.ts' in full and '_view' not in full and '_client' not in full:
                seen_test_patterns.add('domain_test')
            elif '_view.test.ts' in full:
                seen_test_patterns.add('server_view_test')
            elif '_client.test.ts' in full:
                seen_test_patterns.add('client_view_test')

        pattern_map = {
            'base_test': '{concept}_test.ts',
            'domain_test': '{concept}.test.ts',
            'server_view_test': '{concept}_view.test.ts',
            'client_view_test': '{concept}_client.test.ts',
        }
        for key in seen_test_patterns:
            arch.test_files[key] = pattern_map[key]

    # -- test architecture patterns ------------------------------------ #

    def _parse_test_patterns(self, content: str, arch: ParsedArchitecture) -> None:
        if re.search(r'registerTests\s*\(', content):
            arch.test_patterns['template_method'] = r'registerTests\s*\('

        if re.search(r'createCounter|create\w+\s*\(', content):
            arch.test_patterns['abstract_create'] = r'(abstract\s+)?create\w+\s*\('

        if re.search(r'assert\w+\s*\(', content):
            arch.test_patterns['assert_hook'] = r'assert\w+\s*\('

    # -- defaults for anything not extracted ---------------------------- #

    def _apply_defaults(self, arch: ParsedArchitecture) -> None:
        default_layers = {
            'domain': ArchitectureLayer('domain', 'Pure TS domain'),
            'server_domain': ArchitectureLayer('server_domain', 'Server domain with persistence'),
            'server_view': ArchitectureLayer('server_view', 'Server view with postMessage'),
            'client_view': ArchitectureLayer('client_view', 'Client view with DOM'),
            'cli_adapter': ArchitectureLayer('cli_adapter', 'CLI output adapters'),
        }
        for name, default in default_layers.items():
            if name not in arch.layers:
                arch.layers[name] = default

        if not arch.cli_output_formats:
            arch.cli_output_formats = ['tty', 'json', 'markdown']

        if not arch.test_files:
            arch.test_files = {
                'base_test': '{concept}_test.ts',
                'domain_test': '{concept}.test.ts',
                'server_view_test': '{concept}_view.test.ts',
                'client_view_test': '{concept}_client.test.ts',
            }

        # Deduplicate forbidden imports
        for layer in arch.layers.values():
            layer.forbidden_imports = list(set(layer.forbidden_imports))

        # Ensure file suffixes
        suffix_defaults = {
            'domain': None,
            'server_domain': '_server',
            'server_view': '_view',
            'client_view': '_client',
            'cli_adapter': '_adapter',
        }
        location_defaults = {
            'server_view': 'view',
            'client_view': 'view',
            'cli_adapter': 'adapters',
        }
        for name, suffix in suffix_defaults.items():
            if name in arch.layers and arch.layers[name].file_suffix is None:
                arch.layers[name].file_suffix = suffix
        for name, loc in location_defaults.items():
            if name in arch.layers and arch.layers[name].location is None:
                arch.layers[name].location = loc


# --------------------------------------------------------------------------- #
#  Scanner                                                                    #
# --------------------------------------------------------------------------- #

class ArchitectureMdScanner(BaseScanner):
    """Verifies generated TS/JS code follows a target architecture by
    dynamically parsing .md architecture documentation at runtime.

    Usage:
        scanner = ArchitectureMdScanner(
            rule,
            code_folder='/path/to/src/counter',
            architecture_md_paths=[
                '/path/to/architecture-reference.md',
                '/path/to/testing-architecture.md',
            ],
        )
        violations = scanner.scan_with_context(context)
    """

    def __init__(
        self,
        rule: 'Rule',
        code_folder: Optional[str] = None,
        architecture_md_paths: Optional[List[str]] = None,
    ):
        super().__init__(rule)
        self._code_folder: Optional[Path] = Path(code_folder) if code_folder else None
        self._md_paths: List[Path] = [
            Path(p) for p in (architecture_md_paths or [])
        ]
        self._architecture: Optional[ParsedArchitecture] = None
        self._concept_cache: Optional[List[str]] = None

    # ------------------------------------------------------------------ #
    #  Architecture accessors (lazy, cached)                              #
    # ------------------------------------------------------------------ #

    @property
    def architecture(self) -> ParsedArchitecture:
        if self._architecture is None:
            parser = ArchitectureMdParser()
            self._architecture = parser.parse(self._md_paths)
        return self._architecture

    # ------------------------------------------------------------------ #
    #  Entry points                                                       #
    # ------------------------------------------------------------------ #

    def scan_with_context(self, context: 'ScanFilesContext') -> List[Dict[str, Any]]:
        self.story_graph = context.story_graph
        violations: List[Dict[str, Any]] = []

        if not self._md_paths:
            violations.append(self._make_violation(
                'No architecture markdown paths supplied. '
                'Provide architecture_md_paths to ArchitectureMdScanner.',
                severity='error',
            ))
            return violations

        arch = self.architecture
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
            violations.extend(self._check_required_files(code_folder, concept, arch))
            violations.extend(self._check_domain_files(code_folder, concept, arch))

        return violations

    def scan_file_with_context(self, context: 'FileScanContext') -> List[Dict[str, Any]]:
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
        arch = self.architecture

        violations: List[Dict[str, Any]] = []
        layer_name = self._classify_file_layer(file_path)
        layer = arch.layers.get(layer_name)
        if not layer:
            return []

        # Forbidden imports
        if layer.forbidden_imports:
            violations.extend(self._check_forbidden_imports(
                content, lines, file_path, layer.forbidden_imports, layer_name,
            ))

        # Layer-specific checks
        if layer_name == 'domain':
            violations.extend(self._check_domain_class_and_interface(content, file_path))
        elif layer_name == 'server_domain':
            violations.extend(self._check_server_domain_extends(content, file_path, arch))
            violations.extend(self._check_required_methods(content, file_path, layer))
        elif layer_name == 'server_view':
            violations.extend(self._check_required_layer_patterns(content, file_path, layer))
        elif layer_name == 'client_view':
            violations.extend(self._check_client_imports_domain_not_server(content, lines, file_path))
        elif layer_name == 'cli_adapter':
            if file_path.stem.endswith('_adapter'):
                violations.extend(self._check_required_layer_patterns(content, file_path, layer))

        return violations

    # ------------------------------------------------------------------ #
    #  Concept detection                                                  #
    # ------------------------------------------------------------------ #

    def _resolve_code_folder(self, context: 'ScanFilesContext') -> Optional[Path]:
        if self._code_folder:
            return self._code_folder
        all_files = context.files.all_files if context.files else []
        if all_files:
            return all_files[0].parent
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

    def _check_required_files(
        self, code_folder: Path, concept: str, arch: ParsedArchitecture,
    ) -> List[Dict[str, Any]]:
        violations: List[Dict[str, Any]] = []

        for layer_name, layer in arch.layers.items():
            if layer.file_suffix is not None:
                filename = f'{concept}{layer.file_suffix}.ts'
            else:
                filename = f'{concept}.ts'

            if layer.location:
                fp = code_folder / layer.location / filename
                display = f'{layer.location}/{filename}'
            else:
                fp = code_folder / filename
                display = filename

            if not fp.exists():
                violations.append(self._make_violation(
                    f'Missing required file "{display}" for layer '
                    f'"{layer_name}" (concept: {concept}).',
                    location=str(fp.parent),
                    severity='error',
                ))

        # CLI output format files
        for fmt in arch.cli_output_formats:
            filename = f'{concept}_{fmt}.ts'
            fp = code_folder / 'adapters' / filename
            if not fp.exists():
                violations.append(self._make_violation(
                    f'Missing required CLI output file '
                    f'"adapters/{filename}" (concept: {concept}).',
                    location=str(code_folder / 'adapters'),
                    severity='error',
                ))

        # Test files
        violations.extend(self._check_test_files(code_folder, concept, arch))

        return violations

    def _check_test_files(
        self, code_folder: Path, concept: str, arch: ParsedArchitecture,
    ) -> List[Dict[str, Any]]:
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

        for label, pattern in arch.test_files.items():
            filename = pattern.format(concept=concept)
            fp = test_dir / filename
            if not fp.exists():
                violations.append(self._make_violation(
                    f'Missing test file "{filename}" ({label}) '
                    f'for concept "{concept}".',
                    location=str(test_dir),
                    severity='info',
                ))

        return violations

    def _find_test_dir(self, code_folder: Path, concept: str) -> Optional[Path]:
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
    #  Check 1 — Domain orientation (AST / regex)                         #
    # ------------------------------------------------------------------ #

    def _check_domain_files(
        self, code_folder: Path, concept: str, arch: ParsedArchitecture,
    ) -> List[Dict[str, Any]]:
        violations: List[Dict[str, Any]] = []
        ts_files = self._collect_concept_files(code_folder, concept, arch)

        for fp in ts_files:
            parsed = self._parse_js_file(fp)
            if not parsed:
                continue
            content, ast_dict, lines = parsed
            layer_name = self._classify_file_layer(fp)
            layer = arch.layers.get(layer_name)
            if not layer:
                continue

            if layer.forbidden_imports:
                violations.extend(self._check_forbidden_imports(
                    content, lines, fp, layer.forbidden_imports, layer_name,
                ))

            if layer_name == 'domain':
                violations.extend(self._check_domain_class_and_interface(content, fp))
            elif layer_name == 'server_domain':
                violations.extend(self._check_server_domain_extends(content, fp, arch))
                violations.extend(self._check_required_methods(content, fp, layer))
            elif layer_name == 'server_view':
                violations.extend(self._check_required_layer_patterns(content, fp, layer))
            elif layer_name == 'client_view':
                violations.extend(self._check_client_imports_domain_not_server(content, lines, fp))
            elif layer_name == 'cli_adapter' and fp.stem.endswith('_adapter'):
                violations.extend(self._check_required_layer_patterns(content, fp, layer))

        return violations

    def _collect_concept_files(
        self, code_folder: Path, concept: str, arch: ParsedArchitecture,
    ) -> List[Path]:
        files: List[Path] = []

        for layer_name, layer in arch.layers.items():
            if layer.file_suffix is not None:
                filename = f'{concept}{layer.file_suffix}.ts'
            else:
                filename = f'{concept}.ts'

            if layer.location:
                fp = code_folder / layer.location / filename
            else:
                fp = code_folder / filename
            if fp.exists():
                files.append(fp)

        for fmt in arch.cli_output_formats:
            fp = code_folder / 'adapters' / f'{concept}_{fmt}.ts'
            if fp.exists():
                files.append(fp)

        return files

    # -- Forbidden imports --------------------------------------------- #

    def _check_forbidden_imports(
        self,
        content: str,
        lines: List[str],
        file_path: Path,
        forbidden: List[str],
        layer_name: str,
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
                        f'{layer_name} layer (forbidden: {fb}).',
                        location=str(file_path),
                        line_number=line_num,
                        severity='error',
                    ))
        return violations

    # -- Domain class & interface -------------------------------------- #

    def _check_domain_class_and_interface(
        self, content: str, file_path: Path,
    ) -> List[Dict[str, Any]]:
        violations: List[Dict[str, Any]] = []

        if not re.search(r'export\s+interface\s+I\w+', content):
            violations.append(self._make_violation(
                'Domain file is missing an exported interface '
                '(expected: export interface I<Name>).',
                location=str(file_path),
                severity='warning',
            ))

        if not re.search(r'export\s+class\s+\w+', content):
            violations.append(self._make_violation(
                'Domain file is missing an exported class '
                '(expected: export class <Name>).',
                location=str(file_path),
                severity='warning',
            ))

        return violations

    # -- Server domain extends ----------------------------------------- #

    def _check_server_domain_extends(
        self, content: str, file_path: Path, arch: ParsedArchitecture,
    ) -> List[Dict[str, Any]]:
        violations: List[Dict[str, Any]] = []

        extends_patterns = [
            re.compile(rf'{re.escape(child)}\s+extends\s+{re.escape(parent)}')
            for child, parent in arch.inheritance_rules
        ]
        generic_extends = re.compile(r'export\s+class\s+\w+Server\s+extends\s+\w+')

        found = any(p.search(content) for p in extends_patterns)
        if not found:
            found = bool(generic_extends.search(content))

        if not found:
            violations.append(self._make_violation(
                'Server domain class must extend the domain class '
                '(expected: export class <Name>Server extends <Name>).',
                location=str(file_path),
                severity='error',
            ))
        return violations

    # -- Required methods ---------------------------------------------- #

    def _check_required_methods(
        self, content: str, file_path: Path, layer: ArchitectureLayer,
    ) -> List[Dict[str, Any]]:
        violations: List[Dict[str, Any]] = []
        for method in layer.required_methods:
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

    # -- Required layer patterns --------------------------------------- #

    def _check_required_layer_patterns(
        self, content: str, file_path: Path, layer: ArchitectureLayer,
    ) -> List[Dict[str, Any]]:
        violations: List[Dict[str, Any]] = []
        for label, pattern in layer.required_patterns.items():
            if not re.search(pattern, content):
                violations.append(self._make_violation(
                    f'{layer.name} layer is missing required pattern '
                    f'"{label}".',
                    location=str(file_path),
                    severity='warning',
                ))
        return violations

    # ------------------------------------------------------------------ #
    #  Check 2 — Layer completeness                                       #
    # ------------------------------------------------------------------ #

    def _check_client_imports_domain_not_server(
        self, content: str, lines: List[str], file_path: Path,
    ) -> List[Dict[str, Any]]:
        violations: List[Dict[str, Any]] = []
        import_re = re.compile(r'''import\s+.*?\s+from\s+['"]([^'"]+)['"]''')

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

    # ------------------------------------------------------------------ #
    #  File layer classification                                          #
    # ------------------------------------------------------------------ #

    def _classify_file_layer(self, file_path: Path) -> str:
        name = file_path.name
        parent_name = file_path.parent.name

        if parent_name == 'adapters':
            return 'cli_adapter'
        if parent_name == 'view':
            if '_client' in name:
                return 'client_view'
            if '_view' in name:
                return 'server_view'
        if '_server' in name:
            return 'server_domain'
        return 'domain'

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
