let alreadyInitAudio = false;
let workerReady = false;
let worker;

async function initAudio() {
    if (alreadyInitAudio || !workerReady) return;
    alreadyInitAudio = true;
    const ctx = new AudioContext();
    await ctx.audioWorklet.addModule('audio-worklet.js');
    const node = new AudioWorkletNode(ctx, 'tsf-processor');
    const gain = new GainNode(ctx);
    gain.gain.value = 0.1;
    node.connect(gain);
    gain.connect(ctx.destination);

    worker.postMessage({
        type: 'pass-port',
        port: node.port
    }, [node.port]);
}

window.addEventListener('load', () => {
    worker = new Worker("index.worker.js");
    worker.onmessage = (ev) => {
        if (ev.data.type === 'finish-loading') {
            console.log('finish-loading');
            workerReady = true;
            // setInterval(() => {
            //     worker.postMessage({
            //         type: 'note-on',
            //         key: 60,
            //         vel: 1.0
            //     });
            // }, 1000);
        }
    };
    document.body.addEventListener('click', async () => {
        await initAudio();
    });

    const buttons = document.querySelectorAll('.piano');
    buttons.forEach((btn) => {
        btn.addEventListener('click', (ev) => {
            const key = Number(ev.target.getAttribute('x-key'));
            worker.postMessage({
                type: 'note-on',
                key: key,
                vel: 1.0
            });
            setTimeout(() => {
                worker.postMessage({
                    type: 'note-off',
                    key: key
                });
            }, 500);
        });
    });
});