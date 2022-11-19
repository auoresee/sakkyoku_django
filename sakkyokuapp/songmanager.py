import json
import os
import glob
from datetime import datetime
from django.utils.timezone import make_aware
from .mididecoder import *

from .models import Song
from .songdata import SongData

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
    def get_song_list(targetUserID, release, sort, num, offset):
        songs = Song.objects

        if(targetUserID != -1):
            songs = songs.filter(userID=targetUserID)

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

    
    def checkSongValid(self, song):
        # stub
        return True

    def getAvailableSongID(self):
        os.chdir("sakkyokuapp/songs")
        files = glob.glob("*.song")
        os.chdir("../../")
        maxid = 0
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

    def setIDtoSong(self, song):
        if(song['userID'] == 0):
            song['userID'] = self.s_user_id
        if(song['songID'] == 0):
            song['songID'] = self.getAvailableSongID()

    def write_song(self, song):
        songjson = json.dumps(song)
        filename = "sakkyokuapp/songs/" + str(song['songID']) + ".song"
        with open(filename, 'w', encoding='UTF-8') as f:
            f.write(songjson)

    def save_song(self, song_json, s_user_id):
        song = json.loads(song_json)

        self.s_user_id = s_user_id
	
        if (s_user_id != None):
            if (song['userID'] == 0):
                song['userID'] = s_user_id
            if (song['userID'] != s_user_id):		#when one tried to overwrite another user's song
                return "!error: This user is not the original author"

            if(not self.checkSongValid(song)):
                return "!error: Invalid song data"
        
        self.setIDtoSong(song)

        songcopyjson = json.dumps(song)

        try:
            self.write_song(song)
        except OSError as e:
            return "!error: Failed to write the song"

        del song['tracks']       #譜面データはDBに保存しない
        del song['tempo']

        #Song.objects.update_or_create(**song)

        song['createdDate'] = str(make_aware(datetime.fromtimestamp(song['createdDate'] // 1000)))
        if('releasedDate' in song):
            song['releasedDate'] = str(make_aware(datetime.fromtimestamp(song['releasedDate'] // 1000)))
        song['lastUpdatedDate'] = str(make_aware(datetime.fromtimestamp(song['lastUpdatedDate'] // 1000)))

        songentry = Song(**song)
        
        songentry.save()
        
        #if(self.checkSongExistsInDB(song.songID)):
        #    self.addSongToDB(song)
        #else:
        #    self.updateSongInDB(song)

        return songcopyjson