// Flavor wall + Build-a-3-pack. Product images are snapshots of the 3D bags.
// It's a demo store: nothing is charged and the sign-up form sends nothing.
import gsap from 'gsap';

const vars = (f) => `--fc:${f.color};--fr1:${f.ring1};--fr2:${f.ring2};--fi:${f.ink};--fg:${f.glow}`;
const heatDots = (n) => Array.from({ length: 5 }, (_, j) => `<i class="${j < n ? 'on' : ''}"></i>`).join('');
const visible = (r) => r && r.bottom > 0 && r.top < window.innerHeight;

export function initShop({ shots, flavors, toast }) {
  const wall = document.querySelector('.wall-grid');
  wall.innerHTML = flavors
    .map(
      (f, i) => `
    <article class="card" style="${vars(f)}">
      <div class="card-art">
        ${shots.chip ? `<img class="card-chip c1" src="${shots.chip}" alt="" aria-hidden="true"><img class="card-chip c2" src="${shots.chip}" alt="" aria-hidden="true">` : ''}
        <img class="card-bag" src="${shots.bags[i]}" alt="${f.name} bag">
        <span class="card-num">${String(i + 1).padStart(2, '0')}</span>
      </div>
      <div class="card-body">
        <h3>${f.name}</h3>
        <p>${f.notes.join(' · ')}</p>
        <div class="card-foot">
          <span class="heat" role="img" aria-label="Heat ${f.heat} of 5">${heatDots(f.heat)}</span>
          <button class="btn-sm" type="button" data-add="${i}">Add +</button>
        </div>
      </div>
    </article>`,
    )
    .join('');

  const picker = document.querySelector('.picker');
  picker.innerHTML = flavors
    .map(
      (f, i) => `
    <button class="tile" type="button" data-i="${i}" style="${vars(f)}" aria-label="Add ${f.name} to your 3-pack">
      <span class="plus" aria-hidden="true">+</span>
      <img src="${shots.bags[i]}" alt="">
      <span class="tile-name">${f.name}</span>
    </button>`,
    )
    .join('');

  const slots = [...document.querySelectorAll('.slot')];
  const dots = [...document.querySelectorAll('.tray-dots i')];
  const trayCount = document.querySelector('.tray-count');
  const checkout = document.querySelector('.checkout');
  const basket = document.querySelector('.basket');
  const basketCount = document.querySelector('.basket-count');
  const picks = [null, null, null];

  function emptySlot(slot, si) {
    slot.classList.remove('is-full');
    slot.removeAttribute('style');
    slot.innerHTML = `<span class="slot-n">0${si + 1}</span>`;
    slot.setAttribute('aria-label', `Empty slot ${si + 1}`);
  }
  slots.forEach(emptySlot);

  function render() {
    const n = picks.filter((p) => p !== null).length;
    trayCount.textContent = `${n} / 3`;
    dots.forEach((d, i) => d.classList.toggle('on', i < n));
    checkout.disabled = n < 3;
    basketCount.textContent = String(n);
    basket.classList.remove('bump');
    void basket.offsetWidth;
    basket.classList.add('bump');
  }

  function add(i, sourceImg) {
    const si = picks.indexOf(null);
    if (si === -1) {
      toast('Your 3-pack is full. Tap a bag in the tray to swap it out.');
      return false;
    }
    picks[si] = i;
    const slot = slots[si], f = flavors[i];
    slot.dataset.v = String((+slot.dataset.v || 0) + 1);
    gsap.killTweensOf(slot.querySelector('img'));
    slot.classList.add('is-full');
    slot.style.cssText = vars(f);
    slot.innerHTML = `<img src="${shots.bags[i]}" alt="${f.name}"><span class="x" aria-hidden="true">×</span>`;
    slot.setAttribute('aria-label', `Remove ${f.name} from your 3-pack`);
    const img = slot.querySelector('img');

    const src = sourceImg?.getBoundingClientRect();
    const dst = img.getBoundingClientRect();
    if (visible(src) && visible(dst)) {
      // Fly a copy of the bag from where it was clicked into the tray
      const fly = document.createElement('img');
      fly.src = shots.bags[i];
      fly.className = 'flyer';
      Object.assign(fly.style, { left: src.left + 'px', top: src.top + 'px', width: src.width + 'px', height: src.height + 'px' });
      document.body.appendChild(fly);
      img.style.opacity = '0';
      gsap.to(fly, {
        left: dst.left,
        top: dst.top,
        width: dst.width,
        height: dst.height,
        rotation: 360,
        duration: 0.8,
        ease: 'power3.inOut',
        onComplete() {
          fly.remove();
          img.style.opacity = '1';
          gsap.fromTo(slot, { scale: 0.92 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
        },
      });
    } else {
      gsap.fromTo(img, { y: -40, opacity: 0, rotation: -10 }, { y: 0, opacity: 1, rotation: 0, duration: 0.6, ease: 'back.out(2)' });
    }
    render();
    toast(picks.every((p) => p !== null) ? '3-pack full. Ready to check out.' : `${f.name} added to your 3-pack.`);
    return true;
  }

  slots.forEach((slot, si) =>
    slot.addEventListener('click', () => {
      if (picks[si] === null) return;
      picks[si] = null;
      const v = slot.dataset.v;
      const img = slot.querySelector('img');
      render();
      gsap.to(img, {
        y: -30,
        opacity: 0,
        scale: 0.8,
        duration: 0.3,
        onComplete: () => {
          if (slot.dataset.v === v && picks[si] === null) emptySlot(slot, si);
        },
      });
    }),
  );

  picker.addEventListener('click', (e) => {
    const tile = e.target.closest('.tile');
    if (tile) add(+tile.dataset.i, tile.querySelector('img'));
  });
  wall.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-add]');
    if (btn) add(+btn.dataset.add, btn.closest('.card').querySelector('.card-bag'));
  });
  checkout.addEventListener('click', () => {
    const names = picks.map((i) => flavors[i].name).join(', ');
    toast(`Demo store, so there's no real checkout. Your box: ${names}.`);
  });

  const form = document.querySelector('.dibs-form');
  const input = form.querySelector('input');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) {
      toast('Enter a valid email address.');
      input.focus();
      return;
    }
    form.reset();
    toast("You're on the list. (Demo only, nothing was sent.)");
  });

  return { add };
}
