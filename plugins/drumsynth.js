export default class DrumSynth {
    constructor(ctx) {
        this.ctx = ctx;
        this.output = ctx.createGain();
        
        // --- 12-NOTE KIT DATA ---
        this.kits = [
            { name: "C  - KICK",    type: "kick",   tune: 50,  decay: 0.3,  color: 10,   level: 1.0 },
            { name: "C# - RIM",     type: "rim",    tune: 800, decay: 0.05, color: 1000, level: 0.7 },
            { name: "D  - SNARE",   type: "snare",  tune: 200, decay: 0.15, color: 1000, level: 0.8 },
            { name: "D# - CLAP",    type: "clap",   tune: 0,   decay: 0.15, color: 1200, level: 0.7 },
            { name: "E  - TOM LO",  type: "tom",    tune: 80,  decay: 0.35, color: 10,   level: 0.8 },
            { name: "F  - CH HAT",  type: "hat",    tune: 800, decay: 0.05, color: 3000, level: 0.6 }, 
            { name: "F# - TOM MID", type: "tom",    tune: 120, decay: 0.3,  color: 15,   level: 0.8 },
            { name: "G  - OP HAT",  type: "hat",    tune: 800, decay: 0.3,  color: 3000, level: 0.6 }, 
            { name: "G# - TOM HI",  type: "tom",    tune: 180, decay: 0.25, color: 20,   level: 0.8 },
            { name: "A  - SHAKER",  type: "shaker", tune: 6000,decay: 0.1,  color: 500,  level: 0.5 },
            { name: "A# - COWBELL", type: "cb",     tune: 500, decay: 0.2,  color: 800,  level: 0.6 },
            { name: "B  - CRASH",   type: "crash",  tune: 4000,decay: 1.2,  color: 1000, level: 0.5 }
        ];

        this.currentEdit = 0; 
        this.chaosMode = false; 
        this.uiElements = {}; 
    }

    trigger(time, frequency, velocity) {
        // Reverse engineer note index (Safe mapping)
        if (!frequency) return;
        let noteIndex = Math.round(12 * Math.log2(frequency / 16.3516));
        noteIndex = (noteIndex % 12 + 12) % 12; 

        const p = this.kits[noteIndex];
        if (!p) return;

        // --- CHAOS LOGIC ---
        if (this.chaosMode) {
            this.randomizeParameters(p);
            // Update UI if this is the currently selected drum
            if(noteIndex === this.currentEdit && this.uiElements.tune) {
                setTimeout(() => this.updateUI(), 0);
            }
        }

        // Route to engine
        switch(p.type) {
            case 'kick':  this.playKick(time, velocity, p); break;
            case 'rim':   this.playRim(time, velocity, p); break;
            case 'snare': this.playSnare(time, velocity, p); break;
            case 'clap':  this.playClap(time, velocity, p); break;
            case 'tom':   this.playTom(time, velocity, p); break;
            case 'hat':   this.playHat(time, velocity, p); break;
            case 'shaker':this.playShaker(time, velocity, p); break;
            case 'cb':    this.playCowbell(time, velocity, p); break;
            case 'crash': this.playCrash(time, velocity, p); break;
        }
    }

    randomizeParameters(p) {
        const tuneDrift = Math.max(10, p.tune * 0.2); // Ensure we don't drift to 0
        p.tune = Math.max(20, p.tune + (Math.random() * tuneDrift * 2 - tuneDrift));
        
        const decayDrift = p.decay * 0.1;
        p.decay = Math.max(0.01, p.decay + (Math.random() * decayDrift * 2 - decayDrift));

        const colorDrift = p.color * 0.3;
        p.color = Math.max(0, p.color + (Math.random() * colorDrift * 2 - colorDrift));
    }

    // --- ENGINES ---

    playKick(t, vel, p) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain); gain.connect(this.output);

        // FIX 1: SAFETY FLOOR
        // Prevent frequency from ever being 0 to stop crashes
        const safeFreq = Math.max(p.tune, 20); 

        // FIX 2: RELATIVE PITCH SWEEP
        // Instead of +100Hz, we multiply. This keeps it snappy at low pitch 
        // and prevents it from being too high pitched at high settings.
        osc.frequency.setValueAtTime(safeFreq * 4, t); 
        osc.frequency.exponentialRampToValueAtTime(safeFreq, t + 0.1); 

        gain.gain.setValueAtTime(p.level * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + p.decay);
        
        osc.start(t); 
        osc.stop(t + p.decay + 0.1);
    }

    playTom(t, vel, p) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain); gain.connect(this.output);

        const safeFreq = Math.max(p.tune, 20); // Safety

        osc.frequency.setValueAtTime(safeFreq + p.color, t); 
        osc.frequency.exponentialRampToValueAtTime(safeFreq, t + p.decay);

        gain.gain.setValueAtTime(p.level * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + p.decay);
        
        osc.start(t); 
        osc.stop(t + p.decay + 0.1);
    }

    playSnare(t, vel, p) {
        const osc = this.ctx.createOscillator(); osc.type = 'triangle';
        const gain = this.ctx.createGain();
        osc.connect(gain); gain.connect(this.output);
        
        const safeFreq = Math.max(p.tune, 50);

        osc.frequency.setValueAtTime(safeFreq, t);
        gain.gain.setValueAtTime(p.level * vel * 0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        
        osc.start(t); 
        osc.stop(t + 0.2);
        
        // Pass safe values to noise
        this.makeNoise(t, p.decay, Math.max(p.color, 100), p.level * vel, 'highpass');
    }

    playRim(t, vel, p) {
        const osc = this.ctx.createOscillator(); osc.type = 'sine';
        const gain = this.ctx.createGain();
        osc.connect(gain); gain.connect(this.output);
        
        const safeFreq = Math.max(p.tune, 50);

        osc.frequency.setValueAtTime(safeFreq, t);
        gain.gain.setValueAtTime(p.level * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02); 
        osc.start(t); osc.stop(t + 0.05);
    }

    playHat(t, vel, p) {
        const osc = this.ctx.createOscillator(); osc.type = 'square';
        const gain = this.ctx.createGain();
        osc.connect(gain); gain.connect(this.output);
        
        // Hats need high freq, but still safe
        osc.frequency.value = Math.max(p.tune, 200); 
        
        gain.gain.setValueAtTime(0.1 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.start(t); osc.stop(t + 0.1);
        this.makeNoise(t, p.decay, Math.max(p.color, 500), p.level * vel, 'highpass');
    }

    playClap(t, vel, p) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.getNoiseBuffer();
        const filter = this.ctx.createBiquadFilter();
        
        // Safety for filter freq
        filter.type = "bandpass"; 
        filter.frequency.value = Math.max(p.color, 100); 
        filter.Q.value = 1;

        const env = this.ctx.createGain();
        noise.connect(filter); filter.connect(env); env.connect(this.output);
        
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(p.level * vel, t + 0.01);
        env.gain.exponentialRampToValueAtTime(0.001, t + p.decay);
        
        noise.start(t); noise.stop(t + p.decay + 0.1);
    }

    playShaker(t, vel, p) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.getNoiseBuffer();
        const filter = this.ctx.createBiquadFilter();
        
        filter.type = "bandpass"; 
        filter.frequency.value = Math.max(p.tune, 200); 
        filter.Q.value = 5;

        const env = this.ctx.createGain();
        noise.connect(filter); filter.connect(env); env.connect(this.output);
        
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(p.level * vel, t + 0.02);
        env.gain.exponentialRampToValueAtTime(0.001, t + p.decay);
        
        noise.start(t); noise.stop(t + p.decay + 0.1);
    }

    playCowbell(t, vel, p) {
        const osc1 = this.ctx.createOscillator(); osc1.type = 'square';
        const osc2 = this.ctx.createOscillator(); osc2.type = 'square';
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter(); 
        
        const safeTune = Math.max(p.tune, 100);

        filter.type = "bandpass"; 
        filter.frequency.value = Math.max(p.color * 2, 200);
        
        osc1.frequency.value = safeTune;
        osc2.frequency.value = safeTune * 1.5; 
        
        osc1.connect(filter); osc2.connect(filter); 
        filter.connect(gain); gain.connect(this.output);
        
        gain.gain.setValueAtTime(p.level * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + p.decay);
        
        osc1.start(t); osc2.start(t);
        osc1.stop(t + p.decay); osc2.stop(t + p.decay);
    }

    playCrash(t, vel, p) {
        this.makeNoise(t, p.decay, Math.max(p.color, 200), p.level * vel, 'highpass');
        
        const osc = this.ctx.createOscillator(); osc.type = 'sawtooth';
        const gain = this.ctx.createGain();
        osc.connect(gain); gain.connect(this.output);
        
        osc.frequency.value = Math.max(p.tune, 100); 
        
        gain.gain.setValueAtTime(0.2 * vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + p.decay * 0.5);
        osc.start(t); osc.stop(t + p.decay);
    }

    // --- UTILS ---
    makeNoise(time, dur, filterFreq, level, type = 'lowpass') {
        const src = this.ctx.createBufferSource();
        src.buffer = this.getNoiseBuffer();
        const fil = this.ctx.createBiquadFilter();
        
        fil.type = type; 
        fil.frequency.value = Math.max(filterFreq, 20); // Safety
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(level, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
        
        src.connect(fil); fil.connect(gain); gain.connect(this.output);
        src.start(time); src.stop(time + dur + 0.1);
    }

    getNoiseBuffer() {
        if (!this.noiseBuf) {
            const ls = this.ctx.sampleRate * 2.0;
            const b = this.ctx.createBuffer(1, ls, this.ctx.sampleRate);
            const d = b.getChannelData(0);
            for (let i = 0; i < ls; i++) d[i] = Math.random() * 2 - 1;
            this.noiseBuf = b;
        }
        return this.noiseBuf;
    }

    getState() { return { kits: this.kits, chaos: this.chaosMode }; }
    
    setState(data) { 
        if(data.kits) this.kits = data.kits; 
        if(data.chaos !== undefined) this.chaosMode = data.chaos;
    }

    updateUI() {
        if(!this.uiElements.tune) return; 
        const p = this.kits[this.currentEdit];
        this.uiElements.tune.value = p.tune;
        this.uiElements.decay.value = p.decay;
        this.uiElements.color.value = p.color;
        this.uiElements.level.value = p.level;
    }

    renderUI(container, onRemove) {
        container.innerHTML = `
            <div style="padding:10px; background:#222; color:#eee; font-family:monospace; font-size:10px; border:1px solid #444; border-radius:4px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px; align-items:center; border-bottom:1px solid #444; padding-bottom:5px;">
                    <span style="color:#e67e22; font-weight:bold;">DRUM_SYNTH_SAFE</span>
                    <select id="drumSel" style="background:#000; color:#fff; border:1px solid #555; padding:2px; font-size:9px;">
                        ${this.kits.map((k, i) => `<option value="${i}" ${i===this.currentEdit?'selected':''}>${k.name}</option>`).join('')}
                    </select>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:5px;">
                    <div><label>TUNE</label><input type="range" id="tune" min="0" max="8000" step="10"></div>
                    <div><label>DECAY</label><input type="range" id="decay" min="0.01" max="1.5" step="0.01"></div>
                    <div><label>COLOR</label><input type="range" id="color" min="0" max="8000" step="10"></div>
                    <div><label>LEVEL</label><input type="range" id="level" min="0" max="1.5" step="0.01"></div>
                </div>

                <div style="margin-top:8px; border-top:1px dashed #555; padding-top:5px; display:flex; justify-content:space-between;">
                    <label style="color:#e74c3c; font-weight:bold;">CHAOS MODE</label>
                    <input type="checkbox" id="chaos" ${this.chaosMode ? 'checked' : ''}>
                </div>

                <button id="close" style="margin-top:10px; width:100%; background:#c0392b; color:#fff; border:none; padding:3px; cursor:pointer;">REMOVE</button>
            </div>
        `;

        this.uiElements = {
            tune: container.querySelector('#tune'),
            decay: container.querySelector('#decay'),
            color: container.querySelector('#color'),
            level: container.querySelector('#level')
        };

        this.updateUI();

        container.querySelector('#drumSel').onchange = (e) => {
            this.currentEdit = parseInt(e.target.value);
            this.updateUI();
        };

        const bind = (id, param) => {
            container.querySelector('#'+id).oninput = (e) => {
                this.kits[this.currentEdit][param] = parseFloat(e.target.value);
            };
        };

        bind('tune', 'tune');
        bind('decay', 'decay');
        bind('color', 'color');
        bind('level', 'level');

        container.querySelector('#chaos').onchange = (e) => {
            this.chaosMode = e.target.checked;
        };

        container.querySelector('#close').onclick = () => {
            this.uiElements = {}; 
            this.output.disconnect(); 
            onRemove();
        };
    }
}