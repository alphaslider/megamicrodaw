export default class SubsonicWobble {
    constructor(ctx) {
        this.ctx = ctx;
        this.output = ctx.createGain();

        // -- TUNING --
        this.tuneVal = 55.0;     // Sub Bass default
        this.detuneVal = 0;      
        this.waveType = 'sawtooth';

        // -- ENVELOPE --
        this.decayVal = 0.2;     
        this.releaseVal = 0.5;   // Length of tail after note ends

        // -- EFFECTS --
        this.distortionVal = 10; // Amount of crunch
        this.pwmWidth = 0;       // For Pulse wave only
        
        // -- WOBBLE (TREMOLO) --
        this.wobbleSpeed = 4.0;  // Hz
        this.wobbleDepth = 0.8;  // 0.0 to 1.0 (How deep the volume chops)
        this.wobbleOn = true;
    }

    // Helper: Distortion Curve (Soft Clipper)
    makeDistortionCurve(amount) {
        const k = amount; 
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < n_samples; ++i) {
            let x = i * 2 / n_samples - 1;
            curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
        }
        return curve;
    }

    // Helper: Pulse Width Shaper Curve
    makePulseCurve(width) {
        // Defines where the triangle wave gets "sliced" to create a pulse
        // width range: -1 to 1
        const curve = new Float32Array(256);
        for (let i = 0; i < 256; i++) {
            let x = (i / 255) * 2 - 1; // -1 to 1
            curve[i] = (x < width) ? -1 : 1;
        }
        return curve;
    }

    trigger(time, frequency = null, velocity = 1.0) {
        const pitch = frequency ? frequency : this.tuneVal;
        const now = time;

        // ------------------------------------------------
        // 1. OSCILLATORS
        // ------------------------------------------------
        
        // A. Sub Osc (Sine for weight)
        const subOsc = this.ctx.createOscillator();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(pitch / 2, now); // Octave down
        
        const subGain = this.ctx.createGain();
        subGain.gain.value = 0.7; // Fixed sub volume

        // B. Main Osc (Texture)
        const mainOsc = this.ctx.createOscillator();
        let sourceOutput = mainOsc; // This is what we will connect downstream

        if (this.waveType === 'pulse') {
            // PWM Trick: Triangle -> WaveShaper -> Square with width
            mainOsc.type = 'triangle';
            const pwmShaper = this.ctx.createWaveShaper();
            pwmShaper.curve = this.makePulseCurve(this.pwmWidth); // Apply Width
            mainOsc.connect(pwmShaper);
            sourceOutput = pwmShaper;
        } else {
            mainOsc.type = this.waveType;
        }

        mainOsc.frequency.setValueAtTime(pitch, now);
        mainOsc.detune.value = this.detuneVal; 

        // ------------------------------------------------
        // 2. DISTORTION
        // ------------------------------------------------
        const distNode = this.ctx.createWaveShaper();
        if (this.distortionVal > 0) {
            distNode.curve = this.makeDistortionCurve(this.distortionVal);
            distNode.oversample = '4x';
        } else {
            distNode.curve = null; // Bypass
        }

        // ------------------------------------------------
        // 3. WOBBLE (TREMOLO / AMP MODULATION)
        // ------------------------------------------------
        const wobbleGain = this.ctx.createGain();
        
        // Default: Full volume (1.0) if wobble is off
        wobbleGain.gain.setValueAtTime(1.0, now);

        let lfo = null;
        if (this.wobbleOn && this.wobbleDepth > 0) {
            lfo = this.ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.setValueAtTime(this.wobbleSpeed, now);

            const lfoAmp = this.ctx.createGain();
            // Scale LFO depth. 
            // If depth is 1.0, we want Gain to swing 0.0 -> 1.0
            // We set base Gain to 0.5, and LFO adds +/- 0.5
            const base = 1.0 - (this.wobbleDepth * 0.5); 
            const swing = this.wobbleDepth * 0.5;

            wobbleGain.gain.setValueAtTime(base, now);
            lfoAmp.gain.value = swing;

            lfo.connect(lfoAmp);
            lfoAmp.connect(wobbleGain.gain);
            
            lfo.start(now);
            // STOP FIX: LFO must last as long as the Release tail to prevent clicks
            lfo.stop(now + this.decayVal + this.releaseVal + 0.5); 
        }

        // ------------------------------------------------
        // 4. MASTER ENVELOPE (VCA)
        // ------------------------------------------------
        const masterEnv = this.ctx.createGain();
        masterEnv.gain.setValueAtTime(0, now);
        
        // Attack (Short to prevent click, but fast)
        masterEnv.gain.linearRampToValueAtTime(velocity, now + 0.02);
        // Decay
        masterEnv.gain.exponentialRampToValueAtTime(velocity * 0.6, now + this.decayVal);
        // Release
        masterEnv.gain.exponentialRampToValueAtTime(0.001, now + this.decayVal + this.releaseVal);

        // ------------------------------------------------
        // 5. ROUTING
        // ------------------------------------------------
        
        // Chain: MainOsc -> Distortion -> WobbleGain -> MasterEnv
        sourceOutput.connect(distNode);
        distNode.connect(wobbleGain);
        wobbleGain.connect(masterEnv);

        // Chain: SubOsc -> MasterEnv (Clean, no dist, no wobble? Or wobble?)
        // Usually Sub should wobble too if it's bass.
        subOsc.connect(subGain);
        subGain.connect(wobbleGain); // Connect Sub to Wobble so they pump together

        masterEnv.connect(this.output);

        // ------------------------------------------------
        // 6. TIMING
        // ------------------------------------------------
        mainOsc.start(now);
        subOsc.start(now);

        const stopTime = now + this.decayVal + this.releaseVal + 0.1;
        mainOsc.stop(stopTime);
        subOsc.stop(stopTime);

        // Cleanup
        setTimeout(() => {
            masterEnv.disconnect();
        }, (this.decayVal + this.releaseVal + 0.2) * 1000);
    }

    getState() {
        return {
            tune: this.tuneVal, wave: this.waveType,
            decay: this.decayVal, release: this.releaseVal,
            dist: this.distortionVal, pwm: this.pwmWidth,
            wobSpeed: this.wobbleSpeed, wobDepth: this.wobbleDepth,
            wobOn: this.wobbleOn
        };
    }

    setState(data) {
        if (data.tune) this.tuneVal = data.tune;
        if (data.wave) this.waveType = data.wave;
        if (data.decay) this.decayVal = data.decay;
        if (data.release) this.releaseVal = data.release;
        if (data.dist !== undefined) this.distortionVal = data.dist;
        if (data.pwm !== undefined) this.pwmWidth = data.pwm;
        if (data.wobSpeed) this.wobbleSpeed = data.wobSpeed;
        if (data.wobDepth !== undefined) this.wobbleDepth = data.wobDepth;
        if (data.wobOn !== undefined) this.wobbleOn = data.wobOn;
    }

    renderUI(container, onRemove) {
        const rowStyle = "display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;";
        const labelStyle = "color:#b2bec3; font-size:9px;";
        
        container.innerHTML = `
            <div style="padding:10px; background:#2d3436; color:#dfe6e9; font-family:monospace; font-size:10px; border:1px solid #636e72; border-radius:4px; width:160px;">
                <div style="margin-bottom:8px; color:#a29bfe; border-bottom:1px solid #636e72; font-weight:bold;">
                    AMP_WOBBLE_BASS
                </div>

                <div style="${rowStyle}">
                    <select id="wave" style="background:#000; color:#fff; width:60px;">
                        <option value="sawtooth" ${this.waveType=='sawtooth'?'selected':''}>SAW</option>
                        <option value="square" ${this.waveType=='square'?'selected':''}>SQR</option>
                        <option value="pulse" ${this.waveType=='pulse'?'selected':''}>PULSE</option>
                    </select>
                    <div style="width:45%;">
                        <label style="${labelStyle}">PWM</label>
                        <input type="range" id="pwm" min="-0.9" max="0.9" step="0.1" value="${this.pwmWidth}" style="width:100%">
                    </div>
                </div>

                <label style="${labelStyle}">DISTORTION</label>
                <input type="range" id="dist" min="0" max="100" value="${this.distortionVal}" style="width:100%; margin-bottom:5px;">

                <div style="border-top:1px dashed #636e72; padding-top:5px; margin-top:5px;">
                    <div style="${rowStyle}">
                        <label style="color:#a29bfe;">WOBBLE (AMP)</label>
                        <input type="checkbox" id="wobOn" ${this.wobbleOn?'checked':''}>
                    </div>
                    
                    <label style="${labelStyle}">SPEED (Hz)</label>
                    <input type="range" id="speed" min="0.1" max="20" step="0.1" value="${this.wobbleSpeed}" style="width:100%">
                    
                    <label style="${labelStyle}">DEPTH</label>
                    <input type="range" id="depth" min="0" max="1" step="0.1" value="${this.wobbleDepth}" style="width:100%">
                </div>

                <div style="border-top:1px dashed #636e72; padding-top:5px; margin-top:5px; display:flex; gap:5px;">
                    <div>
                        <label style="${labelStyle}">DECAY</label>
                        <input type="range" id="decay" min="0.1" max="1.0" step="0.1" value="${this.decayVal}" style="width:100%">
                    </div>
                    <div>
                        <label style="${labelStyle}">RELEASE</label>
                        <input type="range" id="release" min="0.1" max="2.0" step="0.1" value="${this.releaseVal}" style="width:100%">
                    </div>
                </div>

                <button id="close" style="margin-top:10px; width:100%; background:#d63031; color:#fff; border:none; padding:4px; cursor:pointer;">REMOVE</button>
            </div>
        `;

        // UI Bindings
        const bind = (id, prop, float=true) => {
            const el = container.querySelector('#'+id);
            if(el) el.oninput = (e) => this[prop] = float ? parseFloat(e.target.value) : e.target.value;
        };

        bind('pwm', 'pwmWidth');
        bind('dist', 'distortionVal');
        bind('speed', 'wobbleSpeed');
        bind('depth', 'wobbleDepth');
        bind('decay', 'decayVal');
        bind('release', 'releaseVal');

        container.querySelector('#wave').onchange = (e) => this.waveType = e.target.value;
        container.querySelector('#wobOn').onchange = (e) => this.wobbleOn = e.target.checked;
        
        container.querySelector('#close').onclick = () => {
            this.output.disconnect();
            onRemove();
        };
    }
}