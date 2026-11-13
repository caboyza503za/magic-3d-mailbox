/**
 * Monitors frame rate and adapts pixel ratio / bloom strength for mobile smoothness.
 */
export class QualityManager {
  constructor(renderer, bloomPass) {
    this.renderer = renderer;
    this.bloomPass = bloomPass;
    this.tier = 'high';
    this.sampleTime = 0;
    this.sampleFrames = 0;
    this.maxDpr = Math.min(window.devicePixelRatio || 1, 2);
    this.applyTier('high');
  }

  getPixelRatio() {
    if (this.tier === 'low') return Math.min(this.maxDpr, 1.25);
    if (this.tier === 'medium') return Math.min(this.maxDpr, 1.6);
    return this.maxDpr;
  }

  applyTier(tier) {
    this.tier = tier;
    this.renderer.setPixelRatio(this.getPixelRatio());
    if (this.bloomPass) {
      this.bloomPass.strength = tier === 'low' ? 0.26 : tier === 'medium' ? 0.34 : 0.42;
    }
  }

  update(dt) {
    if (dt <= 0 || dt > 0.25) return;
    this.sampleTime += dt;
    this.sampleFrames += 1;

    if (this.sampleTime >= 2.5) {
      const avgFps = this.sampleFrames / this.sampleTime;
      if (avgFps < 34 && this.tier === 'high') {
        this.applyTier('medium');
      } else if (avgFps < 26 && this.tier === 'medium') {
        this.applyTier('low');
      }
      this.sampleTime = 0;
      this.sampleFrames = 0;
    }
  }
}
