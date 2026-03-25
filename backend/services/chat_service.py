from sqlalchemy import select
from sqlalchemy.orm import Session

from models import AnalysisLog, ChatMessage, User
from services.ai_service import generate_chat_reply
from services.security_service import snippet_from_code


async def chat_with_context(db: Session, user: User, prompt: str) -> dict:
    recent_messages = db.execute(
        select(ChatMessage).where(ChatMessage.user_id == user.id).order_by(ChatMessage.id.desc()).limit(8)
    ).scalars().all()
    recent_messages = list(reversed(recent_messages))

    last_scan = db.execute(
        select(AnalysisLog).where(AnalysisLog.user_id == user.id).order_by(AnalysisLog.id.desc()).limit(1)
    ).scalar_one_or_none()

    context_messages = []
    if last_scan is not None:
        context_messages.append(
            {
                "role": "system",
                "content": (
                    f"Last scan prediction: {last_scan.prediction}. "
                    f"Confidence: {last_scan.confidence:.3f}. "
                    f"Contract snippet: {snippet_from_code(last_scan.source_code)}"
                ),
            }
        )

    prompt_message = ChatMessage(user_id=user.id, role="user", content=prompt)
    db.add(prompt_message)
    db.commit()
    db.refresh(prompt_message)

    ai_messages = context_messages + [
        {"role": message.role, "content": message.content} for message in recent_messages
    ] + [{"role": "user", "content": prompt}]

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
