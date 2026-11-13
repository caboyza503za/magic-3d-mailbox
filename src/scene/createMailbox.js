import * as THREE from 'three';
import { createHeartShape } from '../utils/geometryHelpers.js';
import { easeOutBack, easeInOutCubic, clamp, randomRange } from '../utils/easing.js';

export function createMailbox(scene) {
  const root = new THREE.Group();
  root.position.set(0, 0.22, 0);
  scene.add(root);

  const hitMeshes = [];
  const registerHit = (mesh) => {
    hitMeshes.push(mesh);
    return mesh;
  };

  // Materials
  const plumEnamelMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#2E2464'),
    roughness: 0.25,
    metalness: 0.24,
    clearcoat: 0.94,
    clearcoatRoughness: 0.12,
  });

  const roseGoldMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#F5C28B'),
    metalness: 0.88,
    roughness: 0.22,
  });

  const postMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#191736'),
    metalness: 0.65,
    roughness: 0.38,
  });

  const heartGlassMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#FF8AC9'),
    emissive: new THREE.Color('#FF4F87'),
    emissiveIntensity: 0.9,
    roughness: 0.2,
    metalness: 0.1,
  });

  const flagHeartMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#FF4F87'),
    emissive: new THREE.Color('#CC225B'),
    emissiveIntensity: 0.55,
    roughness: 0.22,
    clearcoat: 0.8,
  });

  // 1. Pedestal Post & Decorative Collars
  const baseFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 0.16, 20), roseGoldMat);
  baseFlange.position.y = 0.08;
  root.add(baseFlange);

  const postShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 1.18, 20), postMat);
  postShaft.position.y = 0.68;
  root.add(postShaft);

  const midRing = new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.024, 12, 24), roseGoldMat);
  midRing.rotation.x = Math.PI / 2;
  midRing.position.y = 0.72;
  root.add(midRing);

  const topBracket = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.08, 0.82), roseGoldMat);
  topBracket.position.y = 1.24;
  root.add(topBracket);

  // Climbing Glowing Flower Vines around Post
  const vineCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.16, 0.12, 0.08),
    new THREE.Vector3(-0.15, 0.36, 0.14),
    new THREE.Vector3(-0.14, 0.62, -0.14),
    new THREE.Vector3(0.15, 0.88, -0.12),
    new THREE.Vector3(0.16, 1.16, 0.12),
  ]);
  const vineMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#216B62'),
    roughness: 0.65,
  });
  const vineMesh = new THREE.Mesh(new THREE.TubeGeometry(vineCurve, 36, 0.018, 7, false), vineMat);
  root.add(vineMesh);

  const tinyBloomGeo = new THREE.OctahedronGeometry(0.042, 1);
  for (let i = 1; i <= 7; i++) {
    const pt = vineCurve.getPoint(i / 8);
    const blossom = new THREE.Mesh(
      tinyBloomGeo,
      new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? '#FF8AC9' : '#74F2CE',
        emissive: i % 2 === 0 ? '#FF5FA8' : '#2CE6C8',
        emissiveIntensity: 1.4,
        roughness: 0.2,
      })
    );
    blossom.position.copy(pt).add(new THREE.Vector3(randomRange(-0.03, 0.03), 0, randomRange(-0.03, 0.03)));
    root.add(blossom);
  }

  // 2. Mailbox Hollow Arched Chamber (centered at y = 1.58)
  const mailboxBodyGroup = new THREE.Group();
  mailboxBodyGroup.position.set(0, 1.28, 0);
  root.add(mailboxBodyGroup);

  const w = 0.36; // half-width
  const hStraight = 0.32;
  const rArch = w;
  const wallT = 0.055;
  const depth = 0.98;

  const outerShape = new THREE.Shape();
  outerShape.moveTo(-w, 0);
  outerShape.lineTo(w, 0);
  outerShape.lineTo(w, hStraight);
  outerShape.absarc(0, hStraight, rArch, 0, Math.PI, false);
  outerShape.lineTo(-w, 0);

  const innerHole = new THREE.Path();
  const iw = w - wallT;
  const ir = rArch - wallT;
  innerHole.moveTo(-iw, wallT * 0.75);
  innerHole.lineTo(iw, wallT * 0.75);
  innerHole.lineTo(iw, hStraight);
  innerHole.absarc(0, hStraight, ir, 0, Math.PI, false);
  innerHole.lineTo(-iw, wallT * 0.75);
  outerShape.holes.push(innerHole);

  const shellGeo = new THREE.ExtrudeGeometry(outerShape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 3,
    curveSegments: 28,
  });
  shellGeo.translate(0, 0, -depth / 2);
  const shellMesh = registerHit(new THREE.Mesh(shellGeo, plumEnamelMat));
  mailboxBodyGroup.add(shellMesh);

  // Back wall plate closing the rear (-Z)
  const backShape = new THREE.Shape();
  backShape.moveTo(-w, 0);
  backShape.lineTo(w, 0);
  backShape.lineTo(w, hStraight);
  backShape.absarc(0, hStraight, rArch, 0, Math.PI, false);
  backShape.lineTo(-w, 0);

  const backGeo = new THREE.ExtrudeGeometry(backShape, {
    depth: 0.04,
    bevelEnabled: false,
    curveSegments: 24,
  });
  backGeo.translate(0, 0, -depth / 2 - 0.02);
  const backMesh = registerHit(new THREE.Mesh(backGeo, plumEnamelMat));
  mailboxBodyGroup.add(backMesh);

  // Front & Back Rose-Gold Arch Trim Rings
  const trimShape = new THREE.Shape();
  const tw = w + 0.022;
  trimShape.moveTo(-tw, -0.01);
  trimShape.lineTo(tw, -0.01);
  trimShape.lineTo(tw, hStraight);
  trimShape.absarc(0, hStraight, tw, 0, Math.PI, false);
  trimShape.lineTo(-tw, -0.01);

  const trimHole = new THREE.Path();
  trimHole.moveTo(-iw, wallT * 0.75);
  trimHole.lineTo(iw, wallT * 0.75);
  trimHole.lineTo(iw, hStraight);
  trimHole.absarc(0, hStraight, ir, 0, Math.PI, false);
  trimHole.lineTo(-iw, wallT * 0.75);
  trimShape.holes.push(trimHole);

  const frontTrimGeo = new THREE.ExtrudeGeometry(trimShape, {
    depth: 0.025,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 2,
    curveSegments: 28,
  });
  const frontTrim = registerHit(new THREE.Mesh(frontTrimGeo, roseGoldMat));
  frontTrim.position.z = depth / 2 - 0.01;
  mailboxBodyGroup.add(frontTrim);

  const backTrim = registerHit(new THREE.Mesh(frontTrimGeo, roseGoldMat));
  backTrim.position.z = -depth / 2 - 0.025;
  mailboxBodyGroup.add(backTrim);

  // Top Ridge Finial Crest (Heart Crown on top of Mailbox roof)
  const crownHeartGeo = new THREE.ExtrudeGeometry(createHeartShape(0.32), {
    depth: 0.04,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2,
  });
  crownHeartGeo.center();
  const crownHeart = registerHit(new THREE.Mesh(crownHeartGeo, heartGlassMat));
  crownHeart.position.set(0, hStraight + rArch + 0.14, 0.22);
  mailboxBodyGroup.add(crownHeart);

  // Side Glowing Heart Windows (Left & Right)
  const sideHeartGeo = new THREE.ExtrudeGeometry(createHeartShape(0.45), {
    depth: 0.03,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 2,
  });
  sideHeartGeo.center();

  const leftHeart = registerHit(new THREE.Mesh(sideHeartGeo, heartGlassMat));
  leftHeart.rotation.y = -Math.PI / 2;
  leftHeart.position.set(-w - 0.01, 0.34, 0);
  mailboxBodyGroup.add(leftHeart);

  const rightHeart = registerHit(new THREE.Mesh(sideHeartGeo, heartGlassMat));
  rightHeart.rotation.y = Math.PI / 2;
  rightHeart.position.set(w + 0.01, 0.34, 0);
  mailboxBodyGroup.add(rightHeart);

  // 3. Hinged Front Door Pivot (at bottom front edge z = +depth/2)
  const doorPivot = new THREE.Group();
  doorPivot.position.set(0, 0.02, depth / 2 + 0.02);
  mailboxBodyGroup.add(doorPivot);

  const doorPanelShape = new THREE.Shape();
  const dw = iw + 0.02;
  doorPanelShape.moveTo(-dw, 0);
  doorPanelShape.lineTo(dw, 0);
  doorPanelShape.lineTo(dw, hStraight - 0.01);
  doorPanelShape.absarc(0, hStraight - 0.01, dw, 0, Math.PI, false);
  doorPanelShape.lineTo(-dw, 0);

  const doorGeo = new THREE.ExtrudeGeometry(doorPanelShape, {
    depth: 0.032,
    bevelEnabled: true,
    bevelThickness: 0.009,
    bevelSize: 0.009,
    bevelSegments: 2,
    curveSegments: 24,
  });
  const doorMesh = registerHit(new THREE.Mesh(doorGeo, plumEnamelMat));
  doorPivot.add(doorMesh);

  // Door Gold Emblem & Glowing Heart Lock
  const doorHeartGeo = new THREE.ExtrudeGeometry(createHeartShape(0.36), {
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelSegments: 2,
  });
  doorHeartGeo.center();
  const doorLockHeart = registerHit(new THREE.Mesh(doorHeartGeo, heartGlassMat));
  doorLockHeart.position.set(0, 0.34, 0.042);
  doorPivot.add(doorLockHeart);

  const doorHandle = registerHit(new THREE.Mesh(new THREE.SphereGeometry(0.038, 16, 16), roseGoldMat));
  doorHandle.position.set(0, 0.56, 0.055);
  doorPivot.add(doorHandle);

  // 4. Articulated Heart Flag (right side)
  const flagPivot = new THREE.Group();
  flagPivot.position.set(w + 0.045, 0.28, 0.16);
  mailboxBodyGroup.add(flagPivot);

  const flagPin = registerHit(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 12), roseGoldMat));
  flagPin.rotation.z = Math.PI / 2;
  flagPivot.add(flagPin);

  const flagRod = registerHit(new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.44, 10), roseGoldMat));
  flagRod.position.set(0.02, 0.22, 0);
  flagPivot.add(flagRod);

  const flagHeartGeo = new THREE.ExtrudeGeometry(createHeartShape(0.34), {
    depth: 0.025,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelSegments: 2,
  });
  flagHeartGeo.center();
  const flagHeart = registerHit(new THREE.Mesh(flagHeartGeo, flagHeartMat));
  flagHeart.rotation.y = Math.PI / 2;
  flagHeart.position.set(0.025, 0.46, 0);
  flagPivot.add(flagHeart);

  // Initial lowered resting pose for the flag
  flagPivot.rotation.x = -Math.PI * 0.46;

  // 5. Inner Warm Point Light + Volumetric-style Light Beam Cone
  const innerLight = new THREE.PointLight('#FF9BD2', 1.4, 4.2, 1.8);
  innerLight.position.set(0, 0.32, 0.1);
  mailboxBodyGroup.add(innerLight);

  const beamUniforms = {
    uOpacity: { value: 0 },
  };
  const beamGeo = new THREE.ConeGeometry(0.78, 1.9, 28, 1, true);
  beamGeo.translate(0, -0.95, 0);
  beamGeo.rotateX(-Math.PI / 2);
  const beamMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: beamUniforms,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        float fade = pow(vUv.y, 1.65) * 0.72;
        vec3 col = mix(vec3(1.0, 0.56, 0.80), vec3(0.98, 0.82, 0.58), vUv.y);
        gl_FragColor = vec4(col, fade * uOpacity);
      }
    `,
  });
  const lightBeam = new THREE.Mesh(beamGeo, beamMat);
  lightBeam.position.set(0, 0.34, 0.38);
  mailboxBodyGroup.add(lightBeam);

  let openProgress = 0;
  let flagProgress = 0;

  return {
    root,
    getHitMeshes() {
      return hitMeshes;
    },
    getDoorOpeningWorldPosition(target = new THREE.Vector3()) {
      target.set(0, 1.62, 0.48);
      root.localToWorld(target);
      return target;
    },
    setProgress(flagT, openT) {
      flagProgress = clamp(flagT, 0, 1);
      openProgress = clamp(openT, 0, 1);

      const fEase = easeOutBack(flagProgress);
      flagPivot.rotation.x = THREE.MathUtils.lerp(-Math.PI * 0.46, 0, fEase);

      const dEase = easeInOutCubic(openProgress);
      doorPivot.rotation.x = THREE.MathUtils.lerp(0, Math.PI * 0.62, dEase);

      beamUniforms.uOpacity.value = clamp(openProgress * 0.48, 0, 0.42);
      innerLight.intensity = 0.85 + openProgress * 1.65;
    },
    update(time) {
      // Gentle breathing glow on stained-glass heart windows
      const pulse = 0.85 + 0.25 * Math.sin(time * 2.4);
      heartGlassMat.emissiveIntensity = pulse + openProgress * 0.35;

      // Subtle crown heart bob
      crownHeart.rotation.y = Math.sin(time * 1.3) * 0.22;
      crownHeart.position.y = hStraight + rArch + 0.14 + Math.sin(time * 2.2) * 0.015;
    },
  };
}
