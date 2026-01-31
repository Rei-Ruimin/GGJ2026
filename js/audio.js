export class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.5;

        // BGM Nodes
        this.bgmNodes = {
            0: null, // Reality
            1: null, // Heaven
            2: null  // Hell
        };
        
        this.bgmGains = {
            0: this.ctx.createGain(),
            1: this.ctx.createGain(),
            2: this.ctx.createGain()
        };

        // Connect BGM gains to master
        for(let i=0; i<3; i++) {
            this.bgmGains[i].connect(this.masterGain);
            this.bgmGains[i].gain.value = 0; // Start silent
        }

        this.initialized = false;
    }

    async init() {
        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }
        
        // Restore volume
        this.masterGain.gain.setTargetAtTime(0.5, this.ctx.currentTime, 0.1);

        if (this.initialized) return;
        this.initialized = true;

        this.startRealityBGM();
        this.startHeavenBGM();
        this.startHellBGM();
    }

    // --- Procedural Music Generators ---

    startRealityBGM() {
        // Theme: "Night Mystery" - Floating, breathing pad
        const rootFreq = 110; // A2
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Osc 1: Fundamental Sine
        osc1.type = 'sine';
        osc1.frequency.value = rootFreq;

        // Osc 2: Fifth Triangle (E3) - adds color
        osc2.type = 'triangle';
        osc2.frequency.value = rootFreq * 1.5; 
        
        // LFO for breathing volume
        const lfo = this.ctx.createOscillator();
        lfo.frequency.value = 0.2; // 5 seconds per breath
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 0.15; // Depth of breath
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        
        // Mix
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.bgmGains[0]);
        
        // Base volume
        gain.gain.value = 0.4;

        osc1.start();
        osc2.start();
        lfo.start();

        this.bgmNodes[0] = { stop: () => { osc1.stop(); osc2.stop(); lfo.stop(); } };
    }

    startHeavenBGM() {
        // Theme: "False Holiness" - Warm, soft organ/choir
        // Lower octave to fix harshness
        const chord = [130.81, 164.81, 196.00, 246.94]; // C3 Major 7 chord
        const masterNode = this.ctx.createGain();
        masterNode.connect(this.bgmGains[1]);
        masterNode.gain.value = 0.3;

        // Lowpass Filter to soften the sound (Remove harshness)
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800; // Cutoff high frequencies
        masterNode.connect(filter);
        filter.connect(this.bgmGains[1]);

        const nodes = [];

        chord.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            osc.type = 'triangle'; // Softer than Sawtooth, richer than Sine
            osc.frequency.value = freq;
            
            // Subtle detune for chorus effect
            if (i % 2 === 0) osc.detune.value = 5; 
            else osc.detune.value = -5;

            osc.connect(masterNode);
            osc.start();
            nodes.push(osc);
        });

        // Slow shimmer LFO on Filter frequency
        const lfo = this.ctx.createOscillator();
        lfo.frequency.value = 0.5;
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 200; // Modulate filter by +/- 200Hz
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();

        this.bgmNodes[1] = { stop: () => { nodes.forEach(n => n.stop()); lfo.stop(); } };
    }

    startHellBGM() {
        // Theme: "The Warning" - Rhythmic, throbbing bass pulse
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = 40; // Low bass drone

        // Filter that opens and closes
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.value = 5; // Resonance
        
        // LFO for rhythmic pulse (Heartbeat)
        const lfo = this.ctx.createOscillator();
        lfo.type = 'square';
        lfo.frequency.value = 2; // 2 beats per second
        
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 300; // Filter sweep depth
        
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        
        // Base filter value
        filter.frequency.value = 200;

        const gain = this.ctx.createGain();
        gain.gain.value = 0.3;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGains[2]);
        
        osc.start();
        lfo.start();

        this.bgmNodes[2] = { stop: () => { osc.stop(); lfo.stop(); } };
    }

    makeDistortionCurve(amount) {
        const k = typeof amount === 'number' ? amount : 50;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < n_samples; ++i) {
            const x = i * 2 / n_samples - 1;
            curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
        }
        return curve;
    }

    // --- Control ---

    fadeBGM(targetDim) {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;
        
        for(let i=0; i<3; i++) {
            const targetGain = (i === targetDim) ? 1 : 0;
            // Linear ramp is safer for preventing clicks in some browsers
            this.bgmGains[i].gain.linearRampToValueAtTime(targetGain, now + 1.5);
        }
    }

    // --- SFX ---

    playFlap() {
        if (!this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        // Soft white noise burst roughly simulated by randomized frequency ramps or simple low sine drop
        // Let's stick to a soft tone drop for "Whoosh"
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.15);
        
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    playBump() {
        if (!this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(80, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    playZap() {
        if (!this.initialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // High pitch zap
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(2000, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(500, this.ctx.currentTime + 0.1); // Fast drop
        osc.frequency.linearRampToValueAtTime(1500, this.ctx.currentTime + 0.2); // Bounce back

        gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
    }

    stopAll() {
        if (!this.initialized) return;
        this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
        setTimeout(() => {
            this.ctx.suspend();
        }, 200);
    }
}