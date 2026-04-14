"""Standalone base scanner — replaces JSCodeScanner for local use.

Provides the same interface the architecture scanners depend on:
- scan_with_context / scan_file_with_context
- _parse_js_file (reads file content, returns content/lines; AST via esprima if available)
- _empty_violation_list
"""

from abc import ABC
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
import json
import subprocess


class ScanFilesContext:
    """Minimal context carrying a story_graph and file collection."""

    def __init__(self, story_graph=None, files=None):
        self.story_graph = story_graph or {}
        self.files = files or FileCollection()
        self.on_file_scanned = None


class FileScanContext:
    """Minimal per-file context."""

    def __init__(self, file_path=None, story_graph=None, full_story_graph=None):
        self.file_path = Path(file_path) if file_path else None
        self.story_graph = story_graph or {}
        self.full_story_graph = full_story_graph

    @property
    def exists(self) -> bool:
        return self.file_path is not None and self.file_path.exists()


class FileCollection:
    """Minimal file list."""

    def __init__(self, test_files=None, code_files=None):
        self.test_files: List[Path] = test_files or []
        self.code_files: List[Path] = code_files or []

    @property
    def all_files(self) -> List[Path]:
        return list(self.test_files) + list(self.code_files)


class BaseScanner(ABC):
    """Local base scanner that mirrors the JSCodeScanner API the architecture
    scanners rely on, without requiring the full agile_bots framework."""

    def __init__(self, rule):
        self.rule = rule
        self.story_graph = None

    def scan_with_context(self, context: ScanFilesContext) -> List[Dict[str, Any]]:
        self.story_graph = context.story_graph
        violations: List[Dict[str, Any]] = []
        for file_path in context.files.all_files:
            if file_path and file_path.exists() and file_path.is_file():
                fc = FileScanContext(file_path=file_path, story_graph=context.story_graph)
                fv = self.scan_file_with_context(fc)
                if fv:
                    violations.extend(fv if isinstance(fv, list) else [fv])
        return violations

    def scan_file_with_context(self, context: FileScanContext) -> List[Dict[str, Any]]:
        return self._empty_violation_list()

    @staticmethod
    def _empty_violation_list() -> List[Dict[str, Any]]:
        return []

    # ------------------------------------------------------------------ #
    #  JS/TS file parsing (content + optional esprima AST)                #
    # ------------------------------------------------------------------ #

    def _parse_js_file(self, file_path: Path) -> Optional[Tuple[str, Dict, List[str]]]:
        if not file_path.exists():
            return None
        try:
            content = file_path.read_text(encoding='utf-8')
            lines = content.split('\n')
            ast = self._parse_with_esprima(content, str(file_path))
            if ast is None:
                ast = {'type': 'Program', 'body': [], '_fallback': True}
            return (content, ast, lines)
        except (UnicodeDecodeError, json.JSONDecodeError):
            return None

    @staticmethod
    def _parse_with_esprima(content: str, filename: str) -> Optional[Dict]:
        import tempfile
        import os
        try:
            with tempfile.NamedTemporaryFile(
                mode='w', suffix='.js', encoding='utf-8', delete=False,
            ) as f:
                temp_path = f.name
                f.write(content)
            try:
                escaped = temp_path.replace('\\', '\\\\')
                js_script = f"""
                const esprima = require('esprima');
                const fs = require('fs');
                const content = fs.readFileSync('{escaped}', 'utf-8');
                try {{
                    const ast = esprima.parseModule(content, {{
                        loc: true, range: true, comment: true, tolerant: true
                    }});
                    console.log(JSON.stringify(ast));
                }} catch (e) {{
                    try {{
                        const ast = esprima.parseScript(content, {{
                            loc: true, range: true, comment: true, tolerant: true
                        }});
                        console.log(JSON.stringify(ast));
                    }} catch (e2) {{
                        process.exit(1);
                    }}
                }}
                """
                result = subprocess.run(
                    ['node', '-e', js_script],
                    capture_output=True, text=True, encoding='utf-8', timeout=30,
                )
                if result.returncode != 0:
                    return None
                return json.loads(result.stdout)
            finally:
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
        except (subprocess.TimeoutExpired, subprocess.SubprocessError,
                FileNotFoundError, json.JSONDecodeError):
            return None
