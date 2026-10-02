from . import views
from django.urls import path

# This list connects each web address to the function that handles it.

urlpatterns = [
    # Admin pages for login, logout, and staff management.
    path('admin-login/', views.admin_login, name='admin_login'),
    path('admin-logout/', views.admin_logout, name='admin_logout'),
    path('admin-dashboard/', views.admin_dashboard_view, name='admin_dashboard'),

    # Lecturer pages for login and the lecturer dashboard.
    path('lecturer-login/', views.lecturer_login_view, name='lecturer_login_view'),
    path('lecturer-dashboard/', views.lecturer_dashboard_view, name='lecturer_dashboard_view'),

    # Public page that anyone can visit to view the directory.
    path('homepage/', views.public_directory_view, name='public_directory'),

    # API endpoints used by the JavaScript files in the frontend.
    path('api/staff/', views.get_staff_data, name='staff_api'),
    path('api/lecturer/login/', views.lecturer_login, name='lecturer_login'),
    path('api/lecturer/profile/<str:staff_id>/', views.lecturer_profile, name='lecturer_profile'),
    path('api/admin-settings/', views.admin_settings_api, name='admin_settings_api'),
    path('api/directory/', views.public_directory_api, name='public_directory_api'),
]