# UDUS Staff Directory

Django app (`staff_admin`) serving the Usmanu Danfodiyo University staff
directory, the lecturer self-service portal, and the admin dashboard.

## Routes

| Path | Purpose |
| --- | --- |
| `/` | Redirects to the public directory |
| `/directory/` | Public student-facing staff directory |
| `/lecturer/` | Lecturer login |
| `/lecturer/dashboard/` | Lecturer profile self-service |
| `/admin-login/`, `/admin-dashboard/` | Admin portal |
| `/django-admin/` | Django's built-in admin |

## Local development

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python manage.py migrate
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=secret .venv/bin/python manage.py seed_admin
DEBUG=True .venv/bin/python manage.py runserver
```

Without `DATABASE_URL` the app falls back to a local SQLite file.

## Deployment

Deployed to the Railway project **Client Websites** as the service
**UDUS Directory**, alongside a **Postgres** service.

- Build/run: Railpack + the `Procfile` web process (migrate → collectstatic →
  seed_admin → gunicorn). `railway.json` carries the same command for
  GitHub-connected deploys.
- Static files: WhiteNoise, collected at boot into `staticfiles/`.
- Uploaded profile images: Railway volume mounted at `/app/media`
  (`MEDIA_ROOT`), so uploads survive redeploys.

Redeploy from this directory with:

```bash
railway up
```

### Environment variables

| Variable | Notes |
| --- | --- |
| `SECRET_KEY` | Required in production |
| `DEBUG` | `False` in production |
| `DATABASE_URL` | Set to `${{Postgres.DATABASE_URL}}` on Railway |
| `MEDIA_ROOT` | `/app/media` (the volume mount path) |
| `ALLOWED_HOSTS` | Extra comma-separated hosts; the Railway domain is added automatically |
