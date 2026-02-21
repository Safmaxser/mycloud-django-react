from rest_framework import permissions


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Универсальное разрешение:
    1. Общий доступ — только для авторизованных.
    2. Доступ к объекту — администратор или владелец.
    """

    def has_permission(self, request, view) -> bool:  # type: ignore[override]
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj) -> bool:  # type: ignore[override]
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff:
            return True

        if obj == request.user:
            return True

        return getattr(obj, 'owner', None) == request.user
