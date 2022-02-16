'use strict';
export let audioCtx: AudioContext;

const audioInitEventName = typeof document.ontouchend !== 'undefined' ? 'touchend' : 'mouseup';
document.addEventListener(audioInitEventName, initAudioContext);

let isWebaudioContextResumed = false;

function initAudioContext(){
    console.log("silent play");
    document.removeEventListener(audioInitEventName, initAudioContext);
    audioCtx.resume();
    isWebaudioContextResumed = true;
}

var masterGainNode;

window.addEventListener("load", function(e){
    try {
        window.AudioContext = window.AudioContext||window.webkitAudioContext;
        audioCtx = new AudioContext();
    }
    catch(e) {
        console.log('Web Audio API is not supported in this browser');
        return;
    }
    masterGainNode = audioCtx.createGain();
    masterGainNode.connect(audioCtx.destination);
    loadSoundFiles();
});

class SoundManager {
    constructor(){
        this.audioBuffers = [];
    }

    loadSound(name, url) {
        var request = new XMLHttpRequest();
        request.open('GET', "/static/sakkyokuapp/"+url, true);
        request.responseType = 'arraybuffer';

        // Decode asynchronously
        request.onload = function() {
            audioCtx.decodeAudioData(request.response, function(buffer) {
                soundManager.audioBuffers[name] = buffer;
            }, function(){
                console.log("load error");
            });
        }
        request.send();
    }

    playSound(name, isLoop) {
        if(!this.audioBuffers[name]){
            return;
        }
        var source = audioCtx.createBufferSource();
        source.buffer = this.audioBuffers[name];
        source.connect(audioCtx.destination);
        source.loop = isLoop;
        source.start(0);
    }

    //pitch: frequency multiplier (1: normal, 2: 1 octave up)
    //duration: second
    playSoundPitch(name, isLoop, pitch, duration, parentNode) {
        if(!this.audioBuffers[name]){
            return;
        }
        var source = audioCtx.createBufferSource();
        source.buffer = this.audioBuffers[name];
        source.playbackRate.value = pitch;
        source.connect(parentNode);
        source.loop = isLoop;
        source.start(0);
        setTimeout(function(){source.stop()}, duration * 1000);
    }

}

var soundManager = new SoundManager();
