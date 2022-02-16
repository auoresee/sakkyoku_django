const DEFAULT_STATUS_MESSAGE_DURATION_MS = 3000;

class Controls {
    constructor(song, piano, grid, sequencer) {
        this.sequencer = sequencer;
        this.piano = piano;
        this.grid = grid;
        this.playButton = document.getElementById('play-button');
        this.tempoButton = document.getElementById('tempo');
        this.tempoButton.value = this.sequencer.song.tempo;
        this.saveButton = document.getElementById('save-button');
        this.releaseButton = document.getElementById('release-button');
        this.createNewSongButton = document.getElementById('create-new-song-button');
        this.noteLengthsElements = document.getElementById('note-lengths').children;
        this.noteLengths = [4, 2, 1, 0.5, 0.25];
        this.tracks = [];
        this.tracksElement = document.getElementById('tracks');
        this.instrumentsElement = document.getElementById('instruments');
        this.trackVolumeSlider = document.getElementById('track-volume-slider');
        this.notePointCheckbox = document.getElementById('note-point-checkbox');
        this.registerInstruments();
        this.lengthWithoutPoint = 1;
        this.clearElement = document.getElementById('clear');
        this.clearElement.onclick = (function () {
            var del = confirm('Are you sure you want to delete track ' + sequencer.getCurrentTrackName());
            if (del) {
                var track = this.sequencer.getCurrentTrack();
                var grid = this.sequencer.getCurrentGrid();
                track.removeAll();
                grid.removeAll();

            }
        }).bind(this);
        this.tracksElement.onchange = (function () {
            var trackID = this.tracksElement.selectedIndex;
            sequencer.changeTrack(this.tracksElement.selectedIndex);
        }).bind(this);
        this.instrumentsElement.onchange = (function () {
            //var instrument = this.instrumentsElement.options[this.instrumentsElement.selectedIndex].value;
            sequencer.changeCurrentTrackInstrument(this.instrumentsElement.selectedIndex);
        }).bind(this);
        this.notePointCheckbox.onchange = (function () {
            this.changeNoteLength(this.lengthWithoutPoint);
        }).bind(this);

        this.lastMessageID = 0;     //used to manage status message
    }

    addListeners() {
        var self = this;
        this.playButton.addEventListener('click', function () {
            if(!isWebaudioContextResumed && audioCtx != null){
                audioCtx.resume();
                isWebaudioContextResumed = true;
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

        this.createNewSongButton.addEventListener('click', function () {
            var ok = confirm("保存されていない内容は失われます。よろしいですか？");
            if (ok) {
                var grid = this.sequencer.getCurrentGrid();
                grid.removeAll();
                this.sequencer.createNewSong();
            }
        }.bind(this), false);

        let textbox = $('#song-name-textbox');
        textbox.change(this.onSongNameTextboxChanged.bind(this));

        this.tempoButton.onblur = (function () {
            var val = parseInt(this.tempoButton.value, 10);
            if (val < 30 || isNaN(val)) {
                this.tempoButton.value = this.song.tempo;
            }
            else {
                this.sequencer.song.changeTempo(val);
            }

        }.bind(this));

        for (var i = 0; i < this.noteLengthsElements.length; i++) {
            this.noteLengthsElements[i].addEventListener('click', this.changeNoteLength.bind(this, this.noteLengths[i], this.noteLengthsElements[i]), false);
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

    setReleaseButtonState(is_on_release){
        this.releaseButton.disabled = is_on_release;
    }

    onSongNameTextboxChanged(){
        this.sequencer.song.name = this.getSongName();
    }

    changeNoteLength(length, element) {
        element = element || this.noteLengthsElements[this.noteLengths.indexOf(length)];

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
            this.noteLengthsElements[i].style.border = "outset";
        }
        element.style.border = "inset";
    }

    registerInstruments(){
        for(let i = 0; i < instrumentArray.length; i++){
            let ins = instrumentArray[i];
            this.instrumentsElement.options[i] = new Option(ins.displayName, ins.displayName);
        }
    }

    addTrack(trackName) {
        this.tracks[this.tracks.length] = trackName;
        this.tracksElement.options[this.tracksElement.options.length] = new Option(trackName, trackName);
    }

    applySongName(song_name){
        let textbox = $('#song-name-textbox');
        textbox.val(song_name);
    }

    getSongName(){
        let textbox = $('#song-name-textbox');
        return textbox.val();
    }

    setTrackVolumeSliderValue(volume){
        this.trackVolumeSlider.value = volume;
    }

    setReadOnlyMode(){
        this.saveButton.disabled = true;
        this.releaseButton.disabled = true;
    }

    setWriteMode(is_song_on_release){
        this.saveButton.disabled = false;
        this.releaseButton.disabled = is_song_on_release;
    }

    getTrackVolumeSliderValue(){
        return this.trackVolumeSlider.value;
    }

    //display message for *duration_ms* milliseconds
    //if duration_ms < 0, the message is not disappear
    displayStatusMessage(message, duration_ms = DEFAULT_STATUS_MESSAGE_DURATION_MS){
        this.lastMessageID++;
        $('#status_text').text(message);
        //時間経過後にメッセージを消去する
        //(自分が一番新しいメッセージである場合のみ)
        //時間内に複数のメッセージが出されたときに後のメッセージが消されないようにする
        //duration_msが負の場合は消去しない
        if(duration_ms >= 0){
            let callback_cleartext = function(messageID){
                if(messageID == this.lastMessageID){
                    $('#status_text').text("");
                }
            }.bind(this, this.lastMessageID);
            setTimeout(callback_cleartext, duration_ms);
        }
    }
}