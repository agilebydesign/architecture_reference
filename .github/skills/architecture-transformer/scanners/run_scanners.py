"""Run architecture scanners against a code folder.

Usage:
    # Config scanner (hardcoded rules):
    python run_scanners.py --scanner config --code-folder src/counter

    # Markdown scanner (parses docs at runtime):
    python run_scanners.py --scanner md --code-folder src/counter \
        --md docs/architecture-reference.md docs/testing-architecture.md

    # Both scanners:
    python run_scanners.py --scanner both --code-folder src/counter \
        --md docs/architecture-reference.md docs/testing-architecture.md
"""

import argparse
import json
import sys
from pathlib import Path

# Ensure the parent of this script's directory is on sys.path so
# `scanners.*` imports work (this script lives inside the scanners/ folder)
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
for p in (str(PROJECT_ROOT), str(SCRIPT_DIR.parent)):
    if p not in sys.path:
        sys.path.insert(0, p)

from scanners.rule import Rule
from scanners.base_scanner import ScanFilesContext, FileCollection


def run_config_scanner(code_folder: Path, rule: Rule) -> list:
    from scanners.architecture_config_scanner import ArchitectureConfigScanner

    scanner = ArchitectureConfigScanner(rule, code_folder=str(code_folder))
    context = ScanFilesContext(story_graph={}, files=FileCollection())
    return scanner.scan_with_context(context)


def run_md_scanner(code_folder: Path, md_paths: list[Path], rule: Rule) -> list:
    from scanners.architecture_md_scanner import ArchitectureMdScanner

    scanner = ArchitectureMdScanner(
        rule,
        code_folder=str(code_folder),
        architecture_md_paths=[str(p) for p in md_paths],
    )
    context = ScanFilesContext(story_graph={}, files=FileCollection())
    return scanner.scan_with_context(context)


SEVERITY_COLORS = {
    'error': '\033[91m',    # red
    'warning': '\033[93m',  # yellow
    'info': '\033[96m',     # cyan
}
RESET = '\033[0m'


def print_violations(violations: list, scanner_name: str) -> None:
    print(f'\n{"=" * 70}')
    print(f'  {scanner_name}: {len(violations)} violation(s)')
    print(f'{"=" * 70}')

    if not violations:
        print('  No violations found.')
        return

    for v in violations:
        sev = v.get('severity', 'error')
        color = SEVERITY_COLORS.get(sev, '')
        loc = v.get('location', '')
        line = v.get('line_number')
        loc_str = f'{loc}' + (f':{line}' if line else '')
        msg = v['violation_message']
        print(f'  {color}[{sev.upper()}]{RESET} {loc_str}')
        print(f'         {msg}')


def main():
    parser = argparse.ArgumentParser(
        description='Run architecture scanners against a code folder.',
    )
    parser.add_argument(
        '--scanner', choices=['config', 'md', 'both'], default='both',
        help='Which scanner to run (default: both)',
    )
    parser.add_argument(
        '--code-folder', required=True,
        help='Path to the code folder to scan (e.g. src/counter)',
    )
    parser.add_argument(
        '--md', nargs='*', default=[],
        help='Path(s) to architecture .md files (required for md/both scanners)',
    )
    parser.add_argument(
        '--json', action='store_true', dest='output_json',
        help='Output violations as JSON',
    )
    args = parser.parse_args()

    code_folder = Path(args.code_folder).resolve()
    if not code_folder.is_dir():
        print(f'Error: code folder does not exist: {code_folder}', file=sys.stderr)
        sys.exit(1)

    md_paths = [Path(p).resolve() for p in args.md]
    all_violations = {}

    if args.scanner in ('config', 'both'):
        rule = Rule('architecture_config', 'architecture_config_rule.json')
        violations = run_config_scanner(code_folder, rule)
        all_violations['config'] = violations

    if args.scanner in ('md', 'both'):
        if not md_paths:
            print('Error: --md paths required for md scanner', file=sys.stderr)
            sys.exit(1)
        for p in md_paths:
            if not p.exists():
                print(f'Error: md file does not exist: {p}', file=sys.stderr)
                sys.exit(1)
        rule = Rule('architecture_md', 'architecture_md_rule.json')
        violations = run_md_scanner(code_folder, md_paths, rule)
        all_violations['md'] = violations

    if args.output_json:
        print(json.dumps(all_violations, indent=2))
    else:
        for name, violations in all_violations.items():
            label = 'Config Scanner' if name == 'config' else 'Markdown Scanner'
            print_violations(violations, label)

    total = sum(len(v) for v in all_violations.values())
    errors = sum(
        1 for vs in all_violations.values()
        for v in vs if v.get('severity') == 'error'
    )

    if not args.output_json:
        print(f'\nTotal: {total} violation(s), {errors} error(s)')

    sys.exit(1 if errors > 0 else 0)


if __name__ == '__main__':
    main()
