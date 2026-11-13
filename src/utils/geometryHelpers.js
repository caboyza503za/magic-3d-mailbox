import * as THREE from 'three';

/**
 * Creates a symmetric 2D THREE.Shape heart centered near origin (tip pointing down).
 * Used across mailbox ornaments, wax seal, beating crystal heart, and floating orbs.
 */
export function createHeartShape(scale = 1) {
  const shape = new THREE.Shape();
  const s = scale * 0.055;
  shape.moveTo(0, -6.5 * s);
  shape.bezierCurveTo(6.8 * s, -1.6 * s, 9.6 * s, 4.4 * s, 4.8 * s, 7.6 * s);
  shape.bezierCurveTo(2.1 * s, 9.3 * s, 0.2 * s, 7.5 * s, 0, 5.4 * s);
  shape.bezierCurveTo(-0.2 * s, 7.5 * s, -2.1 * s, 9.3 * s, -4.8 * s, 7.6 * s);
  shape.bezierCurveTo(-9.6 * s, 4.4 * s, -6.8 * s, -1.6 * s, 0, -6.5 * s);
  return shape;
}

/**
 * Generates a soft radial glow texture for additive sprites and particles.
 */
export function createGlowTexture(size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const half = size / 2;

  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.24, 'rgba(255, 235, 245, 0.85)');
  grad.addColorStop(0.55, 'rgba(255, 180, 220, 0.28)');
  grad.addColorStop(1.0, 'rgba(255, 180, 220, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Evaluates a classic 3D parametric heart curve point in [-1, 1] normalized space.
 */
export function sampleHeartPoint(theta) {
  const sinT = Math.sin(theta);
  const x = 16 * sinT * sinT * sinT;
  const y =
    13 * Math.cos(theta) -
    5 * Math.cos(2 * theta) -
    2 * Math.cos(3 * theta) -
    Math.cos(4 * theta);
  return { x: x / 16, y: (y + 2.2) / 16 };
}
