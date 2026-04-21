from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from database import get_db
from schemas import UserCreate, UserOut, TokenResponse
from services.auth_service import auth_service

router = APIRouter()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_create: UserCreate, db: Session = Depends(get_db)):
    user = auth_service.register_user(db, user_create)
    return user


@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = auth_service.authenticate_user(db, body.email, body.password)
    return auth_service.create_tokens(db, user.id)


@router.post("/refresh", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    return auth_service.refresh_access_token(db, body.refresh_token)


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(body: LogoutRequest, db: Session = Depends(get_db)):
    auth_service.revoke_refresh_token(db, body.refresh_token)
    return {"message": "Logged out successfully"}
