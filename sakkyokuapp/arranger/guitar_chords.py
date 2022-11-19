from chord import Chord, getAlternativeChordName
from note import Note, TONES, toNoteNumber, numberToTone, getToneAbove, noteNameToNumber


# OPEN_CHORD = 'E2', 'A2', 'D3', 'G3', 'B3', 'E4'
# VALLEY_CHORD = 'F2', 'Bb2', 'Eb3', 'Ab3', 'C4', 'F4'

MAJOR_CHORDS = {
    'C': ['C3', 'E3', 'G3', 'C4', 'E4'],
    'G': ['G2', 'B2', 'D3', 'G3', 'B3', 'G4'],
    'E': ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4'],
    'A': ['A2', 'E3', 'A3', 'C#4', 'E4'],
    'D': ['D3', 'A3', 'D4', 'F#4'],
    'F': ['F2', 'C3', 'F3', 'A3', 'C4', 'F4'],
    'F#': ['F#2', 'C#3', 'F#3', 'A#3', 'C#4', 'F#4'],
    'G#': ['G#2', 'D#3', 'G#3', 'C3', 'D#4', 'G#4'],
    'Bb': ['Bb2', 'F3', 'Bb3', 'D4', 'F4'],
    'B': ['B2', 'F#3', 'B3', 'D#4', 'F#4'],
    'C#': ['C#3', 'G#3', 'C#4', 'F4', 'G#4'],
    'Eb': ['Eb3', 'Bb3', 'Eb4', 'G4'],
}

MINOR_CHORDS = {
    'Em': ['E2', 'B2', 'E3', 'G3', 'B3', 'E4'],
    'Fm': ['F2', 'C3', 'F3', 'Ab3', 'C4', 'F4'],
    'F#m': ['F#2', 'C#3', 'F#3', 'A3', 'C#4', 'F#4'],
    'Gm': ['G2', 'D3', 'G3', 'Bb3', 'D4', 'G4'],
    'Abm': ['Ab2', 'Eb3', 'Ab3', 'B3', 'Eb4', 'Ab4'],
    'Am': ['A2', 'E3', 'A3', 'C4', 'E4'],
    'Bbm': ['Bb2', 'F3', 'Bb3', 'Db4', 'F4'],
    'Bm': ['B2', 'F#3', 'B3', 'D4', 'F#4'],
    'Cm': ['C3', 'G3', 'C4', 'Eb4', 'G4'],
    'C#m': ['C#3', 'G#3', 'C#4', 'E4', 'G#4'],
    'Dm': ['D3', 'A3', 'D4', 'F4'],
    'Ebm': ['Eb3', 'Bb3', 'Eb4', 'Gb4'],
}

SEVENTH_CHORDS = {
    'C7': ['C3', 'E3', 'Bb3', 'C4', 'E4'],
    'F7': ['F2', 'C3', 'Eb3', 'A3', 'C4', 'F4'],
    'F#7': ['F#2', 'C#3', 'F#3', 'A#3', 'C#4', 'F#4'],
    'G7': ['G2', 'B2', 'D3', 'G3', 'B3', 'F4'],
    #'G#7': ['G#2', 'D#3', 'G#3', 'C4', 'D#4', 'G#4'],
    'Ab7': ['Ab2', 'Eb3', 'Ab3', 'C3', 'Eb4', 'Ab4'],
    'A7': ['A2', 'E3', 'G3', 'C#4', 'E4'],
    'Bb7': ['Bb2', 'F3', 'Ab3', 'D4', 'F4'],
    'B7': ['B2', 'F#3', 'A3', 'D#4', 'F#4'],
    'C#7': ['C#3', 'G#3', 'B3', 'F4', 'G#4'],
    'D7': ['D3', 'A3', 'C4', 'F#4'],
    'Eb7': ['Eb3', 'Bb3', 'Db4', 'G4'],
    'E7': ['E2', 'B2', 'D3', 'G#3', 'B3', 'E4'],
}

MINOR_SEVENTH_CHORDS = {
    'Fm7': ['F2', 'C3', 'Eb3', 'Ab3', 'C4', 'F4'],
    'F#m7': ['F#2', 'C#3', 'E3', 'A3', 'C#4', 'F#4'],
    'Gm7': ['G2', 'D3', 'F3', 'Bb3', 'D4', 'G4'],
    'G#m7': ['G#2', 'D#3', 'F#3', 'B3', 'D#4', 'G#4'],
    #'Abm7': ['Ab2', 'Eb3', 'Gb3', 'B3', 'Eb4', 'Ab4'],
    'Am7': ['A2', 'E3', 'G3', 'C4', 'E4'],
    'Bbm7': ['Bb2', 'F3', 'Ab3', 'Db4', 'F4'],
    'Bm7': ['B2', 'F#3', 'A3', 'D4', 'F#4'],
    'Cm7': ['C3', 'G3', 'Bb3', 'Eb4', 'G4'],
    'C#m7': ['C#3', 'G#3', 'B3', 'E4', 'G#4'],
    'Dm7': ['D3', 'A3', 'C4', 'F4'],
    'Ebm7': ['Eb3', 'Bb3', 'Db4', 'Gb4'],
    'Em7': ['E2', 'B2', 'D3', 'G3', 'B3', 'E4'],
}

MAJOR_SEVENTH_CHORDS = {
    'FM7': ['F2', 'C3', 'E3', 'A3', 'C4', 'F4'],
    'F#M7': ['F#2', 'C#3', 'F3', 'A#3', 'C#4', 'F#4'],
    'GM7': ['G2', 'B2', 'D3', 'G3', 'B3', 'F#4'],
    #'G#M7': ['G#2', 'D#3', 'G3', 'C3', 'D#4', 'G#4'],
    'AbM7': ['Ab2', 'Eb3', 'G3', 'C3', 'Eb4', 'Ab4'],
    'AM7': ['A2', 'E3', 'G#3', 'C#4', 'E4'],
    'BbM7': ['Bb2', 'F3', 'A3', 'D4', 'F4'],
    'BM7': ['B2', 'F#3', 'A#3', 'D#4', 'F#4'],
    'CM7': ['C3', 'E3', 'G3', 'B3', 'E4'],
    'C#M7': ['C#3', 'G#3', 'C3', 'F4', 'G#4'],
    'DM7': ['D3', 'A3', 'C#4', 'F#4'],
    'EbM7': ['Eb3', 'Bb3', 'D4', 'G4'],
    'EM7': ['E2', 'B2', 'D#3', 'G#3', 'B3', 'E4'],
}

MINOR_MAJOR_SEVENTH_CHORDS = {}     # TODO

DIMINIUSHED_CHORDS = {
    'Bdim': ['B3', 'Fb3', 'G3', 'Db4', 'Fb4'],
    'Cdim': ['C3', 'Gb3', 'A3', 'Eb4', 'Gb4'],
    'C#dim': ['C#3', 'G3', 'A#3', 'E4', 'G4'],
    'Ddim': ['D3', 'Ab3', 'B3', 'F4'],
    'Ebdim': ['Eb3', 'A3', 'C4', 'F#4'],
    'Edim': ['E3', 'Bb3', 'Db4', 'G4'],
    'Fdim': ['F2', 'B2', 'D3', 'Ab3', 'B3', 'F4'],
    'F#dim': ['F#2', 'A3', 'D#3', 'A3', 'C4'],
    'Gdim': ['G2', 'E3', 'Bb3', 'Db4'],
    'G#dim': ['G#2', 'F3', 'B3', 'D4'],
    'Adim': ['A2', 'D#3', 'A3', 'C4', 'F#4'],
    'Bbdim': ['Bb2', 'E3', 'G3', 'Db4', 'E4'],
}

AUGMENTED_CHORDS = {}   # TODO

SUSPENDED_CHORDS = {}   # TODO

HALF_DIMINISHED_CHORDS = {}     # TODO

guitar_chords = {}

def registerChords(chords: dict):
    for chord_name, chord_notes in chords.items():
        """root_note, chord_type = separateChordName(chord_name)
        if root_note not in guitar_chords:
            guitar_chords[root_note] = {}
        guitar_chords[root_note][chord_type] = chord_notes"""
        guitar_chords[chord_name] = chord_notes
        alt_chord_name = getAlternativeChordName(chord_name)
        if alt_chord_name is not None:
            guitar_chords[alt_chord_name] = chord_notes

def getGuitarChordNotes(chord_name: str) -> list:
    ret = []
    arr = guitar_chords[chord_name]
    for note in arr:
        ret.append(Note(noteNameToNumber(note)))
    return ret

registerChords(MAJOR_CHORDS)
registerChords(MINOR_CHORDS)
registerChords(SEVENTH_CHORDS)
registerChords(MINOR_SEVENTH_CHORDS)
registerChords(MAJOR_SEVENTH_CHORDS)
registerChords(MINOR_MAJOR_SEVENTH_CHORDS)
registerChords(DIMINIUSHED_CHORDS)
registerChords(AUGMENTED_CHORDS)
registerChords(SUSPENDED_CHORDS)
registerChords(HALF_DIMINISHED_CHORDS)