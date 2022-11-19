from note import Note, toNoteNumber, numberToTone
from utils import indexWhere

class Pattern:
    def __init__(self, notes = [], name = "") -> None:
        self.name = name
        self.notes = notes

    #音符を追加する (オブジェクトを書き換える。音符が重複した場合は上書きする)
    def add(self, note: Note) -> None:
        i = indexWhere(lambda n: n.tick == note.tick and n.note_number == note.note_number, self.notes)
        if(i != -1):
            self.notes[i] = note 
            return
        self.notes.append(note)
        self.notes.sort(key=lambda x: x.tick * 1000 + x.note_number)

    def concat(self, pattern, tick = 0):
        ret: Pattern = self.clone()
        if(tick != 0): pattern = pattern.shiftTick(tick)
        for note in pattern.notes:
            ret.add(note.clone())
        return ret

    def slice(self, start, end):
        ret = self.clone()
        ret.notes = []
        for note in self.notes:
            if note.tick >= start and note.tick < end:
                ret.notes.append(note)
        return ret

    def shiftHeight(self, height):
        ret = self.clone()
        for note in ret.notes:
            note.number += height
        return ret

    def shiftTick(self, tick):
        ret = self.clone()
        for note in ret.notes:
            note.tick += tick
        return ret

    def shiftVelocity(self, velocity):
        ret = self.clone()
        for note in ret.notes:
            note.velocity += velocity
        return ret

    def shiftDuration(self, duration):
        ret = self.clone()
        for note in ret.notes:
            note.duration += duration
        return ret

    def setVelocity(self, velocity):
        ret = self.clone()
        for note in ret.notes:
            note.velocity = velocity
        return ret

    def setDuration(self, duration):
        ret = self.clone()
        for note in ret.notes:
            note. duration = duration
        return ret

    def clone(self) -> 'Pattern':
        notes = []
        for note in self.notes:
            notes.append(note.clone())
        return Pattern(notes, self.name)

    def repeat(self, times, interval = 1920):
        ret = self.clone()
        for i in range(times - 1):
            ret = ret.concat(self.clone(), (i+1) * interval)
        return ret