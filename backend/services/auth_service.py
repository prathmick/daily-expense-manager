import hashlib
import secrets
from datetime import datetime, timedelta

import bcrypt
from fastapi import HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from config import SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
from models import User, RefreshToken
from schemas import TokenResponse, UserCreate

ALGORITHM = "HS256"


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def _hash_token(token: str) -> str:
    """SHA-256 hash a raw token string for safe storage."""
    return hashlib.sha256(token.encode()).hexdigest()


class AuthService:

    # ── Registration ──────────────────────────────────────────────────────────

    def register_user(self, db: Session, user_create: UserCreate) -> User:
        existing = db.query(User).filter(User.email == user_create.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )
        password_hash = _hash_password(user_create.password)
        user = User(
            email=user_create.email,
            display_name=user_create.display_name,
            password_hash=password_hash,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    # ── Authentication ────────────────────────────────────────────────────────

    def authenticate_user(self, db: Session, email: str, password: str) -> User:
        user = db.query(User).filter(User.email == email).first()
        if not user or not _verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user

    # ── Token creation ────────────────────────────────────────────────────────

    def create_tokens(self, db: Session, user_id: int) -> TokenResponse:
        access_token = self._create_access_token(user_id)
        raw_refresh_token = self._create_raw_refresh_token()

        expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        db_token = RefreshToken(
            user_id=user_id,
            token_hash=_hash_token(raw_refresh_token),
            expires_at=expires_at,
            revoked=False,
        )
        db.add(db_token)
        db.commit()

        return TokenResponse(
            access_token=access_token,
            refresh_token=raw_refresh_token,
        )

    # ── Token refresh ─────────────────────────────────────────────────────────

    def refresh_access_token(self, db: Session, refresh_token: str) -> TokenResponse:
        token_hash = _hash_token(refresh_token)
        db_token = (
            db.query(RefreshToken)
            .filter(RefreshToken.token_hash == token_hash)
            .first()
        )

        if (
            db_token is None
            or db_token.revoked
            or db_token.expires_at < datetime.utcnow()
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Rotate: revoke old token and issue new pair
        db_token.revoked = True
        db.commit()

        return self.create_tokens(db, db_token.user_id)

    # ── Token revocation ──────────────────────────────────────────────────────

    def revoke_refresh_token(self, db: Session, refresh_token: str) -> None:
        token_hash = _hash_token(refresh_token)
        db_token = (
            db.query(RefreshToken)
            .filter(RefreshToken.token_hash == token_hash)
            .first()
        )
        if db_token and not db_token.revoked:
            db_token.revoked = True
            db.commit()

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _create_access_token(self, user_id: int) -> str:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        payload = {"sub": str(user_id), "exp": expire}
        return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    def _create_raw_refresh_token(self) -> str:
        return secrets.token_urlsafe(64)


auth_service = AuthService()
