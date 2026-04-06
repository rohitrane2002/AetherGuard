class ScoringEngine:
    def calculate(self, rule_issues: list[dict]) -> dict:
        # Start at 100
        score = 100
        
        # Deduct based on severity
        for issue in rule_issues:
            severity = issue.get("severity", "medium").lower()
            if severity == "high":
                score -= 35
            elif severity == "medium":
                score -= 15
            else:
                score -= 5
        
        # Clamp to 0-100
        score = max(0, min(100, score))
        
        # Determine overall severity
        if score < 40:
            overall_severity = "high"
        elif score < 75:
            overall_severity = "medium"
        else:
            overall_severity = "low"
            
        return {
            "score": score,
            "severity": overall_severity
        }
