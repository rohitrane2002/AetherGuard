import hashlib
import re
import secrets
from typing import Optional

import bcrypt
from cryptography.fernet import Fernet, InvalidToken

from config import settings

def _get_fernet() -> Fernet:
    key = settings.encryption_key
    try:
        return Fernet(key)
    except ValueError:
        import base64
        hashed_key = base64.urlsafe_b64encode(hashlib.sha256(key.encode()).digest())
        return Fernet(hashed_key)

def encrypt_secret(value: Optional[str]) -> Optional[str]:
    """Encrypts a string for secure storage in the database."""
    if not value:
        return value
    return _get_fernet().encrypt(value.encode("utf-8")).decode("utf-8")

def decrypt_secret(value: Optional[str]) -> Optional[str]:
    """Decrypts a securely stored string from the database."""
    if not value:
        return value
    try:
        return _get_fernet().decrypt(value.encode("utf-8")).decode("utf-8")
    except InvalidToken:
        return value

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def generate_secure_token(length: int = 48) -> str:
    return secrets.token_urlsafe(length)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def build_api_key(prefix: str = "ag") -> tuple[str, str, str]:
    secret = secrets.token_urlsafe(32)
    full_key = f"{prefix}_{secret}"
    key_hash = hash_token(full_key)
    key_prefix = full_key[:12]
    return full_key, key_hash, key_prefix


def compute_confidence(prob_secure: float, prob_vulnerable: float) -> float:
    return max(prob_secure, prob_vulnerable)


def snippet_from_code(code: str, max_chars: int = 240) -> str:
    trimmed = code.strip()
    return trimmed[:max_chars] + ("..." if len(trimmed) > max_chars else "")


ISSUE_CATALOG = [
    {
        "slug": "reentrancy",
        "label": "Reentrancy",
        "severity": "critical",
        "patterns": [r"\.call\s*\{value:", r"\.call\.value\s*\(", r"\.send\s*\(", r"\.transfer\s*\("],
        "recommendation": "Use checks-effects-interactions, ReentrancyGuard, and update state before external calls.",
    },
    {
        "slug": "overflow",
        "label": "Overflow / Arithmetic",
        "severity": "medium",
        "patterns": [r"\+\=", r"-\=", r"\*\=", r"\bunchecked\s*\{"],
        "recommendation": "Validate arithmetic paths, avoid unsafe unchecked blocks, and bound user-controlled values.",
    },
    {
        "slug": "access-control",
        "label": "Access Control",
        "severity": "high",
        "patterns": [r"\bonlyOwner\b", r"\bowner\b", r"\brequire\s*\(\s*msg\.sender", r"\baccesscontrol\b"],
        "recommendation": "Protect privileged functions with explicit access modifiers and event-backed admin changes.",
    },
]

SAFE_PATTERNS = [
    {
        "label": "Checks-Effects-Interactions",
        "patterns": [r"require\s*\(", r"emit\s+", r"mapping\s*\("],
    },
    {
        "label": "Solidity ^0.8 overflow protections",
        "patterns": [r"pragma\s+solidity\s+\^0\.8"],
    },
    {
        "label": "Explicit visibility & guards",
        "patterns": [r"\bexternal\b", r"\bpublic\b", r"\bmodifier\b"],
    },
]


def _match_score(code: str, patterns: list[str]) -> int:
    return sum(1 for pattern in patterns if re.search(pattern, code, flags=re.IGNORECASE | re.MULTILINE))


def infer_vulnerability_findings(code: str) -> list[dict]:
    findings: list[dict] = []
    lowered = code.lower()
    for item in ISSUE_CATALOG:
        matches = _match_score(lowered, item["patterns"])
        if matches:
            findings.append(
                {
                    "slug": item["slug"],
                    "label": item["label"],
                    "severity": item["severity"],
                    "confidence": min(0.35 + matches * 0.18, 0.92),
                    "summary": f"Signals suggest potential {item['label'].lower()} weaknesses.",
                    "recommendation": item["recommendation"],
                }
            )
    return findings


def infer_safe_patterns(code: str) -> list[str]:
    lowered = code.lower()
    found: list[str] = []
    for item in SAFE_PATTERNS:
        if _match_score(lowered, item["patterns"]):
            found.append(item["label"])
    return found


def compute_risk_score(prediction: str, prob_vulnerable: float, findings: list[dict]) -> int:
    base_score = int(round(prob_vulnerable * 100))
    if prediction == "vulnerable":
        base_score = max(base_score, 60)
    severity_bonus = sum(
        18 if finding["severity"] == "critical" else 12 if finding["severity"] == "high" else 6
        for finding in findings
    )
    return max(0, min(100, base_score + severity_bonus))


def build_analysis_summary(prediction: str, risk_score: int, findings: list[dict], safe_patterns: list[str]) -> str:
    if findings:
        top_finding = findings[0]
        return (
            f"AetherGuard marked this contract as {prediction} with a risk score of {risk_score}/100. "
            f"Primary concern: {top_finding['label']}. "
            f"{top_finding['recommendation']}"
        )
    if safe_patterns:
        return (
            f"AetherGuard marked this contract as {prediction} with a risk score of {risk_score}/100. "
            f"Detected strong signals such as {', '.join(safe_patterns[:2])}."
        )
    return f"AetherGuard marked this contract as {prediction} with a risk score of {risk_score}/100."


def build_fix_suggestions(findings: list[dict]) -> list[str]:
    if not findings:
        return [
            "Add explicit access controls around privileged functions.",
            "Emit events for sensitive state changes.",
            "Keep effects before interactions when transferring value.",
        ]
    return [finding["recommendation"] for finding in findings]


def build_autofix_preview(findings: list[dict], safe_patterns: list[str]) -> str:
    if not findings and safe_patterns:
        return (
            "Preserve the detected safety patterns, keep privileged flows explicit, and tighten state transitions around any future value transfers."
        )
    if not findings:
        return (
            "Harden privileged functions, emit events for sensitive writes, and keep state updates before interactions."
        )

    suggestions: list[str] = []
    finding_slugs = {finding["slug"] for finding in findings}
    if "reentrancy" in finding_slugs:
        suggestions.append("move balance mutations before external value transfers")
    if "access-control" in finding_slugs:
        suggestions.append("wrap privileged entrypoints in explicit access modifiers")
    if "overflow" in finding_slugs:
        suggestions.append("remove unsafe arithmetic paths and tighten unchecked usage")

    return "Auto-fix plan: " + ", ".join(suggestions) + "."


def generate_fixed_contract(code: str, findings: list[dict]) -> tuple[str, list[str]]:
    fixed_code = code
    highlighted_changes: list[str] = []
    finding_slugs = {finding["slug"] for finding in findings}

    common_withdraw_pattern = re.compile(
        r"(?P<indent>\s*)\(bool ok,\)\s*=\s*msg\.sender\.call\{value:\s*amount\}\(\"\"\);\s*"
        r"require\(ok,\s*\"transfer failed\"\);\s*"
        r"balances\[msg\.sender\]\s*-=\s*amount;",
        flags=re.MULTILINE,
    )
    if "reentrancy" in finding_slugs and common_withdraw_pattern.search(fixed_code):
        fixed_code = common_withdraw_pattern.sub(
            (
                r"\g<indent>balances[msg.sender] -= amount;\n"
                r"\g<indent>(bool ok,) = msg.sender.call{value: amount}(\"\");\n"
                r"\g<indent>require(ok, \"transfer failed\");"
            ),
            fixed_code,
        )
        highlighted_changes.append("Reordered withdraw flow to apply effects before the external call.")

    if "reentrancy" in finding_slugs and "nonReentrant" not in fixed_code:
        highlighted_changes.append("Recommended adding a nonReentrant-style guard around value-transfer functions.")

    if "access-control" in finding_slugs:
        highlighted_changes.append("Recommended hardening privileged functions with explicit owner/admin modifiers.")

    if "overflow" in finding_slugs and "unchecked" in fixed_code:
        fixed_code = re.sub(r"\bunchecked\s*\{", "{ // unchecked removed for safer arithmetic", fixed_code)
        highlighted_changes.append("Removed unchecked arithmetic block marker in favor of safer default arithmetic.")

    if fixed_code == code:
        highlighted_changes.append("Produced a secure rewrite plan and preserved the original contract where a safe mechanical patch was not certain.")

    return fixed_code, highlighted_changes
