# Khovhe Yavhimbi

Django project for the Khovhe Yavhimbi website. The existing homepage, packages, hiking, and quote pages are Django templates. Shared navigation and footer content live in `templates/partials/`; CSS, JavaScript, and images are served from `assets/`.

## Run locally

Use Python 3.10 or later:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Open `http://127.0.0.1:8000/`. The pages are also available at `/packages.html`, `/hiking.html`, and `/request-quote.html`.

## Quote request email

In development, submitted requests are printed to the runserver console. To send them through an SMTP provider, set these environment variables before starting Django:

```powershell
$env:EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
$env:EMAIL_HOST = "smtp.example.com"
$env:EMAIL_PORT = "587"
$env:EMAIL_USE_TLS = "true"
$env:EMAIL_HOST_USER = "verified-sender@example.com"
$env:EMAIL_HOST_PASSWORD = "your-provider-app-password"
$env:DEFAULT_FROM_EMAIL = "verified-sender@example.com"
$env:OWNER_EMAIL = "musiiwar@icloud.com"
```

Use an SMTP provider and sender address verified for your account. Keep passwords and `DJANGO_SECRET_KEY` in environment variables or your hosting provider's secret store; never put them in templates or JavaScript. For production, also set `DJANGO_DEBUG=false` and `DJANGO_ALLOWED_HOSTS` to your domain.

The quote form validates submissions on the server and sends the owner an email with the visitor's email address as `Reply-To`. SMTP errors are logged and shown as an error instead of a success confirmation.
For production static assets, run `python manage.py collectstatic` and configure the host to serve `STATIC_ROOT`.

## Content still to confirm

- Tent names, capacities, prices, and inclusions.
- Trail names, distances, durations, and difficulty.
- Physical address, Facebook link, group-size maximum, and booking policies.
- Service inclusions, FAQ answers, and other `To be specified` content.
