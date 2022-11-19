from chord import Chord
from utils import indexWhere
from note_pos import LEN_WHOLE, LEN_HALF, LEN_QUARTER, LEN_EIGHTH, LEN_SIXTEENTH

class ChordProgression:
    def __init__(self, chords: list = [], length: int = -1) -> None:
        self.chords = chords
        self.chords.sort(key=lambda x: x.tick)
        self.length = length
        if(length == -1):
            self.calcLength()

    def insert(self, chord: Chord, tick: int = -1) -> None:
        if(tick != -1):
            chord.tick = tick
        
        if(chord.tick == -1):
            i = indexWhere(lambda c: c.tick == chord.tick, self.chords)
            if(i != -1):    # if there is a chord with the same tick
                self.chords[i] = chord # replace
                return
            
        self.chords.append(chord)
        self.chords.sort(key=lambda x: x.tick)
        self.calcLength()

    def calcLength(self) -> int:
        if(len(self.chords) == 0):
            self.length = 0
            return
        t = self.chords[-1].tick
        self.length = int((t // LEN_WHOLE + 1) * LEN_WHOLE) # to the end of the measure of the last chord
        return self.length

    def get(self, tick: int) -> Chord:
        if(len(self.chords) == 0):
            return None

        if(tick < self.chords[0].tick):
            return None

        prevchord = None
        for chord in self.chords:
            if(chord.tick > tick):
                return prevchord
            prevchord = chord

        return self.chords[-1]

        


    