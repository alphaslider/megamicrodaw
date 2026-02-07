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
