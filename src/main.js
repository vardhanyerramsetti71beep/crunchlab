import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { FLAVORS, DEFAULT_FLAVOR } from './flavors.js';
import { makePackFront, makePackBack } from './packArt.js';
import { Experience } from './experience.js';
import { Preloader } from './preloader.js';
import { initHero } from './hero.js';
import { initStory } from './story.js';
import { initShop } from './shop.js';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const frame = () => new Promise((r) => requestAnimationFrame(() => r()));

let toastTimer;
function toast(msg) {
  const el = document.querySelector('.toast');
  el.textContent = msg;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 3200);
}

function initReveals() {
  gsap.utils.toArray('.reveal').forEach((el) =>
    gsap.from(el, { y: 50, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } }),
  );
  gsap.set('.card, .tile', { y: 60, opacity: 0 });
  ScrollTrigger.batch('.card, .tile', {
    start: 'top 92%',
    onEnter: (b) =>
      gsap.to(b, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.08, overwrite: true, clearProps: 'transform,opacity' }),
  });
  gsap.utils.toArray('.storm-title span').forEach((s, i) =>
    gsap.fromTo(
      s,
      { xPercent: i % 2 ? 16 : -16 },
      { xPercent: i % 2 ? -16 : 16, ease: 'none', scrollTrigger: { trigger: '#storm', start: 'top bottom', end: 'bottom top', scrub: true } },
    ),
  );
}

async function boot() {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  const pre = new Preloader(document.getElementById('preloader'), FLAVORS[DEFAULT_FLAVOR]);
  pre.setProgress(8);

  let lenis = null;
  if (!reduce) {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.stop();
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  document.querySelectorAll('a[href^="#"]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const el = id.length > 1 && document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(el, { duration: 1.4 });
      else el.scrollIntoView();
    }),
  );

  // Fonts must be ready before the pack art is drawn onto canvases
  await Promise.race([
    Promise.all([
      document.fonts.load('900 100px Archivo'),
      document.fonts.load('700 40px Archivo'),
      document.fonts.load('500 30px "JetBrains Mono"'),
      document.fonts.load('600 32px Inter'),
    ]),
    new Promise((r) => setTimeout(r, 3000)),
  ]).catch(() => {});
  pre.setProgress(28);
  await frame();

  const arts = [];
  for (const f of FLAVORS) {
    arts.push({ front: makePackFront(f), back: makePackBack(f) });
    pre.setProgress(28 + arts.length * 6);
    await frame();
  }

  let exp = null;
  try {
    exp = new Experience(document.getElementById('webgl'), FLAVORS, arts, DEFAULT_FLAVOR);
  } catch (err) {
    console.error('WebGL unavailable', err);
    document.documentElement.classList.add('no-webgl');
  }
  pre.setProgress(70);
  await frame();

  const shots = exp
    ? await exp.snapshot((p) => pre.setProgress(70 + p * 29))
    : { bags: arts.map((a) => a.front.toDataURL('image/jpeg', 0.85)), chip: '' };
  pre.setProgress(100);

  const shop = initShop({ shots, flavors: FLAVORS, toast });
  const hero = initHero({ exp, flavors: FLAVORS, active: DEFAULT_FLAVOR, reduce, shop });
  initStory({ exp });
  initReveals();

  if (exp) {
    if (import.meta.env.DEV) window.__exp = exp;
    gsap.ticker.add((time, delta) => exp.tick(time, delta / 1000));
    window.addEventListener('resize', () => exp.resize());
  }

  await pre.finish({ reduce, onReveal: () => hero.intro() });
  document.documentElement.classList.remove('is-loading');
  lenis?.start();
  ScrollTrigger.refresh();
}

boot();
