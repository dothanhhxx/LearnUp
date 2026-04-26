"""
User Service — Business logic cho User (login, register).
"""
from repositories import user_repository
from services.auth_service import hash_password, verify_password, create_token
from utils.exceptions import UnauthorizedException, ConflictException, BadRequestException


def login(email: str, password: str, conn):
    """
    Xác thực user, trả về token + user info.
    Raises: UnauthorizedException nếu email/password sai.
    """
    user = user_repository.find_by_email(conn, email)

    if not user:
        raise UnauthorizedException("Invalid email or password. Please try again.")

    if not verify_password(password, user["password_hash"]):
        raise UnauthorizedException("Invalid email or password. Please try again.")

    token = create_token(user["id"], user["email"], user["role"])

    return {
        "status": "Success",
        "message": "Đăng nhập thành công",
        "token": token,
        "user": {
            "userId": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
        }
    }


def register(email: str, password: str, name: str, conn):
    """
    Đăng ký user mới.
    Raises: ConflictException nếu email đã tồn tại, BadRequestException nếu password quá ngắn.
    """
    # Validate password length
    if len(password) < 8:
        raise BadRequestException("Password must be at least 8 characters long.")

    # Validate name
    if not name or len(name.strip()) < 2:
        raise BadRequestException("Name must be at least 2 characters long.")

    # Check duplicate email
    existing = user_repository.find_by_email(conn, email)
    if existing:
        raise ConflictException("Email already registered.")

    # Hash password & create user
    hashed = hash_password(password)
    user_id = user_repository.create(conn, email, hashed, name.strip())

    token = create_token(user_id, email, "user")

    return {
        "status": "Success",
        "message": "Đăng ký thành công",
        "token": token,
        "user": {
            "userId": user_id,
            "email": email,
            "name": name.strip(),
            "role": "user",
        }
    }


def get_profile(user_id: int, conn):
    """Lấy thông tin user theo ID."""
    from utils.exceptions import NotFoundException

    user = user_repository.find_by_id(conn, user_id)
    if not user:
        raise NotFoundException("User not found")

    return {
        "userId": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
    }


def admin_create_user(email: str, password: str, name: str, role: str, conn):
    """Admin tạo user mới với role tùy chọn."""
    if len(password) < 8:
        raise BadRequestException("Password must be at least 8 characters long.")
    if not name or len(name.strip()) < 2:
        raise BadRequestException("Name must be at least 2 characters long.")
    if role not in ("user", "admin"):
        raise BadRequestException("Role must be 'user' or 'admin'.")

    existing = user_repository.find_by_email(conn, email)
    if existing:
        raise ConflictException("Email already registered.")

    hashed = hash_password(password)
    user_id = user_repository.create(conn, email, hashed, name.strip(), role)

    return {
        "success": True,
        "message": "User created successfully",
        "data": {
            "userId": user_id,
            "email": email,
            "name": name.strip(),
            "role": role,
        }
    }


def admin_delete_user(user_id: int, conn):
    """Admin xóa user theo ID."""
    from utils.exceptions import NotFoundException
    deleted = user_repository.delete(conn, user_id)
    if not deleted:
        raise NotFoundException("User not found.")
    return {"success": True, "message": "User deleted successfully"}


def admin_update_role(user_id: int, role: str, conn):
    """Admin cập nhật role của user."""
    if role not in ("user", "admin"):
        raise BadRequestException("Role must be 'user' or 'admin'.")
    updated = user_repository.update_role(conn, user_id, role)
    if not updated:
        from utils.exceptions import NotFoundException
        raise NotFoundException("User not found.")
    return {"success": True, "message": f"Role updated to '{role}'"}
