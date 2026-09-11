import json
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib import messages
from django.contrib.auth.hashers import check_password
from .models import AcademicStaff, SystemAdmin


def get_image_url(image):
    """Return the image URL, or an empty string when no image is available."""
    if not image:
        return ""

    try:
        return image.url
    except ValueError:
        # A file field can exist without pointing to a usable file.
        return ""


def admin_password_is_correct(admin, password):
    """Check both old plain-text passwords and newer hashed passwords."""
    if not admin:
        return False

    return admin.password == password or check_password(password, admin.password)


def get_staff_profile_data(staff):
    """Build the profile dictionary that the lecturer dashboard needs."""
    return {
        "name": staff.name,
        "rank": staff.rank,
        "unit": staff.unit,
        "profile_image": get_image_url(staff.profile_image),
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


# ==========================================
# ADMIN AUTHENTICATION
# ==========================================

def admin_login(request):
    """
    Handles the admin login page.
    - If the admin is already logged in, send them to the dashboard.
    - If they submit the login form (POST request), check their email
      and password before letting them in.
    """

    # Check if this admin already has an active session (already logged in)
    if 'admin_id' in request.session:
        return redirect('admin_dashboard')

    # If the form was submitted
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')

        # Look for an admin account with this email
        admin = SystemAdmin.objects.filter(email=email).first()

        # Check the password two ways:
        # 1) plain text match (for old/simple passwords)
        # 2) properly hashed password check (for secure passwords)
        password_is_correct = admin_password_is_correct(admin, password)

        if password_is_correct:
            # Save the admin's ID in the session so we know they are logged in
            request.session['admin_id'] = admin.id
            request.session.modified = True
            return redirect('admin_dashboard')
        else:
            messages.error(request, 'Invalid email or password.')

    # Show the login page (also shown again if login failed)
    return render(request, 'admin-login.html')


def admin_logout(request):
    """
    Logs the admin out by completely clearing their session data.
    """
    request.session.flush()
    return redirect('admin_login')


def admin_dashboard_view(request):
    """
    Shows the admin dashboard page.
    Only accessible if the admin is logged in.
    """

    # If there is no admin session, block access and send them to login
    if 'admin_id' not in request.session:
        return redirect('admin_login')

    # Get the currently logged-in admin's details from the database
    current_admin = SystemAdmin.objects.get(id=request.session['admin_id'])

    return render(request, 'admin-dashboard-prototype.html', {'admin': current_admin})


# ==========================================
# STAFF AUTHENTICATION & DASHBOARD
# ==========================================

def lecturer_login_view(request):
    """
    Simply displays the lecturer login page.
    """
    return render(request, 'lecturer-login.html')


def lecturer_dashboard_view(request):
    """
    Simply displays the lecturer dashboard page.
    """
    return render(request, 'lecturer-dashboard.html')


@csrf_exempt
def lecturer_login(request):
    """
    Handles the lecturer login request sent from JavaScript (AJAX/fetch).
    Expects JSON data containing 'staff_id' and 'password'.
    """

    if request.method == 'POST':
        # Read the JSON data sent from the frontend
        data = json.loads(request.body)
        input_id = str(data.get('staff_id', '')).strip()
        input_pw = str(data.get('password', '')).strip()

        # Try to find a staff member with this ID
        staff = AcademicStaff.objects.filter(staff_id=input_id).first()

        if staff:
            # Block login if the account has been suspended
            if staff.status.lower() == 'suspended':
                return JsonResponse(
                    {"error": "Account suspended. Please contact the administrator."},
                    status=403
                )

            # Compare the passwords (after removing extra spaces)
            if str(staff.password).strip() == input_pw:
                return JsonResponse({
                    "success": True,
                    "message": "Login successful",
                    "staff_id": staff.staff_id
                })
            else:
                return JsonResponse({"error": "Invalid Staff ID or Password"}, status=401)
        else:
            return JsonResponse({"error": "Invalid Staff ID or Password"}, status=401)


@csrf_exempt
def lecturer_profile(request, staff_id):
    """
    Handles a lecturer's profile page.
    - GET  -> sends the lecturer's current profile data to the frontend
    - POST -> saves updated profile data (including image and password)
    """

    # Find the staff member using their staff_id
    staff = AcademicStaff.objects.filter(staff_id=staff_id).first()
    if not staff:
        return JsonResponse({"error": "Staff not found"}, status=404)

    # ---- READ: send the profile data to the frontend ----
    if request.method == 'GET':

        return JsonResponse(get_staff_profile_data(staff))

    # ---- UPDATE: save new profile data ----
    elif request.method == 'POST':

        # For each field, keep the old value if a new one wasn't sent
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

        # Only change the password if the lecturer actually typed a new one
        new_password = request.POST.get('password', '').strip()
        if new_password:
            staff.password = new_password

        # Only change the profile image if a new one was uploaded
        if 'profile_image' in request.FILES:
            staff.profile_image = request.FILES['profile_image']

        staff.save()
        return JsonResponse({"message": "Profile updated successfully!"})


# ==========================================
# ADMIN API ENDPOINTS
# ==========================================

@csrf_exempt
def get_staff_data(request):
    """
    Handles all admin actions on staff records:
    - GET    -> list all staff members
    - POST   -> add a new staff member
    - PUT    -> update a staff member's status (Active/Suspended)
    - DELETE -> remove a staff member
    """

    # ---- READ: list all staff ----
    if request.method == 'GET':
        staff_records = AcademicStaff.objects.all().order_by('-id')
        data = [
            {
                "id": s.staff_id,
                "name": s.name,
                "rank": s.rank,
                "unit": s.unit,
                "status": s.status
            }
            for s in staff_records
        ]
        return JsonResponse(data, safe=False)

    # ---- CREATE: add a new staff member ----
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

    # ---- UPDATE: change a staff member's status ----
    elif request.method == 'PUT':
        data = json.loads(request.body)
        staff = AcademicStaff.objects.get(staff_id=data['id'])
        staff.status = data['status']
        staff.save()
        return JsonResponse({"message": "Status updated successfully!"})

    # ---- DELETE: remove a staff member ----
    elif request.method == 'DELETE':
        data = json.loads(request.body)
        staff = AcademicStaff.objects.get(staff_id=data['id'])
        staff.delete()
        return JsonResponse({"message": "Staff deleted successfully!"})


@csrf_exempt
def admin_settings_api(request):
    """
    Handles the admin's own account settings.
    - GET  -> send the admin's profile info to the frontend
    - POST -> save updated admin profile info (name, email, password, image)
    """

    # Get the admin profile with id=1, or create it if it doesn't exist yet
    admin_profile, created = SystemAdmin.objects.get_or_create(id=1)

    # ---- READ: send admin profile data ----
    if request.method == 'GET':
        img_url = get_image_url(admin_profile.profile_image)

        return JsonResponse({
            "name": admin_profile.name,
            "email": admin_profile.email,
            "profile_image": img_url
        })

    # ---- UPDATE: save new admin profile data ----
    elif request.method == 'POST':
        admin_profile.name = request.POST.get('name', admin_profile.name)
        admin_profile.email = request.POST.get('email', admin_profile.email)

        # Only change the password if a new one was typed in
        new_password = request.POST.get('password', '').strip()
        if new_password:
            admin_profile.password = new_password

        # Only change the image if a new one was uploaded
        if 'profile_image' in request.FILES:
            admin_profile.profile_image = request.FILES['profile_image']

        admin_profile.save()
        return JsonResponse({"message": "Admin profile updated successfully!"})


# ==========================================
# PUBLIC DIRECTORY VIEWS & API
# ==========================================

def public_directory_view(request):
    """
    Simply displays the public staff directory page.
    """
    return render(request, 'public-directory.html')


def public_directory_api(request):
    """
    Sends a list of all ACTIVE staff members to the public directory page.
    Suspended staff are not included here.
    """

    # Only get staff members whose status is "Active"
    active_staff = AcademicStaff.objects.filter(status__iexact='Active')

    data = []
    for s in active_staff:

        # Safely get the profile image URL (it might not exist yet)
        img_url = get_image_url(s.profile_image)

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