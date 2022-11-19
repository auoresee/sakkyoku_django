from chord import Chord
from chord_progression import ChordProgression
from note import Note, toNoteNumber, numberToTone
from note_pos import LEN_WHOLE, LEN_HALF, LEN_QUARTER, LEN_EIGHTH, LEN_SIXTEENTH

class BassGenerator:
    def __init__(self, chord_progression: ChordProgression) -> None:
        self.chord_progression = chord_progression
        pass

    def generateSimple8Beat(self):
        self.notes = []
        interval = LEN_EIGHTH
        velocity_pattern = [90, 80]
        velocity_pattern_pos = 0
        doOctaving = False
        octaveAbove = False

        velocity = 90
        for t in range(0, self.chord_progression.length, interval):
            velocity = velocity_pattern[velocity_pattern_pos]
            velocity_pattern_pos = (velocity_pattern_pos + 1) % len(velocity_pattern)
            
            octave = 1
            tonename = self.chord_progression.get(t).bass
            if(tonename == ""):
                tonename = self.chord_progression.get(t).root
            if(tonename == 'C' or tonename == 'C#' or tonename == "D" or tonename =="D#"):
                octave = 2
            if(doOctaving):
                if(octaveAbove):
                    octave += 1
                octaveAbove = not octaveAbove

            note = Note(toNoteNumber(tonename, octave), t, interval, velocity)

            self.notes.append(note)

        return self.notes