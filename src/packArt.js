// Draws the pack artwork for each flavor onto 2D canvases.
// The 3D bags use these canvases as textures, so no image files are needed.
import { BRAND } from './flavors.js';

export const SEAL = 0.085; // top/bottom crimped seal, as a fraction of bag height
const W = 1024;
const H = 1536;

export function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hex(h) {
  const s = h.replace('#', '');
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}
export function mix(a, b, t) {
  const pa = hex(a), pb = hex(b);
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
export function rgba(h, a) {
  const p = hex(h);
  return `rgba(${p[0]},${p[1]},${p[2]},${a})`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function spacing(ctx, px) {
  if ('letterSpacing' in ctx) ctx.letterSpacing = px + 'px';
}

function wrapText(ctx, text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lh;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, y);
}

// A single potato chip: wavy oval, golden gradient, seasoning specks.
export function chipPath(ctx, r, seed) {
  const rnd = mulberry32(seed | 0);
  const a1 = rnd() * 6.28, a2 = rnd() * 6.28;
  ctx.beginPath();
  for (let i = 0; i <= 48; i++) {
    const th = (i / 48) * Math.PI * 2;
    const rr = r * (1 + 0.08 * Math.sin(3 * th + a1) + 0.045 * Math.sin(7 * th + a2));
    const x = Math.cos(th) * rr, y = Math.sin(th) * rr * 0.8;
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  ctx.closePath();
}

export function drawChip(ctx, x, y, r, rot, season = '#8E0E16', seed = 1, specks = 18) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  chipPath(ctx, r, seed);
  const g = ctx.createRadialGradient(-r * 0.25, -r * 0.3, r * 0.1, 0, 0, r * 1.1);
  g.addColorStop(0, '#FFE7A3');
  g.addColorStop(0.55, '#F4B942');
  g.addColorStop(1, '#C47A17');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = Math.max(1, r * 0.05);
  ctx.strokeStyle = 'rgba(140,80,10,.55)';
  ctx.stroke();
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,.35)';
  ctx.lineWidth = r * 0.08;
  ctx.beginPath();
  ctx.ellipse(-r * 0.1, -r * 0.15, r * 0.55, r * 0.3, -0.4, Math.PI * 1.1, Math.PI * 1.8);
  ctx.stroke();
  const rnd = mulberry32((seed | 0) + 7);
  ctx.fillStyle = season;
  for (let i = 0; i < specks; i++) {
    const a = rnd() * 6.28, d = Math.sqrt(rnd()) * r * 0.85;
    ctx.globalAlpha = 0.55 + rnd() * 0.4;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * d, Math.sin(a) * d * 0.8, r * (0.025 + rnd() * 0.04), 0, 6.28);
    ctx.fill();
  }
  ctx.restore();
  ctx.restore();
}

// Small ingredient drawings for the pack front (base size about 100px).
function drawIcon(ctx, type, x, y, s, rot, f) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.shadowColor = 'rgba(0,0,0,.25)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 6;
  if (type === 'chili') {
    const g = ctx.createLinearGradient(-50, 0, 55, 0);
    g.addColorStop(0, '#ff5a3c');
    g.addColorStop(1, '#a80f19');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-40, -12);
    ctx.bezierCurveTo(-10, -32, 30, -22, 58, 28);
    ctx.bezierCurveTo(30, 6, -10, 12, -40, 12);
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = 'rgba(255,255,255,.4)';
    ctx.beginPath();
    ctx.ellipse(-8, -12, 18, 4, -0.25, 0, 6.28);
    ctx.fill();
    ctx.strokeStyle = '#2e8b3d';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-40, 0);
    ctx.quadraticCurveTo(-56, -4, -62, -24);
    ctx.stroke();
  } else if (type === 'leaf') {
    ctx.fillStyle = '#46c463';
    ctx.beginPath();
    ctx.moveTo(-52, 0);
    ctx.quadraticCurveTo(0, -40, 52, 0);
    ctx.quadraticCurveTo(0, 40, -52, 0);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(255,255,255,.65)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-46, 0);
    ctx.lineTo(46, 0);
    ctx.stroke();
  } else if (type === 'crystal') {
    for (const [cx, cy, sz, r] of [[-20, 8, 34, 0.3], [18, -10, 28, -0.4], [12, 26, 20, 0.9]]) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(r);
      const g = ctx.createLinearGradient(-sz, -sz, sz, sz);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(1, '#cfe3ef');
      ctx.fillStyle = g;
      ctx.fillRect(-sz / 2, -sz / 2, sz, sz);
      ctx.strokeStyle = 'rgba(80,110,130,.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(-sz / 2, -sz / 2, sz, sz);
      ctx.restore();
    }
  } else if (type === 'flame') {
    const g = ctx.createLinearGradient(0, 50, 0, -50);
    g.addColorStop(0, '#ff5e00');
    g.addColorStop(1, '#ffd23f');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.bezierCurveTo(-46, 40, -40, -6, -10, -52);
    ctx.bezierCurveTo(-4, -20, 16, -26, 10, -46);
    ctx.bezierCurveTo(46, -10, 46, 40, 0, 50);
    ctx.fill();
  } else if (type === 'drop') {
    const g = ctx.createLinearGradient(0, -50, 0, 60);
    g.addColorStop(0, '#d8f0ff');
    g.addColorStop(1, '#4aa3f0');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -52);
    ctx.bezierCurveTo(28, -12, 40, 8, 40, 22);
    ctx.arc(0, 22, 40, 0, Math.PI);
    ctx.bezierCurveTo(-40, 8, -28, -12, 0, -52);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    ctx.beginPath();
    ctx.ellipse(-14, 18, 7, 13, 0.3, 0, 6.28);
    ctx.fill();
  } else {
    ctx.fillStyle = f.glow;
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const rr = i % 2 ? 18 : 52;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawSeals(ctx, f, seal) {
  for (const [y0, y1] of [[0, seal], [H - seal, H]]) {
    ctx.fillStyle = mix(f.color, f.deep, 0.2);
    ctx.fillRect(0, y0, W, y1 - y0);
    for (let y = y0 + 4; y < y1 - 2; y += 10) {
      ctx.fillStyle = 'rgba(0,0,0,.16)';
      ctx.fillRect(0, y, W, 3);
      ctx.fillStyle = 'rgba(255,255,255,.12)';
      ctx.fillRect(0, y + 4, W, 2);
    }
    ctx.fillStyle = 'rgba(0,0,0,.22)';
    ctx.fillRect(0, y0 === 0 ? y1 - 4 : y0, W, 4);
  }
  ctx.fillStyle = rgba(f.ink, 0.75);
  ctx.font = '500 22px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  spacing(ctx, 3);
  ctx.fillText('TEAR HERE  >', 64, seal / 2 + 4);
  spacing(ctx, 0);
}

function base(f, t0, t1) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, mix(f.color, '#ffffff', t0));
  g.addColorStop(0.5, f.color);
  g.addColorStop(1, mix(f.color, f.deep, t1));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // Brand ring motif
  ctx.save();
  ctx.strokeStyle = mix(f.color, f.deep, 0.22);
  ctx.lineWidth = 34;
  ctx.globalAlpha = 0.5;
  for (let r = 70; r < 1500; r += 72) {
    ctx.beginPath();
    ctx.arc(W / 2, H * 0.6, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  return { c, ctx };
}

function finish(ctx, f) {
  // Foil gloss and edge shading
  const gl = ctx.createLinearGradient(0, 0, W, H * 0.7);
  gl.addColorStop(0.18, 'rgba(255,255,255,0)');
  gl.addColorStop(0.3, 'rgba(255,255,255,.16)');
  gl.addColorStop(0.4, 'rgba(255,255,255,0)');
  ctx.fillStyle = gl;
  ctx.fillRect(0, 0, W, H);
  const sh = ctx.createLinearGradient(0, 0, W, 0);
  sh.addColorStop(0, 'rgba(0,0,0,.2)');
  sh.addColorStop(0.12, 'rgba(0,0,0,0)');
  sh.addColorStop(0.88, 'rgba(0,0,0,0)');
  sh.addColorStop(1, 'rgba(0,0,0,.2)');
  ctx.fillStyle = sh;
  ctx.fillRect(0, 0, W, H);
  drawSeals(ctx, f, Math.round(H * SEAL));
}

export function makePackFront(f) {
  const { c, ctx } = base(f, 0.1, 0.4);
  const seal = Math.round(H * SEAL);

  const rg = ctx.createRadialGradient(W / 2, H * 0.5, 40, W / 2, H * 0.5, 720);
  rg.addColorStop(0, rgba(f.glow, 0.5));
  rg.addColorStop(1, rgba(f.glow, 0));
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, W, H);

  // Brand badge
  ctx.save();
  ctx.translate(W / 2, 300);
  ctx.rotate(-0.06);
  ctx.shadowColor = rgba(f.deep, 0.45);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 14;
  roundRect(ctx, -320, -92, 640, 184, 46);
  ctx.fillStyle = '#FFFDF6';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 12;
  ctx.strokeStyle = '#15110B';
  ctx.stroke();
  ctx.fillStyle = '#15110B';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 112px Archivo, sans-serif';
  const bw = ctx.measureText(BRAND).width;
  if (bw > 560) ctx.font = `900 ${Math.floor((112 * 560) / bw)}px Archivo, sans-serif`;
  ctx.fillText(BRAND, 0, 8);
  ctx.restore();
  drawChip(ctx, W / 2 + 300, 214, 54, 0.4, f.season, 11, 8);

  ctx.fillStyle = f.ink;
  ctx.globalAlpha = 0.9;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '500 30px "JetBrains Mono", monospace';
  spacing(ctx, 5);
  ctx.fillText('KETTLE-STYLE POTATO CHIPS', W / 2, 474);
  spacing(ctx, 0);
  ctx.globalAlpha = 1;

  // Flavor name
  const lines = f.lines.map((s) => s.toUpperCase());
  let size = 210;
  ctx.font = `900 ${size}px Archivo, sans-serif`;
  const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
  size = Math.min(210, Math.floor((size * 860) / widest));
  ctx.font = `900 ${size}px Archivo, sans-serif`;
  const lh = size * 0.92;
  const top = 560 + size * 0.8;
  ctx.lineJoin = 'round';
  lines.forEach((l, i) => {
    const y = top + i * lh;
    ctx.lineWidth = size * 0.13;
    ctx.strokeStyle = f.deep;
    ctx.strokeText(l, W / 2, y + size * 0.05);
    ctx.fillStyle = f.ink;
    ctx.fillText(l, W / 2, y);
  });

  drawIcon(ctx, f.icon, 168, 1020, 1.5, -0.4, f);
  drawIcon(ctx, f.icon, 864, 960, 1.2, 0.5, f);

  // Chip pile
  ctx.save();
  ctx.shadowColor = rgba(f.deep, 0.5);
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 16;
  const pile = [
    [515, 1150, 175, 0.15, 3],
    [330, 1210, 150, -0.5, 1],
    [700, 1200, 160, 0.6, 2],
    [420, 1300, 130, 1.1, 4],
    [640, 1305, 125, -1.0, 5],
  ];
  for (const [x, y, r, rot, seed] of pile) drawChip(ctx, x, y, r, rot, f.season, seed * 13, 26);
  ctx.restore();

  // Bottom info row
  const by = H - seal - 44;
  ctx.fillStyle = f.ink;
  ctx.globalAlpha = 0.92;
  ctx.font = '500 28px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  spacing(ctx, 3);
  ctx.fillText('NET WT 52 g', 84, by);
  ctx.textAlign = 'right';
  ctx.fillText('HEAT', 760, by);
  spacing(ctx, 0);
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(796 + i * 34, by - 10, 11, 0, 6.28);
    ctx.lineWidth = 4;
    ctx.strokeStyle = f.ink;
    ctx.stroke();
    if (i < f.heat) {
      ctx.fillStyle = f.ink;
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  finish(ctx, f);
  return c;
}

export function makePackBack(f) {
  const { c, ctx } = base(f, -0.2, 0.6);
  ctx.fillStyle = rgba(f.deep, 0.35);
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = f.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '900 92px Archivo, sans-serif';
  ctx.fillText(BRAND, W / 2, 300);
  ctx.font = '500 26px "JetBrains Mono", monospace';
  spacing(ctx, 6);
  ctx.fillText('THE CRUNCH FACTS', W / 2, 362);
  spacing(ctx, 0);

  // Nutrition panel
  roundRect(ctx, 150, 420, 724, 520, 36);
  ctx.fillStyle = '#FFFDF6';
  ctx.fill();
  ctx.fillStyle = '#15110B';
  ctx.textAlign = 'left';
  ctx.font = '700 40px Archivo, sans-serif';
  ctx.fillText('Nutrition · per 28 g', 200, 500);
  const rows = [['Energy', '150 kcal'], ['Fat', '9 g'], ['Carbohydrate', '15 g'], ['Protein', '2 g'], ['Salt', '0.4 g']];
  rows.forEach(([k, v], i) => {
    const y = 590 + i * 68;
    ctx.fillStyle = 'rgba(21,17,11,.15)';
    ctx.fillRect(200, y - 46, 624, 2);
    ctx.fillStyle = '#15110B';
    ctx.textAlign = 'left';
    ctx.font = '600 32px Inter, sans-serif';
    ctx.fillText(k, 200, y);
    ctx.textAlign = 'right';
    ctx.font = '500 30px "JetBrains Mono", monospace';
    ctx.fillText(v, 824, y);
  });

  ctx.fillStyle = f.ink;
  ctx.textAlign = 'center';
  ctx.font = '500 30px Inter, sans-serif';
  wrapText(
    ctx,
    `Ingredients: potatoes, sunflower oil, ${f.name.toLowerCase()} seasoning (${f.notes.join(', ').toLowerCase()}), sea salt.`,
    W / 2, 1030, 760, 44,
  );

  // Barcode
  roundRect(ctx, W / 2 - 190, 1180, 380, 156, 16);
  ctx.fillStyle = '#FFFDF6';
  ctx.fill();
  const rnd = mulberry32(f.id.length * 97);
  ctx.fillStyle = '#15110B';
  for (let x = W / 2 - 160; x < W / 2 + 160; ) {
    const bw = 2 + Math.floor(rnd() * 6);
    ctx.fillRect(x, 1200, bw, 92);
    x += bw + 2 + Math.floor(rnd() * 6);
  }
  ctx.font = '500 22px "JetBrains Mono", monospace';
  spacing(ctx, 4);
  ctx.fillText('0 26 4  ' + String(100000 + f.id.length * 7919).slice(0, 6), W / 2, 1322);
  spacing(ctx, 0);

  finish(ctx, f);
  return c;
}
