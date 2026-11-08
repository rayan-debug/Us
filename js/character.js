// Blocky (Roblox-style R6) girl: long straight dark hair with a middle part and caramel ends,
// a daisy behind her ear, black zip hoodie over a grey tee, black pants,
// white sneakers and a little gold bracelet.
import * as THREE from '../vendor/three.module.min.js';

const SKIN = '#ecc4a4';
const HOODIE = '#17171b';
const PANTS = '#121215';

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function faceTexture() {
  return canvasTexture(512, 512, (g, w) => {
    g.fillStyle = SKIN; g.fillRect(0, 0, w, w);
    // soft shading at the edges
    const edge = g.createRadialGradient(256, 290, 120, 256, 290, 380);
    edge.addColorStop(0, 'rgba(0,0,0,0)'); edge.addColorStop(1, 'rgba(150,80,60,0.18)');
    g.fillStyle = edge; g.fillRect(0, 0, w, w);

    // blush
    for (const x of [140, 372]) {
      const b = g.createRadialGradient(x, 330, 0, x, 330, 60);
      b.addColorStop(0, 'rgba(240,110,120,0.55)'); b.addColorStop(1, 'rgba(240,110,120,0)');
      g.fillStyle = b; g.fillRect(x - 70, 260, 140, 140);
    }

    // eyebrows (thick, softly arched)
    g.strokeStyle = '#1d1412'; g.lineWidth = 15; g.lineCap = 'round';
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(256 + s * 52, 196);
      g.quadraticCurveTo(256 + s * 95, 172, 256 + s * 142, 192);
      g.stroke();
    }

    // eyes
    for (const s of [-1, 1]) {
      const cx = 256 + s * 96, cy = 252;
      g.fillStyle = '#fff';
      g.beginPath(); g.ellipse(cx, cy, 36, 24, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#3b2216';
      g.beginPath(); g.ellipse(cx + s * -2, cy + 2, 21, 23, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#0d0706';
      g.beginPath(); g.ellipse(cx + s * -2, cy + 3, 11, 13, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff';
      g.beginPath(); g.arc(cx + s * -2 + 8, cy - 6, 6, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(cx + s * -2 - 7, cy + 9, 3, 0, Math.PI * 2); g.fill();
      // upper lash line with a little wing
      g.strokeStyle = '#0d0706'; g.lineWidth = 9;
      g.beginPath();
      g.moveTo(cx - s * 38, cy + 2);
      g.quadraticCurveTo(cx, cy - 36, cx + s * 40, cy - 6);
      g.lineTo(cx + s * 54, cy - 18);
      g.stroke();
    }

    // tiny nose
    g.strokeStyle = 'rgba(160,90,70,0.55)'; g.lineWidth = 6;
    g.beginPath(); g.moveTo(248, 318); g.quadraticCurveTo(256, 326, 266, 318); g.stroke();

    // soft closed smile with rosy lips
    g.fillStyle = '#d4606b';
    g.beginPath();
    g.moveTo(206, 372);
    g.quadraticCurveTo(232, 360, 256, 366);
    g.quadraticCurveTo(280, 360, 308, 370);
    g.quadraticCurveTo(262, 412, 206, 372);
    g.fill();
    g.strokeStyle = '#9e3a45'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(206, 372); g.quadraticCurveTo(258, 388, 308, 370); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.35)';
    g.beginPath(); g.ellipse(262, 392, 16, 5, 0, 0, Math.PI * 2); g.fill();
  });
}

function torsoFrontTexture() {
  return canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = HOODIE; g.fillRect(0, 0, w, h);
    // grey heather tee in the open zip
    g.fillStyle = '#b8bbc1'; g.fillRect(170, 0, 172, 430);
    for (let i = 0; i < 2500; i++) {
      g.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
      g.fillRect(170 + Math.random() * 172, Math.random() * 430, 2, 2);
    }
    // crew neck
    g.fillStyle = '#a3a6ad';
    g.beginPath(); g.ellipse(256, 0, 70, 34, 0, 0, Math.PI); g.fill();
    // thin gold necklace with a little heart (like in her photos)
    g.strokeStyle = '#e2b13c'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(196, 0); g.quadraticCurveTo(256, 120, 316, 0); g.stroke();
    g.fillStyle = '#e2b13c';
    g.beginPath(); g.moveTo(256, 92); g.bezierCurveTo(240, 76, 236, 62, 248, 58); g.bezierCurveTo(254, 56, 256, 62, 256, 64);
    g.bezierCurveTo(256, 62, 258, 56, 264, 58); g.bezierCurveTo(276, 62, 272, 76, 256, 92); g.fill();
    // collegiate letters on the tee
    g.font = '900 92px "Fredoka", "Arial Black", sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 10; g.strokeStyle = '#fff'; g.strokeText('US', 256, 200);
    g.fillStyle = '#1f2840'; g.fillText('US', 256, 200);
    // hoodie fabric texture
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * w, y = Math.random() * h;
      if (x > 170 && x < 342 && y < 430) continue;
      g.fillStyle = 'rgba(255,255,255,0.03)'; g.fillRect(x, y, 2, 2);
    }
    // zipper tapes
    for (const x of [166, 346]) {
      g.fillStyle = '#26262b'; g.fillRect(x - 8, 0, 16, h);
      g.fillStyle = '#c9ccd2';
      for (let y = 4; y < h; y += 10) g.fillRect(x - 4, y, 8, 4);
    }
    // ribbed hem
    g.fillStyle = '#101013'; g.fillRect(0, 440, w, 72);
    g.strokeStyle = 'rgba(255,255,255,0.06)'; g.lineWidth = 3;
    for (let x = 0; x < w; x += 12) { g.beginPath(); g.moveTo(x, 440); g.lineTo(x, h); g.stroke(); }
    // pocket seams
    g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(40, 300); g.lineTo(110, 430); g.stroke();
    g.beginPath(); g.moveTo(472, 300); g.lineTo(402, 430); g.stroke();
  });
}

function torsoBackTexture() {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = HOODIE; g.fillRect(0, 0, w, h);
    g.fillStyle = '#101013'; g.fillRect(0, 220, w, 36);
    g.strokeStyle = 'rgba(255,255,255,0.06)'; g.lineWidth = 3;
    g.beginPath(); g.arc(128, 0, 80, 0, Math.PI); g.stroke();
  });
}

function nameTag(name) {
  const tex = canvasTexture(512, 128, (g) => {
    g.font = '700 64px "Fredoka", "Arial Rounded MT Bold", sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 10; g.strokeStyle = 'rgba(0,0,0,0.55)';
    g.strokeText(name, 256, 64);
    g.fillStyle = '#fff'; g.fillText(name, 256, 64);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: true, transparent: true }));
  s.scale.set(4, 1, 1);
  return s;
}

function box(w, h, d, mat) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
}

function daisy() {
  const g = new THREE.Group();
  const petal = new THREE.MeshLambertMaterial({ color: '#ffffff' });
  const petalGeo = new THREE.BoxGeometry(0.12, 0.26, 0.03);
  for (let i = 0; i < 12; i++) {
    const holder = new THREE.Group();
    holder.rotation.z = (i / 12) * Math.PI * 2;
    const p = new THREE.Mesh(petalGeo, petal);
    p.position.y = 0.2;
    holder.add(p);
    g.add(holder);
  }
  const center = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.11, 0.08, 16),
    new THREE.MeshLambertMaterial({ color: '#f5b819', emissive: '#5a3a00' }),
  );
  center.rotation.x = Math.PI / 2;
  center.position.z = 0.03;
  g.add(center);
  return g;
}

export function createCharacter(name) {
  const root = new THREE.Group();
  const skin = new THREE.MeshLambertMaterial({ color: SKIN });
  const hoodie = new THREE.MeshLambertMaterial({ color: HOODIE });
  const pants = new THREE.MeshLambertMaterial({ color: PANTS });
  const shoe = new THREE.MeshLambertMaterial({ color: '#f4f4f4' });
  const hair = new THREE.MeshPhongMaterial({ color: '#16100d', shininess: 70, specular: '#4a3a30' });
  const hairEnds = new THREE.MeshPhongMaterial({ color: '#4a2f1e', shininess: 60, specular: '#6b4d36' });
  const gold = new THREE.MeshPhongMaterial({ color: '#e4b445', shininess: 90, specular: '#fff3c4', emissive: '#3a2600' });

  // ---- legs (pivot at hip)
  const legs = [];
  for (const s of [1, -1]) {
    const hip = new THREE.Group();
    hip.position.set(0.5 * s, 2, 0);
    const leg = box(0.98, 1.7, 0.98, pants); leg.position.y = -0.85; hip.add(leg);
    const sneaker = box(1.0, 0.3, 1.08, shoe); sneaker.position.set(0, -1.85, 0.04); hip.add(sneaker);
    const sole = box(1.02, 0.08, 1.1, new THREE.MeshLambertMaterial({ color: '#d9d9d9' }));
    sole.position.set(0, -1.96, 0.04); hip.add(sole);
    root.add(hip); legs.push(hip);
  }

  // ---- torso
  const torsoMats = [hoodie, hoodie, hoodie, hoodie,
    new THREE.MeshLambertMaterial({ map: torsoFrontTexture() }),
    new THREE.MeshLambertMaterial({ map: torsoBackTexture() })];
  const torso = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 1), torsoMats);
  torso.position.y = 3;
  root.add(torso);

  // ---- arms (pivot at shoulder)
  const arms = [];
  for (const s of [1, -1]) {
    const sh = new THREE.Group();
    sh.position.set(1.5 * s, 3.85, 0);
    const sleeve = box(1, 1.5, 1, hoodie); sleeve.position.y = -0.7; sh.add(sleeve);
    const cuff = box(1.04, 0.22, 1.04, new THREE.MeshLambertMaterial({ color: '#101013' }));
    cuff.position.y = -1.52; sh.add(cuff);
    const hand = box(0.86, 0.36, 0.86, skin); hand.position.y = -1.8; sh.add(hand);
    if (s === 1) {
      const bracelet = box(0.9, 0.07, 0.9, gold); bracelet.position.y = -1.7; sh.add(bracelet);
      const charm = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), new THREE.MeshPhongMaterial({ color: '#fffaf0', shininess: 120 }));
      charm.position.set(0, -1.7, 0.47); sh.add(charm);
    }
    root.add(sh); arms.push(sh);
  }

  // ---- head
  const head = new THREE.Group();
  head.position.y = 4.66;
  const headMats = [skin, skin, skin, skin, new THREE.MeshLambertMaterial({ map: faceTexture() }), skin];
  head.add(new THREE.Mesh(new THREE.BoxGeometry(1.26, 1.26, 1.26), headMats));
  const neck = box(0.6, 0.12, 0.6, skin); neck.position.y = -0.66; head.add(neck);

  // ---- hair (head-relative where it moves with the head)
  // middle part: two halves on top with a thin parting line between them
  for (const s of [1, -1]) {
    const half = box(0.68, 0.3, 1.44, hair); half.position.set(0.37 * s, 0.74, -0.02); head.add(half);
    // hair swept from the part down to the temples (no bangs)
    const sweep = box(0.5, 0.26, 0.16, hair); sweep.position.set(0.44 * s, 0.56, 0.7); sweep.rotation.z = -0.32 * s; head.add(sweep);
    // long face-framing strands
    const curtain = box(0.22, 1.25, 0.16, hair); curtain.position.set(0.6 * s, -0.08, 0.7); head.add(curtain);
    // sides beside the ears
    const side = box(0.2, 1.5, 1.3, hair); side.position.set(0.74 * s, 0.05, -0.04); head.add(side);
  }
  const partBack = box(0.08, 0.3, 0.9, hair); partBack.position.set(0, 0.74, -0.3); head.add(partBack);
  const backTop = box(1.42, 1.5, 0.24, hair); backTop.position.set(0, 0.05, -0.74); head.add(backTop);
  root.add(head);

  // long hair down the back and over the shoulders (body-relative)
  const back = box(1.6, 2.4, 0.22, hair); back.position.set(0, 3.1, -0.62); root.add(back);
  const backTip = box(1.4, 0.6, 0.2, hairEnds); backTip.position.set(0, 1.6, -0.62); root.add(backTip);
  for (const s of [1, -1]) {
    const shoulderLock = box(0.44, 0.24, 0.9, hair); shoulderLock.position.set(0.62 * s, 4.1, 0.06); root.add(shoulderLock);
    const frontLock = box(0.42, 1.4, 0.14, hair); frontLock.position.set(0.62 * s, 3.38, 0.58); root.add(frontLock);
    const lockTip = box(0.36, 0.6, 0.13, hairEnds); lockTip.position.set(0.61 * s, 2.38, 0.58); root.add(lockTip);
  }

  // daisy behind her right ear
  const flower = daisy();
  flower.position.set(-0.86, 0.3, 0.22);
  flower.rotation.y = -Math.PI / 2 + 0.5;
  head.add(flower);

  // name tag
  const tag = nameTag(name);
  tag.position.y = 6.5;
  root.add(tag);

  // blob shadow
  const shadowTex = canvasTexture(128, 128, (g) => {
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(0,0,0,0.45)'); r.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;

  let phase = 0;
  let jumpBlend = 0;

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
    arms[1].rotation.x = (swing * 0.9 - idle) * (1 - jumpBlend) - 2.9 * jumpBlend;
    arms[0].rotation.z = 0.04 + 0.1 * jumpBlend;
    arms[1].rotation.z = -0.04 - 0.1 * jumpBlend;
    head.rotation.y = moving ? 0 : Math.sin(time * 0.6) * 0.12;
  }

  return { root, shadow, update, tag };
}
