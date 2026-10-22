import json
import os
import glob
import tempfile
from datetime import datetime
from django.db import IntegrityError, transaction
from django.db.models import Max
from django.utils.timezone import make_aware
from .mididecoder import *

from .models import Song
from .songdata import SongData

NOT_RELEASED_DATE = int(datetime(2000, 1, 1).timestamp()) * 1000

class SongError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status

class SongManager:
    SONGLIST_RELEASE_ANY = 1		#no matter whether released
    SONGLIST_RELEASE_TRUE = 2		#released songs only
    SONGLIST_RELEASE_FALSE = 3	#not released songs only

    SONGLIST_TARGET_ALL = 1
    SONGLIST_TARGET_MY = 2
    SONGLIST_TARGET_SPECIFIED_USER = 3

    SONGLIST_SORT_LAST_UPDATED_DATE = 1
    SONGLIST_SORT_RELEASED_DATE = 2
    SONGLIST_SORT_CREATED_DATE = 3
    SONGLIST_SORT_VOTE = 4

    def __init__(self) -> None:
        pass

    #returns: Song[]
    def get_song_list(targetUserID, release, sort, num, offset, only_released=True):
        songs = Song.objects

        if(targetUserID != -1):
            songs = songs.filter(userID=targetUserID)

        if(only_released):
            songs = songs.filter(isOnRelease=True)

        if(release == SongManager.SONGLIST_RELEASE_TRUE):
            songs = songs.filter(isOnRelease=True)
        elif(release == SongManager.SONGLIST_RELEASE_FALSE):
            songs = songs.filter(isOnRelease=False)

        if(sort == SongManager.SONGLIST_SORT_RELEASED_DATE):
            songs = songs.order_by('releasedDate')
        if(sort == SongManager.SONGLIST_SORT_CREATED_DATE):
            songs = songs.order_by('createdDate')
        else:
            songs = songs.order_by('lastUpdatedDate')

        return songs[offset:offset+num]

    
    def get_song(song_id):
        filepath = "sakkyokuapp/songs/"+str(song_id)+".song"
        
        with open(filepath, "r") as f:
            song = f.read()

        return song

    #非公開曲は所有者本人にだけ返す。存在を明かさないよう、どちらの場合も404にする
    def get_visible_song(song_id, s_user_id):
        songentry = Song.objects.filter(songID=song_id).first()
        if(songentry is None or not (songentry.isOnRelease or (s_user_id and songentry.userID == s_user_id))):
            raise SongError("The song does not exist", 404)
        try:
            return SongManager.get_song(song_id)
        except FileNotFoundError:
            raise SongError("The song does not exist", 404)

    
    def checkSongValid(self, song):
        #曲名は文字列でDBの最大長以内に限る(HTMLとしては扱わず、表示側でテキストとして挿入する)
        name = song.get('name')
        if(not isinstance(name, str) or len(name) > Song._meta.get_field('name').max_length):
            return False
        return True

    def getAvailableSongID(self):
        os.chdir("sakkyokuapp/songs")
        files = glob.glob("*.song")
        os.chdir("../../")
        maxid = Song.objects.aggregate(Max('songID'))['songID__max'] or 0
        for val in files:
            splitarr = val.split('.')
            id = int(splitarr[0])
            if(id > maxid):
                maxid = id
        
        return maxid + 1

    #MIDIデータからsongデータを作成
    def generateSongFromMIDI(self, mididata):
        channels = midi2channels(mididata)
        songdata = SongData()
        songdata.loadSMFChannels(channels)
        songjson = json.dumps(songdata.as_dict())
        return self.save_song(songjson, self.s_user_id)

    def timestamp_to_datetime(self, timestamp):
        return make_aware(datetime.fromtimestamp(timestamp // 1000))

    #譜面データ(tracks, tempo)はDBに保存しない
    def make_song_entry(self, song):
        return Song(
            songID=song['songID'],
            userID=song['userID'],
            name=song['name'],
            isOnRelease=song['isOnRelease'],
            createdDate=self.timestamp_to_datetime(song['createdDate']),
            releasedDate=self.timestamp_to_datetime(song.get('releasedDate', NOT_RELEASED_DATE)),
            lastUpdatedDate=self.timestamp_to_datetime(song['lastUpdatedDate']),
        )

    #一時ファイルに書き込んでからDBを保存し、DBの保存に成功した場合だけファイルを差し替える
    def store_song(self, song, is_new):
        filename = "sakkyokuapp/songs/" + str(song['songID']) + ".song"
        try:
            fd, tmpname = tempfile.mkstemp(dir="sakkyokuapp/songs", prefix=".", suffix=".tmp")
        except OSError:
            raise SongError("Failed to write the song", 500)
        try:
            with os.fdopen(fd, 'w', encoding='UTF-8') as f:
                f.write(json.dumps(song))
            with transaction.atomic():
                self.make_song_entry(song).save(force_insert=is_new)
                os.replace(tmpname, filename)
        except IntegrityError:
            raise SongError("Failed to allocate a song ID. Please try again", 409)
        except OSError:
            raise SongError("Failed to write the song", 500)
        finally:
            if os.path.exists(tmpname):
                os.remove(tmpname)

    def save_song(self, song_json, s_user_id):
        song = json.loads(song_json)

        self.s_user_id = s_user_id

        if(not self.checkSongValid(song)):
            raise SongError("Invalid song data")

        #曲IDと所有者はサーバー側で決め、既存の曲はDB上の所有者とセッションを照合する
        is_new = (song['songID'] == 0)
        if(is_new):
            song['songID'] = self.getAvailableSongID()
        else:
            songentry = Song.objects.filter(songID=song['songID']).first()
            if(songentry is None):
                raise SongError("The song does not exist", 404)
            if(songentry.userID != s_user_id):		#when one tried to overwrite another user's song
                raise SongError("This user is not the original author", 403)
        song['userID'] = s_user_id

        self.store_song(song, is_new)

        return song

    #曲ファイルの内容をDBに再登録する(管理用)
    def register_song(self, song):
        self.make_song_entry(song).save()
