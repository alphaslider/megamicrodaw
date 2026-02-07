export default class VinylSim404 {
    constructor(ctx) {
        this.ctx = ctx;
        this.input = ctx.createGain();
        this.output = ctx.createGain();
        
        // STATE TRACKING
        this.wowVal = 0;
        this.dirtVal = 0;
        this.compVal = -35;
        this.bitsVal = 12;

        // 1. PRECISION WARP ENGINE (Max 1.5ms)
        this.vibrato = ctx.createDelay(0.1); 
        this.vibrato.delayTime.value = 0.01;
        
        this.wowLFO = ctx.createOscillator();
        this.wowLFO.frequency.value = 0.5; 
        this.flutterLFO = ctx.createOscillator();
        this.flutterLFO.frequency.value = 4.2;
        
        this.wowGain = ctx.createGain();
        this.wowGain.gain.value = this.wowVal; 
        
        this.wowLFO.connect(this.wowGain);
        this.flutterLFO.connect(this.wowGain);
        this.wowGain.connect(this.vibrato.delayTime);
        
        this.wowLFO.start();
        this.flutterLFO.start();

        // 2. DIRT ENGINE (Hiss & Crackle)
        this.noiseBus = ctx.createGain();
        this.noiseBus.gain.value = this.dirtVal;

        this.hissSource = ctx.createBufferSource();
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
        this.hissSource.buffer = buffer;
        this.hissSource.loop = true;
        
        this.hissFilter = ctx.createBiquadFilter();
        this.hissFilter.type = "bandpass";
        this.hissFilter.frequency.value = 8000;
        
        this.crackleShaper = ctx.createWaveShaper();
        const curve = new Float32Array(4096);
        for (let i = 0; i < 4096; i++) {
            let x = (i / 4096) * 2 - 1;
            curve[i] = Math.abs(x) > 0.98 ? Math.sign(x) : 0;
        }
        this.crackleShaper.curve = curve;

        this.hissSource.connect(this.hissFilter);
        this.hissFilter.connect(this.noiseBus);
        this.hissSource.connect(this.crackleShaper);
        this.crackleShaper.connect(this.noiseBus);
        this.hissSource.start();

        // 3. THE PUMP & BIT CRUSH
        this.compressor = ctx.createDynamicsCompressor();
        this.compressor.threshold.value = this.compVal;
        this.compressor.ratio.value = 12;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.25;

        this.bitcrusher = ctx.createWaveShaper();
        this.updateCrush(this.bitsVal);

        // ROUTING
        this.input.connect(this.vibrato);
        this.vibrato.connect(this.bitcrusher);
        this.bitcrusher.connect(this.compressor);
        this.compressor.connect(this.output);
        this.noiseBus.connect(this.output);
    }

    // --- 1. STATE SAVER ---
    getState() {
        return {
            wow: this.wowVal,
            dirt: this.dirtVal,
            comp: this.compVal,
            bits: this.bitsVal
        };
    }

    // --- 2. STATE LOADER ---
    setState(data) {
        if (data.wow !== undefined) {
            this.wowVal = data.wow;
            this.wowGain.gain.value = this.wowVal;
        }
        if (data.dirt !== undefined) {
            this.dirtVal = data.dirt;
            this.noiseBus.gain.value = this.dirtVal;
        }
        if (data.comp !== undefined) {
            this.compVal = data.comp;
            this.compressor.threshold.value = this.compVal;
        }
        if (data.bits !== undefined) {
            this.updateCrush(data.bits);
        }
    }

    updateCrush(bits) {
        this.bitsVal = bits;
        const size = 4096;
        const curve = new Float32Array(size);
        const step = Math.pow(2, bits);
        for (let i = 0; i < size; i++) {
            let x = (i / size) * 2 - 1;
            curve[i] = Math.round(x * step) / step;
        }
        this.bitcrusher.curve = curve;
    }

    // THE CLEANUP ENGINE
    cleanup() {
        try {
            this.hissSource.stop();
            this.wowLFO.stop();
            this.flutterLFO.stop();
            this.hissSource.disconnect();
            this.wowLFO.disconnect();
            this.flutterLFO.disconnect();
        } catch(e) { 
            // Already stopped or disconnected
        }
        this.input.disconnect();
        this.output.disconnect();
    }

    renderUI(container, onRemove) {
        container.innerHTML = `
            <div style="padding:10px; background:#1a1a1a; color:#fbc531; font-family:monospace; font-size:9px; border:1px solid #444; border-radius:4px;">
                <div style="margin-bottom:8px; color:#fff; border-bottom:1px solid #444; padding-bottom:3px; font-weight:bold;">MFX_404_VINYL</div>
                
                <label>WARP (PITCH)</label>
                <input type="range" id="wow" min="0" max="0.0015" step="0.00001" value="${this.wowVal}" style="width:100%">
                
                <label style="margin-top:8px; display:block;">DIRT (HISS/POP)</label>
                <input type="range" id="dirt" min="0" max="0.4" step="0.01" value="${this.dirtVal}" style="width:100%">

                <label style="margin-top:8px; display:block;">PUMP (COMP)</label>
                <input type="range" id="comp" min="-60" max="0" value="${this.compVal}" style="width:100%">
                
                <label style="margin-top:8px; display:block;">BIT DEPTH</label>
                <input type="range" id="bits" min="6" max="16" step="1" value="${this.bitsVal}" style="width:100%">

                <button id="close" style="margin-top:12px; width:100%; background:#c0392b; color:#fff; border:none; cursor:pointer; font-size:8px; padding:4px; border-radius:2px;">PURGE PLUGIN</button>
            </div>
        `;

        container.querySelector('#wow').oninput = (e) => { 
            this.wowVal = parseFloat(e.target.value);
            this.wowGain.gain.value = this.wowVal; 
        };
        
        container.querySelector('#dirt').oninput = (e) => { 
            this.dirtVal = parseFloat(e.target.value);
            this.noiseBus.gain.value = this.dirtVal; 
        };
        
        container.querySelector('#comp').oninput = (e) => { 
            this.compVal = parseFloat(e.target.value);
            this.compressor.threshold.value = this.compVal; 
        };
        
        container.querySelector('#bits').oninput = (e) => { 
            this.updateCrush(parseFloat(e.target.value)); 
        };
        
        container.querySelector('#close').onclick = () => {
            this.cleanup(); 
            onRemove();     
        };
    }
}