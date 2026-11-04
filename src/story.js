// Scroll story: four chapters while the featured bag turns on its own stage.
// ScrollTrigger only reports progress; the 3D scene and DOM react to it.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const CHAPTERS = [
  { word: 'Thin', hotspot: '1.4 mm slice', off: [-0.34, -0.12] },
  { word: 'Gold', hotspot: '3 min at 180°C', off: [0.3, 0.08] },
  { word: 'Spice', hotspot: '2x seasoning', off: [-0.3, 0.22] },
  { word: 'Fresh', hotspot: 'Nitrogen puff', off: [0.3, -0.3] },
];

export function initStory({ exp }) {
  const story = document.getElementById('story');
  const word = story.querySelector('.story-word');
  const chapters = [...story.querySelectorAll('.chapter')];
  const segs = [...story.querySelectorAll('.cb-seg')];
  const hs = story.querySelector('.hotspot');
  const hsLabel = hs.querySelector('.hs-label');
  const st = exp?.state;
  let ch = -1;

  function setChapter(i) {
    if (i === ch) return;
    ch = i;
    chapters.forEach((c, j) => c.classList.toggle('is-active', j === i));
    segs.forEach((s, j) => s.classList.toggle('is-on', j <= i));
    hsLabel.textContent = CHAPTERS[i].hotspot;
    word.textContent = CHAPTERS[i].word;
    gsap.fromTo(word, { yPercent: 25, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8, ease: 'power3.out', overwrite: true });
  }
  setChapter(0);

  ScrollTrigger.create({
    trigger: story,
    start: 'top bottom',
    end: 'top top',
    onUpdate: (s) => st && (st.storyEnter = s.progress),
  });
  ScrollTrigger.create({
    trigger: story,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (s) => {
      const p = s.progress;
      if (st) st.storyP = p;
      setChapter(Math.min(3, Math.floor(p * 4)));
      segs.forEach((seg, j) => seg.style.setProperty('--p', Math.min(1, Math.max(0, p * 4 - j)).toFixed(3)));
    },
  });
  ScrollTrigger.create({
    trigger: story,
    start: 'bottom bottom',
    end: 'bottom top',
    onUpdate: (s) => st && (st.storyExit = s.progress),
  });
  ScrollTrigger.create({
    trigger: '#storm',
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: (s) => st && (st.stormP = s.progress),
  });

  // The callout pin follows the bag on screen
  if (exp) {
    gsap.ticker.add(() => {
      const on = st.storyEnter > 0.96 && st.storyExit < 0.02 && st.storyP > 0.01 && st.storyP < 0.99 && exp.storySettled;
      hs.classList.toggle('is-on', on);
      if (!on) return;
      const a = exp.activeScreen, o = CHAPTERS[Math.max(ch, 0)].off;
      const x = a.x + o[0] * a.h, y = a.y + o[1] * a.h;
      // Point the label away from the bag, unless that would run off screen
      const need = hsLabel.offsetWidth + 44;
      let flip = o[0] < 0;
      if (!flip && x + need > window.innerWidth - 8) flip = true;
      else if (flip && x - need < 8) flip = false;
      hs.classList.toggle('flip', flip);
      hs.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    });
  }
}
