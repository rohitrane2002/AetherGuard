from sqlalchemy.orm import Session

from models import AnalysisLog, User
from services.security_service import (
    build_analysis_summary,
    build_autofix_preview,
    build_fix_suggestions,
    compute_confidence,
    compute_risk_score,
    infer_safe_patterns,
    infer_vulnerability_findings,
)


def run_analysis_and_log(db: Session, analyzer, user: User, source: str) -> dict:
    result = analyzer.predict(source)
    findings = infer_vulnerability_findings(source)
    safe_patterns = infer_safe_patterns(source)
    risk_score = compute_risk_score(result["prediction"], result["prob_vulnerable"], findings)
    confidence = compute_confidence(result["prob_secure"], result["prob_vulnerable"])
    log_entry = AnalysisLog(
        user_id=user.id,
        user_email=user.email,
        source_code=source,
        prediction=result["prediction"],
        prob_secure=result["prob_secure"],
        prob_vulnerable=result["prob_vulnerable"],
        confidence=confidence,
        model_source=result["model_source"],
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)

    result["email"] = user.email
    result["log_id"] = log_entry.id
    result["confidence"] = confidence
    result["risk_score"] = risk_score
    result["findings"] = findings
    result["safe_patterns"] = safe_patterns
    result["summary"] = build_analysis_summary(result["prediction"], risk_score, findings, safe_patterns)
    result["fix_suggestions"] = build_fix_suggestions(findings)
    result["autofix_preview"] = build_autofix_preview(findings, safe_patterns)
    return result
