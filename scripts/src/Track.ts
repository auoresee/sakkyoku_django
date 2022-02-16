/**
 * A track has notes, an instrument, and methods to remove and add Notes
 * @param instrument The instrument used in the track
 */

import { Song } from "./Song";
import { InstrumentInfo, instrumentArray, instrumentNameToID } from "./instruments";
import { WebMIDISchedulerProxy, WebMIDIPlayer, WebMIDIScheduler } from "./WebMIDIPlayer";

const gWebMidiPlayer = new WebMIDIPlayer();
let gWebMidiIsReady = false;
try {
    gWebMidiPlayer.requestMIDIAccess();
    gWebMidiIsReady = true;
} catch (e) {
    console.log(e);
    console.log("cannot use webMidi");
}

// .value is either "webaudio" or "webmidi"
const backendSelector = document.querySelector('#backendSelector') as HTMLSelectElement;

export class Track {
    private song: Song;
    private sched: any
    private mSched: WebMIDIScheduler;
    gainNode: GainNode
    notes: Note[];
    private instrumentID: number
    private instrument: InstrumentInfo
    private trackNumber: number
    // Program Change イベントを送信したか? (Web MIDIのみ)
    private programChanged = false;
    // response to backend change
    private backend: "webaudio" | "webmidi";
    private volume: number = 90;

    constructor(instrumentID: number, song: Song, trackNumber: number) {
        this.song = song;
        this.sched = new WebAudioScheduler({ context: audioCtx });
        this.mSched = new WebMIDIScheduler(50, gWebMidiPlayer);
        this.gainNode = audioCtx.createGain();
        this.setVolume(90);
        this.notes = [];
        this.instrumentID = instrumentID;
        this.instrument = instrumentArray[instrumentID];
        this.trackNumber = trackNumber;

        this.gainNode.connect(masterGainNode);

        // Program Change イベントを送信したか? (Web MIDIのみ)
        this.programChanged = false;

        // response to backend change
        this.backend = backendSelector.value as any;
        backendSelector.addEventListener('change', (ev) => {
            if (this.sched != null) this.sched.stop();
            if (this.mSched != null) this.mSched.stop();
            this.backend = (ev.target as HTMLSelectElement).value as any;
            console.log(`backend changed to ${this.backend}`);
        });
    }
    /**
     * Add a single note to the track
     * @param {Note} The note to add
     */
    addNote(note: Note) {
        //binary search tree seems kind of overkill for now
        for (var i = 0; i < this.notes.length; i++) {
            if (this.notes[i].beat >= note.beat) {
                this.notes.splice(i, 0, note);
                return note;
            }
        }
        this.notes[this.notes.length] = note;
        return note;
    }
    /**
     * Remove the given note
     * @param {Number} noteNumber
     * @param {Number} beat
     * @param {Number} duration
     */
    removeNote(noteNumber: number, beat: number, duration: number, volume: number) {
        //binary search tree seems kind of overkill for now
        for (var i = 0; i < this.notes.length; i++) {
            //if (this.notes[i].frequency == frequency && this.notes[i].duration == duration && this.notes[i].beat == beat) {
            if (this.notes[i].noteNumber == noteNumber && this.notes[i].beat == beat) {
                this.notes.splice(i, 1);
                return;
            }
        }
    }
    removeAll() {
        this.notes = [];
    }
    /**
     * Play the song
     * may want to add startbeat as an instance variable or something and then have a setter function
     * @param {Number} beat The beat of the song to start at
     */
    play(beat: number) {
        let startNote: number;
        if (beat != undefined) {
            startNote = this.findBeatIndex(beat);
            if (startNote == this.notes.length) {
                return;
            }
            //offset = this.notes[startNote].beat - beat;
        }
        else {
            startNote = 0;
            beat = 0;
            //offset = 0;
        }
        /*for (var i = startNote; i < this.notes.length; i++) {
            this.audiolet.scheduler.addRelative(this.notes[i].beat - beat, this.playNote.bind(this, this.notes[i].frequency, this.notes[i].beat, this.notes[i].duration, this.notes[i].volume));
        }*/


        // this.playWithWebAudio(startNote, beat);
        //this.playWithWebMidi(startNote, beat);
        this.playWithBackend(startNote, beat);
    }

    playWithBackend(startNote: number, beat: number) {
        switch (this.backend) {
        case 'webaudio':
            this.playWithWebAudio(startNote, beat);
            break;
        case 'webmidi':
            this.playWithWebMidi(startNote, beat);
            break;
        }
    }

    playWithWebAudio(startNote: number, beat: number) {
        /* Web Audio 用のスケジューラ */
        let callback = (e: any) => {
            let beatTime = 60.0 / this.song.tempo;
            const delay = 0.1;
            for (var i = startNote; i < this.notes.length; i++) {
                this.sched.insert(e.playbackTime + delay + beatTime * (this.notes[i].beat - beat), this.playNote.bind(this, this.notes[i].noteNumber, this.notes[i].beat, this.notes[i].duration, this.notes[i].volume));
            }
        };
        this.sched.start(callback);
    }

    playWithWebMidi(startNote: number, beat: number) {
        /* Web MIDI 用のスケジューラ */
        const scheduledNotes: boolean[] = []; // ノートがスケジューリングされたか否か
        for (let i=0; i<this.notes.length; i++) {
            scheduledNotes.push(false);
        }
        const callback = (proxy: WebMIDISchedulerProxy) => {
            const beatTime = 60.0 / this.song.tempo;
            const requestedDuration = proxy.requestDuration;
            const playbackTime = proxy.playbackTime;
            for (let i=startNote; i<this.notes.length; i++) {
                // プレイバック開始からノート開始までの実時間 (millis)
                const absoluteTime = beatTime * (this.notes[i].beat - beat) * 1000;
                if (absoluteTime < playbackTime) {
                    // まだ再生位置に達していない
                    continue;
                } else if (absoluteTime > playbackTime + requestedDuration) {
                    // 今要求されている時間外のノートに到達したので終了する
                    break;
                } else if (scheduledNotes[i]) {
                    // 二重にスケジューリングされないようにする
                    continue;
                }

                // 実時間のノートの長さ (millis)
                const absoluteDuration = beatTime * this.notes[i].duration * 1000;
                // MIDI チャンネル
                const ch = this.trackNumber;
                // MIDI イベント
                const nn = this.mapMidiNoteNumber(null, this.notes[i].noteNumber);
                const noteOn = [0x90 | ch, nn, this.notes[i].volume];
                const noteOff = [0x80 | ch, nn, 0];
                // スケジューリング
                proxy.scheduleWithDelay(noteOn, absoluteTime - playbackTime);
                proxy.scheduleWithDelay(noteOff, absoluteTime + absoluteDuration - playbackTime);
                // スケジューリングされたとしてフラグをつける
                scheduledNotes[i] = true;
            }
        };
        this.midiProgramChangeIfNeeded();
        this.mSched.start(callback);
    }

    playNote(noteNumber: number, beat: number, duration: number, volume: number, midiNoteNumber: number) {
        this.playNoteWithWebAudio(noteNumber, beat, duration, volume, midiNoteNumber);
    }

    /**
     * Play a note
     * @param {Number} frequency
     * @param {Number} beat
     * @param {Number} duration
     * @param {Number} volume
     */
    playNoteWithWebAudio(noteNumber: number, beat: number, duration: number, volume: number, midiNoteNumber: number) {
        let note = new Note(noteNumber, beat, duration, volume);
        let beatTime = 60.0 / this.song.tempo;
        this.instrument.play(this, note.noteNumber, note.duration * beatTime, note.volume);
        // noteToPlay.connect(this.audiolet.output);   
    }

    playNoteWithWebMidi(noteNumber: number, beat: number, duration: number, volume: number, midiNoteNumber: number) {
        this.playMidiNote(midiNoteNumber, duration, volume, noteNumber);
    }

    playMidiNote(noteNumber: number, duration: number, volume: number, freq: number) {
        this.midiProgramChangeIfNeeded();
        const ch = this.trackNumber;
        const velocity = Math.floor(100*volume);
        const nn = this.mapMidiNoteNumber(freq, noteNumber);
        const noteOn = [0x90 | ch, nn, velocity];
        const noteOff = [0x80 | ch, nn, 0];
        this.mSched.scheduleNow(noteOn);
        this.mSched.scheduleNowWithDelay(noteOff, duration*1000);
    }

    mapMidiNoteNumber(freq: number, noteNumber: number) {
        const inst = this.instrument;
        return noteNumber;
    }

    /**
     * Get the index where the Beat should be
     * @param {Number} beat The beat
     */
    findBeatIndex(beat: number): number {
        var i;
        for (i = 0; i < this.notes.length; i++) {
            if (beat <= this.notes[i].beat) {
                return i;
            }
        }
        return i;
    }


    getJSONObject(): TrackJSON {
        let jsonobj: TrackJSON = {
            instrument: this.instrument.name, //楽器を追加した場合のためにIDでなくNameを用いる
            volume: this.volume,
            notes: [],
        };
        for(let i = 0; i < this.notes.length; i++){
            jsonobj.notes[i] = this.notes[i].getJSONObject();
        }
        return jsonobj;
    }

    loadJSON(json: string) {
        this.loadJSONObject(JSON.parse(json));
    }

    loadJSONObject(jobj: TrackJSON) {
        this.instrumentID = instrumentNameToID[jobj.instrument];
        this.instrument = instrumentArray[this.instrumentID];
        this.setVolume(jobj.volume);

        this.notes = [];
        for(let i = 0; i < jobj.notes.length; i++){
            this.notes[i] = this.loadNoteJSONObject(jobj.notes[i]);
        }
    }

    loadNoteJSONObject(jobj: NoteJSON) {
        let note = new Note(0, 0, 0, 0);
        note.noteNumber = jobj.noteNumber;
        note.beat = jobj.beat;
        note.duration = jobj.duration;
        note.volume = jobj.velocity;
        return note;
    }

    setVolume(volume: number) {
        this.volume = volume;
        this.gainNode.gain.value = volume / 127.0;
    }

    midiProgramChangeIfNeeded() {
        if (this.programChanged) return;
        if (this.instrument.isDrum) {
            // TODO
            this.trackNumber = 9;
        } else {
            const pc = this.instrument.programChange;
            if (pc == null) {
                console.warn("pc is null");
                return;
            }
            const data = [0xc0 | this.trackNumber, pc];
            this.mSched.scheduleNow(data);
        }
    }

    resetBackend() {

    }
}

type TrackJSON = {
    instrument: string,
    volume: number,
    notes: NoteJSON[]
};


/**
 * A note consists of a frequency, a beat, and a duration
 * @param {Number} frequency
 * @param {Number} beat 
 * @param {Number} duration
 */
class Note {
    noteNumber: number;
    beat: number;
    duration: number;
    volume: number;

    constructor(noteNumber: number, beat: number, duration: number, volume: number) {
        this.noteNumber = noteNumber;
        this.beat = beat;
        this.duration = duration;
        this.volume = volume;
    }
    toString(): string {
        return "beat: " + this.beat + " duration: " + this.duration;
    }
    getJSONObject(): NoteJSON {
        return {
            noteNumber: this.noteNumber,
            beat: this.beat,
            duration: this.duration,
            velocity: this.volume,
        };
    }
}

type NoteJSON = {
    noteNumber: number,
    beat: number,
    duration: number,
    velocity: number
};
