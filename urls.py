from django.urls import path
from . import views

urlpatterns = [
    # Admin Portal
    path('', views.dashboard_view, name='dashboard'),
    path('api/staff/', views.get_staff_data, name='staff_api'),
    
    # Lecturer Portal (THESE ARE THE CRITICAL LINES)
    path('lecturer/', views.lecturer_login_view, name='lecturer_login'),
    path('lecturer/dashboard/', views.lecturer_dashboard_view, name='lecturer_dashboard'),
    
    # Lecturer APIs
    path('api/lecturer/login/', views.lecturer_login, name='lecturer_login'),
    path('api/lecturer/profile/<str:staff_id>/', views.lecturer_profile, name='lecturer_profile'),

    path('api/admin-settings/', views.admin_settings_api, name='admin_settings_api'),

    # Public Student Directory
    path('directory/', views.public_directory_view, name='public_directory'),
    path('api/directory/', views.public_directory_api, name='public_directory_api'),
]