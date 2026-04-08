import json
import logging
from typing import List, Optional

import requests
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from config import settings
from models import AnalysisLog

logger = logging.getLogger(__name__)

class SocialAgent:
    def __init__(self, db: Session):
        self.db = db
        self.api_url = settings.ai_base_url
        self.api_key = settings.openai_api_key

    def generate_daily_content(self) -> dict:
        """Generates viral Twitter/LinkedIn content based on platform analytics."""
        
        # 1. Fetch recent scan stats for content context
        total_scans = self.db.execute(select(func.count(AnalysisLog.id))).scalar_one()
        recent_scan = self.db.execute(select(AnalysisLog).order_by(AnalysisLog.id.desc())).scalars().first()
        
        context = {
            "total_audits_performed": total_scans,
            "latest_vuln_detected": recent_scan.prediction if recent_scan else "Reentrancy",
            "confidence": f"{getattr(recent_scan, 'confidence', 0.95)*100:.1f}%"
        }

        prompt = f"""
        You are a Growth Hacker and Web3 Security Expert. 
        Create high-velocity social media content for AetherGuard (AI Smart Contract Scanner).
        
        CONTEXT:
        - Total scans performed: {context['total_audits_performed']}
        - Latest vulnerability detected in system: {context['latest_vuln_detected']}
        
        OUTPUT JSON FORMAT:
        - twitter_thread: A list of 5 tweets. Start with a hook about the vulnerability. Focus on code.
        - linkedin_post: A single long-form insightful post for developers/Founders.
        - instagram_carousel_titles: List of 7 slide titles for a 'How to fix {context['latest_vuln_detected']}' carousel.
        
        STYLE: Premium, Minimal, Developer-focused. No emojis. Bold, authoritative language.
        """

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": settings.ai_model,
            "messages": [{"role": "user", "content": prompt}]
        }

        try:
            response = requests.post(f"{self.api_url}/chat/completions", headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            
            # Robust JSON cleaning: Find the first { and last }
            start = content.find("{")
            end = content.rfind("}") + 1
            if start == -1 or end == 0:
                raise ValueError(f"No JSON found in social content: {content[:100]}...")

            clean_json = content[start:end]
            return json.loads(clean_json)
        except Exception as e:
            logger.error(f"Social Agent failed: {str(e)}")
            return {"error": str(e), "raw_response": content if 'content' in locals() else None}
