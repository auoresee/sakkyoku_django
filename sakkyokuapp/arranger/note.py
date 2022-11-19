from numpy import number


TONES = {
                'C': 0, 'C#': 1,
    'Db': 1,    'D': 2, 'D#': 3,
    'Eb': 3,    'E': 4,
                'F': 5, 'F#': 6,
    'Gb': 6,    'G': 7, 'G#': 8,
    'Ab': 8,    'A': 9, 'A#': 10,
    'Bb': 10,   'B': 11
}

def getToneAbove(tone: str, interval: int = 1) -> str:
    # Get the note above the given note by the given interval.
    note_fromC = TONES[tone]
    return numberToTone((note_fromC + interval) % 12)

def numberToTone(number: int) -> str:
    number = number % 12
    for tone, num in TONES.items():
        if num == number:
            return tone

def getAlternativeToneName(tone_name: str):
    # Get alternative tone names for the given tone name.
    if(len(tone_name) <= 1): return None
    if(tone_name[1] == 'b'):
        alt_root_note = getToneAbove(tone_name, -1) + '#'
    elif(tone_name[1] == '#'):
        alt_root_note = getToneAbove(tone_name, 1) + 'b'
    
    return alt_root_note

def separateNoteName(note_name: str):
    # Separate note name into tone and octave.
    tone = note_name[0]
    if(len(note_name) >= 2 and (note_name[1] == 'b' or note_name[1] == '#')):
        tone = note_name[:2]
        octave = int(note_name[2:])
    else:
        octave = int(note_name[1:])
    
    return tone, octave

def toNoteNumber(tone, octave):
    return octave * 12 + TONES[tone] + 12   # C4 is 60

def noteNameToNumber(note_name):
    tone, octave = separateNoteName(note_name)
    return toNoteNumber(tone, octave)

class Note:
    def __init__(self, note_number, tick = 0, duration = -1, velocity = 100):
        self.note_number = note_number
        self.tick = tick
        self.duration = duration
        self.velocity = velocity

    def clone(self):
        return Note(self.note_number, self.tick, self.duration, self.velocity)