// Cinematic loader: a 2D chip storm and a real progress counter, then one chip
// spins, gets seasoned and bursts open to reveal the page.
import gsap from 'gsap';
import { drawChip } from './packArt.js';

export class Preloader {
  constructor(el, flavor) {
    this.el = el;
    this.flavor = flavor;
    this.canvas = el.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.countEl = el.querySelector('.pl-count span');
    this.noteEl = el.querySelector('.pl-note');
    this.target = 0;
    this.shown = 0;
    this.t0 = performance.now();
    this.last = this.t0;
    this.st = { chip: 0, spin: 0, season: 0, burst: 0 };
    this.seasoning = [];
    this.shards = [];
    this.resize();
    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize);
    this.storm = Array.from({ length: 30 }, () => this.spawn(true));
    this.running = true;
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  spawn(initial) {
    const k = 0.45 + Math.random() * 0.9;
    const base = Math.min(this.w, this.h) / 18;
    return {
      x: Math.random() * this.w,
      y: initial ? Math.random() * this.h : -base * 2,
      r: base * k,
      vy: (90 + Math.random() * 140) * k,
      vx: (Math.random() * 2 - 1) * 40,
      rot: Math.random() * 6.28,
      vr: (Math.random() * 2 - 1) * 2.4,
      seed: (Math.random() * 1e6) | 0,
    };
  }

  setProgress(p) {
    this.target = Math.max(this.target, Math.min(100, p));
  }

  loop(now) {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.shown += (this.target - this.shown) * (1 - Math.exp(-dt * 4));
    if (this.target === 100 && this.shown > 99.5) this.shown = 100;
    this.countEl.textContent = String(Math.floor(this.shown));

    const { ctx, w, h, st } = this;
    const season = this.flavor.season;
    ctx.clearRect(0, 0, w, h);

    // Background chip storm
    ctx.globalAlpha = Math.max(0, 1 - st.season * 0.6 - st.burst * 0.4);
    for (const c of this.storm) {
      c.y += c.vy * dt;
      c.x += c.vx * dt;
      c.rot += c.vr * dt;
      if (c.y - c.r > h) Object.assign(c, this.spawn(false));
      drawChip(ctx, c.x, c.y, c.r, c.rot, season, c.seed, 10);
    }
    ctx.globalAlpha = 1;

    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.2;

    // Hero chip: spins, collects seasoning
    if (st.chip > 0.001) {
      const glow = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 2.2);
      glow.addColorStop(0, `rgba(255,214,120,${0.45 * Math.min(1, st.chip)})`);
      glow.addColorStop(1, 'rgba(255,214,120,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, 0.78 + 0.22 * Math.cos(st.spin * 1.3));
      drawChip(ctx, 0, 0, R * st.chip, st.spin, season, 4242, Math.floor(st.season * 46));
      ctx.restore();
    }

    // Seasoning falling onto the chip
    if (st.season > 0 && st.season < 1) {
      for (const p of this.seasoning) {
        const q = (st.season - p.t) / 0.22;
        if (q <= 0 || q >= 1) continue;
        ctx.globalAlpha = 1 - q * 0.3;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y0 + (p.y1 - p.y0) * q * q, p.r, 0, 6.28);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Burst into shards
    if (st.burst > 0) {
      const reach = Math.max(w, h) * 0.75;
      ctx.globalAlpha = Math.max(0, 1 - st.burst);
      for (const s of this.shards) {
        const dd = st.burst * s.d * reach;
        drawChip(ctx, cx + Math.cos(s.a) * dd, cy + Math.sin(s.a) * dd, s.r * (1 - st.burst * 0.3), s.rot + st.burst * s.vr, season, s.seed, 6);
      }
      ctx.globalAlpha = 1;
    }

    requestAnimationFrame(this.loop);
  }

  makeParticles() {
    const cx = this.w / 2, cy = this.h / 2, R = Math.min(this.w, this.h) * 0.2;
    const colors = [this.flavor.season, this.flavor.glow, '#ffffff'];
    this.seasoning = Array.from({ length: 160 }, () => {
      const a = Math.random() * 6.28, d = Math.sqrt(Math.random()) * R * 0.8;
      const x = cx + Math.cos(a) * d;
      return {
        x,
        y0: cy - R * 1.6 - Math.random() * this.h * 0.35,
        y1: cy + Math.sin(a) * d * 0.7,
        r: 1.5 + Math.random() * 3,
        t: Math.random() * 0.78,
        color: colors[(Math.random() * colors.length) | 0],
      };
    });
    this.shards = Array.from({ length: 36 }, (_, i) => ({
      a: (i / 36) * 6.28 + Math.random() * 0.3,
      d: 0.35 + Math.random() * 0.75,
      r: R * (0.12 + Math.random() * 0.2),
      rot: Math.random() * 6.28,
      vr: (Math.random() * 2 - 1) * 6,
      seed: (Math.random() * 1e6) | 0,
    }));
  }

  finish({ onReveal, reduce } = {}) {
    return new Promise((resolve) => {
      const done = () => {
        this.destroy();
        resolve();
      };
      const start = () => {
        if (reduce) {
          onReveal?.();
          gsap.to(this.el, { opacity: 0, duration: 0.4, onComplete: done });
          return;
        }
        this.noteEl.textContent = 'Seasoning';
        this.makeParticles();
        const tl = gsap.timeline({ onComplete: done });
        tl.to(this.el.querySelector('.pl-ui'), { opacity: 0, scale: 0.96, duration: 0.45, ease: 'power2.in' }, 0.15)
          .to(this.st, { chip: 1, duration: 0.8, ease: 'back.out(1.7)' }, 0.2)
          .to(this.st, { spin: Math.PI * 3, duration: 2.1, ease: 'power2.inOut' }, 0.2)
          .to(this.st, { season: 1, duration: 1.2, ease: 'none' }, 0.5)
          .to(this.st, { chip: 1.25, duration: 0.25, ease: 'power2.in' }, 1.9)
          .set(this.st, { chip: 0 }, 2.15)
          .to(this.st, { burst: 1, duration: 1.1, ease: 'power3.out' }, 2.15)
          .add(() => onReveal?.(), 2.2)
          .fromTo(this.el, { '--hole': '0%' }, { '--hole': '150%', duration: 1.2, ease: 'power3.inOut' }, 2.15);
      };
      const wait = () => {
        if (this.shown >= 100 && performance.now() - this.t0 > 1500) start();
        else requestAnimationFrame(wait);
      };
      wait();
    });
  }

  destroy() {
    this.running = false;
    window.removeEventListener('resize', this.onResize);
    this.el.remove();
  }
}
