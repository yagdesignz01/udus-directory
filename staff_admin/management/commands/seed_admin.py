import os

from django.core.management.base import BaseCommand

from staff_admin.models import SystemAdmin


class Command(BaseCommand):
    help = 'Create or update the SystemAdmin account from ADMIN_* environment variables.'

    def handle(self, *args, **options):
        email = os.environ.get('ADMIN_EMAIL')
        password = os.environ.get('ADMIN_PASSWORD')
        if not email or not password:
            self.stdout.write('ADMIN_EMAIL/ADMIN_PASSWORD not set, skipping admin seed.')
            return

        admin, created = SystemAdmin.objects.get_or_create(
            id=1, defaults={'email': email, 'password': password}
        )
        admin.email = email
        admin.password = password
        if name := os.environ.get('ADMIN_NAME'):
            admin.name = name
        admin.save()

        verb = 'Created' if created else 'Updated'
        self.stdout.write(self.style.SUCCESS(f'{verb} SystemAdmin for {email}.'))
