from note import Note, toNoteNumber, numberToTone
from note_pos import LEN_WHOLE, LEN_HALF, LEN_QUARTER, LEN_EIGHTH, LEN_SIXTEENTH, LEN_THIRTYSECOND
from pattern import Pattern

SNARE = 38
BASS = 36
CRASH_1 = 49
CRASH_2 = 57
OPEN_HIHAT = 46
CLOSED_HIHAT = 42
PEDAL_HIHAT = 44
RIDE = 51
RIDE_BELL = 53

class DrumGenerator:
    def __init__(self, measure_num) -> None:
        self.measure_num = measure_num
        self.hihat = OPEN_HIHAT
        pass

    def generateSimple8Beat(self):
        self.notes = []
        hihat = self.hihat
        crash = True
        pattern_4beat = Pattern([
            Note(BASS, 0, LEN_THIRTYSECOND, 100),
            Note(hihat, 0, LEN_THIRTYSECOND, 100),
            Note(SNARE, LEN_QUARTER, LEN_THIRTYSECOND, 100),
            Note(hihat, LEN_QUARTER, LEN_THIRTYSECOND, 100),
            Note(BASS, LEN_HALF, LEN_THIRTYSECOND, 100),
            Note(hihat, LEN_HALF, LEN_THIRTYSECOND, 100),
            Note(SNARE, LEN_HALF + LEN_QUARTER, LEN_THIRTYSECOND, 100),
            Note(hihat, LEN_HALF + LEN_QUARTER, LEN_THIRTYSECOND, 100)
        ])

        pattern_8beat = Pattern([
            Note(BASS, 0, LEN_THIRTYSECOND, 100),
            Note(hihat, 0, LEN_THIRTYSECOND, 100),
            Note(hihat, LEN_EIGHTH, LEN_THIRTYSECOND, 80),
            Note(SNARE, LEN_QUARTER, LEN_THIRTYSECOND, 100),
            Note(hihat, LEN_QUARTER, LEN_THIRTYSECOND, 100),
            Note(hihat, LEN_QUARTER + LEN_EIGHTH, LEN_THIRTYSECOND, 80),
            Note(BASS, LEN_HALF, LEN_THIRTYSECOND, 100),
            Note(hihat, LEN_HALF, LEN_THIRTYSECOND, 100),
            Note(hihat, LEN_HALF + LEN_EIGHTH, LEN_THIRTYSECOND, 80),
            Note(SNARE, LEN_HALF + LEN_QUARTER, LEN_THIRTYSECOND, 100),
            Note(hihat, LEN_HALF + LEN_QUARTER, LEN_THIRTYSECOND, 100),
            Note(hihat, LEN_HALF + LEN_QUARTER + LEN_EIGHTH, LEN_THIRTYSECOND, 80)
        ])
        notes = pattern_8beat.repeat(self.measure_num)
        if(crash):
            for i in range(0, self.measure_num, 8):
                notes.add(Note(CRASH_1, LEN_WHOLE * i, LEN_THIRTYSECOND, 120))
        self.notes.extend(notes.notes)

        return self.notes