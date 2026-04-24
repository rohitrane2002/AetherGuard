import httpx
import logging
import base64
import asyncio
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import select

from auth import get_current_user
from database import get_db
from models import User, AnalysisLog
from services.security_service import decrypt_secret
from rule_engine import RuleEngine
from ai_engine import AIEngine
from scoring import ScoringEngine
from services.usage_service import increment_usage, get_user_usage

router = APIRouter(prefix="/github", tags=["github"])
logger = logging.getLogger(__name__)

GITHUB_API_URL = "https://api.github.com"

async def get_github_client(user: User):
    if not user.github_access_token:
        raise HTTPException(status_code=400, detail="GitHub account not linked")
    
    token = decrypt_secret(user.github_access_token)
    return httpx.AsyncClient(
        headers={
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "AetherGuard-Scanner"
        }
    )

@router.get("/repos")
async def list_repos(current_user: User = Depends(get_current_user)):
    try:
        async with await get_github_client(current_user) as client:
            # Fetch user's repos
            resp = await client.get(f"{GITHUB_API_URL}/user/repos?sort=updated&per_page=100")
            resp.raise_for_status()
            repos_data = resp.json()
            
            repos = []
            for r in repos_data:
                repos.append({
                    "id": r["id"],
                    "name": r["name"],
                    "full_name": r["full_name"],
                    "description": r.get("description", ""),
                    "language": r.get("language", ""),
                    "stars": r.get("stargazers_count", 0),
                    "updated_at": r["updated_at"],
                    "private": r["private"],
                    "default_branch": r["default_branch"]
                })
            
            return {
                "github_username": current_user.github_username,
                "repos": repos
            }
    except httpx.HTTPStatusError as exc:
        logger.error(f"GitHub API error: {exc.response.text}")
        raise HTTPException(status_code=exc.response.status_code, detail="Failed to fetch repositories from GitHub")
    except Exception as exc:
        logger.exception("Failed to list GitHub repos")
        raise HTTPException(status_code=500, detail=str(exc))

@router.get("/repos/{owner}/{repo:path}/sol-files")
async def list_sol_files(
    owner: str, 
    repo: str, 
    branch: str = "main",
    current_user: User = Depends(get_current_user)
):
    full_name = f"{owner}/{repo}"
    try:
        async with await get_github_client(current_user) as client:
            # Recursive tree search for .sol files
            # First get the branch sha (to handle cases where default branch isn't main)
            branch_resp = await client.get(f"{GITHUB_API_URL}/repos/{full_name}/branches/{branch}")
            branch_resp.raise_for_status()
            tree_sha = branch_resp.json()["commit"]["sha"]
            
            # Get the recursive tree
            tree_resp = await client.get(f"{GITHUB_API_URL}/repos/{full_name}/git/trees/{tree_sha}?recursive=1")
            tree_resp.raise_for_status()
            tree_data = tree_resp.json()
            
            sol_files = []
            for item in tree_data.get("tree", []):
                if item["type"] == "blob" and item["path"].endswith(".sol"):
                    sol_files.append({
                        "path": item["path"],
                        "sha": item["sha"],
                        "size": item.get("size", 0)
                    })
            
            return {"files": sol_files}
    except httpx.HTTPStatusError as exc:
        logger.error(f"GitHub API error: {exc.response.text}")
        raise HTTPException(status_code=exc.response.status_code, detail="Failed to fetch files from GitHub")
    except Exception as exc:
        logger.exception(f"Failed to list .sol files for {full_name}")
        raise HTTPException(status_code=500, detail=str(exc))

@router.post("/repos/{owner}/{repo:path}/scan")
async def scan_github_file(
    owner: str,
    repo: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    full_name = f"{owner}/{repo}"
    path = payload.get("path")
    if not path:
        raise HTTPException(status_code=400, detail="File path is required")
        
    try:
        # Check usage
        usage = get_user_usage(db, current_user)
        if usage["remaining_today"] <= 0:
            raise HTTPException(status_code=403, detail=f"Daily analysis limit reached for the {current_user.plan} plan")

        async with await get_github_client(current_user) as client:
            # Fetch file content
            content_resp = await client.get(f"{GITHUB_API_URL}/repos/{full_name}/contents/{path}")
            content_resp.raise_for_status()
            content_data = content_resp.json()
            
            if content_data.get("encoding") == "base64":
                raw_content = base64.b64decode(content_data["content"]).decode("utf-8")
            else:
                raw_content = content_data["content"]
            
        # Analysis logic (matching /analyze endpoint)
        rule_engine = RuleEngine()
        ai_engine = AIEngine()
        score_engine = ScoringEngine()

        # Simulated steps for UX consistency
        await asyncio.sleep(0.3)
        rule_issues = rule_engine.analyze(raw_content)
        
        await asyncio.sleep(0.4)
        semantic_issues = ai_engine.semantic_logic_review(raw_content)
        all_issues = rule_issues + semantic_issues
        
        score_data = score_engine.calculate(all_issues)
        ai_result = ai_engine.analyze_code(raw_content, all_issues)
        
        findings = []
        for issue in all_issues:
            name = issue.get("name") or issue.get("label") or "Detected Vulnerability"
            findings.append({
                "slug": issue.get("id", name.lower().replace(" ", "-")),
                "label": name,
                "severity": issue.get("severity", "medium"),
                "confidence": 0.95 if "id" in issue else 0.82,
                "summary": issue.get("description") or issue.get("summary") or "Vulnerability detected.",
                "recommendation": issue.get("recommendation") or "Review sensitive logic.",
            })

        # Log to DB
        analysis_log = AnalysisLog(
            user_id=current_user.id,
            user_email=current_user.email,
            source_code=raw_content,
            prediction="vulnerable" if all_issues else "secure",
            prob_secure=1.0 - (score_data["score"]/100.0),
            prob_vulnerable=score_data["score"]/100.0,
            confidence=0.95 if rule_issues else 0.85,
            model_source="hybrid-modular-v1",
        )
        db.add(analysis_log)
        db.commit()
        db.refresh(analysis_log)

        increment_usage(db, current_user)

        return {
            "score": score_data["score"],
            "severity": score_data["severity"],
            "issues": [f["label"] for f in findings],
            "findings": findings,
            "file_path": path,
            "explanation": ai_result.get("explanation", "Analysis complete."),
            "summary": ai_result.get("explanation", "Analysis summary."),
            "log_id": analysis_log.id
        }

    except httpx.HTTPStatusError as exc:
        logger.error(f"GitHub API error: {exc.response.text}")
        raise HTTPException(status_code=exc.response.status_code, detail="Failed to fetch file content from GitHub")
    except Exception as exc:
        logger.exception(f"Failed to scan file {path} in {full_name}")
        raise HTTPException(status_code=500, detail=str(exc))
