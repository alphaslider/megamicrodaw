export default class LovePhilter {
    constructor(ctx) {
        this.ctx = ctx;
        this.input = ctx.createGain();
        this.output = ctx.createGain();

        // 1. DUAL PATHS (Dry/Wet)
        this.dryGain = ctx.createGain();
        this.wetGain = ctx.createGain();

        // 2. THE FILTER & PANNER
        this.filter = ctx.createBiquadFilter();
        this.filter.type = "lowpass";
        this.filter.Q.value = 3.5; // High resonance for that Love Philter "vocal" sweep

        this.panner = ctx.createStereoPanner();

        // 3. THE MODULATION (LFO)
        this.lfo = ctx.createOscillator();
        this.lfoGain = ctx.createGain();    // Modulates Filter Frequency
        this.lfoPanGain = ctx.createGain(); // Modulates Panner

        // STATE
        this.mixVal = 0.5;
        this.rateVal = 1.2;    // LFO Speed (Hz)
        this.depthVal = 2500;  // Filter Sweep Range
        this.baseFreq = 1200;  // Center Frequency

        // CONNECTIONS
        this.lfo.connect(this.lfoGain);
        this.lfo.connect(this.lfoPanGain);
        
        this.lfoGain.connect(this.filter.frequency);
        this.lfoPanGain.connect(this.panner.pan);

        // SIGNAL ROUTING
        this.input.connect(this.dryGain);
        this.input.connect(this.filter);
        
        this.filter.connect(this.panner);
        this.panner.connect(this.wetGain);

        this.dryGain.connect(this.output);
        this.wetGain.connect(this.output);

        // START LFO
        this.lfo.start();
        this.updateParams();
    }

    updateParams() {
        const now = this.ctx.currentTime;
        this.lfo.frequency.setTargetAtTime(this.rateVal, now, 0.02);
        this.lfoGain.gain.setTargetAtTime(this.depthVal, now, 0.02);
        this.lfoPanGain.gain.setTargetAtTime(0.7, now, 0.02); // 70% width auto-pan
        this.filter.frequency.value = this.baseFreq;
    }

    updateMix(val) {
        this.mixVal = parseFloat(val);
        const now = this.ctx.currentTime;
        // Smooth crossfade
        this.dryGain.gain.setTargetAtTime(1 - this.mixVal, now, 0.02);
        this.wetGain.gain.setTargetAtTime(this.mixVal, now, 0.02);
    }

    cleanup() {
        try { this.lfo.stop(); } catch(e) {}
        this.input.disconnect();
        this.output.disconnect();
    }

    renderUI(container, onRemove) {
        container.innerHTML = `
            <div style="padding:0; background:#1e272e; color:#d2dae2; font-family:monospace; font-size:9px; border:1px solid #00d8d6; border-radius:4px; overflow:hidden;">
                <div style="background:#00d8d6; color:#000; padding:4px 6px; display:flex; justify-content:space-between; font-weight:bold;">
                    <span>LOVE_PHILTER</span>
                    <span id="purge-x" style="cursor:pointer; background:#000; color:#00d8d6; padding:0 4px; border-radius:2px;">X</span>
                </div>

                <div style="padding:10px;">
                    <label>DRY / WET</label>
                    <input type="range" id="mix" min="0" max="1" step="0.01" value="${this.mixVal}" style="width:100%; margin-bottom:8px;">

                    <label>SWEEP RATE (LFO)</label>
                    <input type="range" id="rate" min="0.1" max="8" step="0.1" value="${this.rateVal}" style="width:100%; margin-bottom:8px;">
                    
                    <label>SWEEP DEPTH</label>
                    <input type="range" id="depth" min="0" max="5000" step="10" value="${this.depthVal}" style="width:100%;">
                    
                    <div style="margin-top:8px; font-size:7px; color:#00d8d6; text-align:center;">AUTO-PANNER ACTIVE</div>
                </div>
            </div>
        `;

        // The SAFE Purge Button (The X on the handle)
        container.querySelector('#purge-x').onclick = () => {
            this.cleanup();
            onRemove();
        };

        container.querySelector('#mix').oninput = (e) => this.updateMix(e.target.value);
        
        container.querySelector('#rate').oninput = (e) => {
            this.rateVal = parseFloat(e.target.value);
            this.updateParams();
        };
        
        container.querySelector('#depth').oninput = (e) => {
            this.depthVal = parseFloat(e.target.value);
            this.updateParams();
        };
    }
}