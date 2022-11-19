let sf2 = null;

let load_sf2;
let init_output;
let note_on;
let note_off;
let program_change;
let set_channel_volume;
let render_float;

let audioPort;

let song = [];
let scheduledEntries; // ノートが処理されたか否か

let currentTime = 0;
let nextEntry = 0;

let Module;

function loadSf2() {
    load_sf2 = Module.cwrap('load_sf2', 'number', ['string']);
    sf2 = load_sf2("FluidR3_GM.sf2");
}

//initialize audio output with given sample rate
function initAudioOutput(sampleRate) {
    init_output = Module.cwrap('init_output', null, ['number', 'number']);
    init_output(sf2, sampleRate);
}

function noteOn(chan, key, vel) {
    if (note_on === undefined) {
        note_on = Module.cwrap('note_on', null, ['number', 'number', 'number', 'number']);
    }
    note_on(sf2, chan, key, vel);
    console.log('note on');
}

function noteOff(chan, key) {
    if (note_off === undefined) {
        note_off = Module.cwrap('note_off', null, ['number', 'number', 'number']);
    }
    note_off(sf2, chan, key);
}

function programChange(chan, pc, isDrum) {
    if (program_change === undefined) {
        program_change = Module.cwrap('program_change', null, ['number', 'number', 'number', 'number']);
    }
    program_change(sf2, chan, pc, isDrum);
}

function setChannelVolume(chan, fVolume) {
    if (set_channel_volume === undefined) {
        set_channel_volume = Module.cwrap('set_channel_volume', null, ['number', 'number', 'number']);
    }
    set_channel_volume(sf2, chan, fVolume);
}

function renderFloat(samples) {
    const points = samples * 2; // stereo
    const nBytes = 4 * points;
    const dataPtr = Module._malloc(nBytes);
    const dataHeap = new Uint8Array(Module.HEAPU8.buffer, dataPtr, nBytes);

    if (render_float === undefined) {
        render_float = Module.cwrap('render_float', null, ['number', 'number', 'number']);
    }
    render_float(sf2, dataHeap.byteOffset, samples);

    const tmp = new Float32Array(dataHeap.buffer, dataHeap.byteOffset, points);
    const floatArray = new Float32Array(tmp);

    Module._free(dataHeap.byteOffset);

    // let sum = 0;
    // for (let i = 0; i < floatArray.length; i++) {
    //     sum += floatArray[i];
    // }
    // console.log(sum);

    return floatArray;
}

function stepNote(dt) {
    if (scheduledEntries === undefined) {
        scheduledEntries = new Array(song.length);
        for (let i = 0; i < song.length; i++) {
            scheduledEntries[i] = false;
        }
    }
    const requestedDuration = dt * 1000;
    const playbackTime = currentTime;
    let i;
    for (i = nextEntry; i < song.length; i++) {
        const entryMeta = song[i];
        // プレイバック開始からノート開始までの実時間 (millis)
        const absoluteTime = entryMeta.time;
        // console.log(`cmp ${absoluteTime} ${currentTime} ${currentTime + dt}`);
        if (absoluteTime < playbackTime) {
            // まだ再生位置に達していない
            continue;
        } else if (absoluteTime > playbackTime + requestedDuration) {
            // 今要求されている時間外のノートに到達したので終了する
            break;
        } else if (scheduledEntries[i]) {
            // 二重に処理されないようにする
            continue;
        }

        // Processing
        const ch = entryMeta.chan;
        const entry = entryMeta.entry;
        switch (entryMeta.entry.type) {
            case 'note-on': {
                const key = entry.key;
                const vel = entry.velocity / 127.0;
                noteOn(ch, key, vel);
                break;
            }
            case 'note-off': {
                const key = entry.key;
                noteOff(ch, key);
                break;
            }
            case 'program-change': {
                programChange(ch, entry.pc, entry.isDrum);
                break;
            }
            case 'set-channel-volume': {

                setChannelVolume(ch, entry.volume / 127.0);
                break;
            }
            default: {
                console.warn('unknown entry:', entryMeta.entry);
            }
        }

        // 処理済みとしてフラグをつける
        scheduledEntries[i] = true;
    }

    // console.log(currentTime);
    currentTime += dt * 1000;
}

importScripts("tfs.js");
createTFS().then((module) => {

    Module = module;
    loadSf2();
    postMessage({
        type: 'finish-loading'
    });
});


onmessage = (ev) => {
    const data = ev.data;

    switch (data.type) {
        case 'pass-port':
            //サンプリングレートを受け取る
            console.log("Sample rate: "+data.sampleRate);
            SampleRate = data.sampleRate;
            initAudioOutput(SampleRate);
            audioPort = data.port;
            console.log('received audioPort');

            audioPort.onmessage = (ev) => {
                switch (ev.data.type) {
                    case 'render-float':
                        const samples = ev.data.samples;
                        stepNote(samples / SampleRate);
                        const array = renderFloat(samples);
                        audioPort.postMessage({
                            type: 'render-float-result',
                            buffer: array.buffer
                        }, [array.buffer]);
                        break;
                }
            };

            return;
        case 'upload-song':
            song = data.song; // PlayData[]
            scheduledEntries = undefined;
            nextEntry = 0;
            currentTime = 0;
            break;
    }

    if (sf2 === null) return;
    switch (data.type) {
        case 'note-on':
            noteOn(data.chan, data.key, data.vel);
            break;
        case 'note-off':
            noteOff(data.chan, data.key);
            break;
    }
}
