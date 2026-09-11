from django.contrib import admin
from django.http import JsonResponse
from django.shortcuts import render

from .models import AcademicStaff

# Register the staff model in Django's built-in admin panel.
admin.site.register(AcademicStaff)


def dashboard_view(request):
    """Display the admin dashboard page."""
    return render(request, 'admin-dashboard-prototype.html')


def get_staff_data(request):
    """Send all staff records as JSON for the dashboard JavaScript."""

    # Get every staff record from the database.
    staff_records = AcademicStaff.objects.all()

    # Convert each database record into a simple dictionary.
    data = []
    for staff in staff_records:
        data.append({
            "id": staff.staff_id,
            "name": staff.name,
            "rank": staff.rank,
            "unit": staff.unit,
            "status": staff.status
        })

    return JsonResponse(data, safe=False)