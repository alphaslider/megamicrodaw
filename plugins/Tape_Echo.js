export default class TapeEcho {
    constructor(ctx) {
        this.ctx = ctx;
        this.input = ctx.createGain();
        this.output = ctx.createGain();

        // STATE TRACKING
        this.timeVal = 0.3;
        this.feedbackVal = 0.4;
        this.satVal = 2.0;
        this.mixVal = 0.5;

        // 1. DELAY ENGINE (With a larger buffer for deep glides)
        this.delayNode = ctx.createDelay(4.0);
        this.delayNode.delayTime.value = this.timeVal;

        // 2. FEEDBACK & SATURATION
        this.feedback = ctx.createGain();
        this.feedback.gain.value = this.feedbackVal;
        
        this.saturator = ctx.createWaveShaper();
        this.updateSaturation(this.satVal);

        this.filter = ctx.createBiquadFilter();
        this.filter.type = "lowpass";
        this.filter.frequency.value = 3000;

        // 3. WOW/FLUTTER
        this.wowLFO = ctx.createOscillator();
        this.wowLFO.frequency.value = 0.8; 
        this.wowGain = ctx.createGain();
        this.wowGain.gain.value = 0.001; 
        
        this.wowLFO.connect(this.wowGain);
        this.wowGain.connect(this.delayNode.delayTime);
        this.wowLFO.start();

        // ROUTING
        this.input.connect(this.delayNode);
        this.delayNode.connect(this.saturator);
        this.saturator.connect(this.filter);
        this.filter.connect(this.feedback);
        this.feedback.connect(this.delayNode); 
        
        // MIX BUS
        this.dryGain = ctx.createGain();
        this.wetGain = ctx.createGain();
        
        this.input.connect(this.dryGain);
        this.filter.connect(this.wetGain); // Output of the delay loop
        
        this.dryGain.connect(this.output);
        this.wetGain.connect(this.output);

        this.updateMix(this.mixVal);
    }

    // --- 1. STATE SAVER ---
    getState() {
        return {
            time: this.timeVal,
            feedback: this.feedbackVal,
            saturation: this.satVal,
            mix: this.mixVal
        };
    }

    // --- 2. STATE LOADER ---
    setState(data) {
        if (data.time !== undefined) {
            this.timeVal = data.time;
            // Snap instantly on load (no glide)
            this.delayNode.delayTime.value = this.timeVal;
        }
        if (data.feedback !== undefined) {
            this.feedbackVal = data.feedback;
            this.feedback.gain.value = this.feedbackVal;
        }
        if (data.saturation !== undefined) {
            this.updateSaturation(data.saturation);
        }
        if (data.mix !== undefined) {
            this.updateMix(data.mix);
        }
    }

    updateSaturation(amount) {
        this.satVal = amount;
        const n = 44100;
        const curve = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            let x = (i * 2) / n - 1;
            curve[i] = Math.tanh(x * amount);
        }
        this.saturator.curve = curve;
    }

    updateMix(val) {
        this.mixVal = val;
        // Equal power crossfade
        this.dryGain.gain.value = Math.cos(val * 0.5 * Math.PI);
        this.wetGain.gain.value = Math.sin(val * 0.5 * Math.PI);
    }

    cleanup() {
        this.wowLFO.stop();
        this.input.disconnect();
        this.output.disconnect();
    }

    renderUI(container, onRemove) {
        container.innerHTML = `
            <div style="padding:10px; background:#2f3542; color:#70a1ff; font-family:monospace; font-size:9px; border:1px solid #1e90ff; border-radius:4px;">
                <div style="margin-bottom:8px; color:#fff; border-bottom:1px solid #1e90ff; padding-bottom:3px; font-weight:bold;">MFX_TAPE_ECHO_SMOOTH</div>
                
                <label>TIME (ANALOG GLIDE)</label>
                <input type="range" id="time" min="0.01" max="2.0" step="0.001" value="${this.timeVal}" style="width:100%">
                
                <label style="margin-top:8px; display:block;">FEEDBACK</label>
                <input type="range" id="fback" min="0" max="0.98" step="0.01" value="${this.feedbackVal}" style="width:100%">

                <label style="margin-top:8px; display:block;">WARMTH</label>
                <input type="range" id="sat" min="1" max="15" step="0.5" value="${this.satVal}" style="width:100%">

                <label style="margin-top:8px; display:block;">MIX</label>
                <input type="range" id="mix" min="0" max="1" step="0.01" value="${this.mixVal}" style="width:100%">

                <button id="close" style="margin-top:12px; width:100%; background:#1e90ff; color:#fff; border:none; padding:4px; cursor:pointer; font-weight:bold; border-radius:2px;">PURGE</button>
            </div>
        `;

        container.querySelector('#time').oninput = (e) => { 
            this.timeVal = parseFloat(e.target.value);
            // Musical "Swoosh" glide when moving slider
            this.delayNode.delayTime.setTargetAtTime(this.timeVal, this.ctx.currentTime, 0.1); 
        };
        
        container.querySelector('#fback').oninput = (e) => { 
            this.feedbackVal = parseFloat(e.target.value);
            this.feedback.gain.value = this.feedbackVal; 
        };

        container.querySelector('#sat').oninput = (e) => { 
            this.updateSaturation(parseFloat(e.target.value)); 
        };

        container.querySelector('#mix').oninput = (e) => {
            this.updateMix(parseFloat(e.target.value));
        };
        
        container.querySelector('#close').onclick = () => {
            this.cleanup();
            onRemove();
        };
    }
}