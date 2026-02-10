export default class SpGrossGlitch {
    constructor(ctx) {
        this.ctx = ctx;
        this.input = ctx.createGain();
        this.output = ctx.createGain();
        this.active = true;

        // --- BUFFER ENGINE ---
        this.bufferLen = ctx.sampleRate * 4; 
        this.bufferL = new Float32Array(this.bufferLen);
        this.bufferR = new Float32Array(this.bufferLen);
        this.writePos = 0;
        
        this.mode = 0; 
        this.freezePos = 0; 
        
        // --- PRECISE TIMING STATE ---
        this.phase = 0; // For generating scratch curves
        
        this.script = ctx.createScriptProcessor(512, 2, 2);
        this.input.connect(this.script);
        this.script.connect(this.output);
        this.script.onaudioprocess = (e) => this.process(e);

        // --- PATTERNS ---
        this.patterns = [
            { name: "CLEAN", color: "#2ecc71" },    
            { name: "REPEAT 1/2", color: "#00d2d3" },   
            { name: "REPEAT 1/4", color: "#00d2d3" },   
            { name: "REPEAT 1/8", color: "#00d2d3" },   
            { name: "REPEAT 1/16", color: "#00d2d3" },  
            { name: "REVERSE", color: "#e67e22" },  
            { name: "REV LOOP", color: "#e67e22" },  
            { name: "SLOW DOWN", color: "#ff9f43" },  
            { name: "TAPE STOP", color: "#ff9f43" }, 
            { name: "BACKSPIN", color: "#ff4757" }, // NEW SCRATCH ALGO
            { name: "TRANCE GT", color: "#54a0ff" },     
            { name: "SHUFFLE", color: "#ff4757" }     
        ];
        
        this.miniLabel = null;
        this.winX = 100; this.winY = 100;
    }

    // --- LINEAR INTERPOLATION (QUALITY) ---
    getSample(buffer, pos) {
        const p1 = Math.floor(pos);
        const p2 = (p1 + 1) % this.bufferLen;
        const frac = pos - p1;
        const s1 = buffer[p1];
        const s2 = buffer[p2];
        return s1 + frac * (s2 - s1);
    }

    process(e) {
        const inL = e.inputBuffer.getChannelData(0);
        const inR = e.inputBuffer.getChannelData(1);
        const outL = e.outputBuffer.getChannelData(0);
        const outR = e.outputBuffer.getChannelData(1);
        const len = inL.length;
        
        // 120 BPM Assumption (0.5s per beat)
        // For production, you'd want to fetch engine.bpm if available
        const beatLen = this.ctx.sampleRate * 0.5; 

        for (let i = 0; i < len; i++) {
            // Write to circular buffer
            this.bufferL[this.writePos] = inL[i];
            this.bufferR[this.writePos] = inR[i];

            let playIdx = this.writePos;
            const delta = this.writePos - this.freezePos; 
            const safeDelta = delta < 0 ? delta + this.bufferLen : delta;
            
            // Envelope for gating
            let vol = 1.0; 

            switch(this.mode) {
                case 0: // CLEAN
                    playIdx = this.writePos; 
                    break;

                // --- STUTTERS ---
                case 1: // 1/2
                    playIdx = this.freezePos + (safeDelta % (beatLen)); 
                    break;
                case 2: // 1/4
                    playIdx = this.freezePos + (safeDelta % (beatLen/2)); 
                    break;
                case 3: // 1/8
                    playIdx = this.freezePos + (safeDelta % (beatLen/4)); 
                    break;
                case 4: // 1/16
                    playIdx = this.freezePos + (safeDelta % (beatLen/8)); 
                    break;

                // --- REVERSE ---
                case 5: // PURE REVERSE (1 Bar Back)
                    // We go backwards from the freeze point
                    playIdx = this.freezePos - safeDelta; 
                    break;
                case 6: // REVERSE LOOP (1 Beat)
                     // Sawtooth wave that goes 0 -> 1 -> 0
                    const cycle = safeDelta % beatLen;
                    playIdx = this.freezePos + (beatLen - cycle); // Inverted time
                    break;

                // --- PITCH / TIME ---
                case 7: // SLOW DOWN (Half Speed)
                    playIdx = this.freezePos + (safeDelta * 0.5); 
                    break;
                case 8: // TAPE STOP
                    // Quadratic curve for "Power Down" sound
                    const t = safeDelta / (beatLen * 2); // 2 beats to stop
                    if(t < 1) {
                        playIdx = this.freezePos + (safeDelta - (0.5 * safeDelta * t));
                    } else {
                        vol = 0; // Fully stopped
                        playIdx = this.writePos;
                    }
                    break;

                // --- SCRATCH (NEW) ---
                case 9: // BACKSPIN
                    // Play backwards at 2x speed for 1/4 beat, then reset
                    const scratchLen = beatLen / 2;
                    const scratchPos = safeDelta % scratchLen;
                    // The "-2" is the speed multiplier. Negative = Reverse.
                    playIdx = this.freezePos - (scratchPos * 1.5);
                    break;

                // --- GATING ---
                case 10: // TRANCE GATE
                    const step = Math.floor(safeDelta / (beatLen/8));
                    if(step % 2 !== 0) vol = 0; // Mute every other 1/16th
                    playIdx = this.writePos; 
                    break;

                case 11: // SHUFFLE / JUMP
                     // Jump back 1/8th note every 1/4 note
                    const jumpLen = beatLen / 2;
                    const offset = (safeDelta % jumpLen) > (jumpLen/2) ? (jumpLen/2) : 0;
                    playIdx = this.writePos - offset;
                    break;
            }

            // Wrap Read Head
            while (playIdx < 0) playIdx += this.bufferLen;
            while (playIdx >= this.bufferLen) playIdx -= this.bufferLen;

            // Render with Interpolation (Better Quality)
            outL[i] = this.getSample(this.bufferL, playIdx) * vol;
            outR[i] = this.getSample(this.bufferR, playIdx) * vol;

            this.writePos++;
            if(this.writePos >= this.bufferLen) this.writePos = 0;
        }
    }

    setMode(m) {
        if (this.mode === m) return;
        this.mode = m;
        // Reset freeze position to "Now" whenever we click a button
        if (m !== 0) {
            this.freezePos = this.writePos;
            this.phase = 0;
        }
        this.updateVisuals();
    }

    // --- UI HELPERS (Same as before) ---
    updateVisuals() {
        const p = this.patterns[this.mode];
        if(this.miniLabel) {
            this.miniLabel.innerText = p.name;
            this.miniLabel.style.color = p.color;
            this.miniLabel.style.borderColor = p.color;
        }
        const win = document.getElementById('glitch-window');
        if (win) {
            this.patterns.forEach((pp, k) => {
                const btn = win.querySelector(`#p-btn-${k}`);
                if (btn) {
                    if(k === this.mode) {
                        btn.style.background = pp.color;
                        btn.style.color = '#000';
                        btn.style.borderColor = '#fff';
                        btn.style.boxShadow = `0 0 15px ${pp.color}`;
                    } else {
                        btn.style.background = '#151b24';
                        btn.style.color = '#5f7d8c';
                        btn.style.borderColor = '#333';
                        btn.style.boxShadow = 'none';
                    }
                }
            });
        }
    }

    renderUI(container, onRemove) {
        container.innerHTML = `
            <div style="padding:5px; background:#0b1118; border:1px solid #1f2a36; border-radius:4px; font-family:'Courier New', monospace; text-align:center;">
                <div style="font-size:9px; color:#5f7d8c; margin-bottom:4px;">GROSS_GLITCH</div>
                <div id="mini-label" style="background:#000; color:${this.patterns[this.mode].color}; border:1px solid ${this.patterns[this.mode].color}; font-size:10px; padding:4px; margin-bottom:5px; font-weight:bold;">${this.patterns[this.mode].name}</div>
                <div style="display:flex; gap:2px;">
                    <button id="open-gui" style="flex:1; font-size:9px; padding:3px; background:#151b24; color:#fff; border:1px solid #333; cursor:pointer;">OPEN GUI</button>
                    <button id="del-btn" style="width:20px; font-size:9px; padding:3px; background:#2c0b0e; color:#ff4757; border:1px solid #ff4757; cursor:pointer;">X</button>
                </div>
            </div>`;
        this.miniLabel = container.querySelector('#mini-label');
        container.querySelector('#open-gui').onclick = () => this.openWindow();
        container.querySelector('#del-btn').onclick = () => { this.cleanup(); onRemove(); };
    }

    openWindow() {
        const existing = document.getElementById('glitch-window');
        if(existing) existing.remove();
        const win = document.createElement('div');
        win.id = 'glitch-window';
        win.style.cssText = `position: fixed; top: ${this.winY}px; left: ${this.winX}px; width: 300px; padding: 10px; background: #050a10; border: 2px solid #00d2d3; box-shadow: 0 0 20px rgba(0,0,0,0.8); z-index: 9999; font-family: 'Courier New', monospace;`;
        
        win.innerHTML = `
            <div id="win-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #1f2a36; padding-bottom:5px; cursor: grab; user-select: none;">
                <span style="color:#fff; font-weight:bold; pointer-events:none;">GROSS_GLITCH // V2.0</span>
                <button id="win-close" style="background:none; border:none; color:#ff4757; cursor:pointer;">[CLOSE]</button>
            </div>
            <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:6px;">
                ${this.patterns.map((p, i) => `<button id="p-btn-${i}" style="height:40px; background:#151b24; color:#5f7d8c; border:1px solid #333; font-size:10px; font-weight:bold; cursor:pointer; transition: all 0.05s; user-select: none;">${p.name}</button>`).join('')}
            </div>`;
        
        document.body.appendChild(win);
        this.updateVisuals();

        const header = win.querySelector('#win-header');
        let isDragging = false, offsetX, offsetY;
        header.onmousedown = (e) => { isDragging = true; header.style.cursor = 'grabbing'; offsetX = e.clientX - win.offsetLeft; offsetY = e.clientY - win.offsetTop; };
        document.onmousemove = (e) => { if (!isDragging) return; const x = e.clientX - offsetX; const y = e.clientY - offsetY; win.style.left = x + 'px'; win.style.top = y + 'px'; this.winX = x; this.winY = y; };
        document.onmouseup = () => { isDragging = false; if(header) header.style.cursor = 'grab'; };

        this.patterns.forEach((p, i) => {
            const btn = win.querySelector(`#p-btn-${i}`);
            btn.onmousedown = (e) => { e.preventDefault(); this.setMode(i); };
            btn.onmouseup = () => { this.setMode(0); };
            btn.onmouseleave = () => { if(this.mode === i) this.setMode(0); };
        });
        win.querySelector('#win-close').onclick = () => win.remove();
    }

    getState() { return { mode: this.mode }; }
    setState(data) { if(data.mode !== undefined) this.setMode(data.mode); }
    cleanup() {
        this.input.disconnect(); this.script.disconnect(); this.script.onaudioprocess = null;
        const existing = document.getElementById('glitch-window'); if(existing) existing.remove();
    }
}