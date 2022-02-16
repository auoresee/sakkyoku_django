import { instrumentArray } from "./instruments";
import { Sequencer } from "./Sequencer";
import { Song } from "./Song";
import { audioCtx, isWebaudioContextResumed, setIsWebaudioContextResumed } from "./SoundManager";
import { Track } from "./Track";
import { Grid, Piano } from "./ui";

const DEFAULT_STATUS_MESSAGE_DURATION_MS = 3000;

export class Controls {
    private sequencer: Sequencer;
    private piano: Piano;
    private grid: Grid;
    private playButton: HTMLButtonElement;
    private tempoButton: HTMLInputElement;
    private saveButton: HTMLButtonElement;
    private releaseButton: HTMLButtonElement;
    private createNewSongButton: HTMLButtonElement;
    private noteLengthsElements: HTMLCollection;
    private noteLengths: number[];
    private tracks: string[];
    tracksElement: HTMLSelectElement;
    instrumentsElement: HTMLSelectElement;
    private trackVolumeSlider: HTMLInputElement;
    private notePointCheckbox: HTMLInputElement;
    private lengthWithoutPoint: number;
    private clearElement: HTMLButtonElement;
    private lastMessageID: number     //used to manage status message

    constructor(song: Song, piano: Piano, grid: Grid, sequencer: Sequencer) {
        this.sequencer = sequencer;
        this.piano = piano;
        this.grid = grid;
        this.playButton = document.getElementById('play-button') as any;
        this.tempoButton = document.getElementById('tempo') as any;
        this.tempoButton.value = this.sequencer.song.tempo as unknown as string;
        this.saveButton = document.getElementById('save-button') as any;
        this.releaseButton = document.getElementById('release-button') as any;
        this.createNewSongButton = document.getElementById('create-new-song-button') as any;
        this.noteLengthsElements = document.getElementById('note-lengths')?.children as any;
        this.noteLengths = [4, 2, 1, 0.5, 0.25];
        this.tracks = [];
        this.tracksElement = document.getElementById('tracks') as any;
        this.instrumentsElement = document.getElementById('instruments') as any;
        this.trackVolumeSlider = document.getElementById('track-volume-slider') as any;
        this.notePointCheckbox = document.getElementById('note-point-checkbox') as any;
        this.registerInstruments();
        this.lengthWithoutPoint = 1;
        this.clearElement = document.getElementById('clear') as any;
        this.clearElement.onclick = () => {
            const del = confirm('Are you sure you want to delete track ' + sequencer.getCurrentTrackName());
            if (del) {
                const track = this.sequencer.getCurrentTrack();
                const grid = this.sequencer.getCurrentGrid();
                track.removeAll();
                grid.removeAll();

            }
        };
        this.tracksElement.onchange = () => {
            var trackID = this.tracksElement.selectedIndex;
            sequencer.changeTrack(this.tracksElement.selectedIndex);
        };
        this.instrumentsElement.onchange = () => {
            //var instrument = this.instrumentsElement.options[this.instrumentsElement.selectedIndex].value;
            sequencer.changeCurrentTrackInstrument(this.instrumentsElement.selectedIndex);
        };
        this.notePointCheckbox.onchange = () => {
            this.changeNoteLength(this.lengthWithoutPoint);
        };

        this.lastMessageID = 0;     //used to manage status message
    }

    addListeners() {
        var self = this;
        this.playButton.addEventListener('click', function () {
            if(!isWebaudioContextResumed && audioCtx != null){
                audioCtx.resume();
                setIsWebaudioContextResumed(true);
            }
            self.sequencer.song.play(0);
        }, false);

        this.saveButton.addEventListener('click', function () {
            self.sequencer.uploadSong();
        }, false);

        this.releaseButton.addEventListener('click', function () {
            self.sequencer.releaseSong();
            self.setReleaseButtonState(true);
        }, false);

        this.trackVolumeSlider.addEventListener('input', this.onTrackVolumeSliderChanged.bind(this));

        this.createNewSongButton.addEventListener('click', () => {
            var ok = confirm("保存されていない内容は失われます。よろしいですか？");
            if (ok) {
                var grid = this.sequencer.getCurrentGrid();
                grid.removeAll();
                this.sequencer.createNewSong();
            }
        }, false);

        let textbox = $('#song-name-textbox');
        textbox.change(this.onSongNameTextboxChanged.bind(this));

        this.tempoButton.onblur = () => {
            var val = parseInt(this.tempoButton.value, 10);
            if (val < 30 || isNaN(val)) {
                this.tempoButton.value = (this as any).song.tempo; // bug?
            }
            else {
                this.sequencer.song.changeTempo(val);
            }

        };

        for (var i = 0; i < this.noteLengthsElements.length; i++) {
            this.noteLengthsElements[i].addEventListener('click', () => this.changeNoteLength(this.noteLengths[i], this.noteLengthsElements[i]), false);
        }
    }

    onTrackVolumeSliderChanged(){
        this.sequencer.getCurrentTrack().setVolume(this.getTrackVolumeSliderValue());
    }

    clearAllTrackFromSelector(){
        var sl = this.tracksElement;
        while(sl.lastChild)
        {
            sl.removeChild(sl.lastChild);
        }
    }

    setReleaseButtonState(is_on_release: boolean){
        this.releaseButton.disabled = is_on_release;
    }

    onSongNameTextboxChanged(){
        this.sequencer.song.name = this.getSongName();
    }

    changeNoteLength(length: number, element?: Element | HTMLCollection) {
        const element2 = element || this.noteLengthsElements[this.noteLengths.indexOf(length)];

        this.lengthWithoutPoint = length;

        if(this.notePointCheckbox.checked) length *= 1.5;

        let grid = this.sequencer.getCurrentGrid();

        grid.currentNoteDuration = length;

        if (length >= 1) {
            grid.currentSmallestBeatIncrement = 0.5;
        } else {
            grid.currentSmallestBeatIncrement = 0.25;
        }
        grid.currentSmallestPixelBeatIncrement = grid.cellWidth * grid.currentSmallestBeatIncrement / grid.cellBeatLength;

        for (var i = 0; i < this.noteLengthsElements.length; i++) {
            (this.noteLengthsElements[i] as any).style.border = "outset";
        }
        (element2 as any).style.border = "inset";
    }

    registerInstruments(){
        for(let i = 0; i < instrumentArray.length; i++){
            let ins = instrumentArray[i];
            this.instrumentsElement.options[i] = new Option(ins.displayName, ins.displayName);
        }
    }

    addTrack(trackName: string) {
        this.tracks[this.tracks.length] = trackName;
        this.tracksElement.options[this.tracksElement.options.length] = new Option(trackName, trackName);
    }

    applySongName(song_name: string) {
        let textbox = $('#song-name-textbox');
        textbox.val(song_name);
    }

    getSongName(){
        let textbox = $('#song-name-textbox');
        return textbox.val() as string;
    }

    setTrackVolumeSliderValue(volume: number) {
        this.trackVolumeSlider.value = volume as any;
    }

    setReadOnlyMode(){
        this.saveButton.disabled = true;
        this.releaseButton.disabled = true;
    }

    setWriteMode(is_song_on_release: boolean){
        this.saveButton.disabled = false;
        this.releaseButton.disabled = is_song_on_release;
    }

    getTrackVolumeSliderValue(){
        return Number.parseInt(this.trackVolumeSlider.value);
    }

    //display message for *duration_ms* milliseconds
    //if duration_ms < 0, the message is not disappear
    displayStatusMessage(message: string, duration_ms = DEFAULT_STATUS_MESSAGE_DURATION_MS){
        this.lastMessageID++;
        $('#status_text').text(message);
        //時間経過後にメッセージを消去する
        //(自分が一番新しいメッセージである場合のみ)
        //時間内に複数のメッセージが出されたときに後のメッセージが消されないようにする
        //duration_msが負の場合は消去しない
        if(duration_ms >= 0){
            let callback_cleartext = function(messageID: number){
                // @ts-ignore
                if(messageID == this.lastMessageID){
                    $('#status_text').text("");
                }
            }.bind(this, this.lastMessageID);
            setTimeout(callback_cleartext, duration_ms);
        }
    }
}