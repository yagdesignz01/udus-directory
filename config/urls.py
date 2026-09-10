from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from django.views.generic import RedirectView
from django.views.static import serve

urlpatterns = [
    path('', RedirectView.as_view(pattern_name='public_directory', permanent=False)),
    path('django-admin/', admin.site.urls),
    path('', include('staff_admin.urls')),
    # Small site, low upload volume: Django serves the volume-backed media files.
    path('media/<path:path>', serve, {'document_root': settings.MEDIA_ROOT}),
]
