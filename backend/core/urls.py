from django.conf import settings
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('api/', include('storage.urls')),
    path('api/', include('users.urls')),
]

if settings.DEBUG:
    import debug_toolbar

    urlpatterns = [
        path('admin/', admin.site.urls),
        path('__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns
