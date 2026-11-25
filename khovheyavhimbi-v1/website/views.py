import logging
import smtplib

from django.conf import settings
from django.contrib import messages
from django.core.mail import EmailMessage
from django.shortcuts import redirect, render

from .forms import QuoteRequestForm


logger = logging.getLogger(__name__)


def home(request):
    return render(request, "site/index.html")


def packages(request):
    return _quote_page(request, "site/packages.html")


def hiking(request):
    return render(request, "site/hiking.html")


def request_quote(request):
    return _quote_page(request, "site/request-quote.html")


def _quote_page(request, template_name):
    if request.method == "POST":
        form = QuoteRequestForm(request.POST)
        if form.is_valid():
            data = form.cleaned_data
            body = "\n".join(
                (
                    "New Khovhe Yavhimbi quote request",
                    "",
                    f"Name: {data['name']}",
                    f"Email: {data['email']}",
                    f"Phone: {data['phone']}",
                    f"Service: {data['service']}",
                    f"Package: {data['package']}",
                    f"Additional package: {data['addon'] or 'None'}",
                    f"Preferred date: {data['date'].isoformat()}",
                    f"Number of people: {data['people']}",
                    f"Additional requests: {data['notes'] or 'None'}",
                )
            )
            try:
                EmailMessage(
                    subject="New Khovhe Yavhimbi quote request",
                    body=body,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[settings.OWNER_EMAIL],
                    reply_to=[data["email"]],
                ).send(fail_silently=False)
            except (OSError, smtplib.SMTPException):
                logger.exception("Could not send a Khovhe Yavhimbi quote request")
                form.add_error(
                    None,
                    "We could not send your request right now. Please contact us by phone.",
                )
                return render(
                    request, template_name, {"quote_form": form}, status=503
                )

            messages.success(request, "Thanks, your quote request has been sent.")
            return redirect(request.path)

        return render(request, template_name, {"quote_form": form}, status=400)

    initial = {"package": "Not sure yet"}
    for field in ("service", "package", "addon"):
        value = request.GET.get(field)
        if value:
            initial[field] = value
    form = QuoteRequestForm(initial=initial)
    return render(request, template_name, {"quote_form": form})
