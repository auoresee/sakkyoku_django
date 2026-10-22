import json
import os
from datetime import date, datetime

from django.http import HttpResponseRedirect, JsonResponse
from django.http.response import HttpResponse
from django.shortcuts import get_object_or_404, render
from django.urls import reverse
from django.views import generic

from .models import *
from .songmanager import SongError, SongManager

from . import _env

# Create your views here.

def set_cur_dir():
    if(_env.DEPLOYMENT_ENVIRONMENT != _env.DeploymentEnvironment.DEVELOPMENT):
        os.chdir(_env.VIEW_BASE_DIR)

def top_page(request):
    set_cur_dir()
    return render(request, 'sakkyokuapp/index.html')

def sequencer_page(request):
    set_cur_dir()
    return render(request, 'sakkyokuapp/sequencer.html')

"""class IndexView(generic.ListView):
    template_name = 'sakkyokuapp/index.html'
    context_object_name = 'latest_question_list'"""

    #def get_queryset(self):
    #    """Return the last five published questions."""
    #    return Question.objects.order_by('-pub_date')[:5]

SONGLIST_MAX_NUM = 100

def song_error_response(e):
    return HttpResponse("!error: " + str(e), status=e.status, content_type="text/plain; charset=utf-8")

def get_session_user_id(request):
    return request.session.get('userID') or 0

def api_get_song_list(request):
    s_user_id = get_session_user_id(request)
    try:
        target = int(request.GET.get('target'))
        release = int(request.GET.get('release'))
        sort = int(request.GET.get('sort'))
        num = int(request.GET.get('num'))
        offset = int(request.GET.get('offset'))
        if(target == SongManager.SONGLIST_TARGET_SPECIFIED_USER):
            specifiedUserID = int(request.GET.get('userID'))
    except (TypeError, ValueError):
        return song_error_response(SongError("Invalid parameters"))
    if(not (0 < num <= SONGLIST_MAX_NUM) or offset < 0):
        return song_error_response(SongError("Invalid parameters"))

    #非公開曲は所有者本人の一覧にだけ含める
    if(target == SongManager.SONGLIST_TARGET_ALL):
        targetUserID = -1
        only_released = True
    elif(target == SongManager.SONGLIST_TARGET_MY):
        targetUserID = s_user_id
        only_released = False
    elif(target == SongManager.SONGLIST_TARGET_SPECIFIED_USER):
        targetUserID = specifiedUserID
        only_released = (targetUserID != s_user_id)
    else:
        return song_error_response(SongError("Invalid parameters"))

    if(targetUserID == 0):      #セッションのない利用者の曲は無い
        songs = []
    else:
        songs = SongManager.get_song_list(targetUserID, release, sort, num, offset, only_released)

    song_dicts = []
    for song in songs:
        song_dicts.append(song.as_dict())
    
    jsonobj = {
        "songs": song_dicts
    }

    return JsonResponse(jsonobj)

def api_get_song(request, song_id):
    set_cur_dir()
    try:
        songjson = SongManager.get_visible_song(song_id, get_session_user_id(request))
    except SongError as e:
        return song_error_response(e)
    return JsonResponse({"song": json.loads(songjson)})

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
    set_cur_dir()
    songManager = SongManager()
    songjson = request.POST.get('json')
    if(songjson is None):
        return song_error_response(SongError("Invalid song data"))
    s_user_id = request.session.get('userID', 0)
    if(s_user_id == 0 or s_user_id == None):
        s_user_id = register_user()
        request.session['userID'] = s_user_id
    try:
        res = songManager.save_song(songjson, s_user_id)
    except SongError as e:
        return song_error_response(e)
    return JsonResponse(res)

def api_import_midi(request):
    set_cur_dir()
    songManager = SongManager()
    #print(request.POST)
    try:
        mididata = request.FILES['mididata']
    except:
        return HttpResponse('!MIDIファイルが指定されていません。')
    s_user_id = request.session.get('userID', 0)
    if(s_user_id == 0 or s_user_id == None):
        s_user_id = register_user()
        request.session['userID'] = s_user_id
    songManager.s_user_id = s_user_id
    try:
        res = songManager.generateSongFromMIDI(mididata)
    except SongError as e:
        return song_error_response(e)
    return JsonResponse(res)