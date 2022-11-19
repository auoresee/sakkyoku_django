from note import getAlternativeToneName

BASIC_CHORD_TYPES = {
    '': [0, 4, 7],
    'm': [0, 3, 7],
    'dim': [0, 3, 6],
    'aug': [0, 4, 8],
    'sus2': [0, 2, 7],
    'sus4': [0, 5, 7],
    '7': [0, 4, 7, 10],
    'm7': [0, 3, 7, 10],
    'M7': [0, 4, 7, 11],
    'dim7': [0, 3, 6, 9],
    'm7b5': [0, 3, 6, 10],
    'mM7': [0, 3, 7, 11],
    '7sus4': [0, 5, 7, 10],
    'add9': [0, 4, 7, 14]
}

def getAlternativeChordName(chord_name: str):
    # Get alternative chord name if the chord name is not in the chord dictionary.
    root_note, chord_type, bass = separateChordName(chord_name)
    if(len(root_note) <= 1): return None

    alt_root_note = getAlternativeToneName(root_note)
    
    return alt_root_note + chord_type

def separateChordName(chord_name: str):
    # Separate chord name into root note and chord type.
    chord_name, bass = chord_name.split('/') if '/' in chord_name else (chord_name, "")

    root_note = chord_name[0]
    if(len(chord_name) >= 2 and (chord_name[1] == 'b' or chord_name[1] == '#')):
        root_note = chord_name[:2]
        chord_type = chord_name[2:]
    else:
        chord_type = chord_name[1:]
    
    return root_note, chord_type, bass

class Chord:
    
    def __init__(self, root: str, type: str = "", bass: str = "", tick: int = -1) -> None:
        self.root = root    # C, C#, Db, D, D#, Eb, E, F, F#, Gb, G, G#, Ab, A, A#, Bb, B
        self.type = type    # major triad if empty
        self.bass = bass    # bass note, same as root if empty
        self.tick = tick    # tick in the song, -1 if not set
        pass

    def getChordName(self):
        return self.root + self.type
