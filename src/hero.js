// Hero carousel: arrows, dots, swipe, keyboard and autoplay. Switching flavor
// re-themes the page, sweeps new rings out from the center and swaps the title.
import gsap from 'gsap';

const pad = (n) => String(n).padStart(2, '0');

export function initHero({ exp, flavors, active, reduce, shop }) {
  const N = flavors.length;
  const root = document.documentElement;
  const hero = document.getElementById('top');
  const titleEl = hero.querySelector('.hero-title');
  const tagEl = hero.querySelector('.hero-tag');
  const curEl = hero.querySelector('.hero-count .cur');
  const totEl = hero.querySelector('.hero-count .tot');
  const dotsEl = hero.querySelector('.hero-dots');
  const ringsA = hero.querySelector('.rings-a');
  const ringsB = hero.querySelector('.rings-b');
  const addBtn = hero.querySelector('.add-btn');
  const meta = document.querySelector('meta[name="theme-color"]');

  let cur = active;
  let lastInteract = 0;
  let introDone = false;
  let titleTl = null;
  let ringTween = null;

  totEl.textContent = `/ ${pad(N)}`;
  dotsEl.innerHTML = flavors
    .map((f, i) => `<button class="dot" type="button" data-i="${i}" aria-label="Show ${f.name}"></button>`)
    .join('');
  const dots = [...dotsEl.children];

  const linesHtml = (f) => f.lines.map((l) => `<span class="line"><span class="line-in">${l}</span></span>`).join('');

  function theme(f, instant) {
    const v = { '--c': f.color, '--deep': f.deep, '--glow': f.glow, '--ink': f.ink };
    if (instant) for (const k in v) root.style.setProperty(k, v[k]);
    else gsap.to(root, { ...v, duration: 0.9, ease: 'power2.out', overwrite: 'auto' });
    meta?.setAttribute('content', f.deep);
  }

  function setRings(el, f) {
    el.style.setProperty('--r1', f.ring1);
    el.style.setProperty('--r2', f.ring2);
  }

  function rings(f, instant) {
    if (instant) return setRings(ringsA, f);
    if (ringTween) ringTween.progress(1);
    setRings(ringsB, f);
    ringTween = gsap.fromTo(
      ringsB,
      { '--rad': '0%' },
      {
        '--rad': '160%',
        duration: 1.15,
        ease: 'power2.inOut',
        onComplete: () => {
          setRings(ringsA, f);
          gsap.set(ringsB, { '--rad': '0%' });
          ringTween = null;
        },
      },
    );
  }

  function setTitle(f, dir) {
    titleTl?.kill();
    const olds = titleEl.querySelectorAll('.line-in');
    gsap.killTweensOf(olds);
    titleTl = gsap.timeline();
    titleTl.to(olds, { yPercent: -110 * dir, duration: 0.3, ease: 'power2.in', stagger: 0.03 }).add(() => {
      titleEl.innerHTML = linesHtml(f);
      gsap.fromTo(
        titleEl.querySelectorAll('.line-in'),
        { yPercent: 110 * dir },
        { yPercent: 0, duration: 0.75, ease: 'power3.out', stagger: 0.07 },
      );
    });
  }

  function ui(f, i) {
    tagEl.textContent = f.tagline;
    curEl.textContent = pad(i + 1);
    dots.forEach((d, j) => {
      d.classList.toggle('is-on', j === i);
      d.setAttribute('aria-current', j === i ? 'true' : 'false');
    });
    addBtn.setAttribute('aria-label', `Add ${f.name} to your 3-pack`);
  }

  function go(i, dir) {
    i = ((i % N) + N) % N;
    if (i === cur) return;
    dir = dir || (i > cur ? 1 : -1);
    cur = i;
    const f = flavors[i];
    exp?.setActive(i);
    theme(f);
    rings(f);
    setTitle(f, dir);
    ui(f, i);
    gsap.fromTo(tagEl, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, delay: 0.2, overwrite: true });
  }

  const touch = () => (lastInteract = performance.now());
  const inHero = () => hero.getBoundingClientRect().top > -40;

  // Initial state (hidden until the intro plays)
  theme(flavors[cur], true);
  rings(flavors[cur], true);
  titleEl.innerHTML = linesHtml(flavors[cur]);
  ui(flavors[cur], cur);
  const introEls = hero.querySelectorAll('.hero-left > *, .hero-right > *');
  gsap.set(introEls, { opacity: 0, y: 24 });
  gsap.set(titleEl.querySelectorAll('.line-in'), { yPercent: 110 });

  hero.querySelector('.next').addEventListener('click', () => (touch(), go(cur + 1, 1)));
  hero.querySelector('.prev').addEventListener('click', () => (touch(), go(cur - 1, -1)));
  dots.forEach((d) => d.addEventListener('click', () => (touch(), go(+d.dataset.i))));
  addBtn.addEventListener('click', () => {
    touch();
    shop.add(cur, null);
  });

  // Swipe / drag
  let sx = null, sy = 0;
  hero.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, a')) return;
    sx = e.clientX;
    sy = e.clientY;
  });
  hero.addEventListener('pointercancel', () => (sx = null));
  window.addEventListener('pointerup', (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    sx = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      touch();
      go(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    }
  });

  window.addEventListener('keydown', (e) => {
    if (!inHero() || e.target.closest?.('input, textarea')) return;
    if (e.key === 'ArrowRight') (touch(), go(cur + 1, 1));
    else if (e.key === 'ArrowLeft') (touch(), go(cur - 1, -1));
  });

  if (!reduce) {
    setInterval(() => {
      if (document.hidden || !introDone || !inHero() || performance.now() - lastInteract < 9000) return;
      go(cur + 1, 1);
    }, 5500);
  }

  function intro() {
    const tl = gsap.timeline({ onComplete: () => (introDone = true) });
    if (exp) tl.to(exp.state, { intro: 1, duration: reduce ? 0.01 : 1.8, ease: 'power3.out' }, 0);
    tl.fromTo('.nav', { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out' }, 0.2)
      .to(titleEl.querySelectorAll('.line-in'), { yPercent: 0, duration: 1, ease: 'power4.out', stagger: 0.08 }, 0.35)
      .to(introEls, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.06 }, 0.5);
  }

  return {
    intro,
    go,
    get active() {
      return cur;
    },
  };
}
