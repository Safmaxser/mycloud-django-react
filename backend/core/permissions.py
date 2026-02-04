from rest_framework import permissions


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Универсальное разрешение: доступ разрешен администратору
    или самому владельцу объекта.
    """

    def has_object_permission(self, request, view, obj) -> bool:  # type: ignore[override]
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff:
            return True

        if obj == request.user:
            return True

        return getattr(obj, 'owner', None) == request.user
