/*
    Web MIDI sequencer backend.
    This backend consists of 2 components:
        WebMIDIScheduler: requests new note events at a certain interval (using low precision javascript timer)
        WebMIDIPlayer: handles actual playback of midi events (using high precision timer)
*/

export class WebMIDIPlayer {
    private midi: WebMidi.MIDIAccess | null;
    private outputId: string;

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
                let name: string | null = null;
                outs.forEach(o => {
                    console.log(o);
                    // if (name == null) {
                    name = o.id;
                    // };
                });
                if (name != null) {
                    this.setOutputPort(name);
                }
            },
            (msg) => {
                console.log("failed to get midi access");
                console.log(msg);
            }
        );
    }

    listOutputPorts(): WebMidi.MIDIOutputMap {
        this._checkMidiState();
        return (this.midi as WebMidi.MIDIAccess).outputs;
    }

    setOutputPort(outputId: string) {
        console.log(`output port set: ${outputId}`);
        this.outputId = outputId;
    }

    forceClearOutputQueue() {
        this._currentOutput().clear();
    }

    outputImmediately(data: number[]) {
        // console.log("scheduled immediately: " + data);
        this._currentOutput().send(data);
    }

    outputWithTimestamp(data: number[], timestamp: number) {
        // console.log("scheduled with timestamp: " + data);
        this._currentOutput().send(data, timestamp);
    }

    _currentOutput(): WebMidi.MIDIOutput {
        const out = this.midi?.outputs.get(this.outputId);
        if (out == null) {
            throw "midi output not set";
        }
        return out;
    }

    _checkMidiState() {
        if (this.midi == null) {
            // TODO
            throw "midi not initialized";
        }
    }
}


export class WebMIDIScheduler {
    private player: WebMIDIPlayer;
    interval: number
    private callback: ((proxy: WebMIDISchedulerProxy) => void) | null;
    timeUpdateCallback: ((currentTime: number) => void) | null;
    private isRunning: boolean;
    private _currentLoop: number | null;

    playbackTimeMillis: number;
    private _playbackStartedTs: number | null;

    constructor(interval: number, player: WebMIDIPlayer) {
        const _interval = interval || 50 // 50 ms;
        this.player = player;
        this.interval = _interval;
        this.callback = null;
        this.timeUpdateCallback = null;
        this.isRunning = false;
        this._currentLoop = null;

        this.playbackTimeMillis = 0;
        this._playbackStartedTs = null;
    }

    start(callback: ((proxy: WebMIDISchedulerProxy) => void) | null) {
        this.callback = callback;
        this.isRunning = true;
        this.playbackTimeMillis = 0;
        this._playbackStartedTs = performance.now();
        this._currentLoop = setInterval(this._tick.bind(this), this.interval) as unknown as number;
    }

    stop() {
        if (this._currentLoop !== null) {
            clearInterval(this._currentLoop);
        }
    }

    scheduleNow(data: number[]) {
        this.player.outputImmediately(data);
    }

    scheduleNowWithDelay(data: number[], delayMillis: number) {
        const ts = performance.now() + delayMillis;
        this.player.outputWithTimestamp(data, ts);
    }

    _tick() {
        const timestamp = performance.now();
        const proxy = new WebMIDISchedulerProxy(this);
        if (this.callback == null) {
            console.warn("callback is null");
            return;
        }
        this.callback(proxy);
        const entries = proxy._entries;

        for (const entry of entries) {
            this.player.outputWithTimestamp(entry.data, 100 + timestamp + entry.delayMillis);
        }

        if (this._playbackStartedTs == null) {
            throw new Error("logic error _playbackStartedTs is null");
        }
        this.playbackTimeMillis = timestamp - this._playbackStartedTs;
        if (this.timeUpdateCallback !== null) {
            this.timeUpdateCallback(this.playbackTimeMillis);
        }
    }
}


export class WebMIDISchedulerProxy {
    private _scheduler: WebMIDIScheduler
    _entries: {
        data: number[],
        delayMillis: number
    }[];
    requestDuration: number;
    playbackTime: number;

    constructor(scheduler: WebMIDIScheduler) {
        this._scheduler = scheduler;
        this._entries = [];
        this.requestDuration = this._scheduler.interval * 2;
        this.playbackTime = this._scheduler.playbackTimeMillis;
    }

    scheduleWithDelay(data: number[], delayMillis: number) {
        this._entries.push({
            data: data,
            delayMillis: delayMillis
        });
    }
}
