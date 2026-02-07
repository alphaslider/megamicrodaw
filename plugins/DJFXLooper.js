export default class DjfxLooper {
    constructor(ctx) {
        this.ctx = ctx;
        this.input = ctx.createGain();
        this.output = ctx.createGain();

        // 1. BUFFER SETUP (2 seconds of "memory")
        this.bufferSize = ctx.sampleRate * 2;
        this.ringBuffer = ctx.createBuffer(2, this.bufferSize, ctx.sampleRate);
        
        // 2. THE PROCESSOR
        // Note: scriptProcessor is deprecated but fine for this specific "glitch" aesthetic
        this.scriptNode = ctx.createScriptProcessor(4096, 2, 2);
        
        this.writePos = 0;
        this.looping = false;
        this.loopPos = 0;
        this.loopStart = 0; // Added explicit tracking

        // STATE TRACKING
        this.loopLen = 4096;
        this.playbackRate = 1.0;

        this.scriptNode.onaudioprocess = (e) => {
            const inL = e.inputBuffer.getChannelData(0);
            const inR = e.inputBuffer.getChannelData(1);
            const outL = e.outputBuffer.getChannelData(0);
            const outR = e.outputBuffer.getChannelData(1);
            const bufL = this.ringBuffer.getChannelData(0);
            const bufR = this.ringBuffer.getChannelData(1);

            for (let i = 0; i < e.inputBuffer.length; i++) {
                // Always write to the ring buffer (record what's happening)
                bufL[this.writePos] = inL[i];
                bufR[this.writePos] = inR[i];

                if (this.looping) {
                    // Play back from the "frozen" spot
                    // We use modulo to wrap around the buffer safely
                    const readIdx = Math.floor(this.loopPos) % this.bufferSize;
                    outL[i] = bufL[readIdx];
                    outR[i] = bufR[readIdx];
                    
                    this.loopPos += this.playbackRate;
                    
                    // Loop wrapping logic
                    if (this.loopPos > this.loopStart + this.loopLen) {
                        this.loopPos = this.loopStart;
                    }
                } else {
                    // Pass-through (Listen mode)
                    outL[i] = inL[i];
                    outR[i] = inR[i];
                }
                
                // Advance write head
                this.writePos = (this.writePos + 1) % this.bufferSize;
            }
        };

        this.input.connect(this.scriptNode);
        this.scriptNode.connect(this.output);
    }

    // --- 1. STATE SAVER ---
    getState() {
        return {
            speed: this.playbackRate,
            length: this.loopLen
        };
    }

    // --- 2. STATE LOADER ---
    setState(data) {
        if (data.speed !== undefined) this.playbackRate = data.speed;
        if (data.length !== undefined) this.loopLen = data.length;
    }

    toggleLoop(active) {
        if (active) {
            // Snap the loop start to "Now" minus "Length" (grab the past)
            // Ensure positive modulo result
            this.loopStart = (this.writePos - this.loopLen + this.bufferSize) % this.bufferSize;
            this.loopPos = this.loopStart;
            this.looping = true;
        } else {
            this.looping = false;
        }
    }

    cleanup() {
        this.scriptNode.disconnect();
        this.scriptNode.onaudioprocess = null;
        this.input.disconnect();
        this.output.disconnect();
    }

    renderUI(container, onRemove) {
        container.innerHTML = `
            <div style="padding:10px; background:#4b4b4b; color:#ffdd59; font-family:monospace; font-size:9px; border:1px solid #ffd32a; border-radius:4px;">
                <div style="margin-bottom:8px; color:#fff; border-bottom:1px solid #ffd32a; padding-bottom:3px; font-weight:bold;">MFX_DJFX_LOOPER</div>
                
                <button id="freeze" style="width:100%; background:#ffd32a; border:none; padding:8px; font-weight:bold; cursor:pointer; border-radius:3px; color:#000;">FREEZE (STUTTER)</button>
                
                <label style="margin-top:8px; display:block;">SPEED / PITCH</label>
                <input type="range" id="speed" min="0.2" max="2.0" step="0.01" value="${this.playbackRate}" style="width:100%">
                
                <label style="margin-top:8px; display:block;">LOOP LENGTH</label>
                <input type="range" id="len" min="500" max="20000" step="100" value="${this.loopLen}" style="width:100%">

                <button id="close" style="margin-top:12px; width:100%; background:#3d3d3d; color:#aaa; border:none; padding:4px; cursor:pointer; border-radius:2px;">PURGE</button>
            </div>
        `;

        const freezeBtn = container.querySelector('#freeze');
        
        // Momentary Switch Logic
        freezeBtn.onmousedown = () => {
            this.toggleLoop(true);
            freezeBtn.style.background = "#ff5e57";
            freezeBtn.innerText = "LOOPING...";
        };
        
        // Handle mouseup and mouseleave to prevent getting stuck if you drag off button
        const release = () => {
            this.toggleLoop(false);
            freezeBtn.style.background = "#ffd32a";
            freezeBtn.innerText = "FREEZE (STUTTER)";
        };
        freezeBtn.onmouseup = release;
        freezeBtn.onmouseleave = release;

        container.querySelector('#speed').oninput = (e) => { this.playbackRate = parseFloat(e.target.value); };
        container.querySelector('#len').oninput = (e) => { this.loopLen = parseInt(e.target.value); };
        
        container.querySelector('#close').onclick = () => {
            this.cleanup();
            onRemove();
        };
    }
}