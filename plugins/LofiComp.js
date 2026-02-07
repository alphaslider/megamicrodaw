export default class Compressor303 {
    constructor(ctx) {
        this.ctx = ctx;
        this.input = ctx.createGain();
        this.output = ctx.createGain();

        // 1. THE PUMP ENGINE
        this.comp = ctx.createDynamicsCompressor();
        
        // 303/404 style fixed settings for that "Smash"
        this.comp.attack.value = 0.003; // Fast attack to catch the kick
        this.comp.release.value = 0.25; // Medium release for the "pump"
        this.comp.ratio.value = 20;     // High ratio for heavy squashing
        this.comp.threshold.value = -20; // Default threshold

        // 2. MAKEUP GAIN (To keep it loud when it's crushed)
        this.makeup = ctx.createGain();
        this.makeup.gain.value = 1.0;

        // 3. SATURATION (The "Creamy" grit)
        this.shaper = ctx.createWaveShaper();
        this.driveAmount = 2.0; // STATE TRACKING: We must store this variable to save it
        this.updateDrive(this.driveAmount);

        // ROUTING
        this.input.connect(this.comp);
        this.comp.connect(this.shaper);
        this.shaper.connect(this.makeup);
        this.makeup.connect(this.output);
    }

    // --- 1. STATE SAVER ---
    getState() {
        return {
            threshold: this.comp.threshold.value,
            drive: this.driveAmount,
            makeup: this.makeup.gain.value
        };
    }

    // --- 2. STATE LOADER ---
    setState(data) {
        if (data.threshold !== undefined) this.comp.threshold.value = data.threshold;
        if (data.makeup !== undefined) this.makeup.gain.value = data.makeup;
        if (data.drive !== undefined) {
            this.driveAmount = data.drive;
            this.updateDrive(this.driveAmount);
        }
    }

    updateDrive(amount) {
        this.driveAmount = amount; // Update local tracker
        const n = 44100;
        const curve = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            let x = (i * 2) / n - 1;
            curve[i] = Math.tanh(x * amount);
        }
        this.shaper.curve = curve;
    }

    cleanup() {
        this.input.disconnect();
        this.output.disconnect();
    }

    renderUI(container, onRemove) {
        // We use template literals (${...}) to inject current values into the HTML
        container.innerHTML = `
            <div style="padding:10px; background:#ff9f43; color:#222f3e; font-family:monospace; font-size:9px; border:1px solid #ee5253; border-radius:4px;">
                <div style="margin-bottom:8px; color:#222f3e; border-bottom:1px solid #ee5253; padding-bottom:3px; font-weight:bold;">MFX_303_PUMP</div>
                
                <label>SQUASH (THRESHOLD)</label>
                <input type="range" id="thresh" min="-60" max="0" step="1" value="${this.comp.threshold.value}" style="width:100%">
                
                <label style="margin-top:8px; display:block;">DRIVE (GRIT)</label>
                <input type="range" id="drive" min="1" max="10" step="0.1" value="${this.driveAmount}" style="width:100%">

                <label style="margin-top:8px; display:block;">MAKEUP (LEVEL)</label>
                <input type="range" id="level" min="0" max="3" step="0.05" value="${this.makeup.gain.value}" style="width:100%">

                <button id="close" style="margin-top:12px; width:100%; background:#ee5253; color:#fff; border:none; padding:4px; cursor:pointer; font-weight:bold; border-radius:2px;">PURGE</button>
            </div>
        `;

        container.querySelector('#thresh').oninput = (e) => { this.comp.threshold.value = parseFloat(e.target.value); };
        container.querySelector('#drive').oninput = (e) => { this.updateDrive(parseFloat(e.target.value)); };
        container.querySelector('#level').oninput = (e) => { this.makeup.gain.value = parseFloat(e.target.value); };
        
        container.querySelector('#close').onclick = () => {
            this.cleanup();
            onRemove();
        };
    }
}