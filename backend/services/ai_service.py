from typing import AsyncIterator, List
import json

import httpx

from config import settings


def ai_is_configured() -> bool:
    return bool(settings.openai_api_key)


def _system_prompt() -> str:
    return (
        f"{settings.ai_system_prompt}\n"
        "You are operating inside AetherGuard, an AI smart contract security platform. "
        "When the user asks for fixes, prioritize precise Solidity-safe recommendations, "
        "keep changes minimal when possible, and explain risk in operator-friendly language. "
        "If recent analysis context is available, use it. Avoid vague advice and prefer specific secure coding steps."
    )


async def generate_chat_reply(messages: List[dict]) -> str:
    if not ai_is_configured():
        return (
            "AI chat is not configured yet. Add OPENROUTER_API_KEY or OPENAI_API_KEY to enable contract-aware vulnerability explanations and secure rewrites."
        )

    payload = {
        "model": settings.ai_model,
        "messages": [{"role": "system", "content": _system_prompt()}] + messages,
        "temperature": 0.15,
    }
    async with httpx.AsyncClient(timeout=45) as client:
        response = await client.post(
            f"{settings.ai_base_url.rstrip('/')}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.openai_api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": settings.ai_app_url,
                "X-Title": settings.ai_app_name,
            },
            json=payload,
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]


async def stream_chat_reply(messages: List[dict]) -> AsyncIterator[str]:
    if not ai_is_configured():
        yield "AI chat is not configured yet. Add OPENROUTER_API_KEY or OPENAI_API_KEY to enable contract-aware vulnerability explanations and secure rewrites."
        return

    payload = {
        "model": settings.ai_model,
        "messages": [{"role": "system", "content": _system_prompt()}] + messages,
        "temperature": 0.15,
        "stream": True,
    }
    
    async with httpx.AsyncClient(timeout=45) as client:
        async with client.stream(
            "POST",
            f"{settings.ai_base_url.rstrip('/')}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.openai_api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": settings.ai_app_url,
                "X-Title": settings.ai_app_name,
            },
            json=payload,
        ) as response:
            try:
                response.raise_for_status()
            except httpx.HTTPStatusError as e:
                await response.aread()
                yield f"Error checking intelligence stream (Status {response.status_code}): {response.text}"
                return

            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data_str = line[6:]
                    if data_str.strip() == "[DONE]":
                        break
                    try:
                        data = json.loads(data_str)
                        if "choices" in data and len(data["choices"]) > 0:
                            delta = data["choices"][0].get("delta", {})
                            if "content" in delta:
                                yield delta["content"]
                    except json.JSONDecodeError:
                        continue
