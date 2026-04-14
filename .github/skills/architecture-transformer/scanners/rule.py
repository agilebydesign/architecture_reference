"""Minimal Rule object for standalone scanner execution."""

from typing import Optional


class Rule:
    """Lightweight rule that satisfies the scanner's Violation contract."""

    def __init__(self, name: str, rule_file: str = '', description: str = ''):
        self._name = name
        self._rule_file = rule_file
        self._description = description

    @property
    def name(self) -> str:
        return self._name

    @property
    def rule_file(self) -> str:
        return self._rule_file

    @property
    def description(self) -> str:
        return self._description
