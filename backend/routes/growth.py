from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from database import get_db
from models import GrowthPage, User
from services.growth.seo_agent import SEOAgent
from services.growth.social_agent import SocialAgent
from typing import List, Optional

router = APIRouter(prefix="/growth", tags=["growth"])

@router.get("/page/{slug}")
async def get_growth_page(slug: str, db: Session = Depends(get_db)):
    page = db.execute(select(GrowthPage).where(GrowthPage.slug == slug)).scalar_one_or_none()
    if not page:
        raise HTTPException(status_code=404, detail="Growth page not found")
    return page

@router.post("/generate-social")
async def generate_social(db: Session = Depends(get_db)):
    """Triggers the Social Agent to write your daily Twitter/LinkedIn posts."""
    agent = SocialAgent(db)
    return agent.generate_daily_content()

@router.get("/hub")
async def get_hub_pages(
    category: Optional[str] = Query(None), 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    query = select(GrowthPage)
    if category:
        query = query.where(GrowthPage.category == category)
    
    pages = db.execute(query.limit(limit)).scalars().all()
    return pages

@router.post("/trigger-seo-batch")
async def trigger_seo_batch(db: Session = Depends(get_db)):
    """Triggers the SEO Agent to generate the standard encyclopedia batch."""
    agent = SEOAgent(db)
    agent.automate_encyclopedia()
    return {"status": "Batch generation triggered"}

@router.get("/stats")
async def get_growth_stats(db: Session = Depends(get_db)):
    total_pages = db.execute(select(func.count(GrowthPage.id))).scalar_one()
    pro_users = db.execute(select(func.count(User.id)).where(User.is_pro == True)).scalar_one()
    return {
        "seo_pages_live": total_pages,
        "pro_users": pro_users,
        "growth_efficiency": "High"
    }
