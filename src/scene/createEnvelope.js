import * as THREE from 'three';
import { createHeartShape } from '../utils/geometryHelpers.js';
import { easeOutBack, easeInOutCubic, easeOutCubic, clamp } from '../utils/easing.js';

export function createEnvelope(scene) {
  const root = new THREE.Group();
  root.visible = false;
  scene.add(root);

  const hitMeshes = [];
  const registerHit = (mesh) => {
    hitMeshes.push(mesh);
    return mesh;
  };

  // Materials
  const paperMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#E8DAE4'),
    roughness: 0.58,
    metalness: 0.04,
    clearcoat: 0.15,
    side: THREE.DoubleSide,
  });

  const liningMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#E88DB8'),
    emissive: new THREE.Color('#B83A76'),
    emissiveIntensity: 0.18,
    roughness: 0.5,
    side: THREE.DoubleSide,
  });

  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#F5C28B'),
    metalness: 0.85,
    roughness: 0.24,
  });

  const sealMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#D92662'),
    emissive: new THREE.Color('#6E0D2E'),
    emissiveIntensity: 0.25,
    roughness: 0.2,
    clearcoat: 0.92,
    clearcoatRoughness: 0.12,
  });

  const letterGlowMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#FAF2F6'),
    emissive: new THREE.Color('#F0B6D5'),
    emissiveIntensity: 0.22,
    roughness: 0.42,
  });

  const crystalHeartMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#FF4F87'),
    emissive: new THREE.Color('#D92662'),
    emissiveIntensity: 0.65,
    roughness: 0.14,
    metalness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
  });

  // Envelope dimensions
  const envW = 0.92;
  const envH = 0.62;
  const envD = 0.036;

  // 1. Envelope Back & Pocket
  const backBody = registerHit(new THREE.Mesh(new THREE.BoxGeometry(envW, envH, envD), paperMat));
  root.add(backBody);

  // Decorative Gold Trim Frame on front of envelope
  const borderGroup = new THREE.Group();
  borderGroup.position.z = envD / 2 + 0.004;
  const barTop = new THREE.Mesh(new THREE.BoxGeometry(envW - 0.06, 0.012, 0.005), goldTrimMat);
  barTop.position.y = envH / 2 - 0.035;
  const barBot = barTop.clone();
  barBot.position.y = -envH / 2 + 0.035;
  const barLeft = new THREE.Mesh(new THREE.BoxGeometry(0.012, envH - 0.06, 0.005), goldTrimMat);
  barLeft.position.x = -envW / 2 + 0.035;
  const barRight = barLeft.clone();
  barRight.position.x = envW / 2 - 0.035;
  borderGroup.add(barTop, barBot, barLeft, barRight);
  root.add(borderGroup);

  // Pink inner pocket lining
  const liningMesh = new THREE.Mesh(new THREE.PlaneGeometry(envW - 0.08, envH - 0.08), liningMat);
  liningMesh.position.z = envD / 2 + 0.002;
  root.add(liningMesh);

  // 2. Rising Glowing Letter Parchment Sheet
  const letterGroup = new THREE.Group();
  letterGroup.position.set(0, 0.02, envD / 2 + 0.005);
  root.add(letterGroup);

  const letterSheet = registerHit(new THREE.Mesh(new THREE.BoxGeometry(envW * 0.84, envH * 0.86, 0.012), letterGlowMat));
  letterGroup.add(letterSheet);

  const letterGoldLine = new THREE.Mesh(new THREE.BoxGeometry(envW * 0.68, 0.012, 0.016), goldTrimMat);
  letterGoldLine.position.y = envH * 0.28;
  letterGroup.add(letterGoldLine);

  // 3. Hinged Top Flap (rotates from top edge y = +envH/2)
  const flapPivot = new THREE.Group();
  flapPivot.position.set(0, envH / 2, envD / 2 + 0.008);
  root.add(flapPivot);

  const flapShape = new THREE.Shape();
  flapShape.moveTo(-envW / 2, 0);
  flapShape.lineTo(envW / 2, 0);
  flapShape.lineTo(0.05, -envH * 0.54);
  flapShape.quadraticCurveTo(0, -envH * 0.58, -0.05, -envH * 0.54);
  flapShape.closePath();

  const flapGeo = new THREE.ExtrudeGeometry(flapShape, {
    depth: 0.012,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
  });
  const flapMesh = registerHit(new THREE.Mesh(flapGeo, paperMat));
  flapPivot.add(flapMesh);

  // 4. Wax Heart Seal + Interactive Glow Ring (on flap tip)
  const sealPivot = new THREE.Group();
  sealPivot.position.set(0, -envH * 0.48, 0.026);
  flapPivot.add(sealPivot);

  const waxDisc = registerHit(new THREE.Mesh(new THREE.CylinderGeometry(0.108, 0.116, 0.014, 28), sealMat));
  waxDisc.rotation.x = Math.PI / 2;
  sealPivot.add(waxDisc);

  const waxHeartGeo = new THREE.ExtrudeGeometry(createHeartShape(0.26), {
    depth: 0.016,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
  });
  waxHeartGeo.center();
  const waxHeart = registerHit(new THREE.Mesh(waxHeartGeo, goldTrimMat));
  waxHeart.position.z = 0.019;
  sealPivot.add(waxHeart);

  const sealRingMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#FF8AC9'),
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const sealHaloRing = new THREE.Mesh(new THREE.RingGeometry(0.135, 0.155, 36), sealRingMat);
  sealHaloRing.position.z = 0.018;
  sealPivot.add(sealHaloRing);

  // 5. Beating 3D Crystal Heart above unfolded letter
  const beatingHeartGroup = new THREE.Group();
  beatingHeartGroup.position.set(0, 0.88, 0.08);
  beatingHeartGroup.scale.setScalar(0);
  root.add(beatingHeartGroup);

  const crystalHeartGeo = new THREE.ExtrudeGeometry(createHeartShape(0.62), {
    depth: 0.12,
    bevelEnabled: true,
    bevelThickness: 0.036,
    bevelSize: 0.028,
    bevelSegments: 4,
  });
  crystalHeartGeo.center();
  const crystalHeartMesh = new THREE.Mesh(crystalHeartGeo, crystalHeartMat);
  beatingHeartGroup.add(crystalHeartMesh);

  const envelopeLight = new THREE.PointLight('#FF88C8', 0, 4.5, 1.8);
  envelopeLight.position.set(0, 0.35, 0.65);
  root.add(envelopeLight);

  let currentUnfold = 0;
  let currentEmerge = 0;

  const startPos = new THREE.Vector3(0, 1.58, 0.05);
  const readyPos = new THREE.Vector3(0, 2.32, 1.72);

  return {
    root,
    getHitMeshes() {
      return hitMeshes;
    },
    getSealWorldPosition(target = new THREE.Vector3()) {
      sealPivot.getWorldPosition(target);
      return target;
    },
    setEmergeProgress(t) {
      currentEmerge = clamp(t, 0, 1);
      root.visible = currentEmerge > 0.005;
      if (!root.visible) return;

      const e = easeOutCubic(currentEmerge);
      root.position.lerpVectors(startPos, readyPos, e);
      const s = THREE.MathUtils.lerp(0.32, 0.86, easeOutBack(clamp(currentEmerge * 1.05, 0, 1)));
      root.scale.setScalar(s);
      root.rotation.y = (1 - e) * Math.PI * 0.45;
      envelopeLight.intensity = e * 0.65;
    },
    setUnfoldProgress(t) {
      currentUnfold = clamp(t, 0, 1);

      // 0.0 -> 0.25: Wax seal dissolves into burst
      const sealShrink = 1 - easeOutCubic(clamp(currentUnfold / 0.22, 0, 1));
      sealPivot.scale.setScalar(Math.max(0.0001, sealShrink));
      sealPivot.visible = sealShrink > 0.02;

      // 0.15 -> 0.60: Envelope flap opens backward
      const flapT = easeInOutCubic(clamp((currentUnfold - 0.14) / 0.44, 0, 1));
      flapPivot.rotation.x = THREE.MathUtils.lerp(0, -Math.PI * 0.84, flapT);

      // 0.36 -> 0.82: Letter sheet glides up
      const letterT = easeOutCubic(clamp((currentUnfold - 0.36) / 0.46, 0, 1));
      letterGroup.position.y = THREE.MathUtils.lerp(0.02, 0.56, letterT);
      letterGroup.position.z = envD / 2 + 0.005 + letterT * 0.03;

      // 0.58 -> 1.0: Crystal 3D heart blooms above the letter
      const heartT = easeOutBack(clamp((currentUnfold - 0.58) / 0.42, 0, 1));
      beatingHeartGroup.scale.setScalar(Math.max(0, heartT * 0.92));
      envelopeLight.intensity = 0.65 + currentUnfold * 0.45;
    },
    update(time) {
      if (!root.visible) return;

      // Subtle floating hover when emerged
      if (currentEmerge >= 0.95) {
        const hover = Math.sin(time * 1.8) * 0.045;
        const finaleLift = currentUnfold * 0.18;
        root.position.y = readyPos.y + hover + finaleLift;
        root.rotation.z = Math.sin(time * 1.1) * 0.025;
        if (currentUnfold < 0.05) {
          root.rotation.y = Math.sin(time * 0.9) * 0.12;
        } else {
          root.rotation.y = THREE.MathUtils.lerp(root.rotation.y, 0, 0.08);
        }
      }

      // Pulse waiting halo around wax seal
      if (sealPivot.visible) {
        const ringPulse = 1 + 0.16 * Math.sin(time * 4.0);
        sealHaloRing.scale.setScalar(ringPulse);
        sealRingMat.opacity = 0.48 + 0.35 * Math.sin(time * 4.0);
      }

      // Lub-dub heartbeat & graceful rotation for crystal 3D heart
      if (currentUnfold > 0.58) {
        const beat = Math.pow(Math.max(0, Math.sin(time * 3.6)), 6) * 0.12;
        const beat2 = Math.pow(Math.max(0, Math.sin(time * 3.6 - 0.55)), 8) * 0.07;
        const baseScale = easeOutBack(clamp((currentUnfold - 0.58) / 0.42, 0, 1)) * 0.92;
        beatingHeartGroup.scale.setScalar(baseScale * (1 + beat + beat2));
        beatingHeartGroup.rotation.y = Math.sin(time * 1.15) * 0.36;
      }
    },
  };
}
