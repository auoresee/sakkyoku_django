import io
import mido

class SMFChannel:
    def __init__(self, id=-1, initial_instrument=None):
        self.id = id    #0～15
        self.initial_instrument = initial_instrument
        self.initial_volume = 100       #Todo
        self.notes = []
        self.events = []

class SMFNote:
    def __init__(self, channel, note_on_tick, note_off_tick, note_number, velocity) -> None:
        self.channel = channel
        self.note_on_tick = note_on_tick
        self.note_off_tick = note_off_tick
        self.note_number = note_number
        self.velocity = velocity

    def getDuration(self):
        return self.note_off_tick - self.note_on_tick

# MIDIファイルから各チャンネルのノートを取得
def midi2channels(filedata: str):
    #binstream = io.BytesIO(filedata)        #バイナリストリームを作成
    file = mido.MidiFile(file=filedata)
    #ticks_per_beat = file.ticks_per_beat
    #abs_time_tick_msec = tempo / ticks_per_beat / 1000.0
    channels = [SMFChannel(i) for i in range(16)]
    # Search tracks
    for track in file.tracks:
        now = 0  # 現在の時刻（tick）を保持
        on_note_dict = {}       #現在発音中のノート(note_number -> Note)
        for event in track:
            now = now + event.time
            if event.type == 'set_tempo':
                tempo = event.tempo
                #abs_time_tick_msec = tempo / ticks_per_beat / 1000.0
                # print("BPM = ", 60000000.0 / tempo)
            #elif event.type == 'note_on' and event.channel == 9:
                # 打楽器を無視
            #    pass
            elif event.type == 'program_change':
                channels[event.channel].events.append(event)
                if(channels[event.channel].initial_instrument == None):
                    channels[event.channel].initial_instrument = event.program
            elif event.type == 'note_off' or (event.type == 'note_on' and event.velocity == 0):
                # ノートオフ
                note = on_note_dict.get(event.note, None)    #該当のノート番号にノートがあれば取得、なければNone
                if(note == None):        #該当のノート番号にonになっているノートがない場合
                    print(f"Warning: Channel {event.channel}, tick {now}, note number {event.note}: ノートオフに対応するノートオンが存在しません")
                else:        #該当のノート番号にonになっているノートがある場合
                    on_note_dict[note.note_number].note_off_tick = now       #ノートをオフにする
                    on_note_dict.pop(note.note_number)   #onノートのdictからノートを削除
            elif event.type == 'note_on':
                # ノートオンを登録
                note = SMFNote(event.channel, now, -1, event.note, event.velocity)

                if(note.note_number in on_note_dict):        #既にonになっているノートがある場合
                    print("Warning: Channel {event.channel}, tick {now}, note number {event.note}: 重複するノートがあります")
                    on_note_dict[note.note_number].note_off_tick = now       #既にあるノートをオフにする

                print(str(len(channels[note.channel].notes)), end="")
                channels[note.channel].notes.append(note)
                on_note_dict[note.note_number] = note

        #オフになっていないノートを処理(複数のトラックにまたがるノートはないと仮定する)
        for (note_number, note) in on_note_dict.items():
            print("Warning: Channel {event.channel}, tick {now}, note number {event.note}: ノートオフが存在しないノートがあります")
            on_note_dict[note.note_number].note_off_tick = now       #既にあるノートをオフにする

    return channels