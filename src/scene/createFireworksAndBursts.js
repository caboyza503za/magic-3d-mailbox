import * as THREE from 'three';
import { sampleHeartPoint } from '../utils/geometryHelpers.js';
import { randomRange } from '../utils/easing.js';

/**
 * Pool-based GPU particle engine for 3D Heart Fireworks, Tap Magic Bursts, and Seal Explosions.
 */
export function createFireworksAndBursts(scene, soundEngine) {
  const MAX_PARTICLES = 2400;
  const positions = new Float32Array(MAX_PARTICLES * 3);
  const colors = new Float32Array(MAX_PARTICLES * 3);
  const sizes = new Float32Array(MAX_PARTICLES);
  const alphas = new Float32Array(MAX_PARTICLES);

  const velocities = new Float32Array(MAX_PARTICLES * 3);
  const ages = new Float32Array(MAX_PARTICLES);
  const lifetimes = new Float32Array(MAX_PARTICLES);
  const gravities = new Float32Array(MAX_PARTICLES);
  const drags = new Float32Array(MAX_PARTICLES);
  const active = new Uint8Array(MAX_PARTICLES);

  let cursor = 0;
  const rockets = [];

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));

  const uniforms = {
    uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
  };

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms,
    vertexShader: `
      attribute vec3 aColor;
      attribute float aSize;
      attribute float aAlpha;
      uniform float uPixelRatio;
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vColor = aColor;
        vAlpha = aAlpha;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uPixelRatio * (14.0 / max(1.0, -mvPosition.z));
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        if (vAlpha <= 0.01) discard;
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float glow = pow(1.0 - d * 2.0, 1.8);
        gl_FragColor = vec4(vColor, glow * vAlpha);
      }
    `,
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);

  const palettes = [
    [new THREE.Color('#FF4F87'), new THREE.Color('#FF9AC8'), new THREE.Color('#F5C28B')],
    [new THREE.Color('#2CE6C8'), new THREE.Color('#9D6BFF'), new THREE.Color('#FFF7FA')],
    [new THREE.Color('#FF70B8'), new THREE.Color('#FFD391'), new THREE.Color('#C49EFF')],
  ];

  function emitParticle(pos, vel, color, size, life, gravity = 1.2, drag = 0.96) {
    const idx = cursor;
    cursor = (cursor + 1) % MAX_PARTICLES;

    active[idx] = 1;
    ages[idx] = 0;
    lifetimes[idx] = life;
    gravities[idx] = gravity;
    drags[idx] = drag;

    positions[idx * 3] = pos.x;
    positions[idx * 3 + 1] = pos.y;
    positions[idx * 3 + 2] = pos.z;

    velocities[idx * 3] = vel.x;
    velocities[idx * 3 + 1] = vel.y;
    velocities[idx * 3 + 2] = vel.z;

    colors[idx * 3] = color.r;
    colors[idx * 3 + 1] = color.g;
    colors[idx * 3 + 2] = color.b;

    sizes[idx] = size;
    alphas[idx] = 1;
  }

  function explodeHeartShell(center, scale = 2.4, paletteIndex = 0) {
    const pal = palettes[paletteIndex % palettes.length];
    const count = 115;
    const tiltY = randomRange(-0.32, 0.32);
    const cosTilt = Math.cos(tiltY);
    const sinTilt = Math.sin(tiltY);

    for (let i = 0; i < count; i++) {
      const theta = (i / count) * Math.PI * 2 + randomRange(-0.04, 0.04);
      const hp = sampleHeartPoint(theta);
      const layerScale = scale * (i % 3 === 0 ? 0.62 : 1.0) * randomRange(0.92, 1.08);
      const vx = hp.x * layerScale;
      const vy = hp.y * layerScale;
      const vz = randomRange(-0.35, 0.35);

      const rotVx = vx * cosTilt - vz * sinTilt;
      const rotVz = vx * sinTilt + vz * cosTilt;

      const c = pal[i % pal.length];
      emitParticle(
        center,
        new THREE.Vector3(rotVx, vy, rotVz),
        c,
        randomRange(5.5, 9.5),
        randomRange(1.45, 2.2),
        0.75,
        0.955
      );
    }

    // Center flash ring
    for (let i = 0; i < 24; i++) {
      const c = pal[2];
      emitParticle(
        center,
        new THREE.Vector3(randomRange(-1.2, 1.2), randomRange(-1.2, 1.2), randomRange(-1.2, 1.2)),
        c,
        randomRange(4.0, 6.5),
        randomRange(0.7, 1.1),
        0.4,
        0.92
      );
    }

    if (soundEngine) {
      soundEngine.playFireworkPop();
    }
  }

  return {
    spawnTapBurst(worldPos) {
      const pal = palettes[Math.floor(Math.random() * palettes.length)];
      for (let i = 0; i < 36; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(randomRange(-1, 1));
        const speed = randomRange(0.8, 2.5);
        const vel = new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.cos(phi) * speed + 0.45,
          Math.sin(phi) * Math.sin(theta) * speed
        );
        emitParticle(
          worldPos,
          vel,
          pal[i % pal.length],
          randomRange(4.2, 8.2),
          randomRange(0.65, 1.15),
          0.9,
          0.94
        );
      }
    },
    spawnMailboxBurst(worldPos) {
      const pal = palettes[2];
      for (let i = 0; i < 85; i++) {
        const vel = new THREE.Vector3(
          randomRange(-1.6, 1.6),
          randomRange(0.4, 2.4),
          randomRange(0.6, 3.2)
        );
        emitParticle(
          worldPos,
          vel,
          pal[i % pal.length],
          randomRange(5.0, 9.0),
          randomRange(0.95, 1.65),
          0.7,
          0.95
        );
      }
    },
    spawnSealBurst(worldPos) {
      explodeHeartShell(worldPos, 1.85, 0);
    },
    launchHeartFirework(origin, target) {
      const start = origin
        ? origin.clone()
        : new THREE.Vector3(randomRange(-2.6, 2.6), 0.35, randomRange(-3.2, -1.2));
      const end = target
        ? target.clone()
        : new THREE.Vector3(randomRange(-3.4, 3.4), randomRange(4.4, 6.4), randomRange(-4.2, -1.5));

      rockets.push({
        pos: start.clone(),
        start,
        end,
        age: 0,
        duration: randomRange(0.55, 0.85),
        paletteIndex: Math.floor(Math.random() * palettes.length),
        scale: randomRange(2.2, 3.1),
      });
    },
    update(dt, pixelRatio) {
      uniforms.uPixelRatio.value = pixelRatio;

      // Update climbing rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.age += dt;
        const p = Math.min(1, r.age / r.duration);
        const eased = 1 - Math.pow(1 - p, 2);
        r.pos.lerpVectors(r.start, r.end, eased);

        // Emit trail ember
        emitParticle(
          r.pos,
          new THREE.Vector3(randomRange(-0.2, 0.2), randomRange(-0.4, 0.1), randomRange(-0.2, 0.2)),
          new THREE.Color('#F5C28B'),
          randomRange(3.5, 5.5),
          0.35,
          0.3,
          0.92
        );

        if (p >= 1) {
          explodeHeartShell(r.end, r.scale, r.paletteIndex);
          rockets.splice(i, 1);
        }
      }

      // Update active particles
      for (let i = 0; i < MAX_PARTICLES; i++) {
        if (!active[i]) continue;
        ages[i] += dt;
        const life = lifetimes[i];
        if (ages[i] >= life) {
          active[i] = 0;
          alphas[i] = 0;
          continue;
        }

        const i3 = i * 3;
        const d = Math.pow(drags[i], dt * 60);
        velocities[i3] *= d;
        velocities[i3 + 1] = velocities[i3 + 1] * d - gravities[i] * dt;
        velocities[i3 + 2] *= d;

        positions[i3] += velocities[i3] * dt;
        positions[i3 + 1] += velocities[i3 + 1] * dt;
        positions[i3 + 2] += velocities[i3 + 2] * dt;

        const normAge = ages[i] / life;
        const twinkle = 0.78 + 0.22 * Math.sin(ages[i] * 24 + i);
        alphas[i] = Math.pow(1 - normAge, 1.45) * twinkle;
      }

      geo.attributes.position.needsUpdate = true;
      geo.attributes.aColor.needsUpdate = true;
      geo.attributes.aSize.needsUpdate = true;
      geo.attributes.aAlpha.needsUpdate = true;
    },
  };
}
