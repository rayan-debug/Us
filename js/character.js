// Blocky (Roblox-style R6) girl: long straight black hair with a middle part,
// a daisy behind her ear, a long red satin dress, a gold heart necklace and bracelet.
import * as THREE from '../vendor/three.module.min.js';

const SKIN = '#ecc4a4';
const DRESS = '#b8142f';
const DRESS_DARK = '#8c0c22';

export function canvasTexture(w, h, draw) {
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

function satin(g, w, h) {
  const gr = g.createLinearGradient(0, 0, w, 0);
  gr.addColorStop(0, DRESS_DARK); gr.addColorStop(0.35, DRESS); gr.addColorStop(0.55, '#d42a45'); gr.addColorStop(1, DRESS_DARK);
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 18; i++) {
    const x = Math.random() * w;
    g.strokeStyle = `rgba(255,255,255,${0.03 + Math.random() * 0.05})`; g.lineWidth = 6 + Math.random() * 10;
    g.beginPath(); g.moveTo(x, 0); g.quadraticCurveTo(x + 20, h / 2, x - 10, h); g.stroke();
  }
}

function torsoFrontTexture() {
  return canvasTexture(512, 512, (g, w, h) => {
    satin(g, w, h);
    // skin above a sweetheart neckline
    g.fillStyle = SKIN;
    g.beginPath();
    g.moveTo(0, 0); g.lineTo(w, 0); g.lineTo(w, 70);
    g.bezierCurveTo(470, 210, 300, 230, 256, 170);
    g.bezierCurveTo(212, 230, 42, 210, 0, 70);
    g.closePath(); g.fill();
    // neckline edge
    g.strokeStyle = DRESS_DARK; g.lineWidth = 8;
    g.beginPath(); g.moveTo(w, 70); g.bezierCurveTo(470, 210, 300, 230, 256, 170);
    g.bezierCurveTo(212, 230, 42, 210, 0, 70); g.stroke();
    // thin gold necklace with a little heart (like in her photos)
    g.strokeStyle = '#e2b13c'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(196, 0); g.quadraticCurveTo(256, 120, 316, 0); g.stroke();
    g.fillStyle = '#e2b13c';
    g.beginPath(); g.moveTo(256, 92); g.bezierCurveTo(240, 76, 236, 62, 248, 58); g.bezierCurveTo(254, 56, 256, 62, 256, 64);
    g.bezierCurveTo(256, 62, 258, 56, 264, 58); g.bezierCurveTo(276, 62, 272, 76, 256, 92); g.fill();
    // soft gathered folds and a fitted waist
    g.strokeStyle = 'rgba(80,0,15,0.35)'; g.lineWidth = 4;
    for (const x of [150, 210, 300, 362]) { g.beginPath(); g.moveTo(x, 230); g.quadraticCurveTo(256, 400, x, 470); g.stroke(); }
    // thin gold belt
    g.fillStyle = '#e2b13c'; g.fillRect(0, 456, w, 14);
    g.fillStyle = '#fff3c4'; g.fillRect(244, 452, 24, 22);
  });
}

function torsoBackTexture() {
  return canvasTexture(256, 256, (g, w, h) => {
    satin(g, w, h);
    g.fillStyle = SKIN;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(w, 0); g.lineTo(w, 30); g.quadraticCurveTo(128, 120, 0, 30); g.closePath(); g.fill();
    g.fillStyle = '#e2b13c'; g.fillRect(0, 228, w, 7);
  });
}

function skirtTexture() {
  return canvasTexture(256, 512, (g, w, h) => {
    satin(g, w, h);
    // long vertical folds
    for (let x = 16; x < w; x += 42) {
      g.strokeStyle = 'rgba(60,0,10,0.35)'; g.lineWidth = 5;
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (x - w / 2) * 0.15, h); g.stroke();
      g.strokeStyle = 'rgba(255,200,210,0.12)'; g.lineWidth = 4;
      g.beginPath(); g.moveTo(x + 10, 0); g.lineTo(x + 10 + (x - w / 2) * 0.15, h); g.stroke();
    }
    g.fillStyle = DRESS_DARK; g.fillRect(0, h - 18, w, 18);
  });
}

export function nameTag(name) {
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

export function box(w, h, d, mat) {
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
  const dress = new THREE.MeshPhongMaterial({ color: DRESS, shininess: 45, specular: '#ff9aa8' });
  const legMat = new THREE.MeshLambertMaterial({ color: DRESS_DARK });
  const shoe = new THREE.MeshPhongMaterial({ color: '#7a0c1c', shininess: 90 });
  // all-black hair
  const hair = new THREE.MeshPhongMaterial({ color: '#0a090b', shininess: 80, specular: '#3a3a44' });
  const hairEnds = hair;
  const gold = new THREE.MeshPhongMaterial({ color: '#e4b445', shininess: 90, specular: '#fff3c4', emissive: '#3a2600' });

  // ---- legs (pivot at hip)
  const legs = [];
  for (const s of [1, -1]) {
    const hip = new THREE.Group();
    hip.position.set(0.5 * s, 2, 0);
    // legs stay hidden under the long dress; only the tips of her red heels peek out
    const leg = box(0.8, 1.6, 0.8, legMat); leg.position.y = -0.8; hip.add(leg);
    const heel = box(0.7, 0.22, 0.9, shoe); heel.position.set(0, -1.86, 0.18); hip.add(heel);
    root.add(hip); legs.push(hip);
  }

  // ---- long flowing skirt down to the floor (a flared four-sided cone)
  const skirtMat = new THREE.MeshPhongMaterial({ map: skirtTexture(), shininess: 45, specular: '#ff9aa8' });
  const skirtGeo = new THREE.CylinderGeometry(1.46, 2.0, 1.95, 4, 1, true);
  skirtGeo.rotateY(Math.PI / 4);
  skirtGeo.scale(1, 1, 0.6);
  const skirt = new THREE.Mesh(skirtGeo, skirtMat);
  skirt.material.side = THREE.DoubleSide;
  skirt.position.y = 2.02 - 1.95 / 2 + 0.06;
  root.add(skirt);

  // ---- torso
  const torsoMats = [dress, dress, dress, dress,
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
    // bare arms with a little off-the-shoulder red strap
    const arm = box(0.92, 1.85, 0.92, skin); arm.position.y = -0.98; sh.add(arm);
    const strap = box(1.0, 0.36, 1.0, dress); strap.position.y = -0.3; sh.add(strap);
    const hand = box(0.86, 0.12, 0.86, skin); hand.position.y = -1.86; sh.add(hand);
    if (s === 1) {
      const bracelet = box(0.97, 0.08, 0.97, gold); bracelet.position.y = -1.7; sh.add(bracelet);
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
    legs[0].rotation.x = swing * 0.22 * (1 - jumpBlend) + 0.05 * jumpBlend;
    legs[1].rotation.x = -swing * 0.22 * (1 - jumpBlend) - 0.05 * jumpBlend;
    skirt.rotation.x = Math.sin(phase * 2) * amp * 0.03;
    arms[0].rotation.x = (-swing * 0.9 + idle) * (1 - jumpBlend) - 2.9 * jumpBlend;
    arms[1].rotation.x = (swing * 0.9 - idle) * (1 - jumpBlend) - 2.9 * jumpBlend;
    arms[0].rotation.z = 0.04 + 0.1 * jumpBlend;
    arms[1].rotation.z = -0.04 - 0.1 * jumpBlend;
    head.rotation.y = moving ? 0 : Math.sin(time * 0.6) * 0.12;
  }

  return { root, shadow, update, tag, arms, head };
}
