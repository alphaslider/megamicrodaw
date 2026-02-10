/**
 * MICRO_DAW // FX_MODULE: ULTRA_METER v2.0 (NODE-INJECTION)
 * STRATEGY: Listens to the injected 'targetNode' (The Host Fader)
 * if available, giving true Post-Fader / Post-FX RMS readings.
 */

export default class UltraMeter {
    // 1. Accept the injected 'targetNode' (The Fader)
    constructor(ctx, targetNode) {
        this.ctx = ctx;
        this.name = "POST_FADER_VU";
        
        // Standard Pass-Through (So audio flows through the plugin slot)
        this.input = ctx.createGain();
        this.output = ctx.createGain();
        this.input.connect(this.output); 

        // 2. The Meter Brain
        this.analyser = ctx.createAnalyser();
        this.analyser.fftSize = 256;
        
        // 3. THE SMART ROUTING
        if (targetNode) {
            // If the Host gave us the Fader, listen to THAT.
            // This captures the signal AFTER the FX chain and AFTER the Volume Slider.
            targetNode.connect(this.analyser);
        } else {
            // Fallback for safety: listen to plugin input
            this.input.connect(this.analyser);
        }
        
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.ani = null;
    }

    renderUI(container, onPurge) {
        container.style.cssText = "padding:10px; background:#000; border:1px solid #444; margin-bottom:5px;";
        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; font-size:9px; margin-bottom:5px;">
                <span style="color:#70a1ff;">${this.name}</span>
                <span style="color:red; cursor:pointer;" id="purge-btn"> [X] </span>
            </div>
            <div style="height:12px; background:#111; border:1px solid #333; position:relative;">
                <div id="meter-bar" style="height:100%; width:0%; background:linear-gradient(90deg, #2ecc71 60%, #f1c40f 80%, #ff4757 100%); transition: width 0.05s ease-out;"></div>
            </div>
        `;

        const bar = container.querySelector('#meter-bar');

        const draw = () => {
            if (this.ctx.state === 'running') {
                this.analyser.getByteTimeDomainData(this.dataArray);
                
                // Calculate RMS (Root Mean Square) for "Physics-Accurate" weight
                let sum = 0;
                for (let i = 0; i < this.dataArray.length; i++) {
                    const sample = (this.dataArray[i] - 128) / 128;
                    sum += sample * sample;
                }
                const rms = Math.sqrt(sum / this.dataArray.length);
                
                // Scale for visual flair (RMS is usually quiet, so we boost x2.5)
                const level = Math.min(100, rms * 100 * 2.5);
                
                bar.style.width = level + "%";
            }
            this.ani = requestAnimationFrame(draw);
        };

        draw();

        container.querySelector('#purge-btn').onclick = () => {
            cancelAnimationFrame(this.ani);
            // DISCONNECT SAFETY:
            // Since we connected the Host Fader to our Analyser, 
            // we should technically disconnect it to be polite to the graph.
            try { this.analyser.disconnect(); } catch(e) {}
            onPurge();
        };
    }
}