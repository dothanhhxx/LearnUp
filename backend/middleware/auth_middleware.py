"""
Auth Middleware — JWT verification dependency cho FastAPI.
Dùng Depends(get_current_user) trong route để bảo vệ endpoint.
"""
from fastapi import Depends, Header
from typing import Optional
from services.auth_service import decode_token
from utils.exceptions import UnauthorizedException


def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """
    FastAPI dependency — trích xuất và xác thực JWT từ header.
    
    Usage trong router:
        @router.get("/protected")
        def protected_route(current_user = Depends(get_current_user)):
            return {"user_id": current_user["sub"]}
    """
    if not authorization:
        raise UnauthorizedException("Missing Authorization header")

    # Hỗ trợ cả "Bearer <token>" và "<token>"
    token = authorization
    if authorization.startswith("Bearer "):
        token = authorization[7:]

    try:
        payload = decode_token(token)
        return payload
    except ValueError as e:
        raise UnauthorizedException(str(e))


def get_optional_user(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    """
    Dependency tùy chọn — trả về user nếu có token, None nếu không.
    Dùng cho endpoint không bắt buộc đăng nhập.
    """
    if not authorization:
        return None

    token = authorization
    if authorization.startswith("Bearer "):
        token = authorization[7:]

    try:
        return decode_token(token)
    except ValueError:
        return None


def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Dependency — chỉ cho phép admin.
    
    Usage:
        @router.delete("/articles/{id}")
        def delete_article(id: str, admin = Depends(require_admin)):
            ...
    """
    if current_user.get("role") != "admin":
        from utils.exceptions import ForbiddenException
        raise ForbiddenException("Admin access required")
    return current_user
