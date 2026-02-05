export default class RichChorus {
    constructor(ctx) {
        this.ctx = ctx;
        this.input = ctx.createGain();
        this.output = ctx.createGain();

        // 1. STEREO SPLIT
        this.splitter = ctx.createChannelSplitter(2);
        this.merger = ctx.createChannelMerger(2);

        // 2. DELAY LINES (Left and Right)
        this.delayL = ctx.createDelay(0.1);
        this.delayR = ctx.createDelay(0.1);
        this.delayL.delayTime.value = 0.02;
        this.delayR.delayTime.value = 0.02;

        // 3. DUAL LFOs (Offset by 90 degrees for "Rich" width)
        this.lfo = ctx.createOscillator();
        this.lfo.type = 'sine';
        this.lfo.frequency.value = 1.5; // Rate

        this.depthL = ctx.createGain();
        this.depthR = ctx.createGain();
        this.depthL.gain.value = 0.002; // Depth
        this.depthR.gain.value = -0.002; // Inverted for stereo spread

        this.lfo.connect(this.depthL);
        this.lfo.connect(this.depthR);
        this.depthL.connect(this.delayL.delayTime);
        this.depthR.connect(this.delayR.delayTime);
        this.lfo.start();

        // 4. MIX BUS
        this.dryGain = ctx.createGain();
        this.wetGain = ctx.createGain();

        // ROUTING
        this.input.connect(this.dryGain);
        this.input.connect(this.delayL);
        this.input.connect(this.delayR);
        
        this.delayL.connect(this.merger, 0, 0);
        this.delayR.connect(this.merger, 0, 1);
        this.merger.connect(this.wetGain);

        this.dryGain.connect(this.output);
        this.wetGain.connect(this.output);

        this.updateMix(0.5);
    }

    updateMix(val) {
        // Equal power crossfade
        this.dryGain.gain.setTargetAtTime(Math.cos(val * 0.5 * Math.PI), this.ctx.currentTime, 0.02);
        this.wetGain.gain.setTargetAtTime(Math.sin(val * 0.5 * Math.PI), this.ctx.currentTime, 0.02);
    }

    cleanup() {
        this.lfo.stop();
        this.input.disconnect();
        this.output.disconnect();
    }

    renderUI(container, onRemove) {
        container.innerHTML = `
            <div style="padding:10px; background:#4834d4; color:#dff9fb; font-family:monospace; font-size:9px; border:1px solid #7ed6df;">
                <div style="margin-bottom:8px; color:#fff; border-bottom:1px solid #7ed6df; padding-bottom:3px; font-weight:bold;">MFX_RICH_CHORUS</div>
                
                <label>RATE (SPEED)</label>
                <input type="range" id="rate" min="0.1" max="8" step="0.01" value="1.5" style="width:100%">
                
                <label style="margin-top:8px; display:block;">DEPTH (WIDTH)</label>
                <input type="range" id="depth" min="0" max="0.01" step="0.0001" value="0.002" style="width:100%">

                <label style="margin-top:8px; display:block;">MIX (DRY -> WET)</label>
                <input type="range" id="mix" min="0" max="1" step="0.01" value="0.5" style="width:100%">

                <button id="close" style="margin-top:12px; width:100%; background:#686de0; color:#fff; border:none; padding:4px; cursor:pointer;">PURGE</button>
            </div>
        `;

        container.querySelector('#rate').oninput = (e) => { this.lfo.frequency.value = e.target.value; };
        container.querySelector('#depth').oninput = (e) => { 
            this.depthL.gain.value = e.target.value; 
            this.depthR.gain.value = -e.target.value; 
        };
        container.querySelector('#mix').oninput = (e) => { this.updateMix(parseFloat(e.target.value)); };
        
        container.querySelector('#close').onclick = () => {
            this.cleanup();
            onRemove();
        };
    }
}