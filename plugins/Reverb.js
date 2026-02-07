export default class SpReverb {
    constructor(ctx) {
        this.ctx = ctx;
        this.input = ctx.createGain();
        this.output = ctx.createGain();

        // 1. CROSSFADE ENGINE
        this.dryGain = ctx.createGain();
        this.wetGain = ctx.createGain();

        // 2. REVERB CORE
        this.reverbNode = ctx.createConvolver();
        
        // STATE TRACKING
        this.mixVal = 0.3;
        this.sizeVal = 1.5;
        this.toneVal = 3500;

        this.generateImpulse(this.sizeVal); // Start with default

        // 3. TONE (Low Pass for that "Warm" Reverb)
        this.filter = ctx.createBiquadFilter();
        this.filter.type = "lowpass";
        this.filter.frequency.value = this.toneVal;

        // ROUTING
        this.input.connect(this.dryGain);
        this.input.connect(this.filter);
        this.filter.connect(this.reverbNode);
        this.reverbNode.connect(this.wetGain);

        this.dryGain.connect(this.output);
        this.wetGain.connect(this.output);

        // Initial Balance
        this.updateMix(this.mixVal); 
    }

    // --- 1. STATE SAVER ---
    getState() {
        return {
            mix: this.mixVal,
            size: this.sizeVal,
            tone: this.toneVal
        };
    }

    // --- 2. STATE LOADER ---
    setState(data) {
        if (data.mix !== undefined) this.updateMix(data.mix);
        if (data.tone !== undefined) {
            this.toneVal = data.tone;
            this.filter.frequency.value = this.toneVal;
        }
        if (data.size !== undefined) {
            this.sizeVal = data.size;
            this.generateImpulse(this.sizeVal);
        }
    }

    updateMix(value) {
        this.mixVal = parseFloat(value);
        // Equal-power crossfade (smooth transition)
        this.dryGain.gain.setTargetAtTime(Math.cos(this.mixVal * 0.5 * Math.PI), this.ctx.currentTime, 0.02);
        this.wetGain.gain.setTargetAtTime(Math.sin(this.mixVal * 0.5 * Math.PI), this.ctx.currentTime, 0.02);
    }

    generateImpulse(duration) {
        this.sizeVal = duration;
        const sampleRate = this.ctx.sampleRate;
        const length = sampleRate * duration;
        const impulse = this.ctx.createBuffer(2, length, sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const data = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                // Modified exponential decay for "Tighter" small rooms
                // Using duration in the decay calculation helps scale the tail naturally
                const decay = Math.pow(1 - i / length, duration * 0.8); 
                data[i] = (Math.random() * 2 - 1) * decay;
            }
        }
        this.reverbNode.buffer = impulse;
    }

    cleanup() {
        this.input.disconnect();
        this.output.disconnect();
    }

    renderUI(container, onRemove) {
        container.innerHTML = `
            <div style="padding:10px; background:#1e272e; color:#d2dae2; font-family:monospace; font-size:9px; border:1px solid #485460; border-radius:4px;">
                <div style="margin-bottom:8px; color:#ef5777; border-bottom:1px solid #485460; padding-bottom:3px; font-weight:bold;">MFX_REVERB_PRO</div>
                
                <label>BALANCE (DRY -> WET)</label>
                <input type="range" id="mix" min="0" max="1" step="0.01" value="${this.mixVal}" style="width:100%">
                
                <label style="margin-top:8px; display:block;">ROOM (TIGHT -> BIG)</label>
                <input type="range" id="size" min="0.05" max="4.0" step="0.05" value="${this.sizeVal}" style="width:100%">

                <label style="margin-top:8px; display:block;">TONE (DARKNESS)</label>
                <input type="range" id="tone" min="400" max="8000" step="10" value="${this.toneVal}" style="width:100%">

                <button id="close" style="margin-top:12px; width:100%; background:#ef5777; color:#fff; border:none; padding:4px; cursor:pointer; font-size:8px; border-radius:2px;">PURGE PLUGIN</button>
            </div>
        `;

        container.querySelector('#mix').oninput = (e) => { this.updateMix(e.target.value); };
        
        // Debounce impulse generation to prevent glitching while dragging slider
        let timeout;
        container.querySelector('#size').oninput = (e) => { 
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                 this.generateImpulse(parseFloat(e.target.value));
            }, 50); 
        };
        
        container.querySelector('#tone').oninput = (e) => { 
            this.toneVal = parseFloat(e.target.value);
            this.filter.frequency.value = this.toneVal; 
        };
        
        container.querySelector('#close').onclick = () => {
            this.cleanup();
            onRemove();
        };
    }
}