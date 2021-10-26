/**
 * A Song contains 0 or more tracks, a tempo
 */
class Song {
    constructor() {
        this.name = "New Song";
        this.tempo = 120;
        this.tracks = [];
        this.songID = 0;    //0 if not saved in the server
        this.userID = 0;
        this.isOnRelease = false;   //whether this song is accessible by the public
        this.createdDate = Date.now();
        this.releasedDate = new Date(2000, 0, 1).getTime();   //not released
        this.lastUpdatedDate = this.createdDate;
    }
    /**
     * Create a new track for the song
     * @param instrument
     */
    createTrack(instrumentID) {
        this.tracks[this.tracks.length] = new Track(instrumentID, this);
        return this.tracks[this.tracks.length - 1];
    }
    /**
     * Change the tempo of the track
     * @param newTempo New tempo
     */
    changeTempo(newTempo) {
        this.tempo = newTempo;
    }

    release(){
        this.isOnRelease = true;
        this.releasedDate = Date.now();
    }

    /**
     * Play the song at the specified beat
     * @param {Number} beat
     */
    play(beat) {
        for (var i = 0; i < this.tracks.length; i++) {
            this.tracks[i].play(beat);
        }
    }
    getAllNotes() {
        var allNotes = [];
        for (var i = 0; i < this.tracks.length; i++) {
            allNotes[i] = this.tracks[i].notes;
        }
        return allNotes;
    }


    getJSON() {
        let jsonobj = {
            name: this.name,
            tempo: this.tempo,
            songID: this.songID,
            userID: this.userID,
            isOnRelease: this.isOnRelease,
            createdDate: this.createdDate,
            releasedDate: this.releasedDate,
            lastUpdatedDate: this.lastUpdatedDate,
        };
        let json_tracks = [];
        for(let i = 0; i < this.tracks.length; i++){
            json_tracks[i] = this.tracks[i].getJSONObject();
        }
        jsonobj.tracks = json_tracks;

        return JSON.stringify(jsonobj);
    }

    loadJSON(json){
        let obj = JSON.parse(json);
        this.loadJSONObject(obj);
    }

    loadJSONObject(obj){
        this.name = obj.name;
        this.tempo = obj.tempo;
        this.songID = obj.songID;
        this.userID = obj.userID;
        this.isOnRelease = obj.isOnRelease;
        this.createdDate = obj.createdDate;
        this.releasedDate = obj.releasedDate;
        if( ! ('releasedDate' in obj) ){        //for compatibility
            this.releasedDate = new Date(2000, 0, 1).getTime();
        }
        this.lastUpdatedDate = obj.lastUpdatedDate;
        let json_tracks = obj.tracks;
        for(let i = 0; i < json_tracks.length; i++){
            let track = new Track(0, this);
            track.loadJSONObject(json_tracks[i]);
            this.tracks[i] = track;
        }
    }


}

