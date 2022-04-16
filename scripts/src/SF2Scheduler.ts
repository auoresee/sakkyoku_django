export class SF2Scheduler {
    private player: SF2Player;
    timeUpdateCallback: ((currentTime: number) => void) | null;
    private isRunning: boolean;

    playbackTimeMillis: number;
    private _playbackStartedTs: number | null;

    constructor(player: SF2Player) {
        this.player = player;
        this.timeUpdateCallback = null;
        this.isRunning = false;

        this.playbackTimeMillis = 0;
        this._playbackStartedTs = null;
    }

    async start(entries: PlayData[]) {
        this.isRunning = true;
        this.playbackTimeMillis = 0;
        this._playbackStartedTs = performance.now();
        await this.player.prepareAsync();
        await this.player.uploadSong(entries);
        this.player.start();
    }

    stop() {
        this.player.stop();
    }

    async scheduleNow(data: InstantOutputType) {
        await this.player.prepareAsync();
        this.player.output(data);
    }
}

export type Entry = {
    type: 'note-on',
    key: number,
    velocity: number
} | {
    type: 'note-off',
    key: number
} | {
    type: 'program-change',
    pc: number,
    isDrum: boolean
} | {
    type: 'set-channel-volume',
    volume: number
};

export type PlayData = {
    time: number,
    chan: number,
    entry: Entry
};

export type InstantOutputType = {
    type: 'channel',
    chan: number,
    entry: Entry
}

export class SF2Player {
    private worker: Worker | null;
    private ready: boolean;
    private audioCtx: AudioContext | null;

    constructor() {
        this.worker = null;
        this.ready = false;
        this.audioCtx = null;
    }

    async uploadSong(playData: PlayData[]) {
        console.log(playData);
        this.worker!.postMessage({
            type: 'upload-song',
            song: playData
        });
    }

    async prepareAsync(): Promise<void> {
        if (this.ready) return;
        await this.prepareWorker();
        await this.prepareAudio();
        this.ready = true;
    }

    private async prepareWorker(): Promise<void> {
        this.worker = new Worker(new URL('./SF2Worker.js', import.meta.url));
        return new Promise((resolve) => {
            this.worker!.onmessage = ((ev) => {
                switch (ev.data.type) {
                    case 'finish-loading':
                        resolve();
                        break;
                }
            });
        });
    }

    private async prepareAudio() {
        if (this.audioCtx !== null) {
            console.warn('audio context already exists');
            return;
        }
        const ctx = new AudioContext();
        this.audioCtx = ctx;
        await ctx.audioWorklet.addModule(new URL('./SF2Worklet.js', import.meta.url));
        const node = new AudioWorkletNode(ctx, 'sf2-processor');
        const gain = new GainNode(ctx);
        gain.gain.value = 0.3;
        node.connect(gain);
        gain.connect(ctx.destination);

        this.worker!.postMessage({
            type: 'pass-port',
            port: node.port
        }, [node.port]);
    }

    output(info: InstantOutputType) {
        if (!this.ready) {
            console.warn('not ready');
            return;
        }
        switch (info.entry.type) {
            case 'note-on':
                this.worker!.postMessage({
                    type: 'note-on',
                    chan: info.chan,
                    key: info.entry.key,
                    vel: info.entry.velocity / 127.0
                });
                break;
            case 'note-off':
                this.worker!.postMessage({
                    type: 'note-off',
                    chan: info.chan,
                    key: info.entry.key
                });
                break;
            default:
                console.warn('SF2Player output: unsupported entry: ' + info.entry.type)
        }
    }

    start() {

    }

    async stop() {
        console.log('closing SF2Player');
        this.worker?.terminate();
        this.worker = null;

        await this.audioCtx?.close();
        this.audioCtx = null;

        this.ready = false;
    }
}
