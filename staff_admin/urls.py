from django.urls import path
from . import views

urlpatterns = [
    # Super Admin Routes
    path('admin-login/', views.admin_login, name='admin_login'),
    path('admin-logout/', views.admin_logout, name='admin_logout'),
    path('admin-dashboard/', views.admin_dashboard_view, name='admin_dashboard'),
    
    # Lecturer Routes
    path('lecturer-login/', views.lecturer_login_view, name='lecturer_login_view'),
    path('lecturer-dashboard/', views.lecturer_dashboard_view, name='lecturer_dashboard_view'),
    
    # Public Directory Route (Homepage)
    path('', views.public_directory_view, name='public_directory'),
    
    # API Endpoints (For your JavaScript frontend)
    path('api/staff/', views.get_staff_data, name='staff_api'),
    path('api/lecturer/login/', views.lecturer_login, name='lecturer_login'),
    path('api/lecturer/profile/<str:staff_id>/', views.lecturer_profile, name='lecturer_profile'),
    path('api/admin-settings/', views.admin_settings_api, name='admin_settings_api'),
    path('api/directory/', views.public_directory_api, name='public_directory_api'),
]