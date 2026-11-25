from django.urls import path

from . import views


urlpatterns = [
    path("", views.home, name="home"),
    path("index.html", views.home, name="index"),
    path("packages.html", views.packages, name="packages"),
    path("hiking.html", views.hiking, name="hiking"),
    path("request-quote.html", views.request_quote, name="request-quote"),
]
