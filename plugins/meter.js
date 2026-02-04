/**
 * MICRO_DAW // FX_MODULE: ULTRA_METER v1.2
 * STRATEGY: Zero-latency parallel tap. Signal cannot be muted.
 */

export default class UltraMeter {
    constructor(ctx) {
        this.ctx = ctx;
        this.name = "VU_METER";

        // Main Signal Path (The "Wire")
        this.input = ctx.createGain();
        this.output = ctx.createGain();
        
        // The Tap (The "Sensor")
        this.analyser = ctx.createAnalyser();
        this.analyser.fftSize = 128; // Smaller for speed
        
        // ROUTING: Direct wire from input to output so audio NEVER stops.
        this.input.connect(this.output);
        
        // Branch off to the analyser
        this.input.connect(this.analyser);

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
            <div style="height:15px; background:#111; border:1px solid #333; position:relative; overflow:hidden;">
                <div id="meter-bar" style="height:100%; width:0%; background:linear-gradient(90deg, #2ecc71, #f1c40f, #ff4757); transition: width 0.05s linear;"></div>
            </div>
        `;

        const bar = container.querySelector('#meter-bar');

        const update = () => {
            if (this.ctx.state === 'running') {
                this.analyser.getByteFrequencyData(this.dataArray);
                
                // Get peak value
                let max = 0;
                for(let i=0; i<this.dataArray.length; i++) {
                    if(this.dataArray[i] > max) max = this.dataArray[i];
                }

                // Convert to percentage
                const val = (max / 255) * 100;
                bar.style.width = val + "%";
                
                // Add "Over" light if clipping
                bar.style.filter = val > 95 ? "brightness(1.5)" : "none";
            }
            this.ani = requestAnimationFrame(update);
        };

        update();

        container.querySelector('#purge-btn').onclick = () => {
            cancelAnimationFrame(this.ani);
            onPurge();
        };
    }
}