import json
import os
from datetime import date, datetime

from django.http import HttpResponseRedirect
from django.http.response import HttpResponse
from django.shortcuts import get_object_or_404, render
from django.urls import reverse
from django.views import generic

from .models import *
from .songmanager import SongManager

from _env import DeploymentEnvironment, DEPLOYMENT_ENVIRONMENT, VIEW_BASE_DIR

# Create your views here.

def set_cur_dir():
    if(DEPLOYMENT_ENVIRONMENT != DeploymentEnvironment.DEVELOPMENT):
        os.chdir(VIEW_BASE_DIR)

def top_page(request):
    return render(request, 'sakkyokuapp/index.html')

def sequencer_page(request):
    return render(request, 'sakkyokuapp/sequencer.html')

"""class IndexView(generic.ListView):
    template_name = 'sakkyokuapp/index.html'
    context_object_name = 'latest_question_list'"""

    #def get_queryset(self):
    #    """Return the last five published questions."""
    #    return Question.objects.order_by('-pub_date')[:5]

def api_get_song_list(request):
    target = int(request.GET.get('target'))
    targetUserID = -1

    if(target == SongManager.SONGLIST_TARGET_ALL):
        targetUserID = -1
    elif(target == SongManager.SONGLIST_TARGET_MY):
        targetUserID = request.session.get('userID', 0)
        if(targetUserID == None): targetUserID = 0
    elif(target == SongManager.SONGLIST_TARGET_SPECIFIED_USER):
        targetUserID = request.query.userID

    release = int(request.GET.get('release'))
    sort = int(request.GET.get('sort'))
    num = int(request.GET.get('num'))
    offset = int(request.GET.get('offset'))

    songs = SongManager.get_song_list(targetUserID, release, sort, num, offset)

    song_dicts = []
    for song in songs:
        song_dicts.append(song.as_dict())
    
    jsonobj = {
        "songs": song_dicts
    }

    resjson = json.dumps(jsonobj, default=json_serial)

    return HttpResponse(resjson)

# date, datetimeの変換関数
def json_serial(obj):
    # 日付型の場合には、文字列に変換します
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    # 上記以外はサポート対象外.
    raise TypeError ("Type %s not serializable" % type(obj))

def api_get_song(request, song_id):
    songjson = SongManager.get_song(song_id)
    resjson = '{ "song": '+songjson+' }'
    return HttpResponse(resjson)

def getAvailableUserID():
    id = User.objects.count() + 1       #ID 0 は使用しない
    while True:
        if not User.objects.filter(userID=id).exists():
            break
        id += 1
    return id

def register_user():
    user_id = getAvailableUserID()
    User.objects.create(userID=user_id)
    return user_id

def api_save_song(request):
    songManager = SongManager()
    songjson = request.POST['json']
    s_user_id = request.session.get('userID', 0)
    if(s_user_id == 0 or s_user_id == None):
        s_user_id = register_user()
        request.session['userID'] = s_user_id
    res = songManager.save_song(songjson, s_user_id)
    return HttpResponse(res)

def api_import_midi(request):
    songManager = SongManager()
    print(request.POST)
    mididata = request.FILES['mididata']
    s_user_id = request.session.get('userID', 0)
    if(s_user_id == 0 or s_user_id == None):
        s_user_id = register_user()
        request.session['userID'] = s_user_id
    songManager.s_user_id = s_user_id
    res = songManager.generateSongFromMIDI(mididata)
    return HttpResponse(res)