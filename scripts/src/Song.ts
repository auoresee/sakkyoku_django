import { gTrackCoord, Track, TrackCoordinator } from './Track';

/**
 * A Song contains 0 or more tracks, a tempo
 */
export class Song {
    name: string;
    tempo: number;
    tracks: Track[];
    trackCoord: TrackCoordinator;
    songID: number; //0 if not saved in the server
    userID: number;
    isOnRelease: boolean; //whether this song is accessible by the public
    private createdDate: number;
    private releasedDate: number;
    lastUpdatedDate: number;

    constructor() {
        this.name = "New Song";
        this.tempo = 120;
        this.tracks = [];
        this.trackCoord = gTrackCoord;
        this.trackCoord.reset();
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
    createTrack(instrumentID: number) {
        this.tracks[this.tracks.length] = new Track(instrumentID, this, this.tracks.length);
        const track = this.tracks[this.tracks.length - 1];
        this.trackCoord.pushTrack(track);
        return track;
    }
    /**
     * Change the tempo of the track
     * @param newTempo New tempo
     */
    changeTempo(newTempo: number) {
        this.tempo = newTempo;
    }

    release() {
        this.isOnRelease = true;
        this.releasedDate = Date.now();
    }

    /**
     * Play the song at the specified beat
     * @param {Number} beat
     */
    play(beat: number) {
        this.trackCoord.playAll(beat);
    }
    getAllNotes() {
        var allNotes = [];
        for (var i = 0; i < this.tracks.length; i++) {
            allNotes[i] = this.tracks[i].notes;
        }
        return allNotes;
    }


    getJSON(): string {
        let json_tracks = [];
        for (let i = 0; i < this.tracks.length; i++) {
            json_tracks[i] = this.tracks[i].getJSONObject();
        }

        let jsonobj = {
            name: this.name,
            tempo: this.tempo,
            songID: this.songID,
            userID: this.userID,
            isOnRelease: this.isOnRelease,
            createdDate: this.createdDate,
            releasedDate: this.releasedDate,
            lastUpdatedDate: this.lastUpdatedDate,
            tracks: json_tracks
        };
        return JSON.stringify(jsonobj);
    }

    loadJSON(json: string) {
        let obj = JSON.parse(json);
        this.loadJSONObject(obj);
    }

    loadJSONObject(obj: SongJSON) {
        this.name = obj.name;
        this.tempo = obj.tempo;
        this.songID = obj.songID;
        this.userID = obj.userID;
        this.isOnRelease = obj.isOnRelease;
        this.createdDate = obj.createdDate;

        if (!('releasedDate' in obj)) {        //for compatibility
            this.releasedDate = new Date(2000, 0, 1).getTime();
        } else {
            this.releasedDate = obj.releasedDate as number;
        }

        this.lastUpdatedDate = obj.lastUpdatedDate;
        let json_tracks = obj.tracks;
        for (let i = 0; i < json_tracks.length; i++) {
            let track = new Track(0, this, i);
            track.loadJSONObject(json_tracks[i]);
            this.tracks[i] = track;
            this.trackCoord.pushTrack(track);
        }
    }

    public get currentTime() {
        return this.trackCoord.currentTime;
    }

    public get currentTimeInBeat() {
        const timeS = this.currentTime / 1000;
        const secPerBeat = 60 / this.tempo;
        return timeS / secPerBeat;
    }
}

type SongJSON = {
    name: string,
    tempo: number,
    songID: number,
    userID: number,
    isOnRelease: boolean,
    createdDate: number,
    releasedDate?: number,
    lastUpdatedDate: number,
    tracks: any
};
