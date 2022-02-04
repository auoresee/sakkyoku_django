/*
    Web MIDI sequencer backend.
    This backend consists of 2 components:
        WebMIDIScheduler: requests new note events at a certain interval (using low precision javascript timer)
        WebMIDIPlayer: handles actual playback of midi events (using high precision timer)
*/

class WebMIDIPlayer {
    constructor() {
        this.midi = null;
        this.outputId = "output-0";
    }

    /**
        Request Web MIDI permission.
        @returns true on success, false on failure.
    */
    requestMIDIAccess() {
        navigator.requestMIDIAccess().then(
            (ma) => {
                console.log("got midi access");
                this.midi = ma;
                
                // default output set
                const outs = this.listOutputPorts();
                let name = null;
                outs.forEach(o => {
                    if (name == null) {
                        name = o.id;
                    };
                });
                this.setOutputPort(name);
            },
            (msg) => {
                console.log("failed to get midi access");
                console.log(msg);
            }
        );
    }

    listOutputPorts() {
        this._checkMidiState();
        return this.midi.outputs;
    }

    setOutputPort(outputId) {
        console.log(`output port set: ${outputId}`);
        this.outputId = outputId;
    }

    forceClearOutputQueue() {
        this._currentOutput().clear();
    }

    outputImmediately(data) {
        // console.log("scheduled immediately: " + data);
        this._currentOutput().send(data);
    }

    outputWithTimestamp(data, timestamp) {
        // console.log("scheduled with timestamp: " + data);
        this._currentOutput().send(data, timestamp);
    }

    _currentOutput() {
        return this.midi.outputs.get(this.outputId);
    }

    _checkMidiState() {
        if (this.midi == null) {
            // TODO
            throw "midi not initialized";
        }
    }
}


class WebMIDIScheduler {
    constructor(interval, player) {
        const _interval = interval || 50 // 50 ms;
        this.player = player;
        this.interval = _interval;
        this.callback = null;
        this.isRunning = false;
        this._currentLoop = null;

        this.playbackTimeMillis = 0;
        this._playbackStartedTs = null;
    }

    start(callback) {
        this.callback = callback;
        this.isRunning = true;
        this.playbackTimeMillis = 0;
        this._playbackStartedTs = performance.now();
        this._currentLoop = setInterval(this._tick.bind(this), this.interval);
    }

    stop() {
        if (this._currentLoop !== null) {
            clearInterval(this._currentLoop);
        }
    }

    scheduleNow(data) {
        this.player.outputImmediately(data);
    }

    scheduleNowWithDelay(data, delayMillis) {
        const ts = performance.now() + delayMillis;
        this.player.outputWithTimestamp(data, ts);
    }

    _tick() {
        const timestamp = performance.now();
        const proxy = new WebMIDISchedulerProxy(this);
        this.callback(proxy);
        const entries = proxy._entries;

        for (const entry of entries) {
            this.player.outputWithTimestamp(entry.data, 100+timestamp+entry.delayMillis);
        }

        this.playbackTimeMillis = timestamp - this._playbackStartedTs;
    }
}


class WebMIDISchedulerProxy {
    constructor(scheduler) {
        this._scheduler = scheduler;
        this._entries = [];
        this.requestDuration = this._scheduler.interval*2;
        this.playbackTime = this._scheduler.playbackTimeMillis;
    }

    scheduleWithDelay(data, delayMillis) {
        this._entries.push({
            data: data,
            delayMillis: delayMillis
        });
    }
}
