"""
Users Router — API endpoints cho User (login, register, profile, admin management).
Thin layer — chỉ nhận request, gọi service, trả response.
"""
from fastapi import APIRouter, Depends
from config.database import get_db
from schemas.user_schema import LoginRequest, RegisterRequest, AdminCreateUserRequest, UpdateRoleRequest
from services import user_service
from middleware.auth_middleware import get_current_user, require_admin
from repositories import user_repository

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.post("/login")
def login(request: LoginRequest, conn=Depends(get_db)):
    """Đăng nhập — trả về JWT token."""
    return user_service.login(request.email, request.password, conn)


@router.post("/register")
def register(request: RegisterRequest, conn=Depends(get_db)):
    """Đăng ký tài khoản mới."""
    return user_service.register(request.email, request.password, request.name, conn)


@router.get("/dashboard")
def get_dashboard(current_user=Depends(get_current_user), conn=Depends(get_db)):
    """Lấy thống kê dashboard của user hiện tại (vocabulary, quiz, recent articles)."""
    stats = user_repository.get_dashboard_stats(conn, current_user["sub"])
    return {"success": True, "data": stats}


@router.get("/profile")
def get_profile(current_user=Depends(get_current_user), conn=Depends(get_db)):
    """Lấy thông tin user hiện tại (protected)."""
    return user_service.get_profile(current_user["sub"], conn)


@router.get("")
@router.get("/")
def get_all_users(admin=Depends(require_admin), conn=Depends(get_db)):
    """Lấy danh sách tất cả users (admin only)."""
    users = user_repository.find_all(conn)
    for u in users:
        if u.get("created_at"):
            u["created_at"] = u["created_at"].isoformat()
    return {"success": True, "data": users, "total": len(users)}


@router.post("/admin-create")
def admin_create_user(
    request: AdminCreateUserRequest,
    admin=Depends(require_admin),
    conn=Depends(get_db)
):
    """Admin tạo user mới với role tuỳ chọn."""
    return user_service.admin_create_user(
        request.email, request.password, request.name, request.role, conn
    )


@router.delete("/{user_id}")
def admin_delete_user(
    user_id: int,
    admin=Depends(require_admin),
    conn=Depends(get_db)
):
    """Admin xóa user theo ID (admin only)."""
    return user_service.admin_delete_user(user_id, conn)


@router.patch("/{user_id}/role")
def admin_update_role(
    user_id: int,
    request: UpdateRoleRequest,
    admin=Depends(require_admin),
    conn=Depends(get_db)
):
    """Admin cập nhật role của user."""
    return user_service.admin_update_role(user_id, request.role, conn)
