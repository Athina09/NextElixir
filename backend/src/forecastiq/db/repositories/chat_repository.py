from __future__ import annotations

from sqlalchemy.orm import Session

from forecastiq.db.models import ChatMessage, ChatSession


class ChatRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_or_create_session(self, session_id: int | None) -> ChatSession:
        if session_id is not None:
            existing = self.session.get(ChatSession, session_id)
            if existing is not None:
                return existing
        chat_session = ChatSession()
        self.session.add(chat_session)
        self.session.commit()
        self.session.refresh(chat_session)
        return chat_session

    def add_message(self, *, session_id: int, role: str, text: str, payload: dict | None = None) -> ChatMessage:
        message = ChatMessage(session_id=session_id, role=role, text=text, payload=payload)
        self.session.add(message)
        self.session.commit()
        self.session.refresh(message)
        return message
