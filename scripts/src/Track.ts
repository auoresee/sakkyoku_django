/**
 * A track has notes, an instrument, and methods to remove and add Notes
 * @param instrument The instrument used in the track
 */

import { Song } from "./Song";
import { InstrumentInfo, instrumentArray, instrumentNameToID } from "./instruments";
import { WebMIDISchedulerProxy, WebMIDIPlayer, WebMIDIScheduler } from "./WebMIDIPlayer";
import { audioCtx, masterGainNode } from "./SoundManager";
import WebAudioScheduler from './web-audio-scheduler';
import { timers } from "jquery";
import { Entry, PlayData, SF2Player, SF2Scheduler } from "./SF2Scheduler";
import * as _ from 'lodash';

const gWebMidiPlayer = new WebMIDIPlayer();
let gWebMidiIsReady = false;
try {
    gWebMidiPlayer.requestMIDIAccess();
    gWebMidiIsReady = true;
} catch (e) {
    console.log(e);
    console.log("cannot use webMidi");
}

const gSF2Player = new SF2Player();

type BackendKind = 'webaudio' | 'webmidi' | 'sf2';

// .value is either "webaudio" or "webmidi"
const backendSelector = document.querySelector('#backendSelector') as HTMLSelectElement;

const DEFAULT_BACKEND = 'webaudio';

export class TrackCoordinator {
    private tracks: Track[];
    private wmSched: WebMIDIScheduler;
    private sf2Sched: SF2Scheduler;
    private globalBackend: BackendKind;

    private _currentTime: number;
    public get currentTime() {
        return this._currentTime;
    }

    constructor() {
        this.tracks = [];
        this.wmSched = new WebMIDIScheduler(50, gWebMidiPlayer);
        this.sf2Sched = new SF2Scheduler(gSF2Player);
        this.globalBackend = DEFAULT_BACKEND;

        this._currentTime = 0;
        this.wmSched.timeUpdateCallback = (t) => this._currentTime = t;
    }

    reset() {
        this.wmSched.stop();
        this.wmSched = new WebMIDIScheduler(50, gWebMidiPlayer);
        this._currentTime = 0;
        this.wmSched.timeUpdateCallback = (t) => this._currentTime = t;
        this.tracks = [];
    }

    pushTrack(track: Track) {
        this.tracks.push(track);
    }

    stopAll() {
        for (const track of this.tracks) {
            track.stopWebAudio();
        }
        this.wmSched.stop();
    }

    updateBackend(backend: BackendKind) {
        for (const track of this.tracks) {
            track.updateBackend(backend);
        }
        this.globalBackend = backend;
    }

    playAll(beat: number) {
        switch (this.globalBackend) {
            case 'webaudio': {
                for (const track of this.tracks) {
                    const result = track.play(beat);
                    if (!result) {
                        continue;
                    }
                    if (result.backend !== this.globalBackend) {
                        console.error('backend mismatch');
                        return;
                    }
                }
                console.log(`play all with ${this.globalBackend} backend (${this.tracks.length} tracks loaded)`);
                break;
            }
            case 'webmidi': {
                const subCallbacks: any[] = [];
                for (const track of this.tracks) {
                    const result = track.play(beat);
                    if (!result) {
                        continue;
                    }
                    if (result.backend !== this.globalBackend) {
                        console.error('backend mismatch');
                        return;
                    }
                    subCallbacks.push(result.callback);
                }
                if (subCallbacks.length > 0) {
                    switch (this.globalBackend) {
                        case 'webmidi': {
                            const callback = (proxy: WebMIDISchedulerProxy) => {
                                for (const cb of subCallbacks) {
                                    cb(proxy);
                                }
                            };
                            this.wmSched.start(callback);
                            break;
                        }
                        default:
                            console.error('unreachable');
                            break;
                    }

                }
                break;
            }
            case 'sf2': {
                const notes: PlayData[] = [];
                for (const track of this.tracks) {
                    const result = track.play(beat);
                    if (!result) continue;
                    if (result.backend !== this.globalBackend) {
                        console.error('backend mismatch: ' + (result as any).backend + '!==' + this.globalBackend);
                        return;
                    }
                    result.notes.forEach((note) => {
                        const n2: PlayData = {
                            time: note.time,
                            entry: note.entry,
                            chan: track.trackNumber
                        };
                        notes.push(n2);
                    });
                }

                notes.sort((a, b) => {
                    const timeCmp = a.time - b.time;
                    if (timeCmp !== 0) return timeCmp;
                    if (a.entry.type === 'note-on' && b.entry.type === 'note-off') {
                        return 1;
                    } else if (a.entry.type === 'note-off' && b.entry.type === 'note-on') {
                        return -1;
                    }
                    return timeCmp;
                });
                this.sf2Sched.start(notes);
                break;
            }
        }

        console.log(`play all with ${this.globalBackend} backend (${this.tracks.length} tracks loaded)`);
    }

    scheduleNowWebMidi(data: number[]) {
        this.wmSched.scheduleNow(data);
    }

    scheduleWithDelayWebMidi(data: number[], millis: number) {
        this.wmSched.scheduleNowWithDelay(data, millis);
    }
}

export const gTrackCoord = new TrackCoordinator();

// response to backend change
backendSelector.addEventListener('change', (ev) => {
    gTrackCoord.stopAll();
    const backend = (ev.target as HTMLSelectElement).value as any;
    gTrackCoord.updateBackend(backend);
    console.log(`backend changed to ${backend}`);
});

export class Track {
    private song: Song;
    private sched: any
    private trackCoord: TrackCoordinator;
    gainNode: GainNode
    notes: Note[];
    instrumentID: number
    instrument: InstrumentInfo
    trackNumber: number
    // Program Change イベントを送信したか? (Web MIDIのみ)
    private programChanged = false;
    // response to backend change
    private backend: BackendKind;
    volume: number = 90;

    constructor(instrumentID: number, song: Song, trackNumber: number) {
        this.song = song;
        // @ts-ignore
        this.sched = new WebAudioScheduler({ context: audioCtx });
        this.gainNode = audioCtx.createGain();
        this.setVolume(90);
        this.notes = [];
        this.instrumentID = instrumentID;
        this.instrument = instrumentArray[instrumentID];
        this.trackNumber = trackNumber;

        this.gainNode.connect(masterGainNode);

        // Program Change イベントを送信したか? (Web MIDIのみ)
        this.programChanged = false;

        this.backend = DEFAULT_BACKEND;
        this.trackCoord = gTrackCoord;
    }

    updateBackend(backend: BackendKind) {
        this.backend = backend;
    }

    stopWebAudio() {
        if (this.sched != null) {
            this.sched.stop();
        }
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
    play(beat: number): false | {
        backend: 'webaudio'
    } | {
        backend: 'webmidi',
        callback: (proxy: WebMIDISchedulerProxy) => void
    } | {
        backend: 'sf2',
        notes: {
            time: number,
            entry: Entry
        }[]
    } {
        let startNote: number;
        if (beat != undefined) {
            startNote = this.findBeatIndex(beat);
            if (startNote == this.notes.length) {
                return false;
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
        return this.playWithBackend(startNote, beat);
    }

    playWithBackend(startNote: number, beat: number): {
        backend: 'webaudio'
    } | {
        backend: 'webmidi',
        callback: (proxy: WebMIDISchedulerProxy) => void
    } | {
        backend: 'sf2',
        notes: {
            time: number,
            entry: Entry
        }[]
    } {
        switch (this.backend) {
            case 'webaudio':
                this.playWithWebAudio(startNote, beat);
                return {
                    backend: 'webaudio'
                };
            case 'webmidi': {
                const callback = this.playWithWebMidi(startNote, beat);
                return {
                    backend: 'webmidi',
                    callback: callback
                };
            }
            case 'sf2': {
                const entries = this.playWithSF2(startNote, beat);
                return {
                    backend: 'sf2',
                    notes: entries
                };
            }
            default:
                throw new Error(`invalid backend: ${this.backend}`);
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

    playWithWebMidi(startNote: number, beat: number): (proxy: WebMIDISchedulerProxy) => void {
        /* Web MIDI 用のスケジューラ */
        const scheduledNotes: boolean[] = []; // ノートがスケジューリングされたか否か
        for (let i = 0; i < this.notes.length; i++) {
            scheduledNotes.push(false);
        }
        const callback = (proxy: WebMIDISchedulerProxy) => {
            const beatTime = 60.0 / this.song.tempo;
            const requestedDuration = proxy.requestDuration;
            const playbackTime = proxy.playbackTime;
            for (let i = startNote; i < this.notes.length; i++) {
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
                //const nn = this.mapMidiNoteNumber(null, this.notes[i].noteNumber);
                const nn = this.notes[i].noteNumber;
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
        // this.mSched.start(callback);
        return callback;
    }

    playWithSF2(startNote: number, beat: number): {
        time: number,
        entry: Entry
    }[] {
        const entries: {
            time: number,
            entry: Entry
        }[] = [];
        const beatTime = 60.0 / this.song.tempo;

        // program change
        let pc: number;
        if (this.instrument.isDrum || this.instrument.programChange === null) {
            pc = 0;
        } else {
            pc = this.instrument.programChange;
        }
        entries.push({
            time: 0,
            entry: {
                type: 'program-change',
                pc: pc,
                isDrum: this.instrument.isDrum === undefined ? false : this.instrument.isDrum
            }
        });

        // set channel volume
        entries.push({
            time: 0,
            entry: {
                type: 'set-channel-volume',
                volume: this.volume
            }
        });

        for (const note of this.notes) {
            // プレイバック開始からノート開始までの実時間 (millis)
            const absoluteTime = beatTime * (note.beat - beat) * 1000;
            if (absoluteTime < 0) {
                continue;
            }
            // 実時間のノートの長さ (millis)
            const absoluteDuration = beatTime * note.duration * 1000;

            entries.push({
                time: absoluteTime,
                entry: {
                    type: 'note-on',
                    key: note.noteNumber,
                    velocity: note.volume
                }
            });
            entries.push({
                time: absoluteTime + absoluteDuration,
                entry: {
                    type: 'note-off',
                    key: note.noteNumber
                }
            });
        }

        entries.sort((a, b) =>
            a.time - b.time
        );
        return entries;
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
        const velocity = Math.floor(100 * volume);
        const nn = this.mapMidiNoteNumber(freq, noteNumber);
        const noteOn = [0x90 | ch, nn, velocity];
        const noteOff = [0x80 | ch, nn, 0];
        this.trackCoord.scheduleNowWebMidi(noteOn);
        this.trackCoord.scheduleWithDelayWebMidi(noteOff, duration * 1000);
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
        for (let i = 0; i < this.notes.length; i++) {
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
        for (let i = 0; i < jobj.notes.length; i++) {
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
            this.trackCoord.scheduleNowWebMidi(data);
        }
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
export class Note {
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
