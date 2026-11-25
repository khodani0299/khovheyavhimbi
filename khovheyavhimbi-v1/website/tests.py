from datetime import timedelta
from unittest.mock import patch

from django.core import mail
from django.test import TestCase, override_settings
from django.utils import timezone


class SitePagesTests(TestCase):
    def test_all_pages_render_one_shared_header_and_footer(self):
        for path in ("/", "/packages.html", "/hiking.html", "/request-quote.html"):
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.content.count(b'class="k-header"'), 1)
                self.assertEqual(response.content.count(b'class="k-footer"'), 1)

    def test_quote_form_prefills_query_values(self):
        response = self.client.get(
            "/request-quote.html",
            {"service": "Hike", "package": "Not sure yet"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'name="service"')
        self.assertContains(response, 'value="Hike" selected')


class QuoteEmailTests(TestCase):
    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
        OWNER_EMAIL="owner@example.com",
        DEFAULT_FROM_EMAIL="website@example.com",
    )
    def test_valid_quote_request_emails_owner_and_redirects(self):
        response = self.client.post(
            "/request-quote.html",
            {
                "name": "A Customer",
                "email": "customer@example.com",
                "phone": "076 206 5657",
                "service": "Hike",
                "package": "Not sure yet",
                "addon": "",
                "date": (timezone.localdate() + timedelta(days=1)).isoformat(),
                "people": "2",
                "notes": "Morning booking",
            },
        )

        self.assertRedirects(response, "/request-quote.html")
        self.assertEqual(len(mail.outbox), 1)
        sent = mail.outbox[0]
        self.assertEqual(sent.to, ["owner@example.com"])
        self.assertEqual(sent.reply_to, ["customer@example.com"])
        self.assertIn("A Customer", sent.body)
        self.assertIn("Morning booking", sent.body)

    def test_invalid_quote_does_not_send_email_and_keeps_form_data(self):
        response = self.client.post(
            "/request-quote.html",
            {
                "name": "A Customer",
                "email": "customer@example.com",
                "phone": "not a phone",
                "service": "Hike",
                "package": "Not sure yet",
                "addon": "",
                "date": (timezone.localdate() + timedelta(days=1)).isoformat(),
                "people": "2",
                "notes": "",
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertContains(response, "valid South African phone number", status_code=400)
        self.assertContains(response, "A Customer", status_code=400)
        self.assertEqual(len(mail.outbox), 0)

    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
        OWNER_EMAIL="owner@example.com",
    )
    @patch("website.views.EmailMessage.send", side_effect=OSError("SMTP unavailable"))
    def test_email_failure_is_reported_without_success_redirect(self, send_mock):
        with self.assertLogs("website.views", level="ERROR"):
            response = self.client.post(
                "/request-quote.html",
                {
                    "name": "A Customer",
                    "email": "customer@example.com",
                    "phone": "0762065657",
                    "service": "Hike",
                    "package": "Not sure yet",
                    "addon": "",
                    "date": (timezone.localdate() + timedelta(days=1)).isoformat(),
                    "people": "2",
                    "notes": "",
                },
            )

        self.assertEqual(response.status_code, 503)
        self.assertContains(response, "could not send your request", status_code=503)
        send_mock.assert_called_once()
