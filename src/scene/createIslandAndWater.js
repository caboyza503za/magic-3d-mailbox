import * as THREE from 'three';
import { randomRange } from '../utils/easing.js';

/**
 * Builds a single multi-petal lotus flower BufferGeometry (6 cupped petals).
 */
function createLotusBloomGeometry() {
  const petalShape = new THREE.Shape();
  petalShape.moveTo(0, 0);
  petalShape.bezierCurveTo(0.055, 0.04, 0.065, 0.14, 0, 0.19);
  petalShape.bezierCurveTo(-0.065, 0.14, -0.055, 0.04, 0, 0);

  const singlePetal = new THREE.ShapeGeometry(petalShape, 6);
  const geometries = [];

  for (let i = 0; i < 6; i++) {
    const g = singlePetal.clone();
    const angle = (i / 6) * Math.PI * 2;
    g.rotateX(0.68); // Cup outward
    g.rotateY(angle);
    g.translate(0, 0.36, 0);
    geometries.push(g);
  }

  // Merge petal geometries into one BufferGeometry manually
  let totalVerts = 0;
  let totalIdx = 0;
  for (const g of geometries) {
    totalVerts += g.attributes.position.count;
    totalIdx += g.index ? g.index.count : 0;
  }

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const indices = new Uint16Array(totalIdx);

  let vOffset = 0;
  let iOffset = 0;
  for (const g of geometries) {
    const pos = g.attributes.position.array;
    const norm = g.attributes.normal.array;
    positions.set(pos, vOffset * 3);
    normals.set(norm, vOffset * 3);
    if (g.index) {
      const idx = g.index.array;
      for (let k = 0; k < idx.length; k++) {
        indices[iOffset + k] = idx[k] + vOffset;
      }
      iOffset += idx.length;
    }
    vOffset += g.attributes.position.count;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  merged.setIndex(new THREE.BufferAttribute(indices, 1));
  return merged;
}

export function createIslandAndWater(scene) {
  const islandGroup = new THREE.Group();
  scene.add(islandGroup);

  // 1. Floating Crystal Rock Underside
  const underGeo = new THREE.ConeGeometry(3.25, 2.7, 11, 2);
  const posAttr = underGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const z = posAttr.getZ(i);
    if (y < 1.2) {
      const jitter = 0.85 + 0.25 * Math.sin(x * 2.9 + z * 2.1);
      posAttr.setX(i, x * jitter);
      posAttr.setZ(i, z * jitter);
    }
  }
  underGeo.computeVertexNormals();

  const rockMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#141836'),
    roughness: 0.78,
    metalness: 0.22,
    flatShading: true,
  });
  const underRock = new THREE.Mesh(underGeo, rockMat);
  underRock.rotation.x = Math.PI;
  underRock.position.y = -1.38;
  islandGroup.add(underRock);

  // Hanging glowing crystal shards under the island
  const shardGeo = new THREE.OctahedronGeometry(0.22, 0);
  const shardColors = ['#2CE6C8', '#9D6BFF', '#FF70B8'];
  for (let i = 0; i < 9; i++) {
    const angle = (i / 9) * Math.PI * 2 + 0.3;
    const dist = randomRange(0.95, 2.3);
    const shard = new THREE.Mesh(
      shardGeo,
      new THREE.MeshStandardMaterial({
        color: shardColors[i % shardColors.length],
        emissive: shardColors[i % shardColors.length],
        emissiveIntensity: 0.95,
        roughness: 0.2,
        metalness: 0.1,
      })
    );
    shard.scale.set(0.62, randomRange(1.4, 2.5), 0.62);
    shard.position.set(
      Math.cos(angle) * dist,
      randomRange(-1.75, -0.78),
      Math.sin(angle) * dist
    );
    shard.rotation.set(randomRange(-0.2, 0.2), angle, randomRange(-0.2, 0.2));
    islandGroup.add(shard);
  }

  // 2. Velvet Mossy Mound Top
  const moundGeo = new THREE.CylinderGeometry(3.25, 3.35, 0.36, 48, 3);
  const moundPos = moundGeo.attributes.position;
  for (let i = 0; i < moundPos.count; i++) {
    const x = moundPos.getX(i);
    const y = moundPos.getY(i);
    const z = moundPos.getZ(i);
    const r = Math.hypot(x, z);
    if (y > 0) {
      const dome = Math.cos(Math.min(1, r / 3.4) * Math.PI * 0.5) * 0.18;
      moundPos.setY(i, y + dome);
    }
  }
  moundGeo.computeVertexNormals();

  const mossMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#0E1B36'),
    roughness: 0.9,
    metalness: 0.06,
  });
  const moundMesh = new THREE.Mesh(moundGeo, mossMat);
  moundMesh.position.y = -0.05;
  moundMesh.receiveShadow = true;
  islandGroup.add(moundMesh);

  // 3. Moonlit Ripple Pond Ring Shader
  const waterUniforms = {
    uTime: { value: 0 },
  };
  const waterGeo = new THREE.RingGeometry(0.45, 2.75, 64, 1);
  const waterMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: waterUniforms,
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vPos;
      void main() {
        vUv = uv;
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vPos;

      void main() {
        float dist = length(vPos.xy);
        float normDist = clamp((dist - 0.45) / 2.3, 0.0, 1.0);

        float ripple = sin(dist * 14.0 - uTime * 2.2) * 0.5 + 0.5;
        float ripple2 = sin(dist * 24.0 - uTime * 3.1 + atan(vPos.y, vPos.x) * 3.0) * 0.5 + 0.5;
        float sheen = pow(ripple * 0.65 + ripple2 * 0.35, 3.2);

        vec3 poolColor = mix(vec3(0.04, 0.14, 0.28), vec3(0.14, 0.06, 0.30), normDist);
        vec3 auroraGlint = mix(vec3(0.14, 0.72, 0.65), vec3(0.85, 0.32, 0.58), 0.5 + 0.5 * sin(uTime * 0.8 + dist * 2.0));

        vec3 col = poolColor + auroraGlint * sheen * 0.45;
        float edgeMask = smoothstep(0.0, 0.16, normDist) * smoothstep(1.0, 0.76, normDist);

        gl_FragColor = vec4(col, edgeMask * (0.45 + sheen * 0.28));
      }
    `,
  });
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.y = 0.24;
  islandGroup.add(waterMesh);

  // 4. Counter-Rotating Magic Rune Rings at Base
  const ringMat1 = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#9D6BFF'),
    transparent: true,
    opacity: 0.48,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const ringMat2 = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#F5C28B'),
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const magicRingOuter = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.19, 64), ringMat1);
  magicRingOuter.rotation.x = -Math.PI / 2;
  magicRingOuter.position.y = 0.26;
  islandGroup.add(magicRingOuter);

  const magicRingInner = new THREE.Mesh(new THREE.RingGeometry(0.76, 0.79, 48), ringMat2);
  magicRingInner.rotation.x = -Math.PI / 2;
  magicRingInner.position.y = 0.265;
  islandGroup.add(magicRingInner);

  const gemGroupOuter = new THREE.Group();
  gemGroupOuter.position.y = 0.27;
  const miniGemGeo = new THREE.OctahedronGeometry(0.042, 0);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const gem = new THREE.Mesh(
      miniGemGeo,
      new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? '#2CE6C8' : '#FF70B8',
        transparent: true,
        opacity: 0.85,
      })
    );
    gem.position.set(Math.cos(a) * 1.17, 0, Math.sin(a) * 1.17);
    gemGroupOuter.add(gem);
  }
  islandGroup.add(gemGroupOuter);

  // 5. Sculpted 6-Petal Glowing Lotus Flowers (InstancedMesh with Wind Sway Shader)
  const flowerCount = 54;
  const flowerGroup = new THREE.Group();
  islandGroup.add(flowerGroup);

  const stemGeo = new THREE.CylinderGeometry(0.014, 0.02, 0.36, 6);
  stemGeo.translate(0, 0.18, 0);
  const stemMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1B5952'),
    roughness: 0.7,
  });

  const bloomGeo = createLotusBloomGeometry();
  const stamenGeo = new THREE.SphereGeometry(0.036, 8, 8);
  stamenGeo.translate(0, 0.4, 0);

  const flowerUniforms = { uTime: { value: 0 } };
  const bloomMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#FFFFFF'),
    emissive: new THREE.Color('#5A1E4E'),
    emissiveIntensity: 0.45,
    roughness: 0.28,
    side: THREE.DoubleSide,
  });

  const stamenMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#FFE09E'),
    emissive: new THREE.Color('#FFB86C'),
    emissiveIntensity: 1.0,
    roughness: 0.25,
  });

  const injectWindSway = (shader) => {
    shader.uniforms.uTime = flowerUniforms.uTime;
    shader.vertexShader =
      `uniform float uTime;\n` +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         float sway = sin(uTime * 1.8 + position.x * 3.0 + float(gl_InstanceID) * 0.7) * 0.035;
         transformed.x += sway * max(0.0, transformed.y * 2.0);
        `
      );
  };
  bloomMat.onBeforeCompile = injectWindSway;
  stamenMat.onBeforeCompile = injectWindSway;

  const stemInst = new THREE.InstancedMesh(stemGeo, stemMat, flowerCount);
  const bloomInst = new THREE.InstancedMesh(bloomGeo, bloomMat, flowerCount);
  const stamenInst = new THREE.InstancedMesh(stamenGeo, stamenMat, flowerCount);

  const flowerColorPalette = [
    new THREE.Color('#FF70B8'),
    new THREE.Color('#74F2CE'),
    new THREE.Color('#B990FF'),
    new THREE.Color('#FFD29D'),
  ];

  const dummy = new THREE.Object3D();
  for (let i = 0; i < flowerCount; i++) {
    const angle = randomRange(0, Math.PI * 2);
    const radius = randomRange(0.95, 2.95);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = 0.14 + Math.cos(Math.min(1, radius / 3.4) * Math.PI * 0.5) * 0.14;
    const scale = randomRange(0.68, 1.25);

    dummy.position.set(x, y, z);
    dummy.rotation.set(randomRange(-0.12, 0.12), randomRange(0, Math.PI * 2), randomRange(-0.12, 0.12));
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();

    stemInst.setMatrixAt(i, dummy.matrix);
    bloomInst.setMatrixAt(i, dummy.matrix);
    stamenInst.setMatrixAt(i, dummy.matrix);
    bloomInst.setColorAt(i, flowerColorPalette[i % flowerColorPalette.length]);
  }
  stemInst.instanceMatrix.needsUpdate = true;
  bloomInst.instanceMatrix.needsUpdate = true;
  stamenInst.instanceMatrix.needsUpdate = true;
  if (bloomInst.instanceColor) bloomInst.instanceColor.needsUpdate = true;

  flowerGroup.add(stemInst, bloomInst, stamenInst);

  // 6. Glowing Fairy Mushrooms & Crystal Buds
  const mushCount = 22;
  const mushCapGeo = new THREE.SphereGeometry(0.075, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const mushMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#5AE8CE'),
    emissive: new THREE.Color('#2CE6C8'),
    emissiveIntensity: 0.78,
    roughness: 0.25,
  });
  const mushInst = new THREE.InstancedMesh(mushCapGeo, mushMat, mushCount);

  for (let i = 0; i < mushCount; i++) {
    const angle = randomRange(0, Math.PI * 2);
    const radius = randomRange(1.3, 2.85);
    const y = 0.18 + Math.cos(Math.min(1, radius / 3.4) * Math.PI * 0.5) * 0.12;
    dummy.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    dummy.rotation.set(randomRange(-0.15, 0.15), angle, randomRange(-0.15, 0.15));
    dummy.scale.setScalar(randomRange(0.6, 1.35));
    dummy.updateMatrix();
    mushInst.setMatrixAt(i, dummy.matrix);
  }
  mushInst.instanceMatrix.needsUpdate = true;
  islandGroup.add(mushInst);

  // 7. Curved Wrought-Iron Lantern Post
  const lanternPostGroup = new THREE.Group();
  lanternPostGroup.position.set(-1.35, 0.24, -0.45);
  lanternPostGroup.rotation.y = 0.45;

  const ironMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#23203A'),
    metalness: 0.78,
    roughness: 0.35,
  });
  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#F5C28B'),
    metalness: 0.85,
    roughness: 0.25,
  });

  const postCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 1.35, 0),
    new THREE.Vector3(0.08, 2.15, 0),
    new THREE.Vector3(0.42, 2.42, 0),
    new THREE.Vector3(0.64, 2.22, 0),
  ]);
  const postTube = new THREE.Mesh(new THREE.TubeGeometry(postCurve, 28, 0.036, 8, false), ironMat);
  lanternPostGroup.add(postTube);

  const lanternCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.12, 12), goldTrimMat);
  lanternCollar.position.set(0, 0.06, 0);
  lanternPostGroup.add(lanternCollar);

  const lanternPivot = new THREE.Group();
  lanternPivot.position.set(0.64, 2.2, 0);

  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.18, 6), goldTrimMat);
  chain.position.y = -0.09;
  lanternPivot.add(chain);

  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.12, 6), goldTrimMat);
  cap.position.y = -0.22;
  lanternPivot.add(cap);

  const lanternCore = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.11, 0),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#FFE9C2'),
      emissive: new THREE.Color('#FFB86C'),
      emissiveIntensity: 1.4,
      roughness: 0.15,
    })
  );
  lanternCore.scale.set(0.95, 1.35, 0.95);
  lanternCore.position.y = -0.35;
  lanternPivot.add(lanternCore);

  const lanternLight = new THREE.PointLight('#FFB36B', 1.6, 5.2, 1.8);
  lanternLight.position.set(0, -0.36, 0);
  lanternPivot.add(lanternLight);

  lanternPostGroup.add(lanternPivot);
  islandGroup.add(lanternPostGroup);

  return {
    group: islandGroup,
    update(time) {
      waterUniforms.uTime.value = time;
      flowerUniforms.uTime.value = time;

      islandGroup.position.y = Math.sin(time * 0.75) * 0.06;

      magicRingOuter.rotation.z = time * 0.22;
      gemGroupOuter.rotation.y = -time * 0.22;
      magicRingInner.rotation.z = -time * 0.35;

      lanternPivot.rotation.z = Math.sin(time * 1.4) * 0.06;
      lanternPivot.rotation.x = Math.cos(time * 1.05) * 0.04;
      lanternLight.intensity = 1.5 + Math.sin(time * 3.1) * 0.18;
    },
  };
}
