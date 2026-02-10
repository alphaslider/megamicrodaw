export default class SimpleSynth {
    constructor(ctx) {
        this.ctx = ctx;
        this.output = ctx.createGain(); 

        this.tuneVal = 261.63; // Default C3
        this.decayVal = 0.3;   
        this.cutoffVal = 2000; 
        this.waveType = 'sawtooth'; 
        
        // NEW PARAMETERS
        this.autoFilter = false; // The Toggle
        this.filterSpeed = 2.0;  // The Speed (Hz)
    }

    trigger(time, frequency = null, velocity = 1.0) {
        
        const pitch = frequency ? frequency : this.tuneVal;

        // A. OSCILLATOR
        const osc = this.ctx.createOscillator();
        osc.type = this.waveType;
        osc.frequency.setValueAtTime(pitch, time);

        // Pitch Drop (Kick effect)
        if(this.decayVal < 0.2) {
             osc.frequency.exponentialRampToValueAtTime(10, time + this.decayVal);
        }

        // B. FILTER
        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(this.cutoffVal, time);
        filter.Q.value = 5; 
        
        // Standard Envelope Decay
        filter.frequency.exponentialRampToValueAtTime(this.cutoffVal * 0.1, time + this.decayVal);

        // --- NEW: AUTO FILTER LOGIC (LFO) ---
        let lfo = null;
        if (this.autoFilter) {
            lfo = this.ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.setValueAtTime(this.filterSpeed, time);

            const lfoDepth = this.ctx.createGain();
            lfoDepth.gain.value = 1000; // How wide the sweep is (+/- 1000Hz)

            lfo.connect(lfoDepth);
            lfoDepth.connect(filter.frequency);
            
            lfo.start(time);
            lfo.stop(time + this.decayVal + 0.1);
        }
        // ------------------------------------

        // C. VCA (Volume)
        const env = this.ctx.createGain();
        env.gain.setValueAtTime(0, time);
        env.gain.linearRampToValueAtTime(velocity, time + 0.005); 
        env.gain.exponentialRampToValueAtTime(0.001, time + this.decayVal); 

        // D. ROUTING
        osc.connect(filter);
        filter.connect(env);
        env.connect(this.output);

        // E. START / STOP
        osc.start(time);
        osc.stop(time + this.decayVal + 0.1); 
    }

    getState() {
        return { 
            tune: this.tuneVal, 
            decay: this.decayVal, 
            cutoff: this.cutoffVal, 
            wave: this.waveType,
            autoFilter: this.autoFilter,
            filterSpeed: this.filterSpeed
        };
    }

    setState(data) {
        if (data.tune) this.tuneVal = data.tune;
        if (data.decay) this.decayVal = data.decay;
        if (data.cutoff) this.cutoffVal = data.cutoff;
        if (data.wave) this.waveType = data.wave;
        if (data.autoFilter !== undefined) this.autoFilter = data.autoFilter;
        if (data.filterSpeed) this.filterSpeed = data.filterSpeed;
    }

    renderUI(container, onRemove) {
        container.innerHTML = `
            <div style="padding:10px; background:#2d3436; color:#dfe6e9; font-family:monospace; font-size:10px; border:1px solid #636e72; border-radius:4px;">
                <div style="margin-bottom:8px; color:#55efc4; border-bottom:1px solid #636e72; padding-bottom:3px; font-weight:bold; display:flex; justify-content:space-between;">
                    <span>MONO_SYNTH_V3</span>
                    <select id="wave" style="background:#000; color:#fff; border:none; font-size:9px;">
                        <option value="sawtooth" ${this.waveType=='sawtooth'?'selected':''}>SAW</option>
                        <option value="square" ${this.waveType=='square'?'selected':''}>SQR</option>
                        <option value="sine" ${this.waveType=='sine'?'selected':''}>SIN</option>
                    </select>
                </div>
                
                <label>BASE TUNE (IF NO P.ROLL)</label>
                <input type="range" id="tune" min="50" max="880" step="1" value="${this.tuneVal}" style="width:100%">
                
                <label style="margin-top:5px; display:block;">DECAY</label>
                <input type="range" id="decay" min="0.1" max="2.0" step="0.01" value="${this.decayVal}" style="width:100%">

                <label style="margin-top:5px; display:block;">CUTOFF BASE</label>
                <input type="range" id="cutoff" min="200" max="8000" step="10" value="${this.cutoffVal}" style="width:100%">

                <div style="margin-top:8px; border-top:1px dashed #636e72; padding-top:5px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                        <label>AUTO CUTOFF</label>
                        <input type="checkbox" id="autoFilter" ${this.autoFilter ? 'checked' : ''}>
                    </div>
                    
                    <label>FILTER SPEED (LFO)</label>
                    <input type="range" id="speed" min="0.1" max="20" step="0.1" value="${this.filterSpeed}" style="width:100%">
                </div>

                <button id="close" style="margin-top:10px; width:100%; background:#d63031; color:#fff; border:none; padding:4px; cursor:pointer; font-size:9px;">REMOVE SYNTH</button>
            </div>
        `;

        // Bind Standard Controls
        container.querySelector('#tune').oninput = (e) => this.tuneVal = parseFloat(e.target.value);
        container.querySelector('#decay').oninput = (e) => this.decayVal = parseFloat(e.target.value);
        container.querySelector('#cutoff').oninput = (e) => this.cutoffVal = parseFloat(e.target.value);
        container.querySelector('#wave').onchange = (e) => this.waveType = e.target.value;
        
        // Bind New Controls
        container.querySelector('#autoFilter').onchange = (e) => this.autoFilter = e.target.checked;
        container.querySelector('#speed').oninput = (e) => this.filterSpeed = parseFloat(e.target.value);
        
        container.querySelector('#close').onclick = () => {
            this.output.disconnect(); 
            onRemove(); 
        };
    }
}