from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class GoogleLogin(BaseModel):
    id_token: str


class UserOut(BaseModel):
    id: int
    email: EmailStr
    name: str | None = None

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class MessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationOut(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ConversationDetail(ConversationOut):
    messages: list[MessageOut] = []


class ConversationCreate(BaseModel):
    title: str | None = "New chat"


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    conversation_id: int | None = None


class ChatResponse(BaseModel):
    conversation: ConversationOut
    messages: list[MessageOut]
