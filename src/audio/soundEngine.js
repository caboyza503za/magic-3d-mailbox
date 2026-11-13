/**
 * Procedural WebAudio Music Box & Enchanted SFX Synthesizer.
 * Unlocks automatically on the first user gesture without external MP3 files.
 */
export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.delayNode = null;
    this.isMuted = false;
    this.isUnlocked = false;
    this.melodyTimer = null;
    this.noteIndex = 0;

    // Gentle dreamy music box progression (Fmaj7 - Dm9 - Bbmaj7 - C6)
    this.melody = [
      523.25, 659.25, 698.46, 880.0, 1046.5, 880.0, 698.46, 659.25,
      587.33, 698.46, 880.0, 1046.5, 1174.66, 1046.5, 880.0, 698.46,
      466.16, 587.33, 698.46, 880.0, 932.33, 880.0, 698.46, 587.33,
      523.25, 659.25, 783.99, 1046.5, 880.0, 783.99, 659.25, 523.25,
    ];
  }

  unlock() {
    if (this.isUnlocked) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.isMuted ? 0 : 0.35;

    // Soft dreamy delay echo
    this.delayNode = this.ctx.createDelay(1.0);
    this.delayNode.delayTime.value = 0.34;
    const feedback = this.ctx.createGain();
    feedback.gain.value = 0.28;
    const delayFilter = this.ctx.createBiquadFilter();
    delayFilter.type = 'lowpass';
    delayFilter.frequency.value = 2600;

    this.delayNode.connect(delayFilter);
    delayFilter.connect(feedback);
    feedback.connect(this.delayNode);
    delayFilter.connect(this.masterGain);

    this.masterGain.connect(this.ctx.destination);

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    this.isUnlocked = true;
    this.startMusicBox();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : 0.35, now + 0.12);
    }
    return this.isMuted;
  }

  startMusicBox() {
    if (this.melodyTimer) return;
    const stepMs = 460;
    this.melodyTimer = window.setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running' || this.isMuted) return;
      const freq = this.melody[this.noteIndex % this.melody.length];
      this.noteIndex += 1;
      this.playMusicBoxNote(freq, 0.14, 1.35);
    }, stepMs);
  }

  playMusicBoxNote(freq, volume = 0.16, duration = 1.2) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const overtone = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    overtone.type = 'triangle';
    overtone.frequency.setValueAtTime(freq * 2, now);

    const overtoneGain = this.ctx.createGain();
    overtoneGain.gain.value = 0.16;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    overtone.connect(overtoneGain);
    overtoneGain.connect(gain);

    gain.connect(this.masterGain);
    gain.connect(this.delayNode);

    osc.start(now);
    overtone.start(now);
    osc.stop(now + duration + 0.05);
    overtone.stop(now + duration + 0.05);
  }

  playTapSparkle() {
    this.unlock();
    if (!this.ctx || this.isMuted) return;
    const freqs = [1046.5, 1318.5, 1567.98, 2093.0];
    const base = freqs[Math.floor(Math.random() * freqs.length)];
    this.playMusicBoxNote(base, 0.12, 0.65);
    window.setTimeout(() => this.playMusicBoxNote(base * 1.25, 0.08, 0.55), 55);
  }

  playMailboxOpen() {
    this.unlock();
    if (!this.ctx || this.isMuted) return;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((f, idx) => {
      window.setTimeout(() => this.playMusicBoxNote(f, 0.18, 1.3), idx * 95);
    });
  }

  playSealBreak() {
    this.unlock();
    if (!this.ctx || this.isMuted) return;
    const chord = [698.46, 880.0, 1046.5, 1396.91, 1760.0];
    chord.forEach((f, idx) => {
      window.setTimeout(() => this.playMusicBoxNote(f, 0.2, 1.8), idx * 65);
    });
  }

  playFireworkPop() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Soft shimmering chime + airy burst
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const startFreq = 720 + Math.random() * 480;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 1.9, now + 0.16);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.11, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    osc.connect(gain);
    gain.connect(this.masterGain);
    gain.connect(this.delayNode);

    osc.start(now);
    osc.stop(now + 0.6);
  }

  dispose() {
    if (this.melodyTimer) {
      window.clearInterval(this.melodyTimer);
      this.melodyTimer = null;
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}
