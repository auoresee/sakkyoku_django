from django.db import models
import os
import glob

from django.http.response import HttpResponse
from django.shortcuts import get_object_or_404, render

from ..models import Song
from ..songmanager import SongManager

import sys
sys.path.append(".")
from sakkyoku.mysqlpassword import SQL_PASSWORD

def db_admin_page(request):
    return render(request, 'sakkyokuapp/admintools/admintool.html')

def reconstruct_db(request):
    password = request.POST['password']
    if(password != SQL_PASSWORD):
        return None
    os.chdir("sakkyokuapp/songs")
    files = glob.glob("*.song")
    os.chdir("../../")

    sm = SongManager()

    Song.objects.all().delete()     #全て削除
    
    for file in files:
        splitarr = file.split('.')
        id = int(splitarr[0])
        songjson = SongManager.get_song(id)
        sm.save_song(songjson, None)

    return HttpResponse(str(files))
        
