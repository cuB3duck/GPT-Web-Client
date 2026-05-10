from datetime import datetime

import httpx
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from sqlalchemy.orm import Session

from .auth import create_access_token, get_current_user, hash_password, verify_password
from .config import get_settings
from .database import Base, engine, get_db
from .models import Conversation, Message, User
from .schemas import (
    ChatRequest,
    ChatResponse,
    ConversationCreate,
    ConversationDetail,
    ConversationOut,
    GoogleLogin,
    Token,
    UserCreate,
    UserLogin,
    UserOut,
)


settings = get_settings()
app = FastAPI(title="ChatGPT Style Web Client")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)


def build_token_response(user: User) -> Token:
    return Token(access_token=create_access_token(str(user.id)), user=user)


def get_ollama_chat_response(messages: list[dict[str, str]]) -> str:
    try:
        response = httpx.post(
            f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/chat",
            json={
                "model": settings.OLLAMA_CHAT_MODEL,
                "messages": messages,
                "stream": False,
            },
            timeout=settings.OLLAMA_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
    except httpx.ConnectError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Could not connect to Ollama. Make sure Ollama is running and "
                f"{settings.OLLAMA_CHAT_MODEL} is installed."
            ),
        ) from exc
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Ollama returned an error: {exc.response.text}",
        ) from exc
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Ollama request failed: {exc}",
        ) from exc

    data = response.json()
    assistant_message = data.get("message", {})
    assistant_text = assistant_message.get("content")
    if not assistant_text:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Ollama returned an empty response",
        )
    return assistant_text


def get_user_conversation(db: Session, user_id: int, conversation_id: int) -> Conversation:
    conversation = db.get(Conversation, conversation_id)
    if not conversation or conversation.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return conversation


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/auth/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
def signup(payload: UserCreate, db: Session = Depends(get_db)) -> Token:
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    user = User(
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        name=payload.name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return build_token_response(user)


@app.post("/api/auth/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)) -> Token:
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    return build_token_response(user)


@app.post("/api/auth/google", response_model=Token)
def google_login(payload: GoogleLogin, db: Session = Depends(get_db)) -> Token:
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GOOGLE_CLIENT_ID is not configured",
        )

    try:
        info = google_id_token.verify_oauth2_token(
            payload.id_token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        ) from exc

    email = info.get("email")
    google_sub = info.get("sub")
    if not email or not google_sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google token is missing required identity claims",
        )

    user = db.query(User).filter(User.email == email.lower()).first()
    if not user:
        user = User(
            email=email.lower(),
            name=info.get("name"),
            google_sub=google_sub,
        )
        db.add(user)
    else:
        user.google_sub = user.google_sub or google_sub
        user.name = user.name or info.get("name")

    db.commit()
    db.refresh(user)
    return build_token_response(user)


@app.get("/api/auth/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@app.get("/api/conversations", response_model=list[ConversationOut])
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Conversation]:
    return (
        db.query(Conversation)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )


@app.post("/api/conversations", response_model=ConversationDetail, status_code=status.HTTP_201_CREATED)
def create_conversation(
    payload: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Conversation:
    conversation = Conversation(user_id=current_user.id, title=payload.title or "New chat")
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


@app.get("/api/conversations/{conversation_id}", response_model=ConversationDetail)
def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Conversation:
    return get_user_conversation(db, current_user.id, conversation_id)


@app.post("/api/chat", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ChatResponse:
    if payload.conversation_id:
        conversation = get_user_conversation(db, current_user.id, payload.conversation_id)
    else:
        conversation = Conversation(user_id=current_user.id, title=payload.message[:48])
        db.add(conversation)
        db.flush()

    history = [
        {"role": message.role, "content": message.content}
        for message in conversation.messages
        if message.role in {"user", "assistant", "system"}
    ]
    history.append({"role": "user", "content": payload.message})

    assistant_text = get_ollama_chat_response(
        [
            {"role": "system", "content": "You are a helpful assistant."},
            *history,
        ],
    )

    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=payload.message,
    )
    assistant_message = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=assistant_text,
    )
    conversation.updated_at = datetime.utcnow()
    if conversation.title == "New chat":
        conversation.title = payload.message[:48]

    db.add(user_message)
    db.add(assistant_message)
    db.commit()
    db.refresh(conversation)
    db.refresh(user_message)
    db.refresh(assistant_message)

    return ChatResponse(conversation=conversation, messages=[user_message, assistant_message])
