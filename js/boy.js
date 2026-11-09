// Blocky (Roblox-style R6) boy: short dark hair with a fade, full beard,
// round black glasses, light-blue button shirt, dark jeans, white sneakers,
// and a red rose in his hand for her.
import * as THREE from '../vendor/three.module.min.js';
import { canvasTexture, nameTag, box } from './character.js';

const SKIN = '#e3b48f';
const SHIRT = '#a9c8ea';
const JEANS = '#2c3e5c';
const HAIR = '#1a1310';

function faceTexture() {
  return canvasTexture(512, 512, (g, w) => {
    g.fillStyle = SKIN; g.fillRect(0, 0, w, w);
    const edge = g.createRadialGradient(256, 260, 120, 256, 260, 380);
    edge.addColorStop(0, 'rgba(0,0,0,0)'); edge.addColorStop(1, 'rgba(120,60,40,0.18)');
    g.fillStyle = edge; g.fillRect(0, 0, w, w);

    // full beard: jaw, chin and moustache, with stubble texture
    g.fillStyle = '#2a1d17';
    g.beginPath();
    g.moveTo(20, 250);
    g.lineTo(20, 420); g.quadraticCurveTo(60, 512, 256, 512); g.quadraticCurveTo(452, 512, 492, 420);
    g.lineTo(492, 250);
    g.quadraticCurveTo(470, 300, 420, 320);
    g.quadraticCurveTo(380, 330, 360, 352);
    g.quadraticCurveTo(256, 330, 152, 352);
    g.quadraticCurveTo(132, 330, 92, 320);
    g.quadraticCurveTo(42, 300, 20, 250);
    g.fill();
    for (let i = 0; i < 2600; i++) {
      const x = Math.random() * w, y = 250 + Math.random() * 262;
      g.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.25)' : 'rgba(120,90,70,0.25)';
      g.fillRect(x, y, 2, 3);
    }
    // mouth: a big warm smile showing teeth
    g.fillStyle = '#7a2e2a';
    g.beginPath(); g.moveTo(196, 398); g.quadraticCurveTo(256, 470, 316, 398); g.quadraticCurveTo(256, 414, 196, 398); g.fill();
    g.fillStyle = '#fbf6ec';
    g.beginPath(); g.moveTo(204, 402); g.quadraticCurveTo(256, 440, 308, 402); g.quadraticCurveTo(256, 416, 204, 402); g.fill();

    // thick eyebrows
    g.strokeStyle = '#1a1310'; g.lineWidth = 20; g.lineCap = 'round';
    for (const s of [-1, 1]) {
      g.beginPath(); g.moveTo(256 + s * 46, 182); g.quadraticCurveTo(256 + s * 96, 164, 256 + s * 146, 178); g.stroke();
    }
    // warm brown eyes
    for (const s of [-1, 1]) {
      const cx = 256 + s * 96, cy = 238;
      g.fillStyle = '#fff';
      g.beginPath(); g.ellipse(cx, cy, 30, 20, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#5a3620';
      g.beginPath(); g.arc(cx, cy + 2, 17, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#120b07';
      g.beginPath(); g.arc(cx, cy + 2, 9, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff';
      g.beginPath(); g.arc(cx + 6, cy - 4, 5, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#1a1310'; g.lineWidth = 5;
      g.beginPath(); g.moveTo(cx - 30, cy); g.quadraticCurveTo(cx, cy - 26, cx + 30, cy); g.stroke();
    }
    // nose
    g.strokeStyle = 'rgba(140,80,55,0.6)'; g.lineWidth = 7;
    g.beginPath(); g.moveTo(240, 316); g.quadraticCurveTo(256, 330, 272, 316); g.stroke();
  });
}

function shirtFrontTexture() {
  return canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = SHIRT; g.fillRect(0, 0, w, h);
    // oxford weave
    for (let i = 0; i < 4000; i++) {
      g.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(30,60,110,0.07)';
      g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    // open collar with a bit of skin and chest hair-free V
    g.fillStyle = SKIN;
    g.beginPath(); g.moveTo(196, 0); g.lineTo(256, 92); g.lineTo(316, 0); g.fill();
    g.fillStyle = '#c4dbf3';
    for (const s of [-1, 1]) {
      g.beginPath(); g.moveTo(256, 96); g.lineTo(256 + s * 66, 0); g.lineTo(256 + s * 150, 0); g.lineTo(256 + s * 120, 60); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(40,70,120,0.35)'; g.lineWidth = 3; g.stroke();
    }
    // placket & buttons
    g.strokeStyle = 'rgba(40,70,120,0.3)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(244, 96); g.lineTo(244, h); g.moveTo(268, 96); g.lineTo(268, h); g.stroke();
    g.fillStyle = '#eef4fb';
    for (let y = 150; y < h - 20; y += 80) { g.beginPath(); g.arc(256, y, 8, 0, Math.PI * 2); g.fill(); }
    // chest pocket
    g.strokeStyle = 'rgba(40,70,120,0.35)';
    g.strokeRect(330, 160, 90, 96);
    // tucked into the belt
    g.fillStyle = '#1c1c1f'; g.fillRect(0, 466, w, 46);
    g.fillStyle = '#b9bcc2'; g.fillRect(232, 470, 48, 38);
    g.fillStyle = '#1c1c1f'; g.fillRect(242, 478, 28, 22);
  });
}

function shirtBackTexture() {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = SHIRT; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c4dbf3'; g.fillRect(40, 0, 176, 24);
    g.strokeStyle = 'rgba(40,70,120,0.3)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, 60); g.quadraticCurveTo(128, 80, 256, 60); g.stroke();
    g.fillStyle = '#1c1c1f'; g.fillRect(0, 233, w, 23);
  });
}

function rose() {
  const g = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.9, 0.09), new THREE.MeshLambertMaterial({ color: '#2f7a3a' }));
  stem.position.y = 0.6; g.add(stem);
  const leafMat = new THREE.MeshLambertMaterial({ color: '#3f9a4a' });
  for (const [y, s] of [[0.35, 1], [0.8, -1]]) {
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.04), leafMat);
    leaf.position.set(0.17 * s, y, 0); leaf.rotation.z = 0.5 * s; g.add(leaf);
  }
  const petal = new THREE.MeshPhongMaterial({ color: '#d0183a', shininess: 40, emissive: '#3a0410' });
  const bloom = new THREE.Group();
  bloom.position.y = 1.65;
  const core = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.4, 0.34), petal); bloom.add(core);
  for (let i = 0; i < 4; i++) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.32, 0.1), petal);
    const a = (i / 4) * Math.PI * 2;
    p.position.set(Math.sin(a) * 0.2, -0.04, Math.cos(a) * 0.2);
    p.rotation.y = a; p.rotation.x = 0.35;
    bloom.add(p);
  }
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.2), new THREE.MeshPhongMaterial({ color: '#a50f2c' }));
  top.position.y = 0.22; bloom.add(top);
  const sepal = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.3), leafMat);
  sepal.position.y = -0.2; bloom.add(sepal);
  g.add(bloom);
  return g;
}

export function createBoy(name) {
  const root = new THREE.Group();
  const skin = new THREE.MeshLambertMaterial({ color: SKIN });
  const shirt = new THREE.MeshLambertMaterial({ color: SHIRT });
  const jeans = new THREE.MeshLambertMaterial({ color: JEANS });
  const shoe = new THREE.MeshLambertMaterial({ color: '#f4f4f4' });
  const hair = new THREE.MeshLambertMaterial({ color: HAIR });
  const fade = new THREE.MeshLambertMaterial({ color: '#4a3a32' });
  const frameMat = new THREE.MeshPhongMaterial({ color: '#111114', shininess: 80 });
  const lensMat = new THREE.MeshPhongMaterial({ color: '#b9c8ff', transparent: true, opacity: 0.18, shininess: 120, specular: '#ffffff' });

  // ---- legs
  const legs = [];
  for (const s of [1, -1]) {
    const hip = new THREE.Group();
    hip.position.set(0.5 * s, 2, 0);
    const leg = box(0.98, 1.7, 0.98, jeans); leg.position.y = -0.85; hip.add(leg);
    const sneaker = box(1.0, 0.3, 1.1, shoe); sneaker.position.set(0, -1.85, 0.05); hip.add(sneaker);
    const sole = box(1.02, 0.08, 1.12, new THREE.MeshLambertMaterial({ color: '#d9d9d9' }));
    sole.position.set(0, -1.96, 0.05); hip.add(sole);
    root.add(hip); legs.push(hip);
  }

  // ---- torso (slightly broader than hers)
  const torsoMats = [shirt, shirt, shirt, shirt,
    new THREE.MeshLambertMaterial({ map: shirtFrontTexture() }),
    new THREE.MeshLambertMaterial({ map: shirtBackTexture() })];
  const torso = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2, 1.05), torsoMats);
  torso.position.y = 3;
  root.add(torso);

  // ---- arms; the right arm (index 1) carries the rose
  const arms = [];
  for (const s of [1, -1]) {
    const sh = new THREE.Group();
    sh.position.set(1.55 * s, 3.85, 0);
    const sleeve = box(1, 1.45, 1, shirt); sleeve.position.y = -0.68; sh.add(sleeve);
    const cuff = box(1.04, 0.2, 1.04, new THREE.MeshLambertMaterial({ color: '#c4dbf3' })); cuff.position.y = -1.48; sh.add(cuff);
    const hand = box(0.86, 0.42, 0.86, skin); hand.position.y = -1.78; sh.add(hand);
    if (s === 1) {
      const watch = box(0.9, 0.16, 0.9, new THREE.MeshPhongMaterial({ color: '#2a2a2e', shininess: 80 }));
      watch.position.y = -1.62; sh.add(watch);
    }
    if (s === -1) {
      const r = rose();
      r.position.set(0, -1.9, 0.1);
      r.rotation.x = Math.PI / 2 - 0.15;
      sh.add(r);
    }
    root.add(sh); arms.push(sh);
  }

  // ---- head
  const head = new THREE.Group();
  head.position.y = 4.68;
  const headMats = [skin, skin, skin, skin, new THREE.MeshLambertMaterial({ map: faceTexture() }), skin];
  head.add(new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.3, 1.3), headMats));
  const neck = box(0.62, 0.12, 0.62, skin); neck.position.y = -0.68; head.add(neck);
  // beard volume on the jaw
  const beardMat = new THREE.MeshLambertMaterial({ color: '#2a1d17' });
  const jaw = box(1.34, 0.42, 1.0, beardMat); jaw.position.set(0, -0.48, 0.17); head.add(jaw);
  for (const s of [1, -1]) {
    const side = box(0.06, 0.6, 0.7, beardMat); side.position.set(0.67 * s, -0.25, 0.1); head.add(side);
  }
  // short hair: thicker on top, faded sides
  const top = box(1.38, 0.3, 1.38, hair); top.position.set(0, 0.76, 0); head.add(top);
  const front = box(1.36, 0.16, 0.12, hair); front.position.set(0, 0.6, 0.66); head.add(front);
  for (const s of [1, -1]) {
    const side = box(0.06, 0.55, 1.2, fade); side.position.set(0.67 * s, 0.38, -0.05); head.add(side);
  }
  const back = box(1.3, 0.6, 0.06, fade); back.position.set(0, 0.36, -0.67); head.add(back);
  // ears
  for (const s of [1, -1]) {
    const ear = box(0.1, 0.3, 0.18, skin); ear.position.set(0.7 * s, 0.05, 0); head.add(ear);
  }
  // round black glasses
  const glasses = new THREE.Group();
  glasses.position.set(0, 0.14, 0.68);
  for (const s of [1, -1]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 8, 24), frameMat);
    rim.position.x = 0.29 * s; glasses.add(rim);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.19, 24), lensMat);
    lens.position.set(0.29 * s, 0, 0.005); glasses.add(lens);
    const arm = box(0.03, 0.03, 0.7, frameMat); arm.position.set(0.66 * s, 0.05, -0.35); glasses.add(arm);
  }
  const bridge = box(0.18, 0.03, 0.03, frameMat); bridge.position.y = 0.05; glasses.add(bridge);
  head.add(glasses);
  root.add(head);

  const tag = nameTag(name);
  tag.position.y = 6.5;
  root.add(tag);

  const shadowTex = canvasTexture(128, 128, (g) => {
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(0,0,0,0.45)'); r.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 3.5),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;

  let phase = 0, jumpBlend = 0;
  function update(dt, speed, grounded, time) {
    const moving = speed > 0.5;
    if (moving) phase += dt * (4 + speed * 0.38);
    const amp = moving ? Math.min(1, speed / 16) * 0.85 : 0;
    const swing = Math.sin(phase) * amp;
    jumpBlend += ((grounded ? 0 : 1) - jumpBlend) * Math.min(1, dt * 10);
    const idle = moving ? 0 : Math.sin(time * 1.8) * 0.04;
    legs[0].rotation.x = swing * (1 - jumpBlend) + 0.15 * jumpBlend;
    legs[1].rotation.x = -swing * (1 - jumpBlend) - 0.15 * jumpBlend;
    arms[0].rotation.x = (-swing * 0.9 + idle) * (1 - jumpBlend) - 2.9 * jumpBlend;
    arms[0].rotation.z = 0.04 + 0.1 * jumpBlend;
    // rose arm stays raised, offering the flower, with a gentle sway
    arms[1].rotation.x = -0.85 + Math.sin(time * 1.6) * 0.05 + swing * 0.15 - 1.6 * jumpBlend;
    arms[1].rotation.z = -0.06;
    head.rotation.y = moving ? 0 : Math.sin(time * 0.5 + 1) * 0.15;
  }

  return { root, shadow, update, tag };
}
