import { Controls } from "./Controls";
import { instrumentArray, InstrumentInfo, instrumentList, instrumentNameToID } from "./instruments";
import { Song } from "./Song";
import { Note, Track } from "./Track";
import { Grid, Piano } from "./ui";

const DEFAULT_TRACK_NUM = 8;
const UPLOAD_URL = "/api/songs/save";

export class Sequencer {
    song: Song;
    private instruments: {
        [key: string]: InstrumentInfo;
    };
    private tracks: Track[];
    private trackNames: string[];
    private pianos: Piano[];
    private grids: Grid[];
    private index: number;

    private isWriteMode: boolean;

    //menu   
    private controls: Controls;

    private isPlaying: boolean;

    constructor() {
        this.song = new Song();
        this.instruments = instrumentList;
        this.tracks = this.song.tracks;
        this.trackNames = [];
        this.pianos = [];
        this.grids = [];
        this.index = 0;

        this.isWriteMode = true;

        //menu   
        this.controls = new Controls(this.song, null as any, null as any, this); // TODO: ?
        this.controls.addListeners();

        let saveExist = this.restoreLocalSavedJSON();
        if (!saveExist) {
            console.debug("Local save doesn't exist");
            this.createNewSong();
        }

        setInterval(() => {
            this.save();
        }, 5000);

        this.isPlaying = false;
    }

    createNewSong() {
        this.song = new Song();
        this.setMode(true);
        this.generateInitialTracks();
        this.setSong(this.song);
    }

    generateInitialTracks() {

        this.generateTrack("Piano");
        this.generateTrack("SopranoSax");
        this.generateTrack("FingerBass");
        this.generateTrack("Strings");
        this.generateTrack("Percussion");

        for (let i = this.song.tracks.length; i < DEFAULT_TRACK_NUM; i++) {
            this.generateTrack("Piano");
        }
    }

    generateTrack(instrumentName: string) {
        let new_track = this.song.createTrack(instrumentNameToID[instrumentName]);
        this.addTrack(new_track);
    }

    addTrack(track: Track) {
        let i = this.trackNames.length;
        this.trackNames[i] = this.generateTrackName(i, track.instrument);
        this.pianos[i] = new Piano(20, 40, 30, track);
        this.grids[i] = new Grid();
        this.controls.addTrack(this.trackNames[i]);
    }

    drawMain(track: Track, savedNotes: Note[]) {
        this.index = this.tracks.indexOf(track);
        this.pianos[this.index].drawPiano('c', 7, 60);
        this.grids[this.index].drawGrid(100, 1, this.pianos[this.index], savedNotes);
        this.grids[this.index].drawNotes();
        this.grids[this.index].redrawMeasureBar(0);
        this.controls.changeNoteLength(this.grids[this.index].currentNoteDuration);
    }

    redrawCurrentTimeBar() {
        console.log(this.song.currentTimeInBeat);
        this.grids[this.index].redrawMeasureBar(this.song.currentTimeInBeat);
    }

    save() {
        this.song.lastUpdatedDate = Date.now();
        localStorage.setItem('song', this.song.getJSON());
    }

    restoreLocalSavedJSON() {
        let json = localStorage.getItem('song');
        let result = this.restoreSavedJSON(json);
        return result;
    }

    restoreSavedJSON(json: string | null | undefined) {
        if (json == null || json == undefined) return false;

        //this.song.changeTempo(parseInt(tempo, 10));
        this.song = new Song();
        this.song.loadJSON(json);

        this.setSong(this.song);
        return true;
    }

    setMode(is_write_mode: boolean) {
        if (is_write_mode == this.isWriteMode) return;

        this.isWriteMode = is_write_mode;

        //sets read only mode
        if (this.isWriteMode == false) {
            this.controls.setReadOnlyMode();
        }
        else {
            this.controls.setWriteMode(this.song.isOnRelease);
        }
    }

    setSong(song: Song) {
        this.song = song;
        this.tracks = this.song.tracks;
        this.trackNames = [];
        this.pianos = [];
        this.grids = [];
        this.index = 0;

        let tempo = song.tempo;
        (document.getElementById('tempo') as HTMLInputElement).value = tempo as unknown as string;

        this.controls.clearAllTrackFromSelector();

        for (let i = 0; i < this.tracks.length; i++) {
            this.trackNames[i] = this.generateTrackName(i, this.tracks[i].instrument);
            this.controls.addTrack(this.trackNames[i]);
            this.pianos[i] = new Piano(20, 40, 30, this.tracks[i]);
            this.grids[i] = new Grid();
        }

        this.controls.applySongName(song.name);
        this.controls.setReleaseButtonState(song.isOnRelease);
        this.changeTrack(0);

        for (var i = 0; i < this.tracks.length; i++) {
            this.drawMain(this.tracks[i], this.tracks[i].notes);
        }

        this.drawMain(this.tracks[0], []);
    }

    uploadSong() {
        if (!this.song.name) {        //when empty or null
            alert("曲名を入力してください");
            return;
        }

        const csrf_token = getCookie("csrftoken") as string;

        this.save();

        let jsondata = this.song.getJSON();

        $.ajax(
            {
                url: UPLOAD_URL,
                type: 'POST',
                data: "json=" + jsondata,
                beforeSend: function (xhr, settings) {
                    xhr.setRequestHeader("X-CSRFToken", csrf_token);
                },
                error: function () { },
                complete: this.processUploadResponse.bind(this),
                dataType: 'json'
            }
        );
    }

    processUploadResponse(response: { responseText: any; }) {
        let res = response.responseText;

        console.debug(res);

        if (res.charAt(0) == "!") {   //error
            alert(res.substring(1));
            return;
        }
        if (res.charAt(0) != "{") {   //not json
            alert("Invalid response: " + res);
            return;
        }

        /*alert("保存しました");*/
        let rjson = JSON.parse(res);

        console.debug(rjson);

        if (this.song.songID == 0) {
            this.song.songID = rjson.songID;
        }
        if (this.song.userID == 0) {
            this.song.userID = rjson.userID;
        }
    }

    processImportResponse(response: JQuery.jqXHR<any>) {
        let res = response.responseText;

        console.debug(res);

        if (res.charAt(0) == "!") {   //error
            alert(res.substring(1));
            return;
        }
        if (res.charAt(0) != "{") {   //not json
            alert("Invalid response: " + res);
            return;
        }

        this.song = new Song();
        this.song.loadJSON(res);

        this.setSong(this.song);
    }


    releaseSong() {
        if (!this.song.name) {        //when empty or null
            alert("曲名を入力してください");
            return;
        }
        this.song.release();
        this.uploadSong();
    }

    getCurrentTrack() {
        return this.tracks[this.index];
    }
    getCurrentGrid() {
        return this.grids[this.index];
    }
    getCurrentTrackName() {
        return this.trackNames[this.index];
    }
    changeTrack(trackID: number) {
        let track = this.tracks[trackID];
        this.controls.instrumentsElement.selectedIndex = track.instrumentID;
        this.controls.setTrackVolumeSliderValue(track.volume);
        this.drawMain(this.tracks[trackID], []);
        console.debug(this.song.getJSON())
    }

    generateTrackName(trackID: number, instrument: InstrumentInfo) {
        return "" + (trackID + 1) + ": " + instrument.displayName;
    }

    //change instrument of a track
    changeTrackInstrument(trackID: number, instrumentID: number) {
        let track = this.tracks[trackID];
        let new_instr = instrumentArray[instrumentID];
        track.instrument = new_instr;
        track.instrumentID = instrumentID;
        let trackName = this.generateTrackName(trackID, new_instr);
        this.trackNames[trackID] = trackName;
        this.controls.tracksElement.options[trackID] = new Option(trackName, trackName);
        this.controls.tracksElement.selectedIndex = trackID;    //tracksElementを変更するとインデックスが変化するので元に戻す
    }

    //change instrument of the current track
    changeCurrentTrackInstrument(instrumentID: number) {
        this.changeTrackInstrument(this.index, instrumentID);
    }

    transposeCurrentTrack(num: number) {
        let track = this.tracks[this.index];
        for (let i = 0; i < track.notes.length; i++) {
            track.notes[i].noteNumber += num
        }
        this.drawMain(this.tracks[this.index], []);
    }

    play(beat: number) {
        this.song.play(beat);
        setInterval(() => {
            this.redrawCurrentTimeBar();
        }, 100);
    }
}

// csrf_tokenの取得に使う
export function getCookie(name: string | any[]) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}