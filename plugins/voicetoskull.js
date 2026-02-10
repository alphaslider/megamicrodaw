export default class SpV2KRandomSH {
    constructor(ctx) {
        this.ctx = ctx;
        this.input = ctx.createGain();
        this.output = ctx.createGain();

        // --- VOWEL DATA ---
        this.vowelTable = [
            [730, 1090], // A
            [530, 1840], // E
            [270, 2290], // I
            [570, 840],  // O
            [300, 870]   // U
        ];

        // --- ENGINE ---
        this.osc = ctx.createOscillator();
        this.osc.type = "sawtooth";
        
        this.f1 = ctx.createBiquadFilter();
        this.f1.type = "bandpass";
        this.f1.Q.value = 12;

        this.f2 = ctx.createBiquadFilter();
        this.f2.type = "bandpass";
        this.f2.Q.value = 12;

        this.amp = ctx.createGain();
        this.amp.gain.value = 0;

        // Routing
        this.osc.connect(this.f1);
        this.osc.connect(this.f2);
        this.f1.connect(this.amp);
        this.f2.connect(this.amp);
        this.amp.connect(this.output);

        this.osc.start();

        // Controls
        this.randomRange = 12; // Max semitones to jump
    }

    // --- TRIGGERED BY PIANO ROLL ---
    trigger(time, freq, vel) {
        // 1. SAMPLE AND HOLD: PITCH
        // Take the base frequency and add a random semitone offset
        const semitoneShift = Math.floor(Math.random() * this.randomRange);
        const randomFreq = freq * Math.pow(2, semitoneShift / 12);
        this.osc.frequency.setValueAtTime(randomFreq, time);

        // 2. SAMPLE AND HOLD: VOWEL
        // Pick a random vowel from the table
        const vowelIdx = Math.floor(Math.random() * this.vowelTable.length);
        const [targetF1, targetF2] = this.vowelTable[vowelIdx];
        
        this.f1.frequency.setTargetAtTime(targetF1, time, 0.01);
        this.f2.frequency.setTargetAtTime(targetF2, time, 0.01);

        // 3. ENVELOPE (The "Robot Click")
        this.amp.gain.cancelScheduledValues(time);
        this.amp.gain.setValueAtTime(0, time);
        this.amp.gain.linearRampToValueAtTime(vel, time + 0.005);
        this.amp.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    }

    renderUI(container, onRemove) {
        container.innerHTML = `
            <div style="padding:10px; background:#0b1118; border:1px solid #9b59b6; color:#9b59b6; font-family:monospace; font-size:9px;">
                <div style="text-align:center; border-bottom:1px solid #9b59b6; margin-bottom:8px;">V2K_SH_CHAOS</div>
                
                <label>RANDOM PITCH RANGE</label>
                <input type="range" id="range" min="0" max="24" value="${this.randomRange}" style="width:100%">
                
                <label style="margin-top:8px; display:block;">FORMANT Q</label>
                <input type="range" id="q" min="5" max="40" value="${this.f1.Q.value}" style="width:100%">

                <button id="close" style="width:100%; margin-top:10px; background:#111; color:#9b59b6; border:1px solid #9b59b6; cursor:pointer;">PURGE</button>
            </div>
        `;

        container.querySelector('#range').oninput = (e) => { this.randomRange = parseInt(e.target.value); };
        container.querySelector('#q').oninput = (e) => { 
            this.f1.Q.value = e.target.value; 
            this.f2.Q.value = e.target.value; 
        };
        container.querySelector('#close').onclick = () => { this.cleanup(); onRemove(); };
    }

    cleanup() {
        this.osc.stop();
        this.output.disconnect();
    }
}