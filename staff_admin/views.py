import json
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib import messages
from django.contrib.auth.hashers import check_password
from .models import AcademicStaff, SystemAdmin
from django.http import HttpResponse

# ==========================================
# ADMIN AUTHENTICATION
# ==========================================
def admin_login(request):
    # 1. If already logged in, redirect to dashboard
    if 'admin_id' in request.session:
        return redirect('admin_dashboard')

    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        
        # 2. Find the admin by email only
        admin = SystemAdmin.objects.filter(email=email).first()
        
        # 3. Safely check the password
        if admin and (admin.password == password or check_password(password, admin.password)):
            # Create session
            request.session['admin_id'] = admin.id
            request.session.modified = True
            return redirect('admin_dashboard')
        else:
            messages.error(request, 'Invalid email or password.')

    return render(request, 'admin-login.html')

def admin_logout(request):
    # Completely flush all session data to force a hard logout
    request.session.flush()
    return redirect('admin_login')

def admin_dashboard_view(request):
    # STRICT LOCKDOWN: If there is no active session, redirect to login
    if 'admin_id' not in request.session:
        return redirect('admin_login')

    # Get the logged-in admin's details
    current_admin = SystemAdmin.objects.get(id=request.session['admin_id'])

    # explicitly return the HttpResponse
    return render(request, 'admin-dashboard-prototype.html', {'admin': current_admin})

# ==========================================
# STAFF AUTHENTICATION & DASHBOARD
# ==========================================
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
            if staff.status.lower() == 'suspended':
                return JsonResponse({"error": "Account suspended. Please contact the administrator."}, status=403)
            
            # Compare cleaned passwords
            if str(staff.password).strip() == input_pw:
               return JsonResponse({"success": True, "message": "Login successful", "staff_id": staff.staff_id})
            else:
                return JsonResponse({"error": "Invalid Staff ID or Password"}, status=401)
        else:
            return JsonResponse({"error": "Invalid Staff ID or Password"}, status=401)

@csrf_exempt
def lecturer_profile(request, staff_id):
    # Find the exact staff member in the database
    staff = AcademicStaff.objects.filter(staff_id=staff_id).first()
    if not staff:
        return JsonResponse({"error": "Staff not found"}, status=404)

    # READ: Send data to the frontend
    if request.method == 'GET':
        img_url = ""
        if staff.profile_image:
            try:
                img_url = staff.profile_image.url
            except ValueError:
                pass

        data = {
            "name": staff.name, "rank": staff.rank, "unit": staff.unit,
            "profile_image": img_url,
            "highest_qualification": staff.highest_qualification or "",
            "courses_taught": staff.courses_taught or "",
            "research_interests": staff.research_interests or "",
            "building": staff.building or "",
            "floor": staff.floor or "",
            "office_number": staff.office_number or "",
            "guidance": staff.guidance or "",
            "email": staff.email or "",
            "whatsapp": staff.whatsapp or "",
            "working_hours": staff.working_hours or "",
        }
        return JsonResponse(data)
    
    # UPDATE: Save new data (including images and passwords)
    elif request.method == 'POST':
        staff.highest_qualification = request.POST.get('highest_qualification', staff.highest_qualification)
        staff.courses_taught = request.POST.get('courses_taught', staff.courses_taught)
        staff.research_interests = request.POST.get('research_interests', staff.research_interests)
        staff.building = request.POST.get('building', staff.building)
        staff.floor = request.POST.get('floor', staff.floor)
        staff.office_number = request.POST.get('office_number', staff.office_number)
        staff.guidance = request.POST.get('guidance', staff.guidance)
        staff.email = request.POST.get('email', staff.email)
        staff.whatsapp = request.POST.get('whatsapp', staff.whatsapp)
        staff.working_hours = request.POST.get('working_hours', staff.working_hours)
        
        # Save a new password ONLY if the lecturer typed one in
        new_password = request.POST.get('password', '').strip()
        if new_password:
            staff.password = new_password
        
        # Save the new profile image
        if 'profile_image' in request.FILES:
            staff.profile_image = request.FILES['profile_image']
            
        staff.save()
        return JsonResponse({"message": "Profile updated successfully!"})

# ==========================================
# ADMIN API ENDPOINTS
# ==========================================
@csrf_exempt 
def get_staff_data(request):
    # READ: Send data to the frontend
    if request.method == 'GET':
        staff_records = AcademicStaff.objects.all().order_by('-id')
        data = [{"id": s.staff_id, "name": s.name, "rank": s.rank, "unit": s.unit, "status": s.status} for s in staff_records]
        return JsonResponse(data, safe=False)
    
    # CREATE: Add a new staff member
    elif request.method == 'POST':
        data = json.loads(request.body)
        AcademicStaff.objects.create(
            staff_id=data['id'],
            name=data['name'],
            rank=data['rank'],
            unit=data['unit'],
            status=data['status']
        )
        return JsonResponse({"message": "Staff added successfully!"})
        
    # UPDATE: Edit staff status (Active/Suspended)
    elif request.method == 'PUT':
        data = json.loads(request.body)
        staff = AcademicStaff.objects.get(staff_id=data['id'])
        staff.status = data['status']
        staff.save()
        return JsonResponse({"message": "Status updated successfully!"})
        
    # DELETE: Instantly remove staff record
    elif request.method == 'DELETE':
        data = json.loads(request.body)
        staff = AcademicStaff.objects.get(staff_id=data['id'])
        staff.delete()
        return JsonResponse({"message": "Staff deleted successfully!"})


@csrf_exempt
def admin_settings_api(request):
    # Get the admin profile, or create it if it doesn't exist yet
    admin_profile, created = SystemAdmin.objects.get_or_create(id=1)
    
    if request.method == 'GET':
        img_url = ""
        if admin_profile.profile_image:
            try: 
                img_url = admin_profile.profile_image.url
            except ValueError: 
                pass
        
        return JsonResponse({
            "name": admin_profile.name,
            "email": admin_profile.email,
            "profile_image": img_url
        })
        
    elif request.method == 'POST':
        admin_profile.name = request.POST.get('name', admin_profile.name)
        admin_profile.email = request.POST.get('email', admin_profile.email)
        
        new_password = request.POST.get('password', '').strip()
        if new_password:
            admin_profile.password = new_password
            
        if 'profile_image' in request.FILES:
            admin_profile.profile_image = request.FILES['profile_image']
            
        admin_profile.save()
        return JsonResponse({"message": "Admin profile updated successfully!"})

# ==========================================
# PUBLIC DIRECTORY VIEWS & API
# ==========================================
def public_directory_view(request):
    # Temporarily comment out the HTML render
    # return render(request, 'public-directory.html')
    
    # Return a basic text string instead
    return HttpResponse("<h1>NO REDIRECT LOOP. THE SERVER IS FINE.</h1>")

def public_directory_api(request):
    # Only fetch staff members whose status is 'Active'
    active_staff = AcademicStaff.objects.filter(status__iexact='Active')
    
    data = []
    for s in active_staff:
        img_url = ""
        if s.profile_image:
            try:
                img_url = s.profile_image.url
            except ValueError:
                pass
        
        data.append({
            "id": s.id,
            "name": s.name,
            "rank": s.rank,
            "unit": s.unit,
            "highest_qualification": s.highest_qualification or "Not specified",
            "research_interests": s.research_interests or "Not specified",
            "courses_taught": s.courses_taught or "",
            "building": s.building or "",
            "floor": s.floor or "",
            "office_number": s.office_number or "",
            "guidance": s.guidance or "",
            "email": s.email or "",
            "whatsapp": s.whatsapp or "",
            "working_hours": s.working_hours or "",
            "profile_image": img_url
        })
        
    return JsonResponse({"staff": data})