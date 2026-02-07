export default class SpIsolator {
    constructor(ctx) {
        this.ctx = ctx;
        this.input = ctx.createGain();
        this.output = ctx.createGain();

        // 1. THREE BAND SPLIT
        // Low Band (Below 400Hz)
        this.lowShelf = ctx.createBiquadFilter();
        this.lowShelf.type = "lowshelf";
        this.lowShelf.frequency.value = 400;
        this.lowShelf.gain.value = 0;

        // High Band (Above 2500Hz)
        this.highShelf = ctx.createBiquadFilter();
        this.highShelf.type = "highshelf";
        this.highShelf.frequency.value = 2500;
        this.highShelf.gain.value = 0;

        // Mid Band (Peaking at 1000Hz)
        this.midPeak = ctx.createBiquadFilter();
        this.midPeak.type = "peaking";
        this.midPeak.frequency.value = 1000;
        this.midPeak.Q.value = 0.5; // Wide Q for "creamy" transition
        this.midPeak.gain.value = 0;

        // ROUTING: Input -> Low -> Mid -> High -> Output
        this.input.connect(this.lowShelf);
        this.lowShelf.connect(this.midPeak);
        this.midPeak.connect(this.highShelf);
        this.highShelf.connect(this.output);
    }

    // --- 1. STATE SAVER ---
    getState() {
        return {
            low: this.lowShelf.gain.value,
            mid: this.midPeak.gain.value,
            high: this.highShelf.gain.value
        };
    }

    // --- 2. STATE LOADER ---
    setState(data) {
        if (data.low !== undefined) this.lowShelf.gain.value = data.low;
        if (data.mid !== undefined) this.midPeak.gain.value = data.mid;
        if (data.high !== undefined) this.highShelf.gain.value = data.high;
    }

    cleanup() {
        this.input.disconnect();
        this.output.disconnect();
    }

    renderUI(container, onRemove) {
        container.innerHTML = `
            <div style="padding:10px; background:#218c74; color:#f1f2f6; font-family:monospace; font-size:9px; border:1px solid #33d9b2; border-radius:4px;">
                <div style="margin-bottom:8px; color:#fff; border-bottom:1px solid #33d9b2; padding-bottom:3px; font-weight:bold;">MFX_ISOLATOR</div>
                
                <label>LOW (BASS)</label>
                <input type="range" id="low" min="-40" max="6" step="0.1" value="${this.lowShelf.gain.value}" style="width:100%">
                
                <label style="margin-top:8px; display:block;">MID (VOICE)</label>
                <input type="range" id="mid" min="-40" max="6" step="0.1" value="${this.midPeak.gain.value}" style="width:100%">

                <label style="margin-top:8px; display:block;">HIGH (AIR)</label>
                <input type="range" id="high" min="-40" max="6" step="0.1" value="${this.highShelf.gain.value}" style="width:100%">

                <button id="close" style="margin-top:12px; width:100%; background:#33d9b2; color:#218c74; border:none; padding:4px; cursor:pointer; font-weight:bold; border-radius:2px;">PURGE</button>
            </div>
        `;

        container.querySelector('#low').oninput = (e) => { this.lowShelf.gain.value = parseFloat(e.target.value); };
        container.querySelector('#mid').oninput = (e) => { this.midPeak.gain.value = parseFloat(e.target.value); };
        container.querySelector('#high').oninput = (e) => { this.highShelf.gain.value = parseFloat(e.target.value); };
        
        container.querySelector('#close').onclick = () => {
            this.cleanup();
            onRemove();
        };
    }
}