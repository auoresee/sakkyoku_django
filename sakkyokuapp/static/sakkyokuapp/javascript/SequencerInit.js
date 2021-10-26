var sequencer = null;

window.addEventListener('load', (event) => {
    initialize();
    processQuery();

    sequencer = new Sequencer();

    document.getElementById("grid-container").onscroll = function() {
        document.getElementById("piano-container").scrollTop = this.scrollTop;
        document.getElementById("measure-counter-container").scrollLeft = this.scrollLeft;
    };

    if('song_id' in queryObject){
        songLoader.requestSong(Number(queryObject.song_id))
    }
});

