from sqlalchemy.orm import Session

from models import AnalysisLog, User
from services.security_service import compute_confidence


def run_analysis_and_log(db: Session, analyzer, user: User, source: str) -> dict:
    result = analyzer.predict(source)
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
    return result
