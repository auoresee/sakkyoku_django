import json
import math
import os
import re
import tempfile
import time
from datetime import datetime
from django.db import IntegrityError, transaction
from django.db.models import Max
from django.utils.timezone import make_aware
from .mididecoder import *

from .models import Song
from .songdata import SongData

NOT_RELEASED_DATE = int(datetime(2000, 1, 1).timestamp()) * 1000
MAX_TIMESTAMP = int(datetime(9999, 1, 1).timestamp()) * 1000

SONG_DIR = "sakkyokuapp/songs"
SONG_FILENAME_PATTERN = re.compile(r'^([0-9]+)\.song$')
SONG_KEYS = ('name', 'tempo', 'tracks', 'songID', 'userID', 'isOnRelease', 'createdDate', 'releasedDate', 'lastUpdatedDate')

#曲データの値の範囲と規模の上限。公開曲は他の利用者のブラウザで読み込まれるため、クライアントが扱える範囲に限る
INSTRUMENT_NAMES = ('Piano', 'RockOrgan', 'FingerBass', 'Percussion', 'Strings',      #instruments.ts の instrumentArray の name
                    'SopranoSax', 'ODGuitar', 'EPiano2', 'SquareLead', 'SynthBell')
MIN_TEMPO = 30
MAX_TEMPO = 1000
MAX_MIDI_VALUE = 127            #音高、ベロシティ、トラックの音量
MAX_BEAT = 100000               #ノートの位置と長さ(拍)
MAX_TRACKS = 16                 #MIDIのチャンネル数
MAX_NOTES = 20000               #曲全体。保存時のリクエストの上限(2.5MB)に収まる程度

class SongError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status

def is_int(value):
    return isinstance(value, int) and not isinstance(value, bool)

def is_number(value):
    return (is_int(value) or isinstance(value, float)) and math.isfinite(value)

def is_timestamp(value):
    return is_number(value) and 0 <= value < MAX_TIMESTAMP

def is_in_range(value, low, high):
    return is_number(value) and low <= value <= high

#曲ファイルの絶対パスを返す。曲IDは正の整数に限り、解決後のパスが保存先の外になる場合もエラーにする
def get_song_filepath(song_id):
    if(not is_int(song_id) or song_id <= 0):
        raise SongError("Invalid song ID")
    song_dir = os.path.realpath(SONG_DIR)
    filepath = os.path.realpath(os.path.join(song_dir, str(song_id) + ".song"))
    if(os.path.dirname(filepath) != song_dir):
        raise SongError("Invalid song ID")
    return filepath

#保存されている曲ファイルの曲IDの一覧
def list_song_ids():
    ids = []
    for filename in os.listdir(os.path.realpath(SONG_DIR)):
        match = SONG_FILENAME_PATTERN.match(filename)
        if(match):
            ids.append(int(match.group(1)))
    return ids

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
        filepath = get_song_filepath(song_id)
        
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
        if(not isinstance(song, dict)):
            return False
        #曲名は文字列でDBの最大長以内に限る(HTMLとしては扱わず、表示側でテキストとして挿入する)
        name = song.get('name')
        if(not isinstance(name, str) or len(name) > Song._meta.get_field('name').max_length):
            return False
        #曲IDは保存済みの曲を表す正の整数か、新規作成を表す0に限る
        if(not is_int(song.get('songID')) or song['songID'] < 0):
            return False
        if(not is_int(song.get('userID')) or song['userID'] < 0):
            return False
        if(not isinstance(song.get('isOnRelease'), bool) or not is_in_range(song.get('tempo'), MIN_TEMPO, MAX_TEMPO)):
            return False
        if(not is_timestamp(song.get('createdDate')) or not is_timestamp(song.get('lastUpdatedDate'))):
            return False
        if('releasedDate' in song and not is_timestamp(song['releasedDate'])):
            return False

        tracks = song.get('tracks')
        if(not isinstance(tracks, list)):
            return False
        for track in tracks:
            if(not isinstance(track, dict) or track.get('instrument') not in INSTRUMENT_NAMES):
                return False
            #音量は数値か、音量スライダーの値の文字列
            volume = track.get('volume')
            if(isinstance(volume, str) and volume.isdecimal() and len(volume) <= 3):
                volume = int(volume)
            if(not is_in_range(volume, 0, MAX_MIDI_VALUE)):
                return False
            notes = track.get('notes')
            if(not isinstance(notes, list)):
                return False
            for note in notes:
                if(not isinstance(note, dict)):
                    return False
                if(not is_int(note.get('noteNumber')) or not is_in_range(note['noteNumber'], 0, MAX_MIDI_VALUE)):
                    return False
                if(not is_in_range(note.get('velocity'), 0, MAX_MIDI_VALUE)):
                    return False
                if(not is_in_range(note.get('beat'), 0, MAX_BEAT) or not is_in_range(note.get('duration'), 0, MAX_BEAT)):
                    return False
        return True

    def getAvailableSongID(self):
        maxid = Song.objects.aggregate(Max('songID'))['songID__max'] or 0
        for id in list_song_ids():
            if(id > maxid):
                maxid = id
        
        return maxid + 1

    #MIDIデータからsongデータを作成
    def generateSongFromMIDI(self, mididata):
        channels = midi2channels(mididata)
        songdata = SongData()
        songdata.loadSMFChannels(channels)
        return self.normalize_song(songdata.as_dict())

    #JSON文字列を曲データとして読み込み、検証する
    def parse_song(self, song_json):
        try:
            song = json.loads(song_json)
        except (ValueError, RecursionError):
            raise SongError("Invalid song data")
        return self.normalize_song(song)

    #ファイルやDBに触れる前に、全ての入力を検証する
    def normalize_song(self, song):
        if(not self.checkSongValid(song)):
            raise SongError("Invalid song data")
        if(len(song['tracks']) > MAX_TRACKS or sum(len(track['notes']) for track in song['tracks']) > MAX_NOTES):
            raise SongError("The song has too many tracks or notes")
        return {key: song[key] for key in SONG_KEYS if key in song}

    def timestamp_to_datetime(self, timestamp):
        return make_aware(datetime.fromtimestamp(timestamp // 1000))

    def datetime_to_timestamp(self, date):
        return int(date.timestamp()) * 1000

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
        filename = get_song_filepath(song['songID'])
        try:
            fd, tmpname = tempfile.mkstemp(dir=os.path.dirname(filename), prefix=".", suffix=".tmp")
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

    #song は parse_song / generateSongFromMIDI で検証済みの曲データ
    def save_song(self, song, s_user_id):
        #曲IDと所有者はサーバー側で決め、既存の曲はDB上の所有者とセッションを照合する
        is_new = (song['songID'] == 0)
        if(is_new):
            song['songID'] = self.getAvailableSongID()
            songentry = None
        else:
            songentry = Song.objects.filter(songID=song['songID']).first()
            if(songentry is None):
                raise SongError("The song does not exist", 404)
            if(not s_user_id or songentry.userID != s_user_id):		#when one tried to overwrite another user's song
                raise SongError("This user is not the original author", 403)
        song['userID'] = s_user_id

        #日時もクライアントの値は使わず、サーバーの時刻と保存済みの値から決める(DBに合わせて秒単位)
        now = int(time.time()) * 1000
        song['createdDate'] = now if is_new else self.datetime_to_timestamp(songentry.createdDate)
        song['lastUpdatedDate'] = now
        if(not song['isOnRelease']):
            song['releasedDate'] = NOT_RELEASED_DATE
        elif(songentry is not None and songentry.isOnRelease):
            song['releasedDate'] = self.datetime_to_timestamp(songentry.releasedDate)
        else:
            song['releasedDate'] = now

        self.store_song(song, is_new)

        return song

    #曲ファイルの内容をDBに再登録する(管理用)
    def register_song(self, song):
        if(not self.checkSongValid(song) or song['songID'] == 0):
            raise SongError("Invalid song data")
        self.make_song_entry(song).save()
