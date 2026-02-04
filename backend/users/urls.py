from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import JsonLoginView, JsonLogoutView, UserViewSet

app_name = 'users'

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', JsonLoginView.as_view(), name='login'),
    path('auth/logout/', JsonLogoutView.as_view(), name='logout'),
]
