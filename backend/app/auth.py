from datetime import datetime, timedelta, timezone
import hashlib

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from .config import get_settings
from .database import get_db
from .models import User


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
settings = get_settings()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_password_digest(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str | None) -> bool:
    if not hashed_password:
        return False
    try:
        return bcrypt.checkpw(_password_digest(plain_password), hashed_password.encode("utf-8"))
    except ValueError:
        return False


def _password_digest(password: str) -> bytes:
    # bcrypt accepts up to 72 bytes; pre-hashing avoids silent truncation and long-password errors.
    return hashlib.sha256(password.encode("utf-8")).hexdigest().encode("utf-8")


def create_access_token(subject: str) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": subject, "exp": expires_at}
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_error
    except JWTError as exc:
        raise credentials_error from exc

    user = db.get(User, int(user_id))
    if not user or not user.is_active:
        raise credentials_error
    return user
