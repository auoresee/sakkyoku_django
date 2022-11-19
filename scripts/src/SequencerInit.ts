import { processQuery, queryObject } from "./QueryProcessor";
import { Sequencer } from "./Sequencer";
import { songLoader } from "./SongLoader";
import { initialize } from "./ui";

export let sequencer: Sequencer | null = null;

window.addEventListener('load', (event) => {
    initialize();
    processQuery();

    sequencer = new Sequencer();

    (document.getElementById("grid-container") as HTMLDivElement).onscroll = function() {
        (document.getElementById("piano-container") as HTMLDivElement).scrollTop = (this as any).scrollTop;
        (document.getElementById("measure-counter-container") as HTMLDivElement).scrollLeft = (this as any).scrollLeft;
    };

    if('song_id' in queryObject){
        songLoader.requestSong(Number(queryObject.song_id))
    }
});

