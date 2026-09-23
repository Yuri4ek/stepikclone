from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User, UserRole
from app.slices.auth.schemas import LoginIn, RegisterIn, TokenOut, UserOut


def _user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
        last_seen_at=user.last_seen_at,
    )


def login(db: Session, data: LoginIn) -> TokenOut:
    user = db.scalars(select(User).where(User.email == data.email.lower())).first()
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(str(user.id), extra={"role": user.role.value})
    return TokenOut(access_token=token, user=_user_out(user))


def register(db: Session, data: RegisterIn) -> TokenOut:
    if data.role != UserRole.student.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only student self-registration")
    exists = db.scalars(select(User).where(User.email == data.email.lower())).first()
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = User(
        email=data.email.lower(),
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        role=UserRole.student,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(str(user.id), extra={"role": user.role.value})
    return TokenOut(access_token=token, user=_user_out(user))


def me(user: User) -> UserOut:
    return _user_out(user)
