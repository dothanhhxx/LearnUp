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


# ===== Change Password =====
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


# ===== Forgot / Reset Password =====
class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str
