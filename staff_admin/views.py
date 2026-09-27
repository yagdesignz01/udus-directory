import json
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib import messages
from django.contrib.auth.hashers import check_password
from .models import AcademicStaff, SystemAdmin

def get_image_url(image):
    if not image:
        return ""
    try:
        return image.url
    except ValueError:
        return ""

def admin_password_is_correct(admin, password):
    if not admin:
        return False
    return admin.password == password or check_password(password, admin.password)

def get_staff_profile_data(staff):
    return {
        "name": staff.name.title(), # Forces Title Case
        "title": staff.title,
        "profile_image": get_image_url(staff.profile_image),
        "highest_qualification": staff.highest_qualification or "",
        "courses_taught": staff.courses_taught or "",
        "specializations": staff.specializations or "",
        "administrative_roles": staff.administrative_roles or "",
        "building": staff.building or "",
        "floor": staff.floor or "",
        "office_number": staff.office_number or "",
        "guidance": staff.guidance or "",
        "email": staff.email or "",
        "whatsapp": staff.whatsapp or "",
        "working_hours": staff.working_hours or "",
    }

def admin_login(request):
    if 'admin_id' in request.session:
        return redirect('admin_dashboard')

    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        admin = SystemAdmin.objects.filter(email=email).first()
        password_is_correct = admin_password_is_correct(admin, password)

        if password_is_correct:
            request.session['admin_id'] = admin.id
            request.session.modified = True
            return redirect('admin_dashboard')
        else:
            messages.error(request, 'Invalid email or password.')

    return render(request, 'admin-login.html')

def admin_logout(request):
    request.session.flush()
    return redirect('admin_login')

def admin_dashboard_view(request):
    if 'admin_id' not in request.session:
        return redirect('admin_login')
    current_admin = SystemAdmin.objects.get(id=request.session['admin_id'])
    return render(request, 'admin-dashboard-prototype.html', {'admin': current_admin})

def lecturer_login_view(request):
    return render(request, 'lecturer-login.html')

def lecturer_dashboard_view(request):
    return render(request, 'lecturer-dashboard.html')

@csrf_exempt
def lecturer_login(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        input_id = str(data.get('staff_id', '')).strip()
        input_pw = str(data.get('password', '')).strip()
        staff = AcademicStaff.objects.filter(staff_id=input_id).first()

        if staff:
            # Bulletproof check: handles None types and accidental spaces in the database
            if staff.status and staff.status.strip().lower() == 'suspended':
                return JsonResponse(
                    {"error": "Account suspended. Please contact the administrator."},
                    status=403
                )
            
            if str(staff.password).strip() == input_pw:
                return JsonResponse({"success": True, "message": "Login successful", "staff_id": staff.staff_id})
            else:
                return JsonResponse({"error": "Invalid Staff ID or Password"}, status=401)
        else:
            return JsonResponse({"error": "Invalid Staff ID or Password"}, status=401)

@csrf_exempt
def lecturer_profile(request, staff_id):
    staff = AcademicStaff.objects.filter(staff_id=staff_id).first()
    if not staff:
        return JsonResponse({"error": "Staff not found"}, status=404)

    if request.method == 'GET':
        return JsonResponse(get_staff_profile_data(staff))

    elif request.method == 'POST':
        staff.title = request.POST.get('title', staff.title)
        staff.highest_qualification = request.POST.get('highest_qualification', staff.highest_qualification)
        staff.courses_taught = request.POST.get('courses_taught', staff.courses_taught)
        staff.specializations = request.POST.get('specializations', staff.specializations)
        staff.administrative_roles = request.POST.get('administrative_roles', staff.administrative_roles)
        staff.building = request.POST.get('building', staff.building)
        staff.floor = request.POST.get('floor', staff.floor)
        staff.office_number = request.POST.get('office_number', staff.office_number)
        staff.guidance = request.POST.get('guidance', staff.guidance)
        staff.working_hours = request.POST.get('working_hours', staff.working_hours)
        
        # Safely handle unique fields so empty strings don't crash the database
        email_input = request.POST.get('email', '').strip()
        staff.email = email_input if email_input else None

        whatsapp_input = request.POST.get('whatsapp', '').strip()
        staff.whatsapp = whatsapp_input if whatsapp_input else None
        

        new_password = request.POST.get('password', '').strip()
        if new_password:
            staff.password = new_password

        if 'profile_image' in request.FILES:
            staff.profile_image = request.FILES['profile_image']

        staff.save()
        return JsonResponse({"success": True, "message": "Profile updated successfully!"})

@csrf_exempt
def get_staff_data(request):
    if request.method == 'GET':
        staff_records = AcademicStaff.objects.all().order_by('-id')
        data = [{"id": s.staff_id, "name": s.name.title(), "title": s.title, "status": s.status} for s in staff_records]
        return JsonResponse(data, safe=False)

    elif request.method == 'POST':
        data = json.loads(request.body)
        AcademicStaff.objects.create(
            staff_id=data['id'], 
            name=data['name'].title(), # Formats name properly before saving
            status=data['status']
        )
        return JsonResponse({"message": "Staff added successfully!"})

    elif request.method == 'PUT':
        data = json.loads(request.body)
        staff = AcademicStaff.objects.get(staff_id=data['id'])
        
        if 'name' in data:
            staff.name = data['name'].title() # Formats edited name
            
        staff.status = data['status']
        staff.save()
        return JsonResponse({"message": "Status updated successfully!"})

    elif request.method == 'DELETE':
        data = json.loads(request.body)
        staff = AcademicStaff.objects.get(staff_id=data['id'])
        staff.delete()
        return JsonResponse({"message": "Staff deleted successfully!"})

@csrf_exempt
def admin_settings_api(request):
    admin_profile, created = SystemAdmin.objects.get_or_create(id=1)

    if request.method == 'GET':
        return JsonResponse({"name": admin_profile.name, "email": admin_profile.email, "profile_image": get_image_url(admin_profile.profile_image)})

    elif request.method == 'POST':
        admin_profile.name = request.POST.get('name', admin_profile.name).title()
        admin_profile.email = request.POST.get('email', admin_profile.email)

        new_password = request.POST.get('password', '').strip()
        if new_password:
            admin_profile.password = new_password

        if 'profile_image' in request.FILES:
            admin_profile.profile_image = request.FILES['profile_image']

        admin_profile.save()
        return JsonResponse({"message": "Admin profile updated successfully!"})

def public_directory_view(request):
    return render(request, 'public-directory.html')

def public_directory_api(request):
    active_staff = AcademicStaff.objects.filter(status__iexact='Active')
    data = []
    for s in active_staff:
        data.append({
            "id": s.id, 
            "name": s.name.title(), # Forces Title Case for the public grid
            "title": s.title,
            "highest_qualification": s.highest_qualification or "Not specified",
            "specializations": s.specializations or "Not specified",
            "administrative_roles": s.administrative_roles or "Not specified",
            "courses_taught": s.courses_taught or "",
            "building": s.building or "", "floor": s.floor or "",
            "office_number": s.office_number or "", "guidance": s.guidance or "",
            "email": s.email or "", "whatsapp": s.whatsapp or "",
            "working_hours": s.working_hours or "", "profile_image": get_image_url(s.profile_image)
        })
    return JsonResponse({"staff": data})