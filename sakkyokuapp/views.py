from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404, render
from django.urls import reverse
from django.views import generic


from .models import *
from .songmanager import SongManager

# Create your views here.

def top_page(request):
    return render(request, 'sakkyokuapp/index.html')

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
        #targetUserID = req.session.userID ? req.session.userID : 0
        targetUserID = 0
    elif(target == SongManager.SONGLIST_TARGET_SPECIFIED_USER):
        targetUserID = req.query.userID

    release = int(request.GET.get('release'))
    sort = int(request.GET.get('sort'))
    num = int(request.GET.get('num'))
    offset = int(request.GET.get('offset'))

    songs = SongManager.get_song_list(targetUserID, release, sort, num, offset)

    