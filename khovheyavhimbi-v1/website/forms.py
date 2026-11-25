import re

from django import forms
from django.core.exceptions import ValidationError
from django.utils import timezone


PICNIC_PACKAGES = ("Couple Picnic", "Family Picnic", "Group Picnic")
HIKING_PACKAGES = (
    "Hiking to Meditation Area and Rock Flowing Water only",
    "Hiking to Meditation Area and Rock Flowing Water only, with coffee break",
    "Hiking to Meditation Area, Rock Flowing Water and Matalelani, back to Camp Site, with coffee break",
)
PACKAGE_CHOICES = (
    "Not sure yet",
    "Combo 3",
    "Combo 5",
    "Luxury Combo",
    "Camp with your own tent",
    *HIKING_PACKAGES,
    *PICNIC_PACKAGES,
)


class QuoteRequestForm(forms.Form):
    name = forms.CharField(
        max_length=100,
        widget=forms.TextInput(
            attrs={"id": "f-name", "autocomplete": "name", "aria-describedby": "f-name-error"}
        ),
    )
    email = forms.EmailField(
        widget=forms.EmailInput(
            attrs={"id": "f-email", "autocomplete": "email", "aria-describedby": "f-email-error"}
        )
    )
    phone = forms.CharField(
        max_length=20,
        widget=forms.TelInput(
            attrs={
                "id": "f-phone",
                "autocomplete": "tel",
                "inputmode": "tel",
                "aria-describedby": "f-phone-error",
            }
        ),
    )
    service = forms.ChoiceField(
        choices=(
            ("", "Select a service"),
            ("Picnic", "Picnic"),
            ("Hike", "Hike"),
            ("Camping stay", "Camping stay"),
        ),
        widget=forms.Select(
            attrs={"id": "f-service", "aria-describedby": "f-service-error"}
        ),
    )
    package = forms.ChoiceField(
        choices=tuple((item, item) for item in PACKAGE_CHOICES),
        widget=forms.Select(
            attrs={"id": "f-package", "aria-describedby": "f-package-error"}
        ),
    )
    addon = forms.ChoiceField(
        required=False,
        choices=(
            ("", "No additional picnic or hiking package"),
            *((item, item) for item in (*PICNIC_PACKAGES, *HIKING_PACKAGES)),
        ),
        widget=forms.Select(attrs={"id": "f-addon"}),
    )
    date = forms.DateField(
        widget=forms.DateInput(
            attrs={"id": "f-date", "type": "date", "aria-describedby": "f-date-error"}
        )
    )
    people = forms.IntegerField(
        min_value=1,
        widget=forms.NumberInput(
            attrs={
                "id": "f-people",
                "min": "1",
                "step": "1",
                "inputmode": "numeric",
                "aria-describedby": "f-people-help f-people-error",
            }
        ),
    )
    notes = forms.CharField(
        required=False,
        max_length=2000,
        widget=forms.Textarea(attrs={"id": "f-notes", "rows": "4"}),
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["date"].widget.attrs["min"] = timezone.localdate().isoformat()

    def clean_phone(self):
        phone = re.sub(r"[()\s-]", "", self.cleaned_data["phone"])
        if not re.fullmatch(r"(?:\+27|0)[1-9]\d{8}", phone):
            raise ValidationError("Enter a valid South African phone number.")
        return phone

    def clean_date(self):
        preferred_date = self.cleaned_data["date"]
        if preferred_date < timezone.localdate():
            raise ValidationError("Choose today or a future date.")
        return preferred_date
