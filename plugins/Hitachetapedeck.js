export default class HitachiHotRip {
    constructor(ctx) {
        this.ctx = ctx;
        this.input = ctx.createGain();
        this.output = ctx.createGain();

        // 1. THE "CREAMY" FILTER (High Q for resonant warmth)
        this.lpFilter = ctx.createBiquadFilter();
        this.lpFilter.type = "lowpass";
        this.lpFilter.Q.value = 2.5; // Added resonance for character

        // 2. THE HITACHI ENGINE
        this.driveGain = ctx.createGain(); 
        this.shaper = ctx.createWaveShaper();
        
        // The Hitachi Quirk: Fixed +6dB Output Rail
        this.fixedRip = ctx.createGain();
        this.fixedRip.gain.value = 2.0; 

        // 3. CROSSFADE ENGINE (A/B)
        this.dryGain = ctx.createGain();
        this.wetGain = ctx.createGain();

        // STATE
        this.mixVal = 1.0; // 1 = Wet (Hitachi), 0 = Dry (Bypass)
        this.driveVal = 1.0;
        this.crunchVal = 8;
        this.freqVal = 4000;

        this.updateCurve(this.crunchVal);

        // ROUTING: Input -> Split
        this.input.connect(this.dryGain);
        this.input.connect(this.lpFilter); // Filter BEFORE saturation for creaminess
        
        // Wet Chain: Filter -> Drive -> Shaper -> Fixed Rip -> WetGain
        this.lpFilter.connect(this.driveGain);
        this.driveGain.connect(this.shaper);
        this.shaper.connect(this.fixedRip);
        this.fixedRip.connect(this.wetGain);
        
        // Output Merge
        this.dryGain.connect(this.output);
        this.wetGain.connect(this.output);

        this.updateMix(this.mixVal);
    }

    updateMix(value) {
        this.mixVal = parseFloat(value);
        const now = this.ctx.currentTime;
        // Equal-power crossfade
        this.dryGain.gain.setTargetAtTime(Math.cos(this.mixVal * 0.5 * Math.PI), now, 0.02);
        this.wetGain.gain.setTargetAtTime(Math.sin(this.mixVal * 0.5 * Math.PI), now, 0.02);
    }

    updateCurve(amount) {
        this.crunchVal = parseFloat(amount);
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        for (let i = 0; i < n_samples; ++i) {
            let x = (i * 2) / n_samples - 1;
            // Using a slightly more aggressive tanh variant
            curve[i] = Math.tanh(x * this.crunchVal);
        }
        this.shaper.curve = curve;
    }

    getState() {
        return {
            mix: this.mixVal,
            drive: this.driveVal,
            crunch: this.crunchVal,
            freq: this.freqVal
        };
    }

    setState(data) {
        if (data.mix !== undefined) this.updateMix(data.mix);
        if (data.drive !== undefined) {
            this.driveVal = data.drive;
            this.driveGain.gain.value = this.driveVal;
        }
        if (data.crunch !== undefined) this.updateCurve(data.crunch);
        if (data.freq !== undefined) {
            this.freqVal = data.freq;
            this.lpFilter.frequency.value = this.freqVal;
        }
    }

    cleanup() {
        this.input.disconnect();
        this.output.disconnect();
    }

    renderUI(container, onRemove) {
        container.innerHTML = `
            <div style="padding:10px; background:#1e272e; color:#d2dae2; font-family:monospace; font-size:9px; border:1px solid #485460; border-radius:4px;">
                <div style="margin-bottom:8px; color:#ffdd59; border-bottom:1px solid #485460; padding-bottom:3px; font-weight:bold;">HITACHI_HOT_RIP</div>
                
                <label>A/B MIX (DRY -> HITACHI)</label>
                <input type="range" id="mix" min="0" max="1" step="0.01" value="${this.mixVal}" style="width:100%">

                <label style="margin-top:8px; display:block;">REC LEVEL (DRIVE)</label>
                <input type="range" id="drive" min="0.5" max="5" step="0.1" value="${this.driveVal}" style="width:100%">
                
                <label style="margin-top:8px; display:block;">TAPE CRUNCH</label>
                <input type="range" id="crunch" min="1" max="30" step="1" value="${this.crunchVal}" style="width:100%">

                <label style="margin-top:8px; display:block;">CREAMY LPF (Hz)</label>
                <input type="range" id="freq" min="100" max="12000" step="10" value="${this.freqVal}" style="width:100%">

                <button id="close" style="margin-top:12px; width:100%; background:#ef5777; color:#fff; border:none; padding:4px; cursor:pointer; font-size:8px; border-radius:2px;">PURGE FROM STRIP</button>
            </div>
        `;

        container.querySelector('#mix').oninput = (e) => this.updateMix(e.target.value);
        
        container.querySelector('#drive').oninput = (e) => {
            this.driveVal = parseFloat(e.target.value);
            this.driveGain.gain.setTargetAtTime(this.driveVal, this.ctx.currentTime, 0.01);
        };

        container.querySelector('#crunch').oninput = (e) => this.updateCurve(e.target.value);
        
        container.querySelector('#freq').oninput = (e) => {
            this.freqVal = parseFloat(e.target.value);
            this.lpFilter.frequency.setTargetAtTime(this.freqVal, this.ctx.currentTime, 0.01);
        };
        
        container.querySelector('#close').onclick = () => {
            this.cleanup();
            onRemove();
        };
    }
}