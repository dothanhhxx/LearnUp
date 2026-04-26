"""
Tag Service — Business logic cho Tags.
"""
from repositories import tag_repository
from utils.exceptions import NotFoundException


def get_all(conn):
    """Lấy tất cả tags."""
    tags = tag_repository.find_all(conn)
    return {"success": True, "data": tags, "total": len(tags)}


def create_tag(name: str, conn):
    """Tạo tag mới."""
    tag_id = tag_repository.create(conn, name)
    return {"success": True, "message": "Tag created", "id": tag_id}


def delete_tag(tag_id: int, conn):
    """Xóa tag."""
    deleted = tag_repository.delete(conn, tag_id)
    if not deleted:
        raise NotFoundException(f"Tag with id '{tag_id}' not found")
    return {"success": True, "message": "Tag deleted"}


def update_tag(tag_id: int, name: str, conn):
    """Đổi tên tag."""
    existing = tag_repository.find_by_id(conn, tag_id)
    if not existing:
        raise NotFoundException(f"Tag with id '{tag_id}' not found")
    name = name.strip()
    if not name:
        from utils.exceptions import BadRequestException
        raise BadRequestException("Tag name cannot be empty")
    updated = tag_repository.update(conn, tag_id, name)
    return {"success": True, "message": "Tag updated"}

