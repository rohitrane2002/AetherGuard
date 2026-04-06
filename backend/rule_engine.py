import re

class RuleEngine:
    def __init__(self):
        self.rules = [
            {
                "id": "reentrancy",
                "name": "Reentrancy Pattern",
                "severity": "high",
                "patterns": [
                    r"\.call\s*\{value:",
                    r"\.call\.value\s*\(",
                    r"\.send\s*\(",
                    r"\.transfer\s*\("
                ],
                "description": "External call before state change. Potential reentrancy vulnerability."
            },
            {
                "id": "unsafe-call",
                "name": "Unsafe External Call",
                "severity": "high",
                "patterns": [
                    r"\.call\s*\(",
                    r"delegatecall\s*\(",
                    r"selfdestruct\s*\("
                ],
                "description": "Use of low-level calls or delegatecall can be extremely risky."
            },
            {
                "id": "missing-access-control",
                "name": "Missing Access Control",
                "severity": "high",
                "patterns": [
                    r"function\s+\w+\s*\([^)]*\)\s+(public|external)\s*(?!.*(onlyOwner|onlyAdmin|require\s*\(\s*msg\.sender))"
                ],
                "description": "Public/external functions may lack sufficient access control modifiers."
            },
            {
                "id": "integer-overflow",
                "name": "Integer Overflow/Underflow",
                "severity": "medium",
                "patterns": [
                    r"\+=", r"-=", r"\*=", r"/=",
                    r"\bunchecked\s*\{"
                ],
                "description": "Arithmetic operations could lead to overflow or underflow if not bounded."
            },
            {
                "id": "unchecked-return",
                "name": "Unchecked Return Value",
                "severity": "medium",
                "patterns": [
                    r"(?<!require\s*\()(?<!if\s*\()(?<!assert\s*\()(?<!=\s*)\w+\.call\s*\("
                ],
                "description": "Low-level calls return a boolean which must be checked for success."
            }
        ]

    def analyze(self, code: str) -> list[dict]:
        issues = []
        lines = code.splitlines()
        for rule in self.rules:
            findings_for_rule = []
            for pattern in rule["patterns"]:
                # Compile regex to find all occurrences
                regex = re.compile(pattern, re.MULTILINE | re.IGNORECASE)
                for i, line in enumerate(lines):
                    if regex.search(line):
                        findings_for_rule.append(i + 1) # 1-indexed
            
            if findings_for_rule:
                # Remove duplicates and sort
                unique_lines = sorted(list(set(findings_for_rule)))
                issues.append({
                    "id": rule["id"],
                    "name": rule["name"],
                    "severity": rule["severity"],
                    "description": rule["description"],
                    "line_numbers": unique_lines
                })
        return issues

