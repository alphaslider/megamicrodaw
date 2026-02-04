/**
 * MICRO_DAW // FX_MODULE: SPATIAL_REVERB_v1.1
 * FIX: Resolved initialization silence and buffer assignment race condition.
 */

export default class MicroReverb {
    constructor(ctx) {
        this.ctx = ctx;
        this.name = "REVERB_v1.1";
        
        // NODES
        this.input = ctx.createGain();
        this.convolver = ctx.createConvolver();
        this.dryGain = ctx.createGain();
        this.wetGain = ctx.createGain();
        this.output = ctx.createGain();

        // ROUTING
        this.input.connect(this.dryGain);
        this.input.connect(this.convolver);
        this.convolver.connect(this.wetGain);
        
        this.dryGain.connect(this.output);
        this.wetGain.connect(this.output);

        // INITIAL STATE
        this.params = { roomSize: 1.5, mix: 0.3 };
        
        // Safety: Set gains to a base level immediately before scheduling
        this.dryGain.gain.value = 0.7;
        this.wetGain.gain.value = 0.3;

        this.generateIR();
        this.updateMix();
    }

    generateIR() {
        // Ensure sampleRate is valid
        const sr = this.ctx.sampleRate || 44100;
        const length = Math.max(1, sr * this.params.roomSize);
        const impulse = this.ctx.createBuffer(2, length, sr);
        
        for (let channel = 0; channel < 2; channel++) {
            const data = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                // Modified decay for smoother tail
                const pct = i / length;
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - pct, 2);
            }
        }
        // Assigning the buffer after connections are made is now safe
        this.convolver.buffer = impulse;
    }

    updateMix() {
        const now = this.ctx.currentTime;
        // Use exponentialRamp for cleaner response if target is > 0
        this.wetGain.gain.setTargetAtTime(this.params.mix, now, 0.03);
        this.dryGain.gain.setTargetAtTime(1 - this.params.mix, now, 0.03);
    }

    renderUI(container, onPurge) {
        container.style.padding = "10px";
        container.style.background = "#1a1a1a";
        container.style.border = "1px solid #333";

        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; font-size:9px; margin-bottom:8px; color:#70a1ff;">
                <span>${this.name}</span>
                <span style="color:#ff4757; cursor:pointer; font-weight:bold;" id="purge-btn"> [X] </span>
            </div>
            <div style="font-size:8px; margin-top:5px;">SIZE: <span id="val-room">${this.params.roomSize}</span></div>
            <input type="range" min="0.1" max="5" step="0.1" value="${this.params.roomSize}" id="room-slider" style="width:100%; margin-bottom:8px;">
            <div style="font-size:8px;">MIX: <span id="val-mix">${Math.round(this.params.mix * 100)}%</span></div>
            <input type="range" min="0" max="1" step="0.01" value="${this.params.mix}" id="mix-slider" style="width:100%">
        `;

        container.querySelector('#room-slider').oninput = (e) => {
            this.params.roomSize = parseFloat(e.target.value);
            container.querySelector('#val-room').innerText = this.params.roomSize;
            this.generateIR();
        };
        container.querySelector('#mix-slider').oninput = (e) => {
            this.params.mix = parseFloat(e.target.value);
            container.querySelector('#val-mix').innerText = Math.round(this.params.mix * 100) + "%";
            this.updateMix();
        };
        container.querySelector('#purge-btn').onclick = onPurge;
    }
}
