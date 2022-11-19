from chord import Chord
from chord_progression import ChordProgression
from note import Note, toNoteNumber, numberToTone
from note_pos import LEN_WHOLE, LEN_HALF, LEN_QUARTER, LEN_EIGHTH, LEN_SIXTEENTH
from guitar_chords import guitar_chords, getGuitarChordNotes

class GuitarGenerator:
    def __init__(self, chord_progression: ChordProgression) -> None:
        self.chord_progression = chord_progression
        self.mode = 'full'
        self.filter_type = 'lowpass'
        self.velocity_pattern = 'alternate'
        pass

    def generateSimple8Beat(self):
        self.definePatterns()
        self.notes = []
        interval = LEN_EIGHTH
        velocity_pattern_alt = [90, 80]
        velocity_pattern_332 = [90, 80, 80, 90, 80, 80, 90, 80]
        if(self.velocity_pattern == 'alternate'):
            velocity_pattern = velocity_pattern_alt
        elif (self.velocity_pattern == '332'):
            velocity_pattern = velocity_pattern_332
        else:
            velocity_pattern = [90]
        
        velocity_pattern_pos = 0
        velocity = 90
        for t in range(0, self.chord_progression.length, interval):
            velocity = velocity_pattern[velocity_pattern_pos]
            velocity_pattern_pos = (velocity_pattern_pos + 1) % len(velocity_pattern)

            chord_notes = self.getChordNotes(self.chord_progression.get(t))
            for note in chord_notes:
                note.tick = t
                note.duration = interval
                note.velocity = velocity
                self.notes.append(note)

        if(self.filter_type == 'lowpass'):
            self.notes = self.filter(self.notes)
        return self.notes

    def filter(self, notes):
        for note in notes:
            if(note.note_number > toNoteNumber('A', 3)):
                note.velocity = round(note.velocity * 0.8)
        return notes

    def getChordNotes(self, chord: Chord):

        if(self.mode == 'power'):
            return self.getPowerChordNotes(chord)

        else:
            return getGuitarChordNotes(chord.getChordName())

    def getPowerChordNotes(self, chord: Chord):
        notes = []
        root = Note(toNoteNumber(chord.root, 2), 0, LEN_EIGHTH, 100)
        if(root.note_number < toNoteNumber('E', 2)):
            root.note_number += 12
        notes.append(root)
        fifth = Note(root.note_number + 7, 0, LEN_EIGHTH, 100)
        notes.append(fifth)
        return notes

    def definePatterns(self):
        self.patterns = []
        pattern1 = []
        subpattern1 = []
        subpattern1.append(Note(toNoteNumber('C', 3), 0, LEN_EIGHTH, 100))
        subpattern1.append(Note(toNoteNumber('E', 3), 0, LEN_EIGHTH, 100))
        subpattern1.append(Note(toNoteNumber('G', 3), 0, LEN_EIGHTH, 100))
        subpattern1.append(Note(toNoteNumber('C', 4), 0, LEN_EIGHTH, 100))
        subpattern1.append(Note(toNoteNumber('E', 4), 0, LEN_EIGHTH, 100))