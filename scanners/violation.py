"""Violation data object for scanner results."""

from typing import Optional, Dict, Any


class Violation:

    def __init__(
        self,
        rule,
        violation_message: str,
        line_number: Optional[int] = None,
        location: Optional[str] = None,
        severity: str = 'error',
    ):
        if not hasattr(rule, 'name') or not hasattr(rule, 'rule_file'):
            raise TypeError(f"rule must be a Rule object, got {type(rule)}")

        self._rule = rule
        self._violation_message = violation_message
        self._line_number = line_number
        self._location = location
        self._severity = severity

    @property
    def rule(self):
        return self._rule

    @property
    def violation_message(self) -> str:
        return self._violation_message

    @property
    def line_number(self) -> Optional[int]:
        return self._line_number

    @property
    def location(self) -> Optional[str]:
        return self._location

    @property
    def severity(self) -> str:
        return self._severity

    def to_dict(self) -> Dict[str, Any]:
        return {
            'rule': self._rule.name,
            'rule_file': self._rule.rule_file,
            'violation_message': self._violation_message,
            'severity': self._severity,
            'line_number': self._line_number,
            'location': self._location,
        }
