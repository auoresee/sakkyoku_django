"""sakkyoku URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path

from . import views
from .admintools import reconstruct_db as rec

urlpatterns = [
    path('admin/db/', rec.db_admin_page),
    path('admin/db/reconstruct', rec.reconstruct_db),
    path('admin/', admin.site.urls),
    path('', views.top_page),
    path('index.html', views.top_page),
    path('sequencer', views.sequencer_page),
    path('sequencer.html', views.sequencer_page),
    path("api/songs/", views.api_get_song_list),
    path("api/songs/<int:song_id>", views.api_get_song),
    path("api/songs/save", views.api_save_song),
    path("api/import/midi", views.api_import_midi)
]
