import './styles.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

import { SoundEngine } from './audio/soundEngine.js';
import { QualityManager } from './utils/qualityManager.js';
import { damp, clamp, randomRange } from './utils/easing.js';
import { createSkyAndAurora } from './scene/createSkyAndAurora.js';
import { createIslandAndWater } from './scene/createIslandAndWater.js';
import { createMailbox } from './scene/createMailbox.js';
import { createEnvelope } from './scene/createEnvelope.js';
import { createLivingParticles } from './scene/createLivingParticles.js';
import { createFireworksAndBursts } from './scene/createFireworksAndBursts.js';

const STATES = {
  IDLE_EXPLORE: 'IDLE_EXPLORE',
  OPENING_MAILBOX: 'OPENING_MAILBOX',
  ENVELOPE_READY: 'ENVELOPE_READY',
  UNFOLDING_FINALE: 'UNFOLDING_FINALE',
};

function init() {
  const canvas = document.getElementById('scene-canvas');
  const loadingVeil = document.getElementById('loading-veil');
  const audioToggle = document.getElementById('audio-toggle');
  const hintPill = document.getElementById('hint-pill');
  const finaleCard = document.getElementById('finale-card');
  const replayBtn = document.getElementById('replay-btn');
  const fallbackBox = document.getElementById('webgl-fallback');

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
  } catch {
    loadingVeil.classList.add('is-hidden');
    fallbackBox.hidden = false;
    return;
  }

  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#090C24', 0.012);

  const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 160);

  // Post-processing Composer with balanced UnrealBloom
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.42,
    0.44,
    0.88
  );
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  const qualityManager = new QualityManager(renderer, bloomPass);
  const soundEngine = new SoundEngine();

  // Lighting Rig
  const hemiLight = new THREE.HemisphereLight('#8EC5FF', '#191338', 0.95);
  scene.add(hemiLight);

  const moonLight = new THREE.DirectionalLight('#DFEEFF', 1.45);
  moonLight.position.set(-7, 11, -8);
  scene.add(moonLight);

  const frontFill = new THREE.DirectionalLight('#FFD2EA', 1.15);
  frontFill.position.set(4, 5, 7);
  scene.add(frontFill);

  const rimLight = new THREE.DirectionalLight('#47F5D8', 0.75);
  rimLight.position.set(6, 3, -6);
  scene.add(rimLight);

  // Scene Modules
  const sky = createSkyAndAurora(scene);
  const island = createIslandAndWater(scene);
  const mailbox = createMailbox(scene);
  const envelope = createEnvelope(scene);
  const living = createLivingParticles(scene);
  const fireworks = createFireworksAndBursts(scene, soundEngine);

  // OrbitControls
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.minDistance = 2.6;
  controls.maxDistance = 12.5;
  controls.minPolarAngle = Math.PI * 0.16;
  controls.maxPolarAngle = Math.PI * 0.56;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.42;

  // Responsive Camera Presets (Mobile Portrait vs Landscape)
  function getCameraPreset(state) {
    const aspect = window.innerWidth / Math.max(1, window.innerHeight);
    const isPortrait = aspect < 0.85;

    if (state === STATES.IDLE_EXPLORE) {
      return isPortrait
        ? { fov: 52, pos: new THREE.Vector3(1.85, 2.75, 8.2), target: new THREE.Vector3(0, 1.55, 0) }
        : { fov: 44, pos: new THREE.Vector3(1.9, 2.35, 5.75), target: new THREE.Vector3(0, 1.45, 0) };
    }
    if (state === STATES.OPENING_MAILBOX || state === STATES.ENVELOPE_READY) {
      return isPortrait
        ? { fov: 50, pos: new THREE.Vector3(0.15, 2.28, 4.55), target: new THREE.Vector3(0, 2.18, 1.45) }
        : { fov: 44, pos: new THREE.Vector3(0.2, 2.24, 3.95), target: new THREE.Vector3(0, 2.16, 1.35) };
    }
    // UNFOLDING_FINALE
    return isPortrait
      ? { fov: 52, pos: new THREE.Vector3(0, 2.5, 5.65), target: new THREE.Vector3(0, 2.25, 0.8) }
      : { fov: 44, pos: new THREE.Vector3(0, 2.55, 5.6), target: new THREE.Vector3(0, 2.38, 0.65) };
  }

  let currentState = STATES.IDLE_EXPLORE;
  let stateElapsed = 0;
  let mailboxBurstTriggered = false;
  let finaleCardShown = false;
  let fireworkCooldown = 0;
  let auroraBoostCurrent = 0;
  let auroraBoostTarget = 0;

  let cameraTransitioning = false;
  const desiredCamPos = new THREE.Vector3();
  const desiredTarget = new THREE.Vector3();
  let desiredFov = 48;

  function applyInstantPreset(state) {
    const p = getCameraPreset(state);
    camera.fov = p.fov;
    camera.updateProjectionMatrix();
    camera.position.copy(p.pos);
    controls.target.copy(p.target);
    desiredCamPos.copy(p.pos);
    desiredTarget.copy(p.target);
    desiredFov = p.fov;
    controls.update();
  }

  function transitionCameraTo(state) {
    const p = getCameraPreset(state);
    desiredCamPos.copy(p.pos);
    desiredTarget.copy(p.target);
    desiredFov = p.fov;
    cameraTransitioning = true;
  }

  applyInstantPreset(STATES.IDLE_EXPLORE);

  function setHint(text, visible = true) {
    hintPill.textContent = text;
    hintPill.classList.toggle('is-hidden', !visible);
  }

  function enterState(nextState) {
    currentState = nextState;
    stateElapsed = 0;

    if (nextState === STATES.IDLE_EXPLORE) {
      mailboxBurstTriggered = false;
      finaleCardShown = false;
      auroraBoostTarget = 0;
      mailbox.setProgress(0, 0);
      envelope.setEmergeProgress(0);
      envelope.setUnfoldProgress(0);
      finaleCard.classList.remove('is-visible');
      finaleCard.setAttribute('aria-hidden', 'true');
      replayBtn.hidden = true;
      controls.autoRotate = true;
      controls.enableRotate = true;
      setHint('หมุนชมรอบๆ หรือแตะที่กล่องจดหมาย', true);
      transitionCameraTo(STATES.IDLE_EXPLORE);
    } else if (nextState === STATES.OPENING_MAILBOX) {
      mailboxBurstTriggered = false;
      controls.autoRotate = false;
      setHint('กำลังเปิดกล่องจดหมาย...', true);
      soundEngine.playMailboxOpen();
      transitionCameraTo(STATES.OPENING_MAILBOX);
    } else if (nextState === STATES.ENVELOPE_READY) {
      setHint('แตะที่ตราหัวใจเพื่อเปิดซอง', true);
      transitionCameraTo(STATES.ENVELOPE_READY);
    } else if (nextState === STATES.UNFOLDING_FINALE) {
      finaleCardShown = false;
      auroraBoostTarget = 1.0;
      fireworkCooldown = 2.6;
      setHint('', false);
      soundEngine.playSealBreak();
      fireworks.spawnSealBurst(envelope.getSealWorldPosition());

      // Celebratory 3D Heart Firework Volley
      window.setTimeout(() => {
        if (currentState === STATES.UNFOLDING_FINALE) {
          fireworks.launchHeartFirework(
            new THREE.Vector3(-1.8, 0.4, -1.5),
            new THREE.Vector3(-1.5, 4.9, -2.5)
          );
        }
      }, 220);
      window.setTimeout(() => {
        if (currentState === STATES.UNFOLDING_FINALE) {
          fireworks.launchHeartFirework(
            new THREE.Vector3(1.9, 0.4, -1.6),
            new THREE.Vector3(1.6, 5.2, -2.6)
          );
        }
      }, 620);
      window.setTimeout(() => {
        if (currentState === STATES.UNFOLDING_FINALE) {
          fireworks.launchHeartFirework(
            new THREE.Vector3(0, 0.4, -2.0),
            new THREE.Vector3(0, 5.7, -3.0)
          );
        }
      }, 1080);

      transitionCameraTo(STATES.UNFOLDING_FINALE);
    }
  }

  // Stop forced camera lerp if the user manually orbits in explore/finale
  controls.addEventListener('start', () => {
    controls.autoRotate = false;
    if (currentState === STATES.IDLE_EXPLORE || currentState === STATES.UNFOLDING_FINALE) {
      cameraTransitioning = false;
    }
  });

  // Audio button
  audioToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    soundEngine.unlock();
    const muted = soundEngine.toggleMute();
    audioToggle.setAttribute('aria-pressed', muted ? 'true' : 'false');
  });

  // Replay button
  replayBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    soundEngine.playTapSparkle();
    enterState(STATES.IDLE_EXPLORE);
  });

  // Allow tapping the hint pill directly as a helpful shortcut on small screens
  hintPill.style.pointerEvents = 'auto';
  hintPill.style.cursor = 'pointer';
  hintPill.addEventListener('click', (e) => {
    e.stopPropagation();
    soundEngine.unlock();
    if (currentState === STATES.IDLE_EXPLORE) {
      enterState(STATES.OPENING_MAILBOX);
    } else if (currentState === STATES.ENVELOPE_READY) {
      enterState(STATES.UNFOLDING_FINALE);
    }
  });

  // Pointer Tap vs Drag Raycasting
  const raycaster = new THREE.Raycaster();
  const pointerNdc = new THREE.Vector2();
  const tapPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const tapPlaneNormal = new THREE.Vector3();
  const tapPlanePoint = new THREE.Vector3();

  let downX = 0;
  let downY = 0;
  let downTime = 0;

  canvas.addEventListener('pointerdown', (e) => {
    downX = e.clientX;
    downY = e.clientY;
    downTime = performance.now();
  });

  canvas.addEventListener('pointerup', (e) => {
    const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
    const elapsed = performance.now() - downTime;
    if (dist > 10 || elapsed > 450) return; // Dragged to rotate 3D view

    soundEngine.unlock();

    const rect = canvas.getBoundingClientRect();
    pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointerNdc, camera);

    if (currentState === STATES.IDLE_EXPLORE) {
      const hits = raycaster.intersectObjects(mailbox.getHitMeshes(), false);
      if (hits.length > 0) {
        enterState(STATES.OPENING_MAILBOX);
        return;
      }
    } else if (currentState === STATES.ENVELOPE_READY) {
      const hits = raycaster.intersectObjects(envelope.getHitMeshes(), false);
      if (hits.length > 0) {
        enterState(STATES.UNFOLDING_FINALE);
        return;
      }
    }

    // Raycast onto camera-facing plane at scene center for magic tap burst / fireworks
    camera.getWorldDirection(tapPlaneNormal).negate();
    tapPlane.setFromNormalAndCoplanarPoint(tapPlaneNormal, new THREE.Vector3(0, 1.8, 0));
    if (raycaster.ray.intersectPlane(tapPlane, tapPlanePoint)) {
      tapPlanePoint.x = clamp(tapPlanePoint.x, -4.5, 4.5);
      tapPlanePoint.y = clamp(tapPlanePoint.y, 0.3, 6.2);
      tapPlanePoint.z = clamp(tapPlanePoint.z, -4.5, 4.5);

      fireworks.spawnTapBurst(tapPlanePoint);
      living.attractTo(tapPlanePoint);
      soundEngine.playTapSparkle();

      if (currentState === STATES.UNFOLDING_FINALE) {
        fireworks.launchHeartFirework(
          new THREE.Vector3(randomRange(-2.0, 2.0), 0.35, randomRange(-2.5, -1.0)),
          new THREE.Vector3(
            clamp(tapPlanePoint.x * 1.1, -3.5, 3.5),
            clamp(Math.max(4.1, tapPlanePoint.y + 1.4), 4.1, 6.6),
            randomRange(-3.6, -1.6)
          )
        );
      }
    }
  });

  // Resize Handler
  function handleResize() {
    const w = window.innerWidth;
    const h = Math.max(1, window.innerHeight);
    renderer.setSize(w, h);
    composer.setSize(w, h);
    bloomPass.setSize(w, h);
    camera.aspect = w / h;
    const p = getCameraPreset(currentState);
    desiredFov = p.fov;
    camera.fov = p.fov;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', handleResize);

  // Main Animation Loop
  const clock = new THREE.Clock();
  let firstFrameDone = false;

  function animate() {
    requestAnimationFrame(animate);

    const rawDt = clock.getDelta();
    const dt = Math.min(rawDt, 0.05);
    const elapsed = clock.elapsedTime;
    stateElapsed += Math.min(rawDt, 0.25);

    qualityManager.update(dt);
    const pr = qualityManager.getPixelRatio();

    // Smooth camera choreography
    if (cameraTransitioning) {
      camera.position.x = damp(camera.position.x, desiredCamPos.x, 3.6, dt);
      camera.position.y = damp(camera.position.y, desiredCamPos.y, 3.6, dt);
      camera.position.z = damp(camera.position.z, desiredCamPos.z, 3.6, dt);

      controls.target.x = damp(controls.target.x, desiredTarget.x, 3.8, dt);
      controls.target.y = damp(controls.target.y, desiredTarget.y, 3.8, dt);
      controls.target.z = damp(controls.target.z, desiredTarget.z, 3.8, dt);

      if (Math.abs(camera.fov - desiredFov) > 0.05) {
        camera.fov = damp(camera.fov, desiredFov, 4.0, dt);
        camera.updateProjectionMatrix();
      }

      if (
        camera.position.distanceTo(desiredCamPos) < 0.04 &&
        controls.target.distanceTo(desiredTarget) < 0.04
      ) {
        cameraTransitioning = false;
      }
    }

    // State Timeline Updates
    if (currentState === STATES.OPENING_MAILBOX) {
      const flagT = clamp(stateElapsed / 0.55, 0, 1);
      const openT = clamp((stateElapsed - 0.3) / 0.85, 0, 1);
      const emergeT = clamp((stateElapsed - 0.72) / 1.38, 0, 1);

      mailbox.setProgress(flagT, openT);
      envelope.setEmergeProgress(emergeT);

      if (!mailboxBurstTriggered && stateElapsed >= 0.56) {
        mailboxBurstTriggered = true;
        const doorPos = mailbox.getDoorOpeningWorldPosition();
        fireworks.spawnMailboxBurst(doorPos);
        living.swoopFromMailbox(doorPos);
      }

      if (stateElapsed >= 2.2) {
        enterState(STATES.ENVELOPE_READY);
      }
    } else if (currentState === STATES.UNFOLDING_FINALE) {
      const unfoldT = clamp(stateElapsed / 2.1, 0, 1);
      envelope.setUnfoldProgress(unfoldT);

      if (!finaleCardShown && stateElapsed >= 1.25) {
        finaleCardShown = true;
        finaleCard.classList.add('is-visible');
        finaleCard.setAttribute('aria-hidden', 'false');
        replayBtn.hidden = false;
        setHint('แตะหน้าจอเพื่อจุดพลุหัวใจเพิ่มได้นะ', true);
      }

      fireworkCooldown -= dt;
      if (fireworkCooldown <= 0) {
        fireworkCooldown = randomRange(2.4, 3.8);
        fireworks.launchHeartFirework();
      }
    }

    auroraBoostCurrent = damp(auroraBoostCurrent, auroraBoostTarget, 2.2, dt);
    sky.setIntensityBoost(auroraBoostCurrent);

    controls.update();

    sky.update(elapsed, dt, pr, camera);
    island.update(elapsed);
    mailbox.update(elapsed);
    envelope.update(elapsed);
    living.update(elapsed, dt, pr);
    fireworks.update(dt, pr);

    composer.render();

    if (!firstFrameDone) {
      firstFrameDone = true;
      window.setTimeout(() => {
        loadingVeil.classList.add('is-hidden');
      }, 280);
    }
  }

  animate();
}

init();
