// The particle sphere from rugbuster.io, drawn in a WebView with Three.js.
// The app drives it with injectJavaScript: rb.scan(on), rb.verdict(color),
// rb.image(url). Everything is computed on the phone.

export const SPHERE_HTML = `<!doctype html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>html,body{margin:0;height:100%;background:transparent;overflow:hidden}canvas{display:block}</style>
</head><body>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js"}}</script>
<script type="module">
import * as THREE from "three";
const W = () => innerWidth, H = () => innerHeight;
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(W(), H());
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W() / H(), 0.1, 100);
camera.position.z = 7.2;
const R = 1.9;

const purple = new THREE.Color("#9945ff"), cyan = new THREE.Color("#19d3ff"), green = new THREE.Color("#14f195");
function grad(t) { return t < 0.5 ? purple.clone().lerp(cyan, t * 2) : cyan.clone().lerp(green, (t - 0.5) * 2); }

function dotTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d"), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.35, "rgba(255,255,255,.8)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
const tex = dotTexture();

function shell(n, radius, size, jitter, alpha) {
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2, rr = Math.sqrt(1 - y * y), th = golden * i;
    const k = radius * (1 + (Math.random() - 0.5) * jitter);
    pos.set([Math.cos(th) * rr * k, y * k, Math.sin(th) * rr * k], i * 3);
    const c = grad((y + 1) / 2); col.set([c.r, c.g, c.b], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ size, map: tex, vertexColors: true, transparent: true, opacity: alpha,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  return new THREE.Points(geo, mat);
}
const globe = new THREE.Group(); scene.add(globe);
const core = shell(3200, R, 0.06, 0.04, 0.95); globe.add(core);
const halo = shell(900, R * 1.32, 0.045, 0.25, 0.45); globe.add(halo);
const baseColors = core.geometry.attributes.color.array.slice();

// portrait: the token image rebuilt from particles, always facing the viewer
let portrait = null, formT = 0;
function clearPortrait() { if (portrait) { scene.remove(portrait); portrait.geometry.dispose(); portrait = null; } }
function buildPortrait(img) {
  const S = 56, c = document.createElement("canvas"); c.width = c.height = S;
  const g = c.getContext("2d"), side = Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height);
  g.drawImage(img, ((img.naturalWidth || img.width) - side) / 2, ((img.naturalHeight || img.height) - side) / 2, side, side, 0, 0, S, S);
  const px = g.getImageData(0, 0, S, S).data;
  const corner = [0, S - 1, S * (S - 1), S * S - 1].map((q) => [px[q * 4], px[q * 4 + 1], px[q * 4 + 2]]);
  const bg = [0, 1, 2].map((ch) => corner.reduce((a, cc) => a + cc[ch], 0) / 4);
  const pos = [], from = [], col = [];
  const D = R * 1.15;
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const q = (j * S + i) * 4, a = px[q + 3] / 255;
    const dist = Math.hypot(px[q] - bg[0], px[q + 1] - bg[1], px[q + 2] - bg[2]) / 255;
    const u = i / (S - 1) - 0.5, v = j / (S - 1) - 0.5;
    if (a < 0.2 || dist < 0.12 || Math.hypot(u, v) > 0.5) continue;
    const lum = (px[q] * 0.3 + px[q + 1] * 0.59 + px[q + 2] * 0.11) / 255;
    pos.push(u * R * 1.3, -v * R * 1.3, R * 0.25 + lum * 0.3);
    const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    from.push(Math.sin(ph) * Math.cos(th) * R * 1.4, Math.cos(ph) * R * 1.4, Math.sin(ph) * Math.sin(th) * R * 1.4);
    col.push(px[q] / 255, px[q + 1] / 255, px[q + 2] / 255);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(from), 3));
  geo.userData = { to: new Float32Array(pos), from: new Float32Array(from) };
  geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(col), 3));
  const mat = new THREE.PointsMaterial({ size: 0.075, map: tex, vertexColors: true, transparent: true, opacity: 1, depthWrite: false });
  return new THREE.Points(geo, mat);
}

let scanning = false, tint = null, tintT = 0, pulse = 0;
window.rb = {
  scan(on) { scanning = !!on; if (on) { tint = null; tintT = 0; clearPortrait(); } },
  verdict(color) { tint = color ? new THREE.Color(color) : null; tintT = 0; pulse = 1; },
  image(url) {
    clearPortrait(); if (!url) return;
    const img = new Image(); img.crossOrigin = "anonymous";
    img.onload = () => { try { portrait = buildPortrait(img); scene.add(portrait); formT = 0; } catch (e) {} };
    img.src = url;
  },
};

addEventListener("resize", () => { renderer.setSize(W(), H()); camera.aspect = W() / H(); camera.updateProjectionMatrix(); });
const clock = new THREE.Clock();
let spin = 0;
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  spin += dt * (scanning ? 1.6 : 0.18);
  globe.rotation.y = spin; globe.rotation.x = Math.sin(t * 0.3) * 0.12;
  const s = 1 + (scanning ? Math.sin(t * 7) * 0.025 : 0) + pulse * 0.06;
  globe.scale.setScalar(s); pulse = Math.max(0, pulse - dt * 1.5);
  const c = core.geometry.attributes.color.array;
  if (tint) {
    tintT = Math.min(1, tintT + dt * 1.2);
    for (let i = 0; i < c.length; i += 3) {
      c[i] = baseColors[i] + (tint.r - baseColors[i]) * tintT * 0.65;
      c[i + 1] = baseColors[i + 1] + (tint.g - baseColors[i + 1]) * tintT * 0.65;
      c[i + 2] = baseColors[i + 2] + (tint.b - baseColors[i + 2]) * tintT * 0.65;
    }
    core.geometry.attributes.color.needsUpdate = true;
  } else if (tintT !== -1) { c.set(baseColors); core.geometry.attributes.color.needsUpdate = true; tintT = -1; }
  core.material.opacity = portrait ? 0.35 : 0.95;
  if (portrait) {
    formT = Math.min(1, formT + dt * 0.7);
    const e = 1 - Math.pow(1 - formT, 3), p = portrait.geometry.attributes.position.array, { to, from } = portrait.geometry.userData;
    for (let i = 0; i < p.length; i++) p[i] = from[i] + (to[i] - from[i]) * e;
    portrait.geometry.attributes.position.needsUpdate = true;
    portrait.rotation.y = Math.sin(t * 0.6) * 0.18;
  }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
frame();
</script></body></html>`;
