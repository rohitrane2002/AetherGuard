from sqlalchemy import select
from sqlalchemy.orm import Session

from models import AnalysisLog, ChatMessage, User
from services.ai_service import generate_chat_reply, stream_chat_reply
from services.security_service import snippet_from_code


def get_chat_history(db: Session, user: User, limit: int = 24) -> list[dict]:
    messages = db.execute(
        select(ChatMessage).where(ChatMessage.user_id == user.id).order_by(ChatMessage.id.desc()).limit(limit)
    ).scalars().all()
    return [
        {"role": message.role, "content": message.content, "created_at": message.created_at.isoformat()}
        for message in reversed(messages)
    ]


def _build_context_messages(db: Session, user: User, prompt: str) -> tuple[list[dict], ChatMessage]:
    recent_messages = db.execute(
        select(ChatMessage).where(ChatMessage.user_id == user.id).order_by(ChatMessage.id.desc()).limit(10)
    ).scalars().all()
    recent_messages = list(reversed(recent_messages))

    recent_scans = db.execute(
        select(AnalysisLog).where(AnalysisLog.user_id == user.id).order_by(AnalysisLog.id.desc()).limit(3)
    ).scalars().all()

    context_messages: list[dict] = []
    if recent_scans:
        summaries = []
        for scan in recent_scans:
            summaries.append(
                f"Scan #{scan.id}: prediction={scan.prediction}, confidence={scan.confidence:.3f}, snippet={snippet_from_code(scan.source_code, 160)}"
            )
        context_messages.append(
            {
                "role": "system",
                "content": "Recent AetherGuard scans:\n" + "\n".join(summaries),
            }
        )

    prompt_message = ChatMessage(user_id=user.id, role="user", content=prompt)
    db.add(prompt_message)
    db.commit()
    db.refresh(prompt_message)

    ai_messages = context_messages + [
        {"role": message.role, "content": message.content} for message in recent_messages
    ] + [{"role": "user", "content": prompt}]
    return ai_messages, prompt_message


async def chat_with_context(db: Session, user: User, prompt: str) -> dict:
    ai_messages, prompt_message = _build_context_messages(db, user, prompt)
    reply = await generate_chat_reply(ai_messages)
    reply_message = ChatMessage(user_id=user.id, role="assistant", content=reply)
    db.add(reply_message)
    db.commit()
    db.refresh(reply_message)

    return {
        "reply": reply,
        "messages": [
            {"role": "user", "content": prompt_message.content, "created_at": prompt_message.created_at.isoformat()},
            {"role": "assistant", "content": reply_message.content, "created_at": reply_message.created_at.isoformat()},
        ],
    }


async def stream_chat_with_context(db: Session, user: User, prompt: str):
    ai_messages, prompt_message = _build_context_messages(db, user, prompt)
    chunks: list[str] = []
    async for chunk in stream_chat_reply(ai_messages):
        chunks.append(chunk)
        yield chunk

    reply = "".join(chunks).strip()
    reply_message = ChatMessage(user_id=user.id, role="assistant", content=reply)
    db.add(reply_message)
    db.commit()
    db.refresh(reply_message)
