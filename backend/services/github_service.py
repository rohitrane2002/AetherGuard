"""GitHub API integration for repo scanning."""

import httpx
from typing import Optional


GITHUB_API_BASE = "https://api.github.com"


async def fetch_github_user(access_token: str) -> dict:
    """Fetch the authenticated GitHub user's profile."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{GITHUB_API_BASE}/user",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github+json",
            },
        )
        resp.raise_for_status()
        return resp.json()


async def fetch_github_repos(access_token: str, page: int = 1, per_page: int = 30) -> list[dict]:
    """Fetch the authenticated user's repositories."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{GITHUB_API_BASE}/user/repos",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github+json",
            },
            params={
                "sort": "updated",
                "direction": "desc",
                "per_page": per_page,
                "page": page,
                "type": "owner",
            },
        )
        resp.raise_for_status()
        repos = resp.json()
        return [
            {
                "id": r["id"],
                "name": r["name"],
                "full_name": r["full_name"],
                "description": r.get("description") or "",
                "language": r.get("language") or "",
                "stars": r.get("stargazers_count", 0),
                "updated_at": r.get("updated_at", ""),
                "private": r.get("private", False),
                "default_branch": r.get("default_branch", "main"),
            }
            for r in repos
        ]


async def fetch_security_files(access_token: str, owner: str, repo: str, branch: str = "main") -> list[dict]:
    """Recursively find all security-relevant files (.sol, .rs, .move, .go) in a repository."""
    extensions = {".sol", ".rs", ".move", ".go", ".cairo"}
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(
            f"{GITHUB_API_BASE}/repos/{owner}/{repo}/git/trees/{branch}",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github+json",
            },
            params={"recursive": "1"},
        )
        resp.raise_for_status()
        tree = resp.json().get("tree", [])

        security_files = [
            {"path": item["path"], "sha": item["sha"], "size": item.get("size", 0)}
            for item in tree
            if item["type"] == "blob" and any(item["path"].endswith(ext) for ext in extensions)
        ]
        return security_files


async def fetch_file_content(access_token: str, owner: str, repo: str, path: str) -> Optional[str]:
    """Fetch raw file content from a GitHub repository."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(
            f"{GITHUB_API_BASE}/repos/{owner}/{repo}/contents/{path}",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github.raw+json",
            },
        )
        if resp.status_code != 200:
            return None
        return resp.text
