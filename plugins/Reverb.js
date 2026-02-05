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
        this.generateImpulse(1.5); // Start with a nice medium room

        // 3. TONE (Low Pass for that "Warm" Reverb)
        this.filter = ctx.createBiquadFilter();
        this.filter.type = "lowpass";
        this.filter.frequency.value = 3500;

        // ROUTING
        this.input.connect(this.dryGain);
        this.input.connect(this.filter);
        this.filter.connect(this.reverbNode);
        this.reverbNode.connect(this.wetGain);

        this.dryGain.connect(this.output);
        this.wetGain.connect(this.output);

        // Initial Balance: Mostly Dry
        this.updateMix(0.3); 
    }

    updateMix(value) {
        // Equal-power crossfade (smooth transition)
        const val = parseFloat(value);
        this.dryGain.gain.setTargetAtTime(Math.cos(val * 0.5 * Math.PI), this.ctx.currentTime, 0.02);
        this.wetGain.gain.setTargetAtTime(Math.sin(val * 0.5 * Math.PI), this.ctx.currentTime, 0.02);
    }

    generateImpulse(duration) {
        const sampleRate = this.ctx.sampleRate;
        const length = sampleRate * duration;
        const impulse = this.ctx.createBuffer(2, length, sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const data = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                // Modified exponential decay for "Tighter" small rooms
                const decay = Math.pow(1 - i / length, duration * 2);
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
            <div style="padding:10px; background:#1e272e; color:#d2dae2; font-family:monospace; font-size:9px; border:1px solid #485460;">
                <div style="margin-bottom:8px; color:#ef5777; border-bottom:1px solid #485460; padding-bottom:3px; font-weight:bold;">MFX_REVERB_PRO</div>
                
                <label>BALANCE (DRY -> WET)</label>
                <input type="range" id="mix" min="0" max="1" step="0.01" value="0.3" style="width:100%">
                
                <label style="margin-top:8px; display:block;">ROOM (TIGHT -> BIG)</label>
                <input type="range" id="size" min="0.05" max="4.0" step="0.05" value="1.5" style="width:100%">

                <label style="margin-top:8px; display:block;">TONE (DARKNESS)</label>
                <input type="range" id="tone" min="400" max="8000" step="10" value="3500" style="width:100%">

                <button id="close" style="margin-top:12px; width:100%; background:#ef5777; color:#fff; border:none; padding:4px; cursor:pointer; font-size:8px;">PURGE PLUGIN</button>
            </div>
        `;

        container.querySelector('#mix').oninput = (e) => { this.updateMix(e.target.value); };
        container.querySelector('#size').oninput = (e) => { this.generateImpulse(parseFloat(e.target.value)); };
        container.querySelector('#tone').oninput = (e) => { this.filter.frequency.value = e.target.value; };
        
        container.querySelector('#close').onclick = () => {
            this.cleanup();
            onRemove();
        };
    }
}