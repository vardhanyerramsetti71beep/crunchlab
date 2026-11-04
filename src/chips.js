// A single saddle-shaped potato chip, reused by every instanced chip field.
import * as THREE from 'three';
import { mulberry32 } from './packArt.js';

export function createChipGeometry() {
  const R = 7, S = 44;
  const rnd = mulberry32(3);
  const a1 = rnd() * 6.28, a2 = rnd() * 6.28;
  const pos = [0, 0, 0];
  const uv = [0.5, 0.5];
  const idx = [];
  for (let r = 1; r <= R; r++) {
    const k = r / R;
    for (let s = 0; s < S; s++) {
      const th = (s / S) * Math.PI * 2;
      const edge = 1 + 0.08 * Math.sin(3 * th + a1) + 0.045 * Math.sin(7 * th + a2);
      const rr = 0.5 * k * edge;
      const x = Math.cos(th) * rr;
      const y = Math.sin(th) * rr * 0.84;
      // Saddle curve plus a small ripple toward the rim
      const z = 0.3 * (x * x - y * y) + 0.02 * Math.sin(5 * th + a1) * k;
      pos.push(x, y, z);
      uv.push(x + 0.5, y + 0.5);
    }
  }
  for (let s = 0; s < S; s++) idx.push(0, 1 + s, 1 + ((s + 1) % S));
  for (let r = 1; r < R; r++) {
    const a0 = 1 + (r - 1) * S, b0 = 1 + r * S;
    for (let s = 0; s < S; s++) {
      const s1 = (s + 1) % S;
      const a = a0 + s, b = a0 + s1, c = b0 + s, d = b0 + s1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function createChipMaterial() {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(S * 0.45, S * 0.4, 10, S / 2, S / 2, S * 0.6);
  g.addColorStop(0, '#FFD66A');
  g.addColorStop(0.6, '#E9A230');
  g.addColorStop(1, '#B46A14');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const rnd = mulberry32(21);
  for (let i = 0; i < 46; i++) {
    ctx.fillStyle = `rgba(170,95,20,${0.08 + rnd() * 0.12})`;
    ctx.beginPath();
    ctx.ellipse(rnd() * S, rnd() * S, 6 + rnd() * 22, 4 + rnd() * 12, rnd() * 3, 0, 6.28);
    ctx.fill();
  }
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(255,244,210,${0.15 + rnd() * 0.2})`;
    ctx.beginPath();
    ctx.arc(rnd() * S, rnd() * S, 1.5 + rnd() * 4, 0, 6.28);
    ctx.fill();
  }
  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = `rgba(150,40,20,${0.25 + rnd() * 0.4})`;
    ctx.fillRect(rnd() * S, rnd() * S, 1.5 + rnd() * 2.5, 1.5 + rnd() * 2.5);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0, side: THREE.DoubleSide });
}
