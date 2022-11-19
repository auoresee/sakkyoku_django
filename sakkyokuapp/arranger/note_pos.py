
LEN_WHOLE = 1920
LEN_HALF = LEN_WHOLE // 2
LEN_QUARTER = LEN_HALF // 2
LEN_EIGHTH = LEN_QUARTER // 2
LEN_SIXTEENTH = LEN_EIGHTH // 2
LEN_THIRTYSECOND = LEN_SIXTEENTH // 2

class NotePos:
    def __init__(self, measure, beat):
        self.measure = measure
        self.beat = beat
        pass

def getTick(measure, beat, beats_per_measure = 4, ticks_per_beat = LEN_QUARTER):
    return measure * beats_per_measure * ticks_per_beat + beat * ticks_per_beat