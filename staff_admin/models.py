from django.db import models
from django.utils.timezone import now
import os


def profile_image_path(instance, filename):
    """Create a file path for an uploaded staff profile image."""

    # Keep the original file type, such as jpg or png.
    file_extension = filename.split('.')[-1]

    # Use the staff ID and current time so files do not normally clash.
    new_filename = (
        f"{instance.staff_id}_{now().strftime('%Y%m%d%H%M%S')}"
        f".{file_extension}"
    )

    return os.path.join('profile_images/', new_filename)


class AcademicStaff(models.Model):
    """Store the account and directory details for one lecturer."""

    # These basic details are entered by the administrator.
    staff_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=200)
    rank = models.CharField(max_length=100)
    unit = models.CharField(max_length=100)
    status = models.CharField(max_length=50, default='Active')

    # These details can be completed by the lecturer.
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
        """Use the Staff ID as the password when a new password is missing."""
        if not self.password:
            self.password = self.staff_id
        super().save(*args, **kwargs)

    def __str__(self):
        # This controls how a staff record looks when printed
        # (for example, in the Django admin panel)
        return f"{self.name} ({self.staff_id})"


class SystemAdmin(models.Model):
    """
    Represents the system admin account.
    There is usually just one admin record used for login and settings.
    """

    name = models.CharField(max_length=200, default="Sarah Aliyu")
    email = models.EmailField(default="admin@udus.edu.ng")
    password = models.CharField(max_length=128, blank=True)
    profile_image = models.ImageField(upload_to='admin_images/', null=True, blank=True)

    def __str__(self):
        # This controls how the admin record looks when printed
        return self.name