import * as THREE from 'three';
import { createGlowTexture } from '../utils/geometryHelpers.js';
import { randomRange } from '../utils/easing.js';

export function createSkyAndAurora(scene) {
  const group = new THREE.Group();
  scene.add(group);

  // 1. Deep Midnight Galaxy & Nebula Sky Dome (Linear color space tuned for ACES + sRGB)
  const skyUniforms = {
    uTime: { value: 0 },
    uBoost: { value: 0 },
  };

  const skyGeo = new THREE.SphereGeometry(85, 48, 32);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: skyUniforms,
    vertexShader: `
      varying vec3 vWorldDir;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldDir = normalize(position);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uBoost;
      varying vec3 vWorldDir;

      float hash(vec3 p) {
        p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }

      float noise(vec3 x) {
        vec3 i = floor(x);
        vec3 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
              mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
          mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
              mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
          f.z
        );
      }

      float fbm(vec3 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
          v += a * noise(p);
          p = p * 2.05 + vec3(1.7, 9.2, 4.1);
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec3 dir = normalize(vWorldDir);
        float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);

        // True deep midnight linear values (#07091A -> #111638)
        vec3 deepSky = vec3(0.0022, 0.0032, 0.015);
        vec3 horizon = vec3(0.011, 0.016, 0.062);
        vec3 lowerVoid = vec3(0.0018, 0.0025, 0.012);

        vec3 baseColor = mix(horizon, deepSky, smoothstep(0.46, 0.88, h));
        baseColor = mix(lowerVoid, baseColor, smoothstep(0.15, 0.48, h));

        // Diagonal Milky Way Nebula band
        float band = exp(-pow((dir.y - dir.x * 0.42 - 0.16) * 3.2, 2.0));
        vec3 nebulaCoord = dir * 2.8 + vec3(uTime * 0.01, -uTime * 0.006, 0.0);
        float n1 = fbm(nebulaCoord);
        float n2 = fbm(nebulaCoord * 1.9 + vec3(4.3));

        vec3 amethyst = vec3(0.095, 0.032, 0.28);
        vec3 roseNebula = vec3(0.26, 0.038, 0.17);
        vec3 tealNebula = vec3(0.018, 0.18, 0.22);

        vec3 nebula = mix(amethyst, roseNebula, smoothstep(0.35, 0.72, n2));
        nebula = mix(nebula, tealNebula, smoothstep(0.55, 0.85, n1) * 0.45);

        float nebulaMask = band * smoothstep(0.32, 0.78, n1);
        baseColor += nebula * nebulaMask * (0.65 + uBoost * 0.45);

        gl_FragColor = vec4(baseColor, 1.0);
      }
    `,
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  group.add(skyDome);

  // 2. Twinkling Multi-Color Starfield
  const starCount = 1700;
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);
  const starSizes = new Float32Array(starCount);
  const starPhases = new Float32Array(starCount);

  const palette = [
    new THREE.Color('#FFFFFF'),
    new THREE.Color('#C8F6FF'),
    new THREE.Color('#FFD6EC'),
    new THREE.Color('#F5C28B'),
    new THREE.Color('#C4B5FD'),
  ];

  for (let i = 0; i < starCount; i++) {
    const r = randomRange(44, 74);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(randomRange(-0.4, 0.99));

    starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = r * Math.cos(phi);
    starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    const c = palette[Math.floor(Math.random() * palette.length)];
    starColors[i * 3] = c.r;
    starColors[i * 3 + 1] = c.g;
    starColors[i * 3 + 2] = c.b;

    starSizes[i] = randomRange(1.6, 4.4);
    starPhases[i] = Math.random() * Math.PI * 2;
  }

  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeo.setAttribute('aColor', new THREE.BufferAttribute(starColors, 3));
  starGeo.setAttribute('aSize', new THREE.BufferAttribute(starSizes, 1));
  starGeo.setAttribute('aPhase', new THREE.BufferAttribute(starPhases, 1));

  const starUniforms = {
    uTime: { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
  };

  const starMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: false,
    blending: THREE.AdditiveBlending,
    uniforms: starUniforms,
    vertexShader: `
      attribute vec3 aColor;
      attribute float aSize;
      attribute float aPhase;
      uniform float uTime;
      uniform float uPixelRatio;
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vColor = aColor;
        float twinkle = 0.45 + 0.55 * sin(uTime * (1.4 + mod(aPhase, 2.2)) + aPhase * 3.0);
        vAlpha = twinkle;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uPixelRatio * (18.0 / max(1.0, -mvPosition.z)) * (0.75 + 0.35 * twinkle);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float glow = pow(1.0 - d * 2.0, 2.2);
        gl_FragColor = vec4(vColor, glow * vAlpha);
      }
    `,
  });

  const stars = new THREE.Points(starGeo, starMat);
  group.add(stars);

  // 3. Crisp Transparent GLSL Crescent Moon + Soft Halo
  const moonGroup = new THREE.Group();
  moonGroup.position.set(-4.2, 8.2, -20);

  const moonShaderMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: false,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv * 2.0 - 1.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      void main() {
        float dMain = length(vUv);
        float dCut = length(vUv - vec2(0.24, 0.16));

        float body = smoothstep(0.52, 0.48, dMain);
        float cutout = smoothstep(0.41, 0.46, dCut);
        float crescent = body * cutout;

        // Soft warm moonlight halo around crescent
        float halo = exp(-dMain * 3.2) * 0.38;

        vec3 moonCol = mix(vec3(1.0, 0.90, 0.72), vec3(1.0, 0.97, 0.92), crescent);
        float alpha = clamp(crescent + halo, 0.0, 1.0);
        gl_FragColor = vec4(moonCol * (crescent * 1.15 + halo * 0.9), alpha);
      }
    `,
  });

  const moonQuad = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 4.0), moonShaderMat);
  moonGroup.add(moonQuad);
  group.add(moonGroup);

  // 4. Three-Layer Aurora Borealis Curtains (Framed cleanly in upper sky for mobile & desktop)
  const auroraLayers = [];
  const auroraConfigs = [
    {
      radius: 17.5,
      height: 7.2,
      yOffset: 4.8,
      arc: Math.PI * 1.25,
      rotY: -0.18,
      colorA: '#2CE6C8',
      colorB: '#9D6BFF',
      speed: 0.48,
      opacity: 0.68,
    },
    {
      radius: 21.5,
      height: 8.8,
      yOffset: 6.1,
      arc: Math.PI * 1.38,
      rotY: 0.22,
      colorA: '#9D6BFF',
      colorB: '#FF70B8',
      speed: 0.36,
      opacity: 0.62,
    },
    {
      radius: 14.5,
      height: 5.8,
      yOffset: 4.3,
      arc: Math.PI * 1.05,
      rotY: -0.05,
      colorA: '#38F2D2',
      colorB: '#FF85C8',
      speed: 0.56,
      opacity: 0.52,
    },
  ];

  auroraConfigs.forEach((cfg, idx) => {
    const segX = 96;
    const segY = 20;
    const geo = new THREE.PlaneGeometry(1, cfg.height, segX, segY);
    const posAttr = geo.attributes.position;

    for (let i = 0; i < posAttr.count; i++) {
      const u = posAttr.getX(i) + 0.5;
      const angle = (u - 0.5) * cfg.arc;
      const radialWobble = Math.sin(u * Math.PI * 3.0 + idx * 1.7) * 1.6;
      const r = cfg.radius + radialWobble;
      posAttr.setX(i, Math.sin(angle) * r);
      posAttr.setZ(i, -Math.cos(angle) * r);
    }
    geo.computeVertexNormals();

    const uniforms = {
      uTime: { value: 0 },
      uBoost: { value: 0 },
      uColorA: { value: new THREE.Color(cfg.colorA) },
      uColorB: { value: new THREE.Color(cfg.colorB) },
      uSpeed: { value: cfg.speed },
      uOpacity: { value: cfg.opacity },
      uSeed: { value: idx * 3.7 + 1.1 },
    };

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      fog: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms,
      vertexShader: `
        uniform float uTime;
        uniform float uSpeed;
        uniform float uSeed;
        varying vec2 vUv;

        void main() {
          vUv = uv;
          vec3 pos = position;
          float wave1 = sin(uv.x * 9.0 + uTime * uSpeed + uSeed) * 0.9;
          float wave2 = cos(uv.x * 16.0 - uTime * uSpeed * 1.2 + uSeed) * 0.45;
          pos.x += wave1 * 0.55;
          pos.z += (wave1 + wave2) * 0.65;
          pos.y += sin(uv.x * 6.0 + uTime * 0.4 + uSeed) * 0.6 * uv.y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uBoost;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform float uSpeed;
        uniform float uOpacity;
        uniform float uSeed;
        varying vec2 vUv;

        float hash(float n) { return fract(sin(n) * 43758.5453123); }

        float noise1D(float x) {
          float i = floor(x);
          float f = fract(x);
          f = f * f * (3.0 - 2.0 * f);
          return mix(hash(i), hash(i + 1.0), f);
        }

        void main() {
          float rays = noise1D(vUv.x * 24.0 + uTime * uSpeed * 0.8 + uSeed) * 0.6
                     + noise1D(vUv.x * 58.0 - uTime * uSpeed * 1.15 + uSeed * 2.0) * 0.4;
          rays = pow(rays, 1.55);

          float shimmer = 0.62 + 0.38 * sin(vUv.x * 36.0 - uTime * 1.4 + rays * 5.0);
          float vertFade = smoothstep(0.0, 0.32, vUv.y) * pow(1.0 - vUv.y, 1.85);
          float horizFade = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);

          float intensity = rays * shimmer * vertFade * horizFade;
          vec3 col = mix(uColorA, uColorB, clamp(vUv.y * 1.15 + 0.22 * sin(vUv.x * 6.0 + uTime * 0.5), 0.0, 1.0));
          col *= (0.88 + uBoost * 0.55);

          float alpha = clamp(intensity * uOpacity * (1.45 + uBoost * 0.55), 0.0, 0.85);
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = cfg.yOffset;
    mesh.rotation.y = cfg.rotY;
    group.add(mesh);
    auroraLayers.push(uniforms);
  });

  // 5. Shooting Stars
  const glowTex = createGlowTexture(128);
  const shootingStars = [];
  for (let i = 0; i < 3; i++) {
    const trailGeo = new THREE.PlaneGeometry(3.2, 0.055);
    const trailMat = new THREE.MeshBasicMaterial({
      map: glowTex,
      color: i === 1 ? '#FF8AC9' : '#E2FAFF',
      transparent: true,
      opacity: 0,
      fog: false,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(trailGeo, trailMat);
    group.add(mesh);
    shootingStars.push({
      mesh,
      mat: trailMat,
      cooldown: randomRange(1.2, 5.5) + i * 2.2,
      active: false,
      life: 0,
      duration: 0.9,
      startPos: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
    });
  }

  function resetShootingStar(star) {
    star.active = true;
    star.life = 0;
    star.duration = randomRange(0.75, 1.15);
    const x = randomRange(-16, 16);
    const y = randomRange(7.5, 14);
    const z = randomRange(-28, -16);
    star.startPos.set(x, y, z);
    const dirX = x > 0 ? randomRange(-15, -8) : randomRange(8, 15);
    star.velocity.set(dirX, randomRange(-7, -4), randomRange(-2, 2));
    star.mesh.position.copy(star.startPos);
    star.mesh.rotation.z = Math.atan2(star.velocity.y, star.velocity.x);
  }

  let auroraBoost = 0;

  return {
    setIntensityBoost(boost) {
      auroraBoost = boost;
    },
    update(time, dt, pixelRatio, camera) {
      skyUniforms.uTime.value = time;
      skyUniforms.uBoost.value = auroraBoost;
      starUniforms.uTime.value = time;
      starUniforms.uPixelRatio.value = pixelRatio;

      if (camera) {
        moonQuad.quaternion.copy(camera.quaternion);
      }

      for (const u of auroraLayers) {
        u.uTime.value = time;
        u.uBoost.value = auroraBoost;
      }

      stars.rotation.y = time * 0.008;

      for (const s of shootingStars) {
        if (!s.active) {
          s.cooldown -= dt;
          if (s.cooldown <= 0) {
            resetShootingStar(s);
          }
          continue;
        }
        s.life += dt;
        const p = s.life / s.duration;
        if (p >= 1) {
          s.active = false;
          s.mat.opacity = 0;
          s.cooldown = randomRange(2.8, 7.5);
          continue;
        }
        s.mesh.position.addScaledVector(s.velocity, dt);
        s.mat.opacity = Math.sin(p * Math.PI) * 0.9;
      }
    },
  };
}
