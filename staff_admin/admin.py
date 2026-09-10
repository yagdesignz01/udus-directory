from django.contrib import admin
from .models import AcademicStaff

# This makes your table visible in the Django admin panel
admin.site.register(AcademicStaff)

from django.shortcuts import render
from django.http import JsonResponse
from .models import AcademicStaff

# 1. Render the HTML dashboard
def dashboard_view(request):
    return render(request, 'admin-dashboard-prototype.html')

# 2. API to send data to your JavaScript
def get_staff_data(request):
    staff_records = AcademicStaff.objects.all()
    
    # Format the data into a list of dictionaries for JavaScript
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