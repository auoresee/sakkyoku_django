from pattern import Pattern

#Section is a multi-track version of Pattern
class Section:
    def __init__(self, track: dict = {}, name=""):
        self.name = name
        self.tracks = track

    def addTrack(self, ch, pattern):
        self.tracks[ch] = pattern

    def concat(self, section, tick = 0):
        ret: Section = self.clone()
        if(tick != 0): section = section.shiftTick(tick)
        for track_pair in section.tracks.items():
            ch, track = track_pair
            if ch in ret.tracks:
                ret.tracks[ch] = ret.tracks[ch].concat(track)

            else:
                ret.tracks[ch] = track.clone()

        return ret

    def shiftTick(self, tick):
        ret = self.clone()
        for track_pair in ret.tracks.items():
            ch, track = track_pair
            ret.tracks[ch] = track.shiftTick(tick)
        return ret

    def slice(self, start, end):
        ret = self.clone()
        ret.notes = []
        for note in self.notes:
            if note.tick >= start and note.tick < end:
                ret.notes.append(note)
        return ret