import * as THREE from '../vendor/three.module.min.js';
import { CONFIG, QUOTES, LOVE_WORDS, BOY_LINES, PHOTO_LINES } from './content.js';
import { createCharacter } from './character.js';
import { createBoy } from './boy.js';

const $ = (id) => document.getElementById(id);
const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
const SINCE = new Date(CONFIG.since.year, CONFIG.since.month - 1, CONFIG.since.day);
const SINCE_TEXT = `${CONFIG.since.day} · ${CONFIG.since.month} · ${CONFIG.since.year}`;

// ============================================================
//  Password gate
// ============================================================
function isCorrect(value) {
  const nums = (value.match(/\d+/g) || []).map(Number);
  const { year, month, day } = CONFIG.since;
  if (nums.length === 3) {
    if (nums[0] === day && nums[1] === month && nums[2] === year) return true;
    if (nums[0] === month && nums[1] === day && nums[2] === year) return true;
    if (nums[0] === year && nums[1] === month && nums[2] === day) return true;
  }
  const digits = value.replace(/\D/g, '');
  const p2 = (n) => String(n).padStart(2, '0');
  return [`${day}${month}${year}`, `${p2(day)}${p2(month)}${year}`, `${p2(month)}${p2(day)}${year}`,
    `${month}${day}${year}`, `${year}${p2(month)}${p2(day)}`].includes(digits);
}
function remembered() { try { return sessionStorage.getItem('mou-ok') === '1'; } catch { return false; } }
function remember() { try { sessionStorage.setItem('mou-ok', '1'); } catch { /* private mode */ } }

let audio = null;
function startMusic() {
  if (!CONFIG.music) return;
  try {
    if (!audio) { audio = new Audio(CONFIG.music); audio.loop = true; audio.volume = 0.45; }
    audio.play().catch(() => {});
  } catch { /* ignore */ }
}

let started = false;
function enter() {
  if (started) return;
  started = true;
  $('login').classList.add('hidden');
  $('loading').classList.remove('hidden');
  boot().catch((err) => {
    console.error(err);
    $('load-text').textContent = 'Something went wrong while loading — please refresh ❤';
  });
}

$('login-title').textContent = CONFIG.title;
$('login-sub').textContent = CONFIG.subtitle;
$('load-title').textContent = CONFIG.title;
document.title = CONFIG.title;

$('login-card').addEventListener('submit', (e) => {
  e.preventDefault();
  if (isCorrect($('pw').value)) {
    remember();
    startMusic();
    enter();
  } else {
    const card = $('login-card');
    card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
    $('pw-error').textContent = 'Hmm, that’s not our date. Try again ❤';
    $('pw').select();
  }
});
if (remembered()) enter(); else $('pw').focus();

// ============================================================
//  Helpers
// ============================================================
function canvasTex(w, h, draw, { repeat = false, aniso = 8 } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return t;
}
function wrapLines(g, text, maxW) {
  const words = text.split(' ');
  const lines = []; let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (g.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}
function fitText(g, text, fontFn, maxW, maxH, start, lineH = 1.25) {
  let size = start, lines;
  for (; size > 12; size -= 2) {
    g.font = fontFn(size);
    lines = wrapLines(g, text, maxW);
    if (lines.length * size * lineH <= maxH && lines.every((l) => g.measureText(l).width <= maxW)) break;
  }
  return { size, lines };
}
function heartPath(g, x, y, s) {
  g.beginPath();
  g.moveTo(x, y + s * 0.3);
  g.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3);
  g.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.8, x, y + s);
  g.bezierCurveTo(x, y + s * 0.8, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3);
  g.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3);
  g.closePath();
}
const daysTogether = () => Math.max(1, Math.floor((Date.now() - SINCE.getTime()) / 86400000) + 1);
const withTimeout = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(r, ms))]);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ============================================================
//  Boot
// ============================================================
async function boot() {
  const setProgress = (f, text) => {
    $('load-bar').style.width = `${Math.round(f * 100)}%`;
    if (text) $('load-text').textContent = text;
  };
  setProgress(0.05, 'Polishing the floors…');
  await withTimeout(Promise.all([
    document.fonts.load('600 40px "Fredoka"'),
    document.fonts.load('700 40px "Dancing Script"'),
    document.fonts.load('italic 500 40px "Playfair Display"'),
  ]), 4000);

  setProgress(0.12, 'Hanging our pictures…');
  let manifest = null;
  try {
    const r = await fetch('generated/photos.json', { cache: 'no-cache' });
    if (r.ok) manifest = await r.json();
  } catch { /* no photos yet */ }
  const photoData = (manifest && Array.isArray(manifest.photos) && manifest.photos.length)
    ? manifest.photos
    : Array.from({ length: 10 }, (_, i) => ({ placeholder: true, w: i % 3 === 1 ? 3 : 4, h: i % 3 === 1 ? 4 : 3 }));

  const game = createGame(photoData);
  if (location.search.includes('debug')) window.__museum = game.debug;
  await game.loadThumbs((f) => setProgress(0.15 + f * 0.8, `Hanging our pictures… ${Math.round(f * 100)}%`));
  setProgress(1, 'Ready ❤');
  await new Promise((r) => setTimeout(r, 350));
  $('loading').classList.add('hidden');
  $('game').classList.remove('hidden');
  game.start();
}

// ============================================================
//  Game
// ============================================================
function createGame(photoData) {
  const canvas = $('c');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isTouch ? 2 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const maxTex = renderer.capabilities.maxTextureSize;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#f3e6dc');
  scene.fog = new THREE.Fog('#f3e6dc', 90, 220);
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 400);

  scene.add(new THREE.HemisphereLight('#fffaf5', '#e6d2c2', 1.9));
  scene.add(new THREE.AmbientLight('#ffffff', 0.55));
  const sun = new THREE.DirectionalLight('#fff3e6', 1.0);
  sun.position.set(30, 60, 20);
  scene.add(sun);

  // ---------------- materials
  const H = 18;
  const wallMat = new THREE.MeshLambertMaterial({ color: '#f7eee7' });
  const wainMat = new THREE.MeshLambertMaterial({ color: '#d98fa1' });
  const goldMat = new THREE.MeshPhongMaterial({ color: '#d8b064', shininess: 80, specular: '#fff1c7' });
  const woodMat = new THREE.MeshLambertMaterial({ color: '#8a5a3c' });
  const marbleMat = new THREE.MeshPhongMaterial({ color: '#fbf8f4', shininess: 50, specular: '#ffffff' });
  const ceilMat = new THREE.MeshLambertMaterial({ color: '#fbf7f2' });
  const lightPanelMat = new THREE.MeshBasicMaterial({ color: '#fffaf0' });

  function studTexture(base, light, dark) {
    return canvasTex(64, 64, (g) => {
      g.fillStyle = base; g.fillRect(0, 0, 64, 64);
      g.strokeStyle = dark; g.globalAlpha = 0.25; g.lineWidth = 2; g.strokeRect(0, 0, 64, 64); g.globalAlpha = 1;
      g.fillStyle = dark; g.beginPath(); g.arc(34, 35, 17, 0, Math.PI * 2); g.fill();
      g.fillStyle = light; g.beginPath(); g.arc(30, 30, 17, 0, Math.PI * 2); g.fill();
      g.fillStyle = base; g.beginPath(); g.arc(32, 32, 15, 0, Math.PI * 2); g.fill();
    }, { repeat: true, aniso: maxAniso });
  }
  const floorTex = studTexture('#ecdccb', '#f8efe5', '#cbb6a1');
  const carpetTex = studTexture('#b93a56', '#d65c76', '#7e1f35');

  // ---------------- world bookkeeping
  const colliders = [];   // {minX,maxX,minY,maxY,minZ,maxZ}
  const camBlockers = []; // meshes the camera should not go through
  const clickables = [];  // photo meshes
  const animated = [];    // fn(t, dt)

  function addBox(cx, cy, cz, w, h, d, mat, { collide = false, cam = false } = {}) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(cx, cy, cz);
    scene.add(m);
    if (collide) colliders.push({ minX: cx - w / 2, maxX: cx + w / 2, minY: cy - h / 2, maxY: cy + h / 2, minZ: cz - d / 2, maxZ: cz + d / 2 });
    if (cam) camBlockers.push(m);
    return m;
  }

  // wall segment given by its inner face line and the normal pointing into the room.
  // decoBack also decorates the opposite face (for walls between two rooms).
  const T = 1.2;
  function wallSeg(x1, z1, x2, z2, nx, nz, y0 = 0, y1 = H, deco = true, decoBack = false) {
    const alongX = Math.abs(x2 - x1) > Math.abs(z2 - z1);
    const len = alongX ? Math.abs(x2 - x1) : Math.abs(z2 - z1);
    const mx = (x1 + x2) / 2, mz = (z1 + z2) / 2;
    addBox(mx - nx * T / 2, (y0 + y1) / 2, mz - nz * T / 2, alongX ? len : T, y1 - y0, alongX ? T : len, wallMat, { collide: true, cam: true });
    const faces = [];
    if (deco) faces.push([mx, mz, nx, nz]);
    if (decoBack) faces.push([mx - nx * T, mz - nz * T, -nx, -nz]);
    for (const [fx, fz, fnx, fnz] of faces) {
      const t = 0.18;
      const W = (th) => (alongX ? len : th), D = (th) => (alongX ? th : len);
      if (y0 === 0) {
        addBox(fx + fnx * t / 2, 1.7, fz + fnz * t / 2, W(t), 3.4, D(t), wainMat);
        addBox(fx + fnx * 0.14, 3.45, fz + fnz * 0.14, W(0.28), 0.22, D(0.28), goldMat);
        addBox(fx + fnx * 0.12, 0.2, fz + fnz * 0.12, W(0.24), 0.4, D(0.24), goldMat);
      }
      addBox(fx + fnx * 0.2, y1 - 0.35, fz + fnz * 0.2, W(0.4), 0.5, D(0.4), goldMat);
    }
  }

  function addRoom(x0, x1, z0, z1, tex) {
    const w = x1 - x0, d = z1 - z0;
    const ft = tex.clone(); ft.needsUpdate = true; ft.repeat.set(w, d);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshLambertMaterial({ map: ft }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2);
    scene.add(floor);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(w, d), ceilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set((x0 + x1) / 2, H, (z0 + z1) / 2);
    scene.add(ceil);
    for (let x = x0 + 6; x <= x1 - 5; x += 10) {
      for (let z = z0 + 6; z <= z1 - 5; z += 10) {
        addBox(x, H - 0.1, z, 4, 0.2, 4, lightPanelMat);
      }
    }
  }

  // ---------------- texture painters
  function quoteTexture(q) {
    return canvasTex(1024, 720, (g, w, h) => {
      const bg = g.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#fffaf4'); bg.addColorStop(1, '#fbeee8');
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#c9707f'; g.lineWidth = 6; g.strokeRect(28, 28, w - 56, h - 56);
      g.strokeStyle = '#e7b4bd'; g.lineWidth = 2; g.strokeRect(44, 44, w - 88, h - 88);
      g.fillStyle = '#d86c80';
      for (const [x, y] of [[70, 62], [w - 70, 62], [70, h - 98], [w - 70, h - 98]]) { heartPath(g, x, y, 34); g.fill(); }
      g.fillStyle = 'rgba(201,112,127,0.25)';
      g.font = '700 220px "Playfair Display", serif';
      g.textAlign = 'left'; g.textBaseline = 'top';
      g.fillText('“', 70, 40);
      g.fillStyle = '#4a2730';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      const { size, lines } = fitText(g, q.text, (s) => `italic 500 ${s}px "Playfair Display", Georgia, serif`, w - 220, h - 300, 76);
      const lh = size * 1.25;
      const top = h / 2 - 40 - ((lines.length - 1) * lh) / 2;
      lines.forEach((l, i) => g.fillText(l, w / 2, top + i * lh));
      g.fillStyle = '#b4556a';
      g.font = '600 38px "Fredoka", sans-serif';
      g.fillText(q.author ? `— ${q.author}` : '— with all my love ❤', w / 2, h - 120);
    }, { aniso: maxAniso });
  }

  function brassPlaque(text) {
    return canvasTex(512, 128, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#f1d48f'); gr.addColorStop(0.5, '#d4a94f'); gr.addColorStop(1, '#b88a35');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#8c6420'; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12);
      g.fillStyle = '#4b3209';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      const { size, lines } = fitText(g, text, (s) => `700 ${s}px "Dancing Script", cursive`, w - 50, h - 20, 64);
      g.font = `700 ${size}px "Dancing Script", cursive`;
      g.fillText(lines.join(' '), w / 2, h / 2 + 2);
    }, { aniso: maxAniso });
  }

  function placeholderTexture(i, w, h) {
    const W = w >= h ? 1024 : 768, Hh = w >= h ? 768 : 1024;
    return canvasTex(W, Hh, (g) => {
      const gr = g.createLinearGradient(0, 0, W, Hh);
      gr.addColorStop(0, '#f7c6cf'); gr.addColorStop(1, '#f9e3c6');
      g.fillStyle = gr; g.fillRect(0, 0, W, Hh);
      g.fillStyle = 'rgba(255,255,255,0.35)';
      for (let k = 0; k < 18; k++) { heartPath(g, (k * 137) % W, (k * 251) % Hh, 40 + (k % 4) * 20); g.fill(); }
      g.fillStyle = '#d4566f'; heartPath(g, W / 2, Hh / 2 - 190, 150); g.fill();
      g.fillStyle = '#7a3442'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = '700 84px "Dancing Script", cursive';
      g.fillText('Our memory', W / 2, Hh / 2 + 40);
      g.font = '500 40px "Fredoka", sans-serif';
      g.fillText(`photo #${i + 1} coming soon`, W / 2, Hh / 2 + 120);
    });
  }

  const glowTex = canvasTex(256, 256, (g) => {
    const r = g.createRadialGradient(128, 110, 0, 128, 128, 128);
    r.addColorStop(0, 'rgba(255,236,200,0.75)'); r.addColorStop(0.55, 'rgba(255,225,190,0.25)'); r.addColorStop(1, 'rgba(255,220,190,0)');
    g.fillStyle = r; g.fillRect(0, 0, 256, 256);
  });
  const glowMat = new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 });

  function sign(w, h, pxW, pxH, draw) {
    const tex = canvasTex(pxW, pxH, draw, { aniso: maxAniso });
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  }
  function mount(obj, x, y, z, nx, nz, off = 0.15) {
    obj.position.set(x + nx * off, y, z + nz * off);
    obj.rotation.y = Math.atan2(nx, nz);
    scene.add(obj);
    return obj;
  }

  // ---------------- quotes
  let quoteIdx = 0;
  function placeQuote(x, y, z, nx, nz, w = 6.4) {
    const q = QUOTES[quoteIdx++ % QUOTES.length];
    const h = w * (720 / 1024);
    const grp = new THREE.Group();
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.9, h * 1.9), glowMat); glow.position.z = 0.03; grp.add(glow);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, h + 0.5, 0.2), goldMat); frame.position.z = 0.14; grp.add(frame);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: quoteTexture(q), toneMapped: false }));
    plate.position.z = 0.25; grp.add(plate);
    mount(grp, x, y, z, nx, nz, 0);
  }

  // ---------------- photos
  const frameDarkMat = new THREE.MeshPhongMaterial({ color: '#9c7231', shininess: 60, specular: '#ffe3a1' });
  const frameLipMat = new THREE.MeshPhongMaterial({ color: '#e9c77a', shininess: 100, specular: '#fff6d8' });
  const goldFlatMat = new THREE.MeshBasicMaterial({ color: '#d8b064' });
  const matBoardMat = new THREE.MeshBasicMaterial({ color: '#fbf6ee' });
  const frameShadowMat = new THREE.MeshBasicMaterial({
    map: canvasTex(128, 128, (g) => {
      const r = g.createRadialGradient(64, 64, 20, 64, 64, 64);
      r.addColorStop(0, 'rgba(60,30,20,0.45)'); r.addColorStop(1, 'rgba(60,30,20,0)');
      g.fillStyle = r; g.fillRect(0, 0, 128, 128);
    }), transparent: true, depthWrite: false,
  });
  const heartOrnGeo = (() => {
    const sh = new THREE.Shape();
    sh.moveTo(0, -0.3);
    sh.bezierCurveTo(-0.05, -0.2, -0.36, -0.05, -0.36, 0.12);
    sh.bezierCurveTo(-0.36, 0.3, -0.12, 0.36, 0, 0.2);
    sh.bezierCurveTo(0.12, 0.36, 0.36, 0.3, 0.36, 0.12);
    sh.bezierCurveTo(0.36, -0.05, 0.05, -0.2, 0, -0.3);
    return new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 });
  })();
  const photos = [];
  let wordIdx = 0;
  function placePhoto(data, index, x, y, z, nx, nz, maxW, maxH) {
    const aspect = (data.w && data.h) ? data.w / data.h : 4 / 3;
    let pw, ph;
    if (aspect > maxW / maxH) { pw = maxW; ph = maxW / aspect; } else { ph = maxH; pw = maxH * aspect; }
    const grp = new THREE.Group();
    const F = 1.47; // total frame border (mat + mouldings)
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(pw * 2, ph * 1.9), glowMat); glow.position.z = 0.02; grp.add(glow);
    // soft drop shadow on the wall
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(pw + F * 2 + 1.2, ph + F * 2 + 1.2), frameShadowMat);
    shadow.position.set(0.12, -0.22, 0.03); grp.add(shadow);
    // layered gold frame made of rings: outer moulding, raised ridge, bevel, bright lip; linen mat inside
    const ring = (innerW, innerH, border, depth, m) => {
      const z = 0.05 + depth / 2, W = innerW + border * 2;
      for (const sy of [1, -1]) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(W, border, depth), m);
        bar.position.set(0, sy * (innerH / 2 + border / 2), z); grp.add(bar);
      }
      for (const sx of [1, -1]) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(border, innerH, depth), m);
        bar.position.set(sx * (innerW / 2 + border / 2), 0, z); grp.add(bar);
      }
    };
    let iw = pw + 0.8, ih = ph + 0.8;
    ring(iw, ih, 0.12, 0.34, frameLipMat); iw += 0.24; ih += 0.24;
    ring(iw, ih, 0.3, 0.46, frameDarkMat); iw += 0.6; ih += 0.6;
    ring(iw, ih, 0.3, 0.62, goldMat); iw += 0.6; ih += 0.6;
    ring(iw, ih, 0.36, 0.44, frameDarkMat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(pw + 0.8, ph + 0.8, 0.26), frameDarkMat);
    back.position.z = 0.18; grp.add(back);
    const matBoard = new THREE.Mesh(new THREE.PlaneGeometry(pw + 0.8, ph + 0.8), matBoardMat);
    matBoard.position.z = 0.315; grp.add(matBoard);
    const fillet = new THREE.Mesh(new THREE.PlaneGeometry(pw + 0.12, ph + 0.12), goldFlatMat);
    fillet.position.z = 0.32; grp.add(fillet);
    const mat = new THREE.MeshBasicMaterial({ color: '#efe4dc', toneMapped: false });
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), mat);
    pic.position.z = 0.325; grp.add(pic);
    // little gold heart on the top of the frame
    const heartOrn = new THREE.Mesh(heartOrnGeo, goldMat);
    heartOrn.position.set(0, ph / 2 + F + 0.25, 0.3); grp.add(heartOrn);
    const caption = data.caption || LOVE_WORDS[wordIdx++ % LOVE_WORDS.length];
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.7), new THREE.MeshBasicMaterial({ map: brassPlaque(caption), toneMapped: false }));
    plaque.position.set(0, -ph / 2 - F - 0.6, 0.08); grp.add(plaque);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(Math.min(3.2, pw * 0.6), 0.25, 0.9), goldMat);
    lamp.position.set(0, ph / 2 + F + 0.85, 0.7); grp.add(lamp);
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(Math.min(3, pw * 0.58), 0.08, 0.7), new THREE.MeshBasicMaterial({ color: '#fff6dc' }));
    bulb.position.set(0, ph / 2 + F + 0.71, 0.7); grp.add(bulb);
    mount(grp, x, y, z, nx, nz, 0);

    const p = {
      index, data, mat, mesh: pic, caption, state: 'none', lowTex: null, highTex: null,
      pos: new THREE.Vector3(x + nx * 0.33, y, z + nz * 0.33), normal: new THREE.Vector3(nx, 0, nz), ph,
    };
    pic.userData.photo = p;
    clickables.push(pic);
    photos.push(p);
    return p;
  }

  // ---------------- layout
  const N = photoData.length;
  function capacity(S) {
    let wallSlot = 0, cap = 0;
    for (let i = 0; i < S; i++) {
      for (let k = 0; k < 2; k++) { if (wallSlot++ % 3 !== 2) cap++; }
      if (i % 2 === 1) cap += 2;
    }
    return cap;
  }
  let S = 6;
  while (capacity(S) < N) S++;
  const L = S * 10 + 10; // hall length
  const FZ = L + 40;     // final room back wall

  // rooms
  addRoom(-20, 20, -40, 0, floorTex);
  addRoom(-14, 14, 0, L, floorTex);
  addRoom(-20, 20, L, FZ, floorTex);
  // carpet runner
  {
    const ct = carpetTex.clone(); ct.needsUpdate = true; ct.repeat.set(6, L + 60);
    const carpet = new THREE.Mesh(new THREE.PlaneGeometry(6, L + 60), new THREE.MeshLambertMaterial({ map: ct }));
    carpet.rotation.x = -Math.PI / 2; carpet.position.set(0, 0.03, L / 2);
    scene.add(carpet);
  }

  // lobby
  wallSeg(-20, -40, 20, -40, 0, 1);
  wallSeg(-20, -40, -20, 0, 1, 0);
  wallSeg(20, -40, 20, 0, -1, 0);
  // wall between lobby and hall (face at z=0 towards the lobby, hall side at z=T)
  wallSeg(-20, 0, -7, 0, 0, -1, 0, H, true, true);
  wallSeg(7, 0, 20, 0, 0, -1, 0, H, true, true);
  // hall
  wallSeg(-14, 0, -14, L, 1, 0);
  wallSeg(14, 0, 14, L, -1, 0);
  // wall between hall and final room (face at z=L towards the final room, hall side at z=L-T)
  wallSeg(-20, L, -7, L, 0, 1, 0, H, true, true);
  wallSeg(7, L, 20, L, 0, 1, 0, H, true, true);
  // final room
  wallSeg(-20, L, -20, FZ, 1, 0);
  wallSeg(20, L, 20, FZ, -1, 0);
  wallSeg(-20, FZ, 20, FZ, 0, -1);
  // lintels above the two doors + gold door frames
  for (const [z, nz] of [[0, -1], [L, 1]]) {
    wallSeg(-7, z, 7, z, 0, nz, 12.5, H, false);
    const zc = z - nz * T / 2;
    for (const side of [1, -1]) addBox(side * 7.3, 6.25, zc, 0.6, 12.5, T + 0.6, goldMat);
    addBox(0, 12.8, zc, 15.2, 0.6, T + 0.6, goldMat);
  }

  // ---- hall content
  let photoI = 0, wallSlot = 0;
  const nextPhoto = () => (photoI < N ? photoData[photoI] : null);
  for (let i = 0; i < S; i++) {
    const z = 10 + i * 10;
    const doWall = (x, nx) => {
      const isQuote = wallSlot++ % 3 === 2 || photoI >= N;
      if (isQuote) placeQuote(x, 7.2, z, nx, 0);
      else { placePhoto(nextPhoto(), photoI, x, 8.4, z, nx, 0, 6.2, 6.4); photoI++; }
    };
    doWall(-14, 1);
    if (i % 2 === 1) {
      // free-standing double-sided panel
      addBox(0, 6.25, z - 5, 1, 12.5, 9.4, wallMat, { collide: true, cam: true });
      addBox(0, 12.6, z - 5, 1.3, 0.3, 9.8, goldMat);
      addBox(0, 0.3, z - 5, 1.3, 0.6, 9.8, goldMat);
      for (const nx of [-1, 1]) {
        if (photoI < N) { placePhoto(nextPhoto(), photoI, nx * 0.5, 6.6, z - 5, nx, 0, 5.6, 5.4); photoI++; }
        else placeQuote(nx * 0.5, 6.4, z - 5, nx, 0, 6.6);
      }
    }
    doWall(14, -1);
  }

  // ---- signs
  const titleSign = sign(18, 6.75, 2048, 768, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, '#b8405a'); gr.addColorStop(1, '#d9707f');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#f3d28b'; g.lineWidth = 16; g.strokeRect(24, 24, w - 48, h - 48);
    g.fillStyle = 'rgba(255,255,255,0.12)';
    for (let k = 0; k < 26; k++) { heartPath(g, (k * 331) % w, (k * 197) % h, 50 + (k % 5) * 18); g.fill(); }
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(80,10,30,0.4)'; g.shadowBlur = 20;
    g.font = '700 250px "Dancing Script", cursive';
    g.fillText(CONFIG.title, w / 2, 290);
    g.shadowBlur = 0;
    g.font = '600 74px "Fredoka", sans-serif';
    g.fillStyle = '#ffe9b8';
    g.fillText(`est. ${SINCE_TEXT}`, w / 2, 500);
    g.fillStyle = '#fff';
    g.font = '500 60px "Fredoka", sans-serif';
    g.fillText(`Day ${daysTogether().toLocaleString()} of us ❤`, w / 2, 620);
  });
  mount(titleSign, 0, 9.5, -40, 0, 1, 0.42);
  addBox(0, 9.5, -39.85, 18.8, 7.55, 0.3, goldMat);

  const gallerySign = sign(12, 3, 1536, 384, (g, w, h) => {
    g.fillStyle = '#fff8f2'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#d8b064'; g.lineWidth = 14; g.strokeRect(14, 14, w - 28, h - 28);
    g.fillStyle = '#b8405a'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '700 170px "Dancing Script", cursive';
    g.fillText('The Gallery of Us', w / 2, h / 2 + 8);
  });
  mount(gallerySign, 0, 15.2, 0, 0, -1, 0.2);
  const welcomeSign = gallerySign.clone(); mount(welcomeSign, 0, 15.2, T, 0, 1, 0.2);

  const foreverSign = sign(12, 3, 1536, 384, (g, w, h) => {
    g.fillStyle = '#b8405a'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#f3d28b'; g.lineWidth = 14; g.strokeRect(14, 14, w - 28, h - 28);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '700 170px "Dancing Script", cursive';
    g.fillText('Forever ❤', w / 2, h / 2 + 8);
  });
  mount(foreverSign, 0, 15.2, L - T, 0, -1, 0.2);

  const finalSign = sign(22, 12.4, 2048, 1152, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#fffaf4'); bg.addColorStop(1, '#fde9ea');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#d8b064'; g.lineWidth = 20; g.strokeRect(30, 30, w - 60, h - 60);
    g.strokeStyle = '#e7a9b6'; g.lineWidth = 5; g.strokeRect(62, 62, w - 124, h - 124);
    g.fillStyle = 'rgba(216,108,128,0.15)';
    for (let k = 0; k < 30; k++) { heartPath(g, 100 + (k * 367) % (w - 200), 100 + (k * 211) % (h - 200), 40 + (k % 5) * 22); g.fill(); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#c23f5c';
    g.font = '700 330px "Dancing Script", cursive';
    g.fillText(CONFIG.finalTitle, w / 2, 300);
    g.fillStyle = '#4a2730';
    const { size, lines } = fitText(g, CONFIG.finalMessage, (s) => `italic 500 ${s}px "Playfair Display", serif`, w - 360, 380, 84);
    lines.forEach((l, i) => g.fillText(l, w / 2, 590 + i * size * 1.3 - ((lines.length - 1) * size * 1.3) / 2 + 40));
    g.fillStyle = '#b4556a';
    g.font = '600 64px "Fredoka", sans-serif';
    g.fillText(`since ${SINCE_TEXT} · day ${daysTogether().toLocaleString()} ❤`, w / 2, h - 150);
  });
  mount(finalSign, 0, 8.8, FZ, 0, -1, 0.42);
  addBox(0, 8.8, FZ - 0.1, 23, 13.4, 0.3, goldMat);

  // lobby & final room quotes
  placeQuote(-20, 7.5, -30, 1, 0); placeQuote(-20, 7.5, -12, 1, 0);
  placeQuote(20, 7.5, -30, -1, 0); placeQuote(20, 7.5, -12, -1, 0);
  for (const z of [L + 12, L + 28]) { placeQuote(-20, 7.5, z, 1, 0); placeQuote(20, 7.5, z, -1, 0); }

  // ---- voxel hearts
  const HEART = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
  function voxelHeart(size, color, emissive) {
    const cells = [];
    HEART.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === 'X') cells.push([c - 3, 2.5 - r]); }));
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(size * 0.96, size * 0.96, size * 0.96),
      new THREE.MeshLambertMaterial({ color, emissive }), cells.length);
    const m = new THREE.Matrix4();
    cells.forEach(([x, y], i) => { m.makeTranslation(x * size, y * size, 0); mesh.setMatrixAt(i, m); });
    return mesh;
  }
  // lobby centrepiece
  addBox(0, 1.5, -14, 4.5, 3, 4.5, marbleMat, { collide: true, cam: false });
  addBox(0, 3.1, -14, 5, 0.25, 5, goldMat);
  const heart1 = voxelHeart(0.8, '#e0405f', '#4a0716');
  heart1.position.set(0, 7.2, -14); scene.add(heart1);
  animated.push((t) => { heart1.rotation.y = t * 0.8; heart1.position.y = 7.2 + Math.sin(t * 1.6) * 0.3; });
  const pl1 = new THREE.PointLight('#ff8fa6', 30, 26, 1.6); pl1.position.set(0, 8, -14); scene.add(pl1);
  // final room centrepiece
  // final room: two beating hearts on either side of the message
  for (const sx of [-1, 1]) {
    const hz = FZ - 7;
    addBox(sx * 14.5, 1.5, hz, 4, 3, 4, marbleMat, { collide: true });
    addBox(sx * 14.5, 3.1, hz, 4.5, 0.25, 4.5, goldMat);
    const h2 = voxelHeart(0.95, '#e8325a', '#5a0a1e');
    h2.position.set(sx * 14.5, 8, hz); scene.add(h2);
    animated.push((t) => {
      h2.rotation.y = t * 0.6 * sx;
      h2.scale.setScalar(1 + Math.sin(t * 2.4) * 0.05 + Math.max(0, Math.sin(t * 4.8)) * 0.04);
    });
    const pl = new THREE.PointLight('#ff7f9b', 35, 28, 1.5); pl.position.set(sx * 14.5, 9, hz); scene.add(pl);
  }

  // ---- benches
  function bench(x, z, rotated) {
    const w = rotated ? 2.2 : 7, d = rotated ? 7 : 2.2;
    addBox(x, 1.6, z, w, 0.5, d, woodMat, { collide: true });
    for (const a of [-1, 1]) {
      const lx = rotated ? x : x + a * (w / 2 - 0.6), lz = rotated ? z + a * (d / 2 - 0.6) : z;
      addBox(lx, 0.68, lz, rotated ? 1.8 : 0.6, 1.36, rotated ? 0.6 : 1.8, goldMat);
    }
  }
  bench(-10, -16, true); bench(10, -16, true);
  bench(-8, L + 22, false); bench(8, L + 22, false);

  // ---- plants
  const potMat = new THREE.MeshLambertMaterial({ color: '#c9714b' });
  const leafMat = new THREE.MeshLambertMaterial({ color: '#5aa35a' });
  const leafMat2 = new THREE.MeshLambertMaterial({ color: '#4a8d4b' });
  function plant(x, z) {
    addBox(x, 1, z, 2, 2, 2, potMat, { collide: true });
    addBox(x, 2.05, z, 2.2, 0.2, 2.2, goldMat);
    addBox(x, 3.4, z, 1.8, 2.4, 1.8, leafMat);
    addBox(x + 0.4, 4.6, z - 0.2, 1.2, 1.2, 1.2, leafMat2);
    addBox(x - 0.5, 4.2, z + 0.4, 1, 1, 1, leafMat2);
    // daisies on the plant
    const d = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.1), new THREE.MeshLambertMaterial({ color: '#fff' }));
    d.position.set(x, 4.2, z + 0.92); scene.add(d);
    const dc = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.12), new THREE.MeshLambertMaterial({ color: '#f5b819' }));
    dc.position.set(x, 4.2, z + 0.94); scene.add(dc);
  }
  plant(-17.5, -37.5); plant(17.5, -37.5); plant(-17.5, -2.5); plant(17.5, -2.5);
  plant(-17.5, L + 37.5); plant(17.5, L + 37.5); plant(-17.5, L + 2.5); plant(17.5, L + 2.5);

  // ---- floating hearts
  const heartSprite = canvasTex(64, 64, (g) => { g.fillStyle = '#fff'; heartPath(g, 32, 6, 54); g.fill(); });
  const PN = isTouch ? 160 : 320;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(PN * 3), pCol = new Float32Array(PN * 3), pSpd = new Float32Array(PN);
  const palette = [new THREE.Color('#ff7a98'), new THREE.Color('#ffb3c4'), new THREE.Color('#e8325a'), new THREE.Color('#ffd1dc')];
  const zMin = -40, zMax = FZ;
  for (let i = 0; i < PN; i++) {
    const z = zMin + Math.random() * (zMax - zMin);
    const halfW = (z > 0 && z < L) ? 13 : 19;
    pPos[i * 3] = (Math.random() * 2 - 1) * halfW;
    pPos[i * 3 + 1] = Math.random() * H;
    pPos[i * 3 + 2] = z;
    const c = palette[i % palette.length];
    pCol[i * 3] = c.r; pCol[i * 3 + 1] = c.g; pCol[i * 3 + 2] = c.b;
    pSpd[i] = 0.6 + Math.random() * 1.4;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  const points = new THREE.Points(pGeo, new THREE.PointsMaterial({
    size: 0.7, map: heartSprite, vertexColors: true, transparent: true, depthWrite: false, opacity: 0.85, alphaTest: 0.05,
  }));
  scene.add(points);
  animated.push((t, dt) => {
    for (let i = 0; i < PN; i++) {
      let y = pPos[i * 3 + 1] + pSpd[i] * dt;
      if (y > H) y = 0;
      pPos[i * 3 + 1] = y;
      pPos[i * 3] += Math.sin(t * 0.8 + i) * dt * 0.3;
    }
    pGeo.attributes.position.needsUpdate = true;
  });

  // ============================================================
  //  Photo texture loading (low-res first, high-res when close)
  // ============================================================
  const HIGH_NEAR = isTouch ? 24 : 34;
  const HIGH_FAR = isTouch ? 40 : 56;
  const HIGH_MAX = Math.min(maxTex, isTouch ? 2048 : 2560);
  const LOW_MAX = 512;

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }
  async function textureFrom(url, maxSize) {
    const img = await loadImage(url);
    const w = img.naturalWidth, h = img.naturalHeight;
    const scale = Math.min(1, maxSize / Math.max(w, h));
    let source = img;
    if (scale < 1) {
      const c = document.createElement('canvas');
      c.width = Math.round(w * scale); c.height = Math.round(h * scale);
      const g = c.getContext('2d');
      g.imageSmoothingQuality = 'high';
      g.drawImage(img, 0, 0, c.width, c.height);
      source = c;
    }
    const t = new THREE.Texture(source);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = maxAniso;
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.needsUpdate = true;
    return t;
  }
  const urlLow = (d) => d.thumb || d.large || d.full || d.src;
  const urlHigh = (d) => d.large || d.full || d.src;
  const urlFull = (d) => d.full || d.src || d.large;

  function setMap(p, tex) {
    p.mat.map = tex; p.mat.color.set('#ffffff'); p.mat.needsUpdate = true;
  }

  async function loadThumbs(onProgress) {
    let done = 0;
    const total = photos.length;
    const queue = photos.slice();
    const worker = async () => {
      while (queue.length) {
        const p = queue.shift();
        try {
          if (p.data.placeholder) p.lowTex = placeholderTexture(p.index, p.data.w, p.data.h);
          else p.lowTex = await textureFrom(urlLow(p.data), LOW_MAX);
          setMap(p, p.lowTex);
          p.state = 'low';
        } catch (e) { console.warn('photo failed', p.data, e); p.state = 'error'; }
        done++; onProgress(done / total);
      }
    };
    await withTimeout(Promise.all(Array.from({ length: 6 }, worker)), 25000);
  }

  let highLoading = 0;
  function updateLOD() {
    const pp = player.pos;
    const cand = [];
    for (const p of photos) {
      if (p.data.placeholder || p.state === 'error') continue;
      const d = Math.hypot(p.pos.x - pp.x, p.pos.z - pp.z);
      if (p.state === 'high' && d > HIGH_FAR) {
        setMap(p, p.lowTex); p.highTex.dispose(); p.highTex = null; p.state = 'low';
      } else if (p.state === 'low' && d < HIGH_NEAR) cand.push([d, p]);
    }
    cand.sort((a, b) => a[0] - b[0]);
    for (const [, p] of cand) {
      if (highLoading >= 2) break;
      highLoading++; p.state = 'loadingHigh';
      textureFrom(urlHigh(p.data), HIGH_MAX).then((t) => {
        p.highTex = t;
        const d = Math.hypot(p.pos.x - player.pos.x, p.pos.z - player.pos.z);
        if (d > HIGH_FAR) { t.dispose(); p.highTex = null; p.state = 'low'; } else { setMap(p, t); p.state = 'high'; }
      }).catch(() => { p.state = 'low'; }).finally(() => { highLoading--; });
    }
  }

  // ============================================================
  //  Player & camera
  // ============================================================
  const girl = createCharacter(CONFIG.girlName);
  const boy = createBoy(CONFIG.boyName);
  for (const c of [girl, boy]) { scene.add(c.root); scene.add(c.shadow); }
  let char = girl, buddyChar = boy;   // char = the one you control, buddyChar = the one following
  const player = { pos: new THREE.Vector3(0, 0, -28), vel: new THREE.Vector3(), grounded: true, facing: 0 };
  const buddy = { pos: new THREE.Vector3(3, 0, -31), vel: new THREE.Vector3(), grounded: true, facing: 0, jumpIn: -1 };
  let selecting = true;
  const R = 1.15, HEIGHT = 5.8;
  const cam = { yaw: Math.PI, pitch: 0.28, dist: isTouch ? 15 : 13, curDist: isTouch ? 15 : 13, fp: false };

  function groundAt(x, z, y) {
    let g = 0;
    const r = R * 0.55;
    for (const c of colliders) {
      if (x + r > c.minX && x - r < c.maxX && z + r > c.minZ && z - r < c.maxZ && y >= c.maxY - 0.65 && c.maxY > g) g = c.maxY;
    }
    return g;
  }
  function resolve(p) {
    for (let iter = 0; iter < 2; iter++) {
      for (const c of colliders) {
        if (p.y >= c.maxY - 0.65 || p.y + HEIGHT <= c.minY) continue;
        const qx = clamp(p.x, c.minX, c.maxX), qz = clamp(p.z, c.minZ, c.maxZ);
        const dx = p.x - qx, dz = p.z - qz;
        const d2 = dx * dx + dz * dz;
        if (d2 >= R * R) continue;
        if (d2 > 1e-9) {
          const d = Math.sqrt(d2), push = (R - d) / d;
          p.x += dx * push; p.z += dz * push;
        } else {
          const pens = [p.x - c.minX + R, c.maxX - p.x + R, p.z - c.minZ + R, c.maxZ - p.z + R];
          const k = pens.indexOf(Math.min(...pens));
          if (k === 0) p.x = c.minX - R; else if (k === 1) p.x = c.maxX + R; else if (k === 2) p.z = c.minZ - R; else p.z = c.maxZ + R;
        }
      }
    }
  }

  function integrate(body, dt) {
    body.vel.y -= 196.2 * dt;
    const sub = 3;
    for (let s = 0; s < sub; s++) {
      body.pos.x += body.vel.x * dt / sub;
      body.pos.z += body.vel.z * dt / sub;
      body.pos.y += body.vel.y * dt / sub;
      resolve(body.pos);
      const g = groundAt(body.pos.x, body.pos.z, body.pos.y);
      if (body.pos.y <= g) { body.pos.y = g; if (body.vel.y < 0) body.vel.y = 0; body.grounded = true; }
      else body.grounded = body.pos.y - g < 0.05 && body.vel.y <= 0;
    }
  }

  // The companion walks after the player, a little behind and to the side.
  function updateBuddy(dt, t) {
    const fx = Math.sin(player.facing), fz = Math.cos(player.facing);
    const tx = player.pos.x - fx * 3.6 + fz * 2.2;
    const tz = player.pos.z - fz * 3.6 - fx * 2.2;
    const toPlayer = Math.hypot(player.pos.x - buddy.pos.x, player.pos.z - buddy.pos.z);
    if (toPlayer > 40 || !Number.isFinite(buddy.pos.x)) { buddy.pos.set(tx, player.pos.y, tz); buddy.vel.set(0, 0, 0); }
    const dx = tx - buddy.pos.x, dz = tz - buddy.pos.z, d = Math.hypot(dx, dz);
    let speed = 0;
    if (toPlayer > 3.2 && d > 0.5) speed = Math.min(30, d * 3.2);
    const k = Math.min(1, dt * 8);
    buddy.vel.x += ((d > 0 ? dx / d : 0) * speed - buddy.vel.x) * k;
    buddy.vel.z += ((d > 0 ? dz / d : 0) * speed - buddy.vel.z) * k;
    // hop along when the player jumps
    if (buddy.jumpIn > 0) { buddy.jumpIn -= dt; if (buddy.jumpIn <= 0 && buddy.grounded) { buddy.vel.y = 46; buddy.grounded = false; } }
    integrate(buddy, dt);
    // never stand inside each other
    const sx = buddy.pos.x - player.pos.x, sz = buddy.pos.z - player.pos.z, sd = Math.hypot(sx, sz);
    if (sd < 2.4 && sd > 1e-4) { buddy.pos.x = player.pos.x + sx / sd * 2.4; buddy.pos.z = player.pos.z + sz / sd * 2.4; resolve(buddy.pos); }
    const hs = Math.hypot(buddy.vel.x, buddy.vel.z);
    const target = hs > 1.5 ? Math.atan2(buddy.vel.x, buddy.vel.z) : Math.atan2(player.pos.x - buddy.pos.x, player.pos.z - buddy.pos.z);
    let diff = target - buddy.facing; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    buddy.facing += diff * Math.min(1, dt * 8);
    buddyChar.root.position.copy(buddy.pos);
    buddyChar.root.rotation.y = buddy.facing;
    buddyChar.update(dt, hs, buddy.grounded, t);
    buddyChar.shadow.position.set(buddy.pos.x, groundAt(buddy.pos.x, buddy.pos.z, buddy.pos.y) + 0.05, buddy.pos.z);
    buddyChar.root.visible = buddyChar.shadow.visible = true;
  }

  function choose(who) {
    const wantBoy = who === 'boy';
    if ((char === boy) !== wantBoy) {
      [char, buddyChar] = [buddyChar, char];
      const pp = player.pos.clone(), pf = player.facing;
      player.pos.copy(buddy.pos); player.facing = buddy.facing;
      buddy.pos.copy(pp); buddy.facing = pf;
      player.vel.set(0, 0, 0); buddy.vel.set(0, 0, 0);
      cam.yaw = player.facing + Math.PI;
    }
    $('btn-swap').textContent = char === boy ? `Play ${CONFIG.girlName}` : `Play ${CONFIG.boyName}`;
  }

  // ---------------- input state
  const keys = new Set();
  const input = { x: 0, z: 0, run: false, jump: false, joy: null };
  let paused = false;

  window.addEventListener('keydown', (e) => {
    if (lightbox.open) {
      if (e.code === 'Escape') lightbox.close();
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') lightbox.step(1);
      else if (e.code === 'ArrowLeft' || e.code === 'KeyA') lightbox.step(-1);
      return;
    }
    if (!$('help').classList.contains('hidden')) { hideHelp(); }
    if (e.target && e.target.tagName === 'INPUT') return;
    keys.add(e.code);
    if (e.code === 'Space') { input.jump = true; e.preventDefault(); }
    if (e.code === 'KeyV' || e.code === 'KeyC') toggleView();
    if ((e.code === 'KeyE' || e.code === 'Enter') && nearest) lightbox.show(nearest.index);
    if (e.code.startsWith('Arrow')) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  function toggleView() {
    cam.fp = !cam.fp;
    if (cam.fp) { cam.pitch = 0.05; if (!isTouch) canvas.requestPointerLock?.(); }
    else { cam.dist = Math.max(cam.dist, 12); cam.curDist = cam.dist; cam.pitch = 0.28; if (document.pointerLockElement) document.exitPointerLock(); }
    $('btn-view').textContent = cam.fp ? '3rd' : '1st';
    $('t-view').textContent = cam.fp ? '3rd' : '1st';
    showToast(cam.fp ? 'First-person view' : 'Third-person view');
  }

  // mouse / touch look
  const pointers = new Map();
  let dragMoved = 0;
  canvas.addEventListener('pointerdown', (e) => {
    if (lightbox.open) return;
    if (!$('help').classList.contains('hidden')) hideHelp();
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY });
    dragMoved = 0;
    canvas.setPointerCapture?.(e.pointerId);
    if (cam.fp && !isTouch && e.pointerType === 'mouse' && !document.pointerLockElement) canvas.requestPointerLock?.();
  });
  canvas.addEventListener('pointermove', (e) => {
    const sens = e.pointerType === 'touch' ? 0.0065 : 0.0045;
    if (document.pointerLockElement === canvas) {
      cam.yaw -= e.movementX * 0.0025; cam.pitch += e.movementY * 0.0025; clampPitch();
      return;
    }
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    dragMoved += Math.abs(dx) + Math.abs(dy);
    cam.yaw -= dx * sens; cam.pitch += dy * sens; clampPitch();
  });
  const endPointer = (e) => {
    const p = pointers.get(e.pointerId);
    pointers.delete(e.pointerId);
    if (p && dragMoved < 8 && !document.pointerLockElement) tryClickPhoto(e.clientX, e.clientY);
    else if (document.pointerLockElement === canvas && e.type === 'pointerup' && nearest) { /* no-op */ }
  };
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', (e) => pointers.delete(e.pointerId));
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (cam.fp) { if (e.deltaY > 0) toggleView(); return; }
    cam.dist = clamp(cam.dist * (1 + e.deltaY * 0.0012), 3, 34);
    if (cam.dist <= 3.2) { cam.dist = 12; toggleView(); }
  }, { passive: false });
  function clampPitch() { cam.pitch = cam.fp ? clamp(cam.pitch, -1.45, 1.45) : clamp(cam.pitch, -0.45, 1.3); }

  const raycaster = new THREE.Raycaster();
  function tryClickPhoto(cx, cy) {
    const ndc = new THREE.Vector2((cx / window.innerWidth) * 2 - 1, -(cy / window.innerHeight) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    raycaster.far = 60;
    const hits = raycaster.intersectObjects([...clickables, ...camBlockers], false);
    if (hits.length && hits[0].object.userData.photo) lightbox.show(hits[0].object.userData.photo.index);
  }
  // pointer-locked click opens the photo you're looking at
  document.addEventListener('mousedown', () => {
    if (document.pointerLockElement === canvas && !lightbox.open) tryClickPhoto(window.innerWidth / 2, window.innerHeight / 2);
  });

  // touch joystick
  const joyZone = $('joy-zone'), joyBase = $('joy-base'), joyKnob = $('joy-knob');
  if (isTouch) document.body.classList.add('touch');
  joyZone.addEventListener('pointerdown', (e) => {
    if (!$('help').classList.contains('hidden')) hideHelp();
    input.joy = { id: e.pointerId, cx: e.clientX, cy: e.clientY, x: 0, y: 0 };
    joyZone.setPointerCapture?.(e.pointerId);
    joyBase.style.left = `${e.clientX}px`; joyBase.style.top = `${e.clientY}px`;
    joyBase.classList.add('active');
    joyKnob.style.transform = 'translate(-50%,-50%)';
  });
  joyZone.addEventListener('pointermove', (e) => {
    const j = input.joy; if (!j || j.id !== e.pointerId) return;
    let dx = e.clientX - j.cx, dy = e.clientY - j.cy;
    const max = 55, m = Math.hypot(dx, dy);
    if (m > max) { dx *= max / m; dy *= max / m; }
    j.x = dx / max; j.y = dy / max;
    joyKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  });
  const joyEnd = (e) => { if (input.joy && input.joy.id === e.pointerId) { input.joy = null; joyBase.classList.remove('active'); } };
  joyZone.addEventListener('pointerup', joyEnd);
  joyZone.addEventListener('pointercancel', joyEnd);
  $('t-jump').addEventListener('pointerdown', (e) => { e.preventDefault(); input.jump = true; });
  $('t-view').addEventListener('pointerdown', (e) => { e.preventDefault(); toggleView(); });
  $('btn-view').addEventListener('click', toggleView);
  $('btn-swap').addEventListener('click', () => { choose(char === boy ? 'girl' : 'boy'); showToast(`You are ${char === boy ? CONFIG.boyName : CONFIG.girlName} now`); });
  $('btn-help').addEventListener('click', () => $('help').classList.toggle('hidden'));
  $('btn-full').addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  });
  if (CONFIG.music) {
    $('btn-music').classList.remove('hidden');
    $('btn-music').addEventListener('click', () => {
      if (audio && !audio.paused) { audio.pause(); $('btn-music').classList.add('off'); }
      else { startMusic(); $('btn-music').classList.remove('off'); }
    });
  }
  function hideHelp() { $('help').classList.add('hidden'); }
  $('help').addEventListener('click', hideHelp);
  $('help-text').innerHTML = isTouch
    ? '<b>Joystick (left side)</b> — drag to walk<br><b>Right side</b> — drag to look around<br><b>Jump</b> button to jump<br><b>1st / 3rd</b> to switch camera<br><b>Tap a photo</b> to see it in full resolution'
    : '<b>W A S D</b> / arrow keys — walk &nbsp; <b>Shift</b> — run<br><b>Space</b> — jump<br><b>Drag mouse</b> — look around &nbsp; <b>Scroll</b> — zoom<br><b>V</b> — switch 1st / 3rd person<br><b>E</b> or <b>click a photo</b> — view it in full resolution';

  // ---------------- toast & chat bubble
  let toastTimer = 0;
  function showToast(text) {
    const t = $('toast'); t.textContent = text; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 1600);
  }
  let bubbleUntil = 0;
  function say(text, secs = 4.5) { $('bubble').textContent = text; bubbleUntil = performance.now() + secs * 1000; }

  // ---------------- lightbox
  const lightbox = {
    open: false, i: 0,
    show(i) {
      this.open = true; this.i = i; keys.clear();
      if (document.pointerLockElement) document.exitPointerLock();
      $('lightbox').classList.remove('hidden');
      this.render();
    },
    render() {
      const p = photos[this.i];
      const img = $('lb-img');
      $('lb-stage').classList.remove('zoomed');
      $('lb-caption').textContent = p.caption;
      $('lb-count').textContent = `${this.i + 1} / ${photos.length}`;
      if (p.data.placeholder) {
        img.src = p.lowTex.image.toDataURL('image/jpeg', 0.9);
        return;
      }
      const token = Symbol('lb'); this.token = token;
      img.src = urlHigh(p.data);
      const full = urlFull(p.data);
      if (full !== img.src) {
        const pre = new Image();
        pre.onload = () => { if (this.token === token) img.src = full; };
        pre.src = full;
      }
    },
    step(d) { this.i = (this.i + d + photos.length) % photos.length; this.render(); },
    close() { this.open = false; $('lightbox').classList.add('hidden'); },
  };
  $('lb-close').addEventListener('click', () => lightbox.close());
  $('lb-prev').addEventListener('click', () => lightbox.step(-1));
  $('lb-next').addEventListener('click', () => lightbox.step(1));
  $('lb-img').addEventListener('click', (e) => { e.stopPropagation(); $('lb-stage').classList.toggle('zoomed'); });
  $('lb-stage').addEventListener('click', (e) => { if (e.target === $('lb-stage')) lightbox.close(); });
  $('prompt').addEventListener('click', () => { if (nearest) lightbox.show(nearest.index); });

  // ============================================================
  //  Loop
  // ============================================================
  let nearest = null;
  let lastLOD = 0;
  let room = 'lobby';
  let nextChat = 25, chatIdx = 0, photoChatIdx = 0, lastTalked = null;
  const clock = new THREE.Clock();
  const tmpV = new THREE.Vector3();
  const camDir = new THREE.Vector3();

  function step(dt, t) {
    // ---- movement input
    let ix = 0, iz = 0, run = false;
    if (keys.has('KeyW') || keys.has('ArrowUp')) iz += 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) iz -= 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) ix -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1;
    run = keys.has('ShiftLeft') || keys.has('ShiftRight');
    let mag = Math.hypot(ix, iz);
    if (mag > 1) { ix /= mag; iz /= mag; mag = 1; }
    if (input.joy) { ix = input.joy.x; iz = -input.joy.y; mag = Math.min(1, Math.hypot(ix, iz)); run = mag > 0.92; }
    if (lightbox.open) { ix = iz = 0; mag = 0; input.jump = false; }

    const sy = Math.sin(cam.yaw), cy = Math.cos(cam.yaw);
    const mx = ix * cy + iz * -sy;
    const mz = ix * -sy + iz * -cy;
    const speed = (run ? 28 : 16) * (input.joy ? Math.min(1, mag * 1.15) : (mag > 0 ? 1 : 0));
    const k = Math.min(1, dt * 12);
    player.vel.x += (mx * speed - player.vel.x) * k;
    player.vel.z += (mz * speed - player.vel.z) * k;
    if (input.jump && player.grounded) { player.vel.y = 50; player.grounded = false; buddy.jumpIn = 0.18; }
    input.jump = false;
    integrate(player, dt);
    // safety net
    if (player.pos.y < -20 || !Number.isFinite(player.pos.x)) { player.pos.set(0, 0, -28); player.vel.set(0, 0, 0); }

    // ---- character
    const hs = Math.hypot(player.vel.x, player.vel.z);
    if (cam.fp) player.facing = cam.yaw + Math.PI;
    else if (hs > 1) {
      const target = Math.atan2(player.vel.x, player.vel.z);
      let diff = target - player.facing;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      player.facing += diff * Math.min(1, dt * 14);
    }
    char.root.position.copy(player.pos);
    char.root.rotation.y = player.facing;
    char.update(dt, hs, player.grounded, t);
    updateBuddy(dt, t);
    char.shadow.position.set(player.pos.x, groundAt(player.pos.x, player.pos.z, player.pos.y) + 0.05, player.pos.z);

    // ---- camera
    const head = tmpV.set(player.pos.x, player.pos.y + 4.6, player.pos.z);
    if (cam.fp) {
      camera.position.set(player.pos.x, player.pos.y + 4.75, player.pos.z);
      camDir.set(-Math.sin(cam.yaw) * Math.cos(cam.pitch), -Math.sin(cam.pitch), -Math.cos(cam.yaw) * Math.cos(cam.pitch));
      camera.lookAt(camera.position.x + camDir.x, camera.position.y + camDir.y, camera.position.z + camDir.z);
      char.root.visible = false;
    } else {
      cam.curDist += (cam.dist - cam.curDist) * Math.min(1, dt * 10);
      camDir.set(Math.sin(cam.yaw) * Math.cos(cam.pitch), Math.sin(cam.pitch), Math.cos(cam.yaw) * Math.cos(cam.pitch));
      raycaster.set(head, camDir); raycaster.far = cam.curDist + 0.5;
      const hit = raycaster.intersectObjects(camBlockers, false)[0];
      const d = hit ? Math.max(0.8, hit.distance - 0.6) : cam.curDist;
      camera.position.copy(head).addScaledVector(camDir, d);
      camera.position.y = Math.min(camera.position.y, H - 0.6);
      camera.position.y = Math.max(camera.position.y, 0.6);
      camera.lookAt(head);
      char.root.visible = d > 2.2;
    }
    char.shadow.visible = char.root.visible;

    // ---- nearest photo prompt
    nearest = null;
    let best = 11;
    for (const p of photos) {
      const dx = player.pos.x - p.pos.x, dz = player.pos.z - p.pos.z;
      if (dx * p.normal.x + dz * p.normal.z < 0.5) continue; // behind the photo
      const d = Math.hypot(dx, dz);
      if (d < best) { best = d; nearest = p; }
    }
    const prompt = $('prompt');
    if (nearest && !lightbox.open) {
      const v = new THREE.Vector3(nearest.pos.x, nearest.pos.y - nearest.ph / 2 + 0.6, nearest.pos.z).project(camera);
      if (v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1) {
        prompt.classList.remove('hidden');
        prompt.style.left = `${clamp((v.x * 0.5 + 0.5) * window.innerWidth, 90, window.innerWidth - 90)}px`;
        prompt.style.top = `${clamp((-v.y * 0.5 + 0.5) * window.innerHeight, 80, window.innerHeight - 140)}px`;
        $('prompt-obj').textContent = nearest.caption;
      } else prompt.classList.add('hidden');
    } else prompt.classList.add('hidden');

    // ---- chat bubble: he is the one talking
    const bubble = $('bubble');
    const boyPos = char === boy ? player.pos : buddy.pos;
    if (performance.now() < bubbleUntil && boy.root.visible) {
      const v = new THREE.Vector3(boyPos.x, boyPos.y + 7.6, boyPos.z).project(camera);
      if (v.z < 1) {
        bubble.classList.add('show');
        bubble.style.left = `${clamp((v.x * 0.5 + 0.5) * window.innerWidth, 140, window.innerWidth - 140)}px`;
        bubble.style.top = `${clamp((-v.y * 0.5 + 0.5) * window.innerHeight, 90, window.innerHeight - 40)}px`;
      } else bubble.classList.remove('show');
    } else if (performance.now() < bubbleUntil && cam.fp && char === boy) {
      bubble.classList.add('show');
      bubble.style.left = '50%'; bubble.style.top = '22%';
    } else bubble.classList.remove('show');

    // he says something sweet now and then, and about the photos you stop at
    if (performance.now() > bubbleUntil + 14000 && t > nextChat) {
      say(BOY_LINES[chatIdx++ % BOY_LINES.length]);
      nextChat = t + 22 + Math.random() * 12;
    }
    if (nearest && nearest !== lastTalked && best < 8 && performance.now() > bubbleUntil + 1500 && Math.random() < 0.35 * dt * 4) {
      lastTalked = nearest;
      say(PHOTO_LINES[photoChatIdx++ % PHOTO_LINES.length]);
    }

    const newRoom = player.pos.z < 0 ? 'lobby' : player.pos.z < L ? 'hall' : 'final';
    if (newRoom !== room) {
      room = newRoom;
      if (room === 'hall') say('Look at all our memories… ❤️');
      if (room === 'final') say('I love you, forever & always ❤️', 6);
    }

    for (const fn of animated) fn(t, dt);

    if (t - lastLOD > 0.4) { lastLOD = t; updateLOD(); }
  }

  // character select: both stand side by side in the lobby facing the camera
  function selectStep(dt, t) {
    const sides = [[girl, -2.6], [boy, 2.6]];
    for (const [c, x] of sides) {
      c.root.visible = c.shadow.visible = true;
      c.root.position.set(x, 0, -27);
      c.root.rotation.y = 0;
      c.update(dt, 0, true, t);
      c.shadow.position.set(x, 0.05, -27);
    }
    const narrow = camera.aspect < 1;
    camera.position.set(0, 4.2, narrow ? -10 : -16.5);
    camera.lookAt(0, 3.6, -27);
    for (const fn of animated) fn(t, dt);
  }

  function frame() {
    const dt = Math.min(clock.getDelta(), 1 / 20);
    const t = clock.elapsedTime;
    if (!paused) (selecting ? selectStep : step)(dt, t);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  function fitCamera() {
    camera.aspect = window.innerWidth / window.innerHeight;
    // keep a comfortable horizontal view on portrait phones
    camera.fov = camera.aspect < 1 ? clamp(70 / Math.sqrt(camera.aspect), 70, 95) : 70;
    camera.updateProjectionMatrix();
  }
  fitCamera();
  window.addEventListener('resize', () => {
    fitCamera();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  document.addEventListener('visibilitychange', () => { paused = document.hidden; clock.getDelta(); });

  return {
    loadThumbs,
    start() {
      $('chip-title').textContent = CONFIG.title;
      clock.start();
      $('sel-boy-name').textContent = CONFIG.boyName;
      $('sel-girl-name').textContent = CONFIG.girlName;
      $('select').classList.remove('hidden');
      $('topbar').classList.add('hidden');
      const pick = (who) => {
        $('select').classList.add('hidden');
        $('topbar').classList.remove('hidden');
        player.pos.set(who === 'boy' ? 2.6 : -2.6, 0, -27);
        buddy.pos.set(who === 'boy' ? -2.6 : 2.6, 0, -27);
        player.facing = 0; buddy.facing = 0; cam.yaw = Math.PI;
        char = girl; buddyChar = boy;
        choose(who);
        player.pos.set(who === 'boy' ? 2.6 : -2.6, 0, -27); player.facing = 0;
        buddy.pos.set(who === 'boy' ? -2.6 : 2.6, 0, -27); buddy.facing = 0;
        cam.yaw = Math.PI;
        selecting = false;
        $('help').classList.remove('hidden');
        step(0.016, clock.elapsedTime);
        setTimeout(() => say(who === 'boy'
          ? `Come on ${CONFIG.girlName}, I made you a museum ❤️`
          : `Hi ${CONFIG.girlName}! Welcome to the ${CONFIG.title} ❤️`), 700);
      };
      $('sel-boy').addEventListener('click', () => pick('boy'));
      $('sel-girl').addEventListener('click', () => pick('girl'));
      frame();
    },
    debug: { player, buddy, cam, photos, lightbox, choose, get selecting() { return selecting; } },
  };
}
