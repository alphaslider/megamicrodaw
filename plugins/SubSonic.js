export default class SubSonic {
    constructor(ctx) {
        this.ctx = ctx;
        this.input = ctx.createGain();
        this.output = ctx.createGain();

        // 1. DETECTION PATH (Finding the "Thump")
        this.analyzer = ctx.createBiquadFilter();
        this.analyzer.type = "lowpass";
        this.analyzer.frequency.value = 100;

        // 2. SUB OSCILLATOR (The Deep End)
        this.subOsc = ctx.createOscillator();
        this.subOsc.type = "sine";
        this.subOsc.frequency.value = 55; // Default 55Hz (Low A)
        
        this.subGain = ctx.createGain();
        this.subGain.gain.value = 0; // Controlled by input volume

        // 3. ENVELOPE FOLLOWER (Making the sub "track" the drums)
        // We use a ScriptProcessor to link the drum volume to the sub volume
        this.processor = ctx.createScriptProcessor(2048, 1, 1);
        this.processor.onaudioprocess = (e) => {
            const input = e.inputBuffer.getChannelData(0);
            let max = 0;
            for (let i = 0; i < input.length; i++) {
                if (Math.abs(input[i]) > max) max = Math.abs(input[i]);
            }
            // Smoothly move the sub gain to match the kick volume
            this.subGain.gain.setTargetAtTime(max * this.intensity, this.ctx.currentTime, 0.05);
        };

        this.intensity = 0; // The "Amount" slider

        // ROUTING
        this.subOsc.connect(this.subGain);
        this.input.connect(this.analyzer);
        this.analyzer.connect(this.processor);
        this.processor.connect(this.ctx.destination); // Hidden "ear" for tracking
        
        this.subGain.connect(this.output);
        this.input.connect(this.output); // Dry signal pass-through

        this.subOsc.start();
    }

    cleanup() {
        this.subOsc.stop();
        this.input.disconnect();
        this.output.disconnect();
    }

    renderUI(container, onRemove) {
        container.innerHTML = `
            <div style="padding:10px; background:#1e272e; color:#05c46b; font-family:monospace; font-size:9px; border:1px solid #05c46b;">
                <div style="margin-bottom:8px; color:#fff; border-bottom:1px solid #05c46b; padding-bottom:3px; font-weight:bold;">MFX_SUBSONIC</div>
                
                <label>SUB INTENSITY (THE THUMP)</label>
                <input type="range" id="intensity" min="0" max="2" step="0.01" value="0" style="width:100%">
                
                <label style="margin-top:8px; display:block;">PITCH (TONE)</label>
                <input type="range" id="pitch" min="30" max="80" step="1" value="55" style="width:100%">

                <button id="close" style="margin-top:12px; width:100%; background:#05c46b; color:#1e272e; border:none; padding:4px; cursor:pointer; font-weight:bold;">PURGE</button>
            </div>
        `;

        container.querySelector('#intensity').oninput = (e) => { this.intensity = parseFloat(e.target.value); };
        container.querySelector('#pitch').oninput = (e) => { 
            this.subOsc.frequency.setTargetAtTime(e.target.value, this.ctx.currentTime, 0.1); 
        };
        
        container.querySelector('#close').onclick = () => {
            this.cleanup();
            onRemove();
        };
    }
}