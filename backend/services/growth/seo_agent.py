import json
import logging
from typing import List, Optional

import requests
from sqlalchemy.orm import Session
from sqlalchemy import select

from config import settings
from models import GrowthPage
from database import SessionLocal

logger = logging.getLogger(__name__)

VULNERABILITY_TOPICS = [
    "Reentrancy",
    "Integer Overflow and Underflow",
    "Unexpected Ether",
    "Delegatecall to Untrusted Callee",
    "Default Visibilities",
    "Entropy Illusion",
    "External Contract Referencing",
    "Short Address Attack",
    "Unchecked CALL Return Values",
    "Race Conditions / Frontrunning",
    "Timestamp Dependence",
    "Access Control Failures",
    "Flash Loan Attacks",
    "Signature Malleability",
]

class SEOAgent:
    def __init__(self, db: Session):
        self.db = db
        self.api_url = settings.ai_base_url
        self.api_key = settings.openai_api_key

    def generate_page(self, topic: str, category: str = "audit") -> Optional[GrowthPage]:
        """Generates a high-quality pSEO page for a specific topic."""
        slug = topic.lower().replace(" ", "-").replace("/", "-")
        
        # Check if already exists
        existing = self.db.execute(select(GrowthPage).where(GrowthPage.slug == slug)).scalar_one_or_none()
        if existing:
            logger.info(f"Page for {topic} already exists. Skipping.")
            return existing

        prompt = f"""
        You are a Senior Web3 Security Researcher and SEO Strategist.
        Generate a comprehensive, developer-focused, premium technical guide for the smart contract vulnerability: {topic}.
        
        The output must be in JSON format with the following keys:
        - title: An eye-catching SEO title.
        - meta_description: A compelling 160-char meta description.
        - keywords: A comma-separated list of 5-8 relevant keywords.
        - content_html: A deep-dive article in semantic HTML (using h2, h3, p, pre/code for examples). 
          Include: What is it, Example code (vulnerable), How to fix it, Real-world examples.
        
        Style: Minimalist, authoritative, professional. Avoid fluff. Focus on Solidity.
        """

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "X-Title": "AetherGuard Growth Engine",
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
                raise ValueError(f"No JSON object found in AI response: {content[:100]}...")
                
            clean_json = content[start:end]
            page_data = json.loads(clean_json)
            
            new_page = GrowthPage(
                slug=slug,
                title=page_data["title"],
                meta_description=page_data["meta_description"],
                keywords=page_data["keywords"],
                content_html=page_data["content_html"],
                category=category,
                author_ai_name="AetherGuard Security Agent"
            )
            
            self.db.add(new_page)
            self.db.commit()
            self.db.refresh(new_page)
            logger.info(f"Successfully generated pSEO page: {slug}")
            return new_page
            
        except Exception as e:
            logger.error(f"Failed to generate pSEO page for {topic}: {str(e)}")
            return None

    def automate_encyclopedia(self):
        """Batch generates pages for all major vulnerability topics using a fresh session if needed."""
        # Use existing session or create a new one for long-running background tasks
        session_to_use = self.db if self.db else SessionLocal()
        
        try:
            for topic in VULNERABILITY_TOPICS:
                self.db = session_to_use
                self.generate_page(topic)
        finally:
            if not self.db: # Only close if we created it here
                session_to_use.close()
