import re

class RuleEngine:
    def __init__(self):
        self.rules = {
            "solidity": [
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
                }
            ],
            "rust": [
                {
                    "id": "missing-signer-check",
                    "name": "Missing Signer Check",
                    "severity": "critical",
                    "patterns": [
                        r"(?<!is_signer)\s*AccountInfo",
                        r"\.key\(\)\s*=="
                    ],
                    "description": "Account data used without verifying it belongs to the expected signer."
                },
                {
                    "id": "missing-ownership-check",
                    "name": "Missing Ownership Check",
                    "severity": "critical",
                    "patterns": [
                        r"AccountInfo.*owner"
                    ],
                    "description": "Verifying account ownership is critical to ensure data is not spoofed."
                }
            ]
        }

    def _detect_language(self, code: str) -> str:
        if "contract" in code or "pragma solidity" in code:
            return "solidity"
        if "fn main" in code or "#[program]" in code or "use anchor_lang" in code:
            return "rust"
        return "solidity" # Default

    def analyze(self, code: str) -> list[dict]:
        issues = []
        lang = self._detect_language(code)
        lang_rules = self.rules.get(lang, self.rules["solidity"])
        
        lines = code.splitlines()
        for rule in lang_rules:
            findings_for_rule = []
            for pattern in rule["patterns"]:
                regex = re.compile(pattern, re.MULTILINE | re.IGNORECASE)
                for i, line in enumerate(lines):
                    if regex.search(line):
                        findings_for_rule.append(i + 1)
            
            if findings_for_rule:
                unique_lines = sorted(list(set(findings_for_rule)))
                issues.append({
                    "id": rule["id"],
                    "name": rule["name"],
                    "severity": rule["severity"],
                    "description": rule["description"],
                    "line_numbers": unique_lines,
                    "language": lang
                })
        return issues

