import os
from django.db import models
from django.utils.timezone import now

# This function renames the uploaded image to: STF-1004_20260817143000.jpg
def profile_image_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{instance.staff_id}_{now().strftime('%Y%m%d%H%M%S')}.{ext}"
    return os.path.join('profile_images/', filename)

class AcademicStaff(models.Model):
    # Admin details
    staff_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=200)
    rank = models.CharField(max_length=100)
    unit = models.CharField(max_length=100)
    status = models.CharField(max_length=50, default='Active')
    
    # Lecturer self-service details
    password = models.CharField(max_length=128, blank=True)
    profile_image = models.ImageField(upload_to=profile_image_path, null=True, blank=True)
    highest_qualification = models.CharField(max_length=200, blank=True, null=True)
    courses_taught = models.TextField(blank=True, null=True) 
    research_interests = models.TextField(blank=True, null=True)
    building = models.CharField(max_length=200, blank=True, null=True)
    floor = models.CharField(max_length=100, blank=True, null=True)
    office_number = models.CharField(max_length=100, blank=True, null=True)
    guidance = models.TextField(blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    whatsapp = models.CharField(max_length=50, blank=True, null=True)
    working_hours = models.TextField(blank=True, null=True)

    def save(self, *args, **kwargs):
        # Automatically set the password to their Staff ID when the account is created
        if not self.password:
            self.password = self.staff_id 
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.staff_id})"

class SystemAdmin(models.Model):
    name = models.CharField(max_length=200, default="Sarah Aliyu")
    email = models.EmailField(default="admin@udus.edu.ng")
    password = models.CharField(max_length=128, blank=True)
    profile_image = models.ImageField(upload_to='admin_images/', null=True, blank=True)

    def __str__(self):
        return self.name