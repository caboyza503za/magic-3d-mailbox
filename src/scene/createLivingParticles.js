import * as THREE from 'three';
import { createHeartShape } from '../utils/geometryHelpers.js';
import { damp, randomRange } from '../utils/easing.js';

export function createLivingParticles(scene) {
  const group = new THREE.Group();
  scene.add(group);

  // 1. 12 Animated 3D Crystal Butterflies
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.bezierCurveTo(0.06, 0.14, 0.22, 0.16, 0.2, 0.03);
  wingShape.bezierCurveTo(0.18, -0.02, 0.11, -0.04, 0.14, -0.09);
  wingShape.bezierCurveTo(0.16, -0.15, 0.05, -0.17, 0, -0.05);
  wingShape.closePath();

  const wingGeo = new THREE.ShapeGeometry(wingShape, 10);
  const bodyGeo = new THREE.CapsuleGeometry(0.01, 0.09, 4, 6);
  bodyGeo.rotateX(Math.PI / 2);

  const butterflyColors = ['#FF85C8', '#5AF5DB', '#C49EFF', '#FFD391'];
  const butterflies = [];

  for (let i = 0; i < 12; i++) {
    const color = butterflyColors[i % butterflyColors.length];
    const wingMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.95,
      transparent: true,
      opacity: 0.86,
      roughness: 0.2,
      side: THREE.DoubleSide,
    });

    const bGroup = new THREE.Group();
    const body = new THREE.Mesh(
      bodyGeo,
      new THREE.MeshBasicMaterial({ color: '#FFF7FA' })
    );
    bGroup.add(body);

    const leftWingPivot = new THREE.Group();
    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.rotation.x = -Math.PI / 2;
    leftWing.scale.x = -1;
    leftWingPivot.add(leftWing);

    const rightWingPivot = new THREE.Group();
    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.rotation.x = -Math.PI / 2;
    rightWingPivot.add(rightWing);

    bGroup.add(leftWingPivot, rightWingPivot);
    const scale = randomRange(0.75, 1.25);
    bGroup.scale.setScalar(scale);
    group.add(bGroup);

    butterflies.push({
      group: bGroup,
      leftWingPivot,
      rightWingPivot,
      baseRadius: randomRange(1.05, 2.75),
      baseHeight: randomRange(0.95, 2.85),
      speed: randomRange(0.45, 0.85),
      phase: randomRange(0, Math.PI * 2),
      flapSpeed: randomRange(11, 16),
      attractTarget: null,
      attractTimer: 0,
      pos: new THREE.Vector3(),
      prevPos: new THREE.Vector3(),
    });
  }

  // 2. 480 Bioluminescent Fireflies & Golden Stardust
  const fireflyCount = 480;
  const ffPositions = new Float32Array(fireflyCount * 3);
  const ffColors = new Float32Array(fireflyCount * 3);
  const ffPhases = new Float32Array(fireflyCount);
  const ffSizes = new Float32Array(fireflyCount);

  const ffPalette = [
    new THREE.Color('#2CE6C8'),
    new THREE.Color('#FF70B8'),
    new THREE.Color('#F5C28B'),
    new THREE.Color('#9D6BFF'),
  ];

  for (let i = 0; i < fireflyCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = randomRange(0.4, 4.6);
    ffPositions[i * 3] = Math.cos(angle) * radius;
    ffPositions[i * 3 + 1] = randomRange(0.25, 4.5);
    ffPositions[i * 3 + 2] = Math.sin(angle) * radius;

    const c = ffPalette[i % ffPalette.length];
    ffColors[i * 3] = c.r;
    ffColors[i * 3 + 1] = c.g;
    ffColors[i * 3 + 2] = c.b;

    ffPhases[i] = Math.random() * Math.PI * 2;
    ffSizes[i] = randomRange(3.2, 7.6);
  }

  const ffGeo = new THREE.BufferGeometry();
  ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPositions, 3));
  ffGeo.setAttribute('aColor', new THREE.BufferAttribute(ffColors, 3));
  ffGeo.setAttribute('aPhase', new THREE.BufferAttribute(ffPhases, 1));
  ffGeo.setAttribute('aSize', new THREE.BufferAttribute(ffSizes, 1));

  const ffUniforms = {
    uTime: { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
  };

  const ffMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: ffUniforms,
    vertexShader: `
      attribute vec3 aColor;
      attribute float aPhase;
      attribute float aSize;
      uniform float uTime;
      uniform float uPixelRatio;
      varying vec3 vColor;
      varying float vGlow;

      void main() {
        vColor = aColor;
        vec3 p = position;
        p.x += sin(uTime * 0.7 + aPhase * 2.1) * 0.35;
        p.y += mod(uTime * 0.16 + aPhase, 3.8) * 0.32 - 0.6;
        p.z += cos(uTime * 0.65 + aPhase * 1.7) * 0.35;

        vGlow = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * 2.6 + aPhase * 4.0));
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = aSize * uPixelRatio * (10.5 / max(1.0, -mvPosition.z)) * (0.7 + 0.45 * vGlow);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vGlow;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float core = pow(1.0 - d * 2.0, 2.0);
        gl_FragColor = vec4(vColor, core * vGlow * 0.95);
      }
    `,
  });

  const fireflies = new THREE.Points(ffGeo, ffMat);
  group.add(fireflies);

  // 3. 80 Curved 3D Rose Petals spiraling upward
  const petalCount = 80;
  const petalShape = new THREE.Shape();
  petalShape.moveTo(0, -0.05);
  petalShape.bezierCurveTo(0.06, -0.02, 0.07, 0.06, 0, 0.08);
  petalShape.bezierCurveTo(-0.07, 0.06, -0.06, -0.02, 0, -0.05);
  const petalGeo = new THREE.ShapeGeometry(petalShape, 6);

  const petalMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#FF9AC8'),
    emissive: new THREE.Color('#FF4F87'),
    emissiveIntensity: 0.42,
    roughness: 0.35,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
  });

  const petalInst = new THREE.InstancedMesh(petalGeo, petalMat, petalCount);
  const petalData = [];
  const petalPalette = [
    new THREE.Color('#FF9AC8'),
    new THREE.Color('#FFC6DE'),
    new THREE.Color('#F5C28B'),
  ];

  for (let i = 0; i < petalCount; i++) {
    petalData.push({
      angle: randomRange(0, Math.PI * 2),
      radius: randomRange(0.7, 3.2),
      y: randomRange(0.3, 4.4),
      riseSpeed: randomRange(0.18, 0.42),
      orbitSpeed: randomRange(0.18, 0.45),
      spinSpeed: randomRange(1.2, 2.8),
      scale: randomRange(0.7, 1.35),
      phase: randomRange(0, Math.PI * 2),
    });
    petalInst.setColorAt(i, petalPalette[i % petalPalette.length]);
  }
  if (petalInst.instanceColor) petalInst.instanceColor.needsUpdate = true;
  group.add(petalInst);

  // 4. 26 Floating Translucent Heart Orbs
  const orbCount = 26;
  const miniHeartGeo = new THREE.ExtrudeGeometry(createHeartShape(0.22), {
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 2,
  });
  miniHeartGeo.center();

  const orbMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#FF8AC9'),
    emissive: new THREE.Color('#FF4F87'),
    emissiveIntensity: 0.95,
    transparent: true,
    opacity: 0.72,
    roughness: 0.15,
  });
  const orbInst = new THREE.InstancedMesh(miniHeartGeo, orbMat, orbCount);
  const orbData = [];
  for (let i = 0; i < orbCount; i++) {
    orbData.push({
      angle: randomRange(0, Math.PI * 2),
      radius: randomRange(0.85, 2.85),
      y: randomRange(0.4, 4.2),
      speed: randomRange(0.22, 0.44),
      phase: randomRange(0, Math.PI * 2),
      scale: randomRange(0.65, 1.2),
    });
  }
  group.add(orbInst);

  const dummy = new THREE.Object3D();
  const tempTarget = new THREE.Vector3();

  return {
    attractTo(worldPoint) {
      // Nearest 4 butterflies swoop gently toward tap position
      const sorted = [...butterflies].sort(
        (a, b) => a.pos.distanceToSquared(worldPoint) - b.pos.distanceToSquared(worldPoint)
      );
      for (let i = 0; i < 4 && i < sorted.length; i++) {
        sorted[i].attractTarget = worldPoint.clone().add(
          new THREE.Vector3(randomRange(-0.4, 0.4), randomRange(-0.2, 0.45), randomRange(-0.4, 0.4))
        );
        sorted[i].attractTimer = 2.6;
      }
    },
    swoopFromMailbox(origin) {
      for (let i = 0; i < 5; i++) {
        const b = butterflies[i];
        b.pos.copy(origin);
        b.attractTarget = origin.clone().add(
          new THREE.Vector3(randomRange(-1.4, 1.4), randomRange(0.7, 1.6), randomRange(0.6, 1.5))
        );
        b.attractTimer = 2.4;
      }
    },
    update(time, dt, pixelRatio) {
      ffUniforms.uTime.value = time;
      ffUniforms.uPixelRatio.value = pixelRatio;

      // Update butterflies
      for (const b of butterflies) {
        b.prevPos.copy(b.pos);

        // Nominal 3D flower-garden orbit
        const t = time * b.speed + b.phase;
        tempTarget.set(
          Math.cos(t) * b.baseRadius + Math.sin(t * 2.1) * 0.25,
          b.baseHeight + Math.sin(t * 1.7) * 0.42,
          Math.sin(t) * b.baseRadius
        );

        if (b.attractTimer > 0 && b.attractTarget) {
          b.attractTimer -= dt;
          tempTarget.lerp(b.attractTarget, Math.min(1, b.attractTimer * 0.65));
        }

        b.pos.x = damp(b.pos.x, tempTarget.x, 3.2, dt);
        b.pos.y = damp(b.pos.y, tempTarget.y, 3.2, dt);
        b.pos.z = damp(b.pos.z, tempTarget.z, 3.2, dt);
        b.group.position.copy(b.pos);

        // Face flight direction
        const dir = tempTarget.clone().sub(b.pos);
        if (dir.lengthSq() > 0.0005) {
          const targetYaw = Math.atan2(dir.x, dir.z);
          b.group.rotation.y = targetYaw;
        }

        // Flap wings
        const flap = Math.sin(time * b.flapSpeed + b.phase) * 0.92;
        b.leftWingPivot.rotation.z = -flap - 0.15;
        b.rightWingPivot.rotation.z = flap + 0.15;
      }

      // Update rose petals
      for (let i = 0; i < petalCount; i++) {
        const p = petalData[i];
        p.y += p.riseSpeed * dt;
        p.angle += p.orbitSpeed * dt;
        if (p.y > 4.8) {
          p.y = 0.28;
        }

        const swayR = p.radius + Math.sin(time * 1.2 + p.phase) * 0.22;
        dummy.position.set(Math.cos(p.angle) * swayR, p.y, Math.sin(p.angle) * swayR);
        dummy.rotation.set(
          time * p.spinSpeed + p.phase,
          p.angle,
          Math.sin(time * 1.8 + p.phase) * 0.8
        );
        dummy.scale.setScalar(p.scale);
        dummy.updateMatrix();
        petalInst.setMatrixAt(i, dummy.matrix);
      }
      petalInst.instanceMatrix.needsUpdate = true;

      // Update floating heart orbs
      for (let i = 0; i < orbCount; i++) {
        const o = orbData[i];
        o.y += o.speed * dt;
        if (o.y > 4.6) o.y = 0.35;

        const fadeScale = Math.sin(((o.y - 0.35) / 4.25) * Math.PI) * o.scale;
        dummy.position.set(
          Math.cos(o.angle + time * 0.12) * o.radius,
          o.y,
          Math.sin(o.angle + time * 0.12) * o.radius
        );
        dummy.rotation.set(0, time * 0.9 + o.phase, 0);
        dummy.scale.setScalar(Math.max(0.01, fadeScale));
        dummy.updateMatrix();
        orbInst.setMatrixAt(i, dummy.matrix);
      }
      orbInst.instanceMatrix.needsUpdate = true;
    },
  };
}
