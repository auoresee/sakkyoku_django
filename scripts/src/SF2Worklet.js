class SF2Processor extends AudioWorkletProcessor {
    constructor(options) {
        super(options);

        this.port.onmessage = (ev) => {
            const data = ev.data;
            switch (data.type) {
                case 'render-float-result':
                    this.queue.push(data.buffer);
                    break;
            }
        }
        this.queue = [];
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const samples = output[0].length;
        this.port.postMessage({
            type: 'render-float',
            samples: samples,
        });
        output.forEach(chan => {
            const buf = this.queue.shift();
            if (buf !== undefined) {
                const floatBuf = new Float32Array(buf);
                let sum = 0;
                for (let i = 0; i < chan.length; i++) {
                    chan[i] = floatBuf[i];
                    sum += floatBuf[i];
                }
                // console.log(sum);
            }
        });
        return true;
    }
}

registerProcessor('sf2-processor', SF2Processor);
