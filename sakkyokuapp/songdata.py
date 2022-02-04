import time
import datetime

class SongNote:
    def __init__(self, noteNumber, beat, duration, velocity) -> None:
        self.noteNumber = noteNumber
        self.beat = beat
        self.duration = duration
        self.velocity = velocity
    
    def as_dict(self):
        return {
            'noteNumber': self.noteNumber,
            'beat': self.beat,
            'duration': self.duration,
            'velocity': self.velocity
        }

class SongTrack:
    def __init__(self, notes=[], instrument=None, volume=100):
        self.notes = notes
        self.instrument = instrument
        self.volume = volume

    def as_dict(self):
        return {
            'notes': [note.as_dict() for note in self.notes],
            'instrument': self.instrument,
            'volume': self.volume
        }


def mappingInstrument(instrument):
    return "SopranoSax"

def convertSMFChannelToSongTrack(channel) -> SongTrack:
    notes = []
    for note in channel.notes:
        newnote = SongNote(note.note_number, note.note_on_tick / 480, note.getDuration() / 480, note.velocity)
        notes.append(newnote)
    return SongTrack(notes, mappingInstrument(channel.initial_instrument), channel.initial_volume)

class SongData:
    def __init__(self):
        self.name = "New Song"
        self.tempo = 120
        self.tracks = []
        self.songID = 0    #0 if not saved in the server
        self.userID = 0
        self.isOnRelease = False   #whether self song is accessible by the public
        self.createdDate = time.time() * 1000   #現在のUNIX時間×1000
        self.releasedDate = int(datetime.datetime(2000, 1, 1).timestamp()) * 1000 #not released
        self.lastUpdatedDate = self.createdDate

    def loadSMFChannels(self, channels):
        self.tracks = []
        for channel in channels:
            track = convertSMFChannelToSongTrack(channel)
            print(f"Track {channel.id} notes {len(channel.notes)}")
            if(len(track.notes) == 0): continue
            self.tracks.append(track)

    #dictとしてシリアライズ
    def as_dict(self):
        return {
            'name'  : self.name,
            'tempo' : self.tempo,
            'tracks': [track.as_dict() for track in self.tracks],
            'songID': self.songID,
            'userID': self.userID,
            'name': self.name,
            'isOnRelease': self.isOnRelease,
            'createdDate': self.createdDate,
            'releasedDate': self.releasedDate,
            'lastUpdatedDate': self.lastUpdatedDate
        }
