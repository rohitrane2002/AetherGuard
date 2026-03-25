from typing import List

import httpx

from config import settings


def ai_is_configured() -> bool:
    return bool(settings.openai_api_key)


async def generate_chat_reply(messages: List[dict]) -> str:
    if not ai_is_configured():
        return (
            "AI chat is not configured yet. Add OPENAI_API_KEY to enable vulnerability explanations and fix suggestions."
        )

    payload = {
        "model": settings.ai_model,
        "messages": [{"role": "system", "content": settings.ai_system_prompt}] + messages,
        "temperature": 0.2,
    }
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{settings.ai_base_url.rstrip('/')}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.openai_api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
