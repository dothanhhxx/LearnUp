"""
User Schemas — Request/Response models cho User & Auth.
"""
from pydantic import BaseModel, EmailStr
from typing import Optional


# ===== Auth Requests =====
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str


# ===== Admin User Management =====
class AdminCreateUserRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "user"


class UpdateRoleRequest(BaseModel):
    role: str


# ===== Auth Responses =====
class UserResponse(BaseModel):
    userId: int
    email: str
    name: str
    role: str


class TokenResponse(BaseModel):
    status: str = "Success"
    message: str = "Đăng nhập thành công"
    token: str
    user: UserResponse

