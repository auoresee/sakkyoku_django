import sys, os
import mido
from mido import Message, MidiFile, MidiTrack, MetaMessage
from guitar_generator import GuitarGenerator
from bass_generator import BassGenerator
from chord_progression import ChordProgression
from chord import Chord, separateChordName
from note_pos import LEN_WHOLE, LEN_HALF, LEN_QUARTER, LEN_EIGHTH, LEN_SIXTEENTH
from drum_generator import DrumGenerator

def addNotesToTrack(track: MidiTrack, notes: list, channel: int = 0, start_tick = 0) -> None:
    msglist = []
    for note in notes:
        msglist.append(Message('note_on', note=note.note_number, velocity=note.velocity, time=note.tick + start_tick, channel=channel))
        msglist.append(Message('note_off', note=note.note_number, velocity=note.velocity, time=note.tick + start_tick + note.duration, channel=channel))

    msglist.sort(key=lambda x: x.time)

    prevtime = 0
    """for msg in msglist:
        if(prev is not None):
            step = msg.time - prevtime
            prev.time = step
            track.append(prev)
        prev = msg
        prevtime = msg.time
    if(prev is not None):
        prev.time = LEN_WHOLE
        track.append(prev)"""

    for msg in msglist:
        step = msg.time - prevtime
        prevtime = msg.time
        msg.time = step
        track.append(msg)

canon = ["C", "G", "Am", "Em7", "F", "C", "Dm7", "G7"]
basic = ["C", "F", "G", "C", "C", "F", "G7", "C"]
circ = ["C", "Am", "F", "G", "C", "Am", "F", "G"]
cgaf = ["C", "G", "Am7", "F", "C", "G", "Am7", "F"]
cliche = ["C", "G/B", "Gm/Bb", "F/A", "Fm/Ab", "C/G", "D/F#", "G"]
kmr = ["Am", "F", "G7", "C", "Am7", "F", "G7", "C"]
th = ["Ab", "Bb", "Cm", "Cm", "Ab", "Bb", "Cm", "Cm"]
fgea = ["F", "G7", "Em7", "Am7", "Dm7", "G7", "C", "C7"]
fgea_m = ["F", "G7", "Em7", "Am7", "Dm7", "G7", "A", "A"]
fgea_end = ["F", "G7", "Em7", "Am7", "Dm7", "G7", "C", "C"]

s0129 = ["Bb", "Bb", "Bb", "Bb", "D/A", "D/A", "D7", "D7",
        "Gm", "Gm", "F", "Bb", "Cm", "C7", "F7", "F7"]

heavy = ["C", "C", "E", "E", "A", "A", "C", "C",
        "F", "G7", "C", "A7", "Dm", "Dm7", "G7", "G7"]

ea = ["Eb", "Eb", "Bb", "Bb", "Cm", "Bb", "Ab", "Ab", 
         "Bb", "Bb", "Eb", "Cm", "Dm7", "Dm7", "G", "G"]

eb = ["Ab", "Ab", "Gm", "Cm", "Fm", "Bb", "Bbm", "Eb",
         "Ab", "Ab", "Gm", "Cm", "Dm7", "Dm7", "G", "G"]

e7 = ["Cm", "Fm", "Bb", "Eb", "Cm", "Fm", "Bb", "Eb",
        "Cm", "Fm", "Bb", "Eb", "Cm", "Fm", "Bb", "Cm",
        "Cm", "Fm", "Bb", "Eb", "Cm", "Fm", "Bb", "Cm"]

cs = []
"""cs.extend(canon)
cs.extend(basic)
cs.extend(circ)
cs.extend(cgaf)
cs.extend(cliche)
cs.extend(kmr)
cs.extend(th)
cs.extend(fgea)
cs.extend(fgea_end)
cs.extend(ea)
cs.extend(ea)
cs.extend(eb)
cs.extend(e7)

cs.extend(canon)
cs.extend(canon)
cs.extend(cliche)
cs.extend(cliche)
cs.extend(th)
cs.extend(ea)
cs.extend(ea)
cs.extend(eb)
cs.extend(e7)"""

cs.extend(canon)
cs.extend(canon)
cs.extend(["F", "G7", "Em7", "Am7", "F", "G7", "Em7", "Am7"])
cs.extend(["F", "G7", "Em7", "Am7", "Dm", "Em", "F", "G"])
cs.extend(kmr)
cs.extend(kmr)


chords = []

for i in range(0, len(cs)):
    root, type, bass = separateChordName(cs[i])
    chords.append(Chord(root, type=type, bass=bass, tick=i * LEN_HALF))

prog = ChordProgression(chords)

gg = GuitarGenerator(prog)
#gg.mode = 'power'
gg.velocity_pattern = '332'

notes = gg.generateSimple8Beat()

bg = BassGenerator(prog)

notes2 = bg.generateSimple8Beat()

dg = DrumGenerator(prog.calcLength() // LEN_WHOLE)

notes10 = dg.generateSimple8Beat()

mid = MidiFile()

conductor = MidiTrack()
mid.tracks.append(conductor)
conductor.append(MetaMessage('set_tempo', tempo=mido.bpm2tempo(165)))
conductor.append(MetaMessage('time_signature', numerator=1, denominator=4))
conductor.append(MetaMessage('time_signature', numerator=4, denominator=4, time=LEN_QUARTER))

track = MidiTrack()
mid.tracks.append(track)
#track.append(MetaMessage('set_tempo', tempo=mido.bpm2tempo(145)))
track.append(Message('program_change', time=0, channel=0, program=29))  # OD guitar

addNotesToTrack(track, notes, 0, LEN_QUARTER)


track2 = MidiTrack()
mid.tracks.append(track2)
track2.append(Message('program_change', time=0, channel=1, program=33))  # Finger Bass
addNotesToTrack(track2, notes2, 1, LEN_QUARTER)

track10 = MidiTrack()
mid.tracks.append(track10)
track10.append(Message('program_change', time=0, channel=9, program=0))
addNotesToTrack(track10, notes10, 9, LEN_QUARTER)

mid.save('new_song2.mid')