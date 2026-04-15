from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.jwt import blocklist_token, create_access_token
from app.auth.password import hash_password, verify_password
from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    ChangePassword,
    PasswordResetConfirm,
    PasswordResetRequest,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        role="recruit",
        department=data.department,
        start_date=data.start_date,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(user.id, user.role)
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/logout")
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
    current_user: User = Depends(get_current_user),
):
    blocklist_token(credentials.credentials)
    return {"message": "Logged out"}


@router.post("/password-reset")
async def request_password_reset(
    data: PasswordResetRequest, db: AsyncSession = Depends(get_db)
):
    # In a real app, this would send an email with a reset token.
    # For now, we just acknowledge the request.
    result = await db.execute(select(User).where(User.email == data.email))
    # Always return success to prevent email enumeration
    return {"message": "If the email exists, a reset link has been sent."}


@router.post("/password-reset/confirm")
async def confirm_password_reset(data: PasswordResetConfirm):
    # In a real app, this would validate the reset token and update the password.
    # For now, return a placeholder response.
    return {"message": "Password updated"}


@router.post("/change-password")
async def change_password(
    data: ChangePassword,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    current_user.password_hash = hash_password(data.new_password)
    await db.flush()
    return {"message": "Password changed successfully"}
