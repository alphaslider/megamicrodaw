export default class SpV2KTalker {
    constructor(ctx) {
        this.ctx = ctx;
        this.input = ctx.createGain();
        this.output = ctx.createGain();

        // --- VOWEL MAP (F1, F2 Frequencies) ---
        this.vowels = {
            'A': [730, 1090],
            'E': [530, 1840],
            'I': [270, 2290],
            'O': [570, 840],
            'U': [300, 870]
        };

        // --- AUDIO SOURCE ---
        // Sawtooth is best for speech because it's buzzy like vocal cords
        this.osc = ctx.createOscillator();
        this.osc.type = "sawtooth";
        
        // Two Parallel Bandpass Filters (The "Throat" and "Mouth")
        this.f1 = ctx.createBiquadFilter();
        this.f1.type = "bandpass";
        this.f1.Q.value = 10;

        this.f2 = ctx.createBiquadFilter();
        this.f2.type = "bandpass";
        this.f2.Q.value = 10;

        this.amp = ctx.createGain();
        this.amp.gain.value = 0;

        // Routing
        this.osc.connect(this.f1);
        this.osc.connect(this.f2);
        this.f1.connect(this.amp);
        this.f2.connect(this.amp);
        this.amp.connect(this.output);

        this.osc.start();
    }

    // --- TRIGGERED BY PIANO ROLL ---
    trigger(time, freq, vel) {
        // Map MIDI Note to a Vowel
        // We take the note value (0-11) and pick a vowel
        const note = Math.round(12 * Math.log2(freq / 440) + 69) % 12;
        
        let targetVowel = 'A';
        if (note <= 2) targetVowel = 'A';      // C, C#
        else if (note <= 4) targetVowel = 'E'; // D, D#
        else if (note <= 7) targetVowel = 'I'; // E, F, F#
        else if (note <= 9) targetVowel = 'O'; // G, G#
        else targetVowel = 'U';                // A, A#, B

        const [vF1, vF2] = this.vowels[targetVowel];

        // Apply Pitch
        this.osc.frequency.setValueAtTime(freq, time);

        // Apply Formants (Talking Effect)
        this.f1.frequency.setTargetAtTime(vF1, time, 0.02);
        this.f2.frequency.setTargetAtTime(vF2, time, 0.02);

        // Envelope
        this.amp.gain.cancelScheduledValues(time);
        this.amp.gain.setValueAtTime(0, time);
        this.amp.gain.linearRampToValueAtTime(vel, time + 0.01);
        this.amp.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
    }

    renderUI(container, onRemove) {
        container.innerHTML = `
            <div style="padding:10px; background:#050a10; border:1px solid #00d2d3; color:#00d2d3; font-family:monospace; font-size:9px;">
                <div style="text-align:center; border-bottom:1px solid #00d2d3; margin-bottom:8px;">V2K_VOWEL_MORPH</div>
                <div style="font-size:8px; color:#5f7d8c; margin-bottom:10px;">
                    C=A | D=E | F=I | G=O | B=U
                </div>
                <label>RESONANCE (Q)</label>
                <input type="range" id="q-fac" min="1" max="50" value="${this.f1.Q.value}" style="width:100%">
                <button id="close" style="width:100%; margin-top:10px; background:#111; color:#00d2d3; border:1px solid #00d2d3; cursor:pointer;">PURGE</button>
            </div>
        `;

        container.querySelector('#q-fac').oninput = (e) => {
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