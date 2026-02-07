export default class SubSonic {
    constructor(ctx) {
        this.ctx = ctx;
        this.input = ctx.createGain();
        this.output = ctx.createGain();

        // 1. DETECTION
        this.analyzer = ctx.createBiquadFilter();
        this.analyzer.type = "lowpass";
        this.analyzer.frequency.value = 100;

        // 2. SUB ENGINE
        this.subOsc = ctx.createOscillator();
        this.subOsc.type = "sine";
        this.subOsc.frequency.value = 55;
        
        this.subGain = ctx.createGain();
        this.subGain.gain.value = 0;

        // 3. ENVELOPE (With adjustable decay)
        this.intensity = 0;
        this.decayTime = 0.1; // Default "tight"

        this.processor = ctx.createScriptProcessor(2048, 1, 1);
        
        // --- PROCESSOR LOGIC ---
        // We use a closure here to access 'this' correctly inside the audio thread
        this.processor.onaudioprocess = (e) => {
            const input = e.inputBuffer.getChannelData(0);
            let max = 0;
            // Simple Peak Detection
            for (let i = 0; i < input.length; i++) {
                if (Math.abs(input[i]) > max) max = Math.abs(input[i]);
            }
            
            // Envelope Follower Logic
            // We use setTargetAtTime to smooth the gain changes based on decayTime
            // If intensity is 0, sub is silent.
            if(this.subGain && this.subGain.gain) {
                this.subGain.gain.setTargetAtTime(max * this.intensity, this.ctx.currentTime, this.decayTime);
            }
        };

        // ROUTING
        // Signal Path: Sub Osc -> Sub Gain -> Output
        this.subOsc.connect(this.subGain);
        this.subGain.connect(this.output);

        // Detection Path: Input -> Analyzer (Filter) -> Processor (Analyzes Amplitude)
        this.input.connect(this.analyzer);
        this.analyzer.connect(this.processor);
        this.processor.connect(this.ctx.destination); // Keep processor alive
        
        // Dry Path: Input -> Output
        this.input.connect(this.output);

        this.subOsc.start();
    }

    // --- 1. STATE SAVER ---
    getState() {
        return {
            intensity: this.intensity,
            decay: this.decayTime,
            pitch: this.subOsc.frequency.value
        };
    }

    // --- 2. STATE LOADER ---
    setState(data) {
        if (data.intensity !== undefined) this.intensity = data.intensity;
        if (data.decay !== undefined) this.decayTime = data.decay;
        if (data.pitch !== undefined) {
            this.subOsc.frequency.value = data.pitch;
        }
    }

    cleanup() {
        if(this.subOsc) {
            try { this.subOsc.stop(); } catch(e) {} // Prevent error if already stopped
            this.subOsc.disconnect();
        }
        if(this.processor) {
            this.processor.disconnect();
            this.processor.onaudioprocess = null; // Kill the loop
        }
        this.input.disconnect();
        this.output.disconnect();
    }

    renderUI(container, onRemove) {
        container.innerHTML = `
            <div style="padding:10px; background:#1e272e; color:#05c46b; font-family:monospace; font-size:9px; border:1px solid #05c46b; border-radius:4px;">
                <div style="margin-bottom:8px; color:#fff; border-bottom:1px solid #05c46b; padding-bottom:3px; font-weight:bold;">MFX_SUBSONIC_V2</div>
                
                <label>INTENSITY (VOLUME)</label>
                <input type="range" id="intensity" min="0" max="2" step="0.01" value="${this.intensity}" style="width:100%">
                
                <label style="margin-top:8px; display:block;">LENGTH (DECAY/BOOM)</label>
                <input type="range" id="decay" min="0.02" max="1.5" step="0.01" value="${this.decayTime}" style="width:100%">

                <label style="margin-top:8px; display:block;">PITCH (HERTZ)</label>
                <input type="range" id="pitch" min="30" max="80" step="1" value="${this.subOsc.frequency.value}" style="width:100%">

                <button id="close" style="margin-top:12px; width:100%; background:#05c46b; color:#1e272e; border:none; padding:4px; cursor:pointer; font-weight:bold; border-radius:2px;">PURGE</button>
            </div>
        `;

        container.querySelector('#intensity').oninput = (e) => { this.intensity = parseFloat(e.target.value); };
        container.querySelector('#decay').oninput = (e) => { this.decayTime = parseFloat(e.target.value); };
        
        container.querySelector('#pitch').oninput = (e) => { 
            this.subOsc.frequency.setTargetAtTime(parseFloat(e.target.value), this.ctx.currentTime, 0.1); 
        };
        
        container.querySelector('#close').onclick = () => {
            this.cleanup();
            onRemove();
        };
    }
}