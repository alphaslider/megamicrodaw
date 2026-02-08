# megamicrodaw
A high-performance, single-file HTML5/Web Audio workstation. Features a 32-step sequencer with mono-triggering, 8-bank pattern system, and a full song arranger. Includes an 8-channel mixer with dynamic JS FX injection, precision BPM scheduling, and session export/import. Built for zero-latency browser beat-making.
# MEGAMICRODAW // v6.0

**A professional, single-file Digital Audio Workstation running entirely in your browser.**

MEGAMICRODAW is a lightweight, zero-dependency music production environment built on the **Web Audio API**. It combines the workflow of classic grooveboxes (like the SP-404 or MPC) with the convenience of modern browser technology.

![Status](https://img.shields.io/badge/Status-Stable-green) ![License](https://img.shields.io/badge/License-MIT-blue) ![Platform](https://img.shields.io/badge/Platform-HTML5-orange)

## 🚀 Key Features

* **Zero Installation:** Runs as a single `.html` file. No servers, no node_modules, no setup.
* **State Saving:** Full project recall. Save your patterns, samples, mixer settings, and plugin states to a single `.daw` file.
* **WAV Export:** Render your final master output directly to a high-quality WAV file.
* **Sample Loader:** Load your own WAV/MP3 samples into 8 independent tracks.
* **Song Mode:** Chain patterns together to build full arrangements.
* **Hot-Swappable FX:** A modular mixer system that supports custom JavaScript effect plugins.

---

## 🎹 Included Effect Plugins

MEGAMICRODAW comes pre-loaded with a suite of character-driven FX inspired by vintage hardware:

| Plugin | Description |
| :--- | :--- |
| **Compressor303** | A heavy "pumping" compressor inspired by the SP-303 vinyl sim compressor. Great for gluing drums. |
| **VinylSim404** | Lo-fi degradation processor. Adds pitch warble (wow/flutter), crackle, hiss, and bit-crushing. |
| **TapeEcho** | Dub-style delay with saturation and analog pitch-gliding time controls. |
| **DjfxLooper** | Performance looper for stutter effects, glitching, and repitching audio in real-time. |
| **SpIsolator** | 3-Band DJ-style EQ (Low/Mid/High) for aggressive frequency killing. |
| **SpReverb** | Convolution reverb with adjustable room size and "dark" tone filtering. |
| **SubSonic** | Sub-bass enhancer. Detects kick drums and synthesizes a clean sine wave sub-layer underneath. |
| **RichChorus** | Wide stereo chorus with dual LFOs for thick, shimmering textures. |

---

## 🛠️ Quick Start Guide

1.  **Open:** Simply open `index.html` in any modern web browser (Chrome, Firefox, Edge, Safari).
2.  **Start Engine:** Click the **START** button in the top left to initialize the audio engine.
3.  **Load Samples:** Click **LOAD** on any track to pick an audio file from your computer.
4.  **Sequence:** Click the step grid to create a beat.
    * *Blue Step* = Active Trigger
    * *Dark Step* = Silent
5.  **Mix:** Switch to the **MIX** tab to adjust levels and add effects.
6.  **Export:**
    * Click **EXP** to save your project file (`.daw`).
    * Click **ARM REC** and then **START** to record your performance to WAV.

---

## 🎛️ Controls & Shortcuts

### Transport
* **PAT / SONG:** Toggles between looping the current 16-step pattern or playing the full song arrangement.
* **SWING:** Adds groove to your beat (0% to 30%).

### Sequencer
* **Tracks:** 8 Tracks available.
* **Mono-Triggering:** Samples on the same track choke each other (great for hi-hats or chopping breaks).
* **Pattern Length:** Adjustable per pattern (e.g., set Pattern 1 to 16 steps, Pattern 2 to 32 steps).

### Mixer
* **Add FX:** Click `+ FX` on any channel strip and select one of the included JS plugin files.
* **Save State:** All knob positions and settings are saved automatically when you Export your session.

---

## 📦 Installation

To host this yourself or run it offline:

1.  Clone this repository:
    ```bash
    git clone [https://github.com/YOUR_USERNAME/megamicrodaw.git](https://github.com/YOUR_USERNAME/megamicrodaw.git)
    ```
2.  Open `index.html` in your browser.
3.  That's it.

---

## 📜 License

This project is open-source and available under the **MIT License**. You are free to modify, distribute, and use it for personal or commercial projects.

**Created by [Your Name/Handle]**

Here is the updated README.md for MEGAMICRODAW v9.3. It includes all the new features, how to use them, and instructions on how to load the JavaScript plugins.

MEGAMICRODAW - User Manual & Features
MEGAMICRODAW is a lightweight, browser-based Digital Audio Workstation designed for rapid idea generation, live performance, and creative sound design. It features a Cyberpunk/Hacker aesthetic and a powerful audio engine capable of synthesis, sampling, and generative music creation.

🚀 Key Features
1. Audio Engine & Performance
Sample & Synth Hybrid: Each track can play samples (WAV/MP3) or host live synthesis plugins.

Silky Smooth Playback: Automatic 3ms micro-fades and smooth voice stealing prevent clicks and pops during fast triggering (triplets/rolls).

Master Limiter: A built-in dynamics compressor on the Master Bus ensures your mix stays loud and punchy without digital distortion.

Mute & Solo:

[M]: Mute a track (silence it).

[S]: Solo a track (silence everything else).

2. Sequencing & Piano Roll
Dual Edit Modes:

[VEL]: Edit note velocities with a bar graph.

[NOTE]: Open the Piano Roll grid for melodic sequencing.

View Octave (VIEW ▲ ▼): Scroll the Piano Roll grid up and down to access different octaves. (This does not change the pitch of existing notes).

Transpose (XPOS + -): Shift the playback pitch of the entire track in semitones.

Multi-Octave Editing: You can paint bass notes in View Octave 1 and melody notes in View Octave 4 on the same track.

3. Generative Tools (AI Co-Pilot)
[RND] (Randomize): Instantly fills the current pattern with random notes and rhythms based on the notes visible in your current View Octave.

[GEN] (Generative Mode):

Turn this ON to make the track self-compose.

Every time the loop restarts, it generates a brand new pattern automatically.

Per-Pattern State: You can have GEN "ON" for Pattern 1 (chaos) and "OFF" for Pattern 2 (composed).

[CLR] (Clear): Instantly wipes the pattern for the current track.

4. Arrangement & Workflow
Song Mode: Chain up to 8 different patterns together to create a full song structure.

Pattern Copy/Paste: Use [CPY] and [PST] in the top bar to duplicate patterns to new banks for variation.

Delete Safety: Clicking [X] to delete a track now asks for confirmation to prevent accidents.

5. Mixer & FX Rack
Drag & Drop Routing:

Grab any plugin by its handle (:::) to drag it up or down the FX chain.

The audio signal path updates instantly (e.g., swapping Distortion before/after Reverb).

Unlimited FX: Add as many effects or synths as your CPU can handle.

6. Recording & Export
Live Resampling: Click [ARM REC] to record your main output.

Instant Preview: After recording, press [PLAY] to hear your take immediately inside the browser before saving.

Project Save/Load: Saves your entire session (Samples, Notes, Mixer Settings, Plugin States) to a single .daw file.

🎹 Included Plugins
The DAW comes with two powerful JavaScript plugins that you can load into any mixer channel.

1. DrumSynth (12-Sound Kit)
Turns the Piano Roll into a Drum Machine.

Mapping: Notes C through B trigger 12 different synthesized drums (Kick, Snare, Hats, Toms, Percussion).

Usage: Select a drum from the dropdown menu, then use the sliders to shape its sound (Tune, Decay, Snap, Level).

2. SimpleSynth v3 (Mono Synth)
A powerful monophonic synthesizer for basslines and leads.

Oscillators: Saw, Square, Sine waves.

Filter: Resonant Lowpass Filter with Envelope.

Auto-Cutoff (LFO): Toggle the LFO to automatically wobble the filter cutoff for dubstep/techno effects.

🛠️ How to Use
Loading Plugins
Save the Plugin Code: Copy the Javascript code for a plugin (e.g., DrumSynth) and save it as a .js file on your computer (e.g., DrumSynth.js).

Open Mixer: Click the [MIX] tab in the top right.

Add FX: Click the [+ FX] button on any channel strip.

Select File: Browse and select your .js plugin file.

Done: The plugin controls will appear in the rack, and the audio will route through it.

Recording a Song
Arm: Click [ARM REC]. The button will flash red ("WAITING...").

Start: Click [START] to begin playback and recording simultaneously.

Perform: Mute tracks, tweak filters, and change patterns live.

Stop: Click [STOP].

Preview: The recording buttons will change. Click [PLAY] to hear your mix.

Save: Click [SAVE WAV] to download the audio file.

Generative Workflow
Create a track and open the [NOTE] drawer.

Select a scale or range by using VIEW ▲/▼.

Turn on [GEN].

Press [START].

The track will now invent a new melody every time the bar loops. To "lock in" a cool melody, simply turn [GEN] off.

⌨️ Shortcuts & Tips
BPM: Type a tempo or drag the box to change speed.

Swing: Add groove to your beats (0.0 - 0.3 range).

Track Rename: Tracks are automatically named after the sample file you load.

CPU Saving: If audio crackles, try increasing the buffer size (in code) or removing a few heavy FX plugins.
