// One fixed WebGL canvas behind the page. Sections write progress values into
// `state`, and every frame the bags and chips ease toward the pose those values imply.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createBag, BAG_H } from './bag.js';
import { createChipGeometry, createChipMaterial } from './chips.js';
import { mulberry32 } from './packArt.js';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));

// Story poses for the featured bag, one per chapter
const STORY = {
  x: [0.9, -0.9, 0.9, 0],
  y: [0, 0, 0, 0.3],
  ry: [-0.45, 0.5, Math.PI + 0.35, Math.PI * 2],
  s: [1.15, 1.15, 1.15, 1.0],
};
const STORY_MOBILE = {
  x: [0, 0, 0, 0],
  y: [0.5, 0.5, 0.5, 0.5],
  ry: STORY.ry,
  s: [1.0, 1.0, 1.0, 1.0],
};

function envFor(renderer) {
  const pm = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const tex = pm.fromScene(room, 0.04).texture;
  room.dispose?.();
  pm.dispose();
  return tex;
}

function makeLights(rimColor) {
  const key = new THREE.DirectionalLight('#ffffff', 2.4);
  key.position.set(2.5, 3.5, 5);
  const rim = new THREE.DirectionalLight(rimColor, 3.2);
  rim.position.set(-4, 2, -3);
  const hemi = new THREE.HemisphereLight('#fff3df', '#2a1a0a', 0.5);
  return { key, rim, hemi };
}

function toTexture(canvas, aniso) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  return t;
}

const canvasURL = (c) =>
  new Promise((res) => c.toBlob((b) => res(b ? URL.createObjectURL(b) : c.toDataURL()), 'image/webp', 0.92));

export class Experience {
  constructor(canvas, flavors, arts, active) {
    this.flavors = flavors;
    this.N = flavors.length;
    this.state = { active, intro: 0, storyEnter: 0, storyP: 0, storyExit: 0, stormP: 0, px: 0, py: 0 };
    this.ptr = { x: 0, y: 0 };
    this.activeScreen = { x: 0, y: 0, h: 0 };
    this.storySettled = true;
    this.idle = false;

    const renderer = (this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    }));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping ?? THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    this.camera.position.set(0, 0, 6);
    this.scene.environment = envFor(renderer);
    const L = makeLights(flavors[active].glow);
    this.rim = L.rim;
    this.rimTarget = new THREE.Color(flavors[active].glow);
    this.scene.add(L.key, L.rim, L.hemi);

    const aniso = renderer.capabilities.getMaxAnisotropy();
    this.textures = arts.map((a) => ({ front: toTexture(a.front, aniso), back: toTexture(a.back, aniso) }));
    this.bags = this.textures.map((t) => {
      const b = createBag(t.front, t.back);
      b.userData.cur = null;
      b.userData.last = null;
      this.scene.add(b);
      return b;
    });

    this.chipGeo = createChipGeometry();
    this.chipMat = createChipMaterial();
    const small = Math.min(window.innerWidth, window.innerHeight) < 700;
    this.heroChips = this.chipField(14, 7);
    this.stormChips = this.chipField(small ? 60 : 120, 99);

    this.dummy = new THREE.Object3D();
    this.v = new THREE.Vector3();
    this.resize(true);

    window.addEventListener(
      'pointermove',
      (e) => {
        this.state.px = (e.clientX / window.innerWidth) * 2 - 1;
        this.state.py = -((e.clientY / window.innerHeight) * 2 - 1);
      },
      { passive: true },
    );
  }

  chipField(count, seed) {
    const mesh = new THREE.InstancedMesh(this.chipGeo, this.chipMat, count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    mesh.visible = false;
    const rnd = mulberry32(seed);
    mesh.userData.items = Array.from({ length: count }, () => ({
      a: rnd() * Math.PI * 2,
      r: 1.0 + rnd() * 0.9,
      y: (rnd() * 2 - 1) * 0.95,
      sp: (0.12 + rnd() * 0.22) * (rnd() < 0.5 ? 1 : -1),
      s: 0.14 + rnd() * 0.12,
      x0: (rnd() * 2 - 1) * 6.5,
      y0: (rnd() * 2 - 1) * 3.4,
      z0: -2.5 + rnd() * 4.6,
      vx: 0.8 + rnd() * 0.7,
      vy: (rnd() * 2 - 1) * 0.5,
      ax: new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize(),
      rs: 2 + rnd() * 5,
      ph: rnd() * 10,
    }));
    this.scene.add(mesh);
    return mesh;
  }

  setActive(i) {
    this.state.active = i;
    this.rimTarget.set(this.flavors[i].glow);
  }

  resize(force) {
    const w = window.innerWidth, h = window.innerHeight;
    // Ignore small height-only changes (mobile URL bar showing/hiding)
    if (!force && w === this.w && Math.abs(h - this.h) < 140) return;
    this.w = w;
    this.h = h;
    this.mobile = w < 760;
    this.renderer.setSize(w, h);
    const a = w / h;
    this.camera.aspect = a;
    this.baseZ = a < 1 ? 6 + (1 - a) * 5.5 : 6;
    this.camera.updateProjectionMatrix();
    this.idle = false;
  }

  storyPose(p, mobile) {
    const K = mobile ? STORY_MOBILE : STORY;
    // Hold each chapter's pose, then ease to the next one around the chapter boundary
    const c = Math.min(3, Math.max(0, p * 4 - 0.5));
    const i = Math.min(2, Math.floor(c));
    const t = smooth(clamp01((c - i - 0.3) / 0.4));
    this.storySettled = t < 0.03 || t > 0.97;
    return {
      x: lerp(K.x[i], K.x[i + 1], t),
      y: lerp(K.y[i], K.y[i + 1], t),
      ry: lerp(K.ry[i], K.ry[i + 1], t) + Math.sin(p * Math.PI * 8) * 0.05,
      rx: 0.06 * Math.sin(p * Math.PI * 4),
      s: lerp(K.s[i], K.s[i + 1], t),
    };
  }

  tick(time, dt) {
    dt = Math.min(dt || 0.016, 0.05);
    const s = this.state, N = this.N, mob = this.mobile;
    this.ptr.x = damp(this.ptr.x, s.px, 3, dt);
    this.ptr.y = damp(this.ptr.y, s.py, 3, dt);
    const e = smooth(clamp01(s.storyEnter));
    const exit = clamp01(s.storyExit);
    const intro = clamp01(s.intro);
    const heroVis = 1 - e;
    const sp = this.storyPose(clamp01(s.storyP), mob);
    const spacing = mob ? 0.95 : 1.32;
    const showBags = exit < 0.999;

    for (let i = 0; i < N; i++) {
      const bag = this.bags[i], u = bag.userData;
      let off = (((i - s.active) % N) + N) % N;
      if (off >= N / 2) off -= N;
      const ao = Math.abs(off), center = off === 0;

      // Hero carousel: bags on an arc around the active one
      let x = off * spacing, y = 0.22, z = -Math.pow(ao, 1.2) * 0.85;
      let rx = 0.02, ry = -off * 0.42, rz = off * 0.04;
      let sc = center ? 1.1 : Math.max(0, 0.82 - ao * 0.07);
      if (center) {
        y += Math.sin(time * 1.3) * 0.05;
        rx = -this.ptr.y * 0.12;
        ry += this.ptr.x * 0.3 + Math.sin(time * 0.7) * 0.08;
      } else {
        y += Math.sin(time * 1.1 + i) * 0.03;
      }
      if (ao >= 2.5) {
        sc = 0;
        z = -3;
      }
      y -= (1 - intro) * (3.4 + ao * 0.5);

      // Story: the active bag takes the stage, the rest drop away
      if (center) {
        x = lerp(x, sp.x, e);
        y = lerp(y, sp.y, e);
        z = lerp(z, 0.35, e);
        rx = lerp(rx, sp.rx, e);
        ry = lerp(ry, sp.ry, e);
        rz = lerp(rz, 0, e);
        sc = lerp(sc, sp.s, e);
      } else {
        y -= e * 4.5;
        sc *= 1 - e;
      }
      // After the story the bag flies up and out
      y += exit * 4.4;
      rz += exit * 0.5;

      // A bag wrapping from one end of the arc to the other pops in instead of flying across
      const jumped = u.last !== null && Math.abs(off - u.last) > 1.5;
      u.last = off;
      if (!u.cur || jumped) u.cur = { x, y, z, rx, ry, rz, s: u.cur ? 0 : sc };
      const c = u.cur, k = 6.5;
      c.x = damp(c.x, x, k, dt);
      c.y = damp(c.y, y, k, dt);
      c.z = damp(c.z, z, k, dt);
      c.rx = damp(c.rx, rx, k, dt);
      c.ry = damp(c.ry, ry, k, dt);
      c.rz = damp(c.rz, rz, k, dt);
      c.s = damp(c.s, sc, k, dt);
      bag.position.set(c.x, c.y, c.z);
      bag.rotation.set(c.rx, c.ry, c.rz);
      bag.scale.setScalar(Math.max(c.s, 1e-4));
      bag.visible = showBags && c.s > 0.01;
    }

    const ab = this.bags[s.active];
    const d = this.dummy;

    // Chips orbiting the hero bag
    const hm = this.heroChips;
    const hv = heroVis * intro * (showBags ? 1 : 0);
    hm.visible = hv > 0.01;
    if (hm.visible) {
      const items = hm.userData.items, rs = mob ? 0.62 : 1;
      for (let i = 0; i < items.length; i++) {
        const it = items[i], a = it.a + time * it.sp;
        d.position.set(
          ab.position.x + Math.cos(a) * it.r * rs,
          ab.position.y + it.y + Math.sin(time * 0.9 + it.ph) * 0.12,
          ab.position.z + Math.sin(a) * it.r * 0.55,
        );
        d.rotation.set(it.ph + time * 0.5, it.ph * 2 + time * 0.35, it.ph);
        d.scale.setScalar(it.s * hv);
        d.updateMatrix();
        hm.setMatrixAt(i, d.matrix);
      }
      hm.instanceMatrix.needsUpdate = true;
    }

    // Chip storm, driven by scroll through the storm section
    const p = s.stormP, sm = this.stormChips;
    sm.visible = p > 0.001 && p < 0.999;
    if (sm.visible) {
      const items = sm.userData.items, span = p * 2 - 1;
      const spread = Math.max(0.6, this.camera.aspect / 1.6);
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        d.position.set(
          it.x0 * spread + span * 7.5 * it.vx,
          it.y0 + span * it.vy * 3 + Math.sin(time * 0.8 + it.ph) * 0.12,
          it.z0,
        );
        d.quaternion.setFromAxisAngle(it.ax, it.ph + span * it.rs * 2 + time * 0.4);
        d.scale.setScalar(it.s * 1.8);
        d.updateMatrix();
        sm.setMatrixAt(i, d.matrix);
      }
      sm.instanceMatrix.needsUpdate = true;
    }

    // Camera: gentle pointer parallax in the hero, a small dolly in the story
    const cam = this.camera;
    cam.position.x = damp(cam.position.x, this.ptr.x * 0.14 * heroVis, 3, dt);
    cam.position.y = damp(cam.position.y, this.ptr.y * 0.1 * heroVis, 3, dt);
    cam.position.z = this.baseZ - e * 0.5;
    cam.lookAt(0, 0, 0);
    cam.updateMatrixWorld();
    this.rim.color.lerp(this.rimTarget, 1 - Math.exp(-4 * dt));

    // Screen position of the featured bag, used by the story callouts
    const v = this.v.copy(ab.position).project(cam);
    this.activeScreen.x = (v.x * 0.5 + 0.5) * this.w;
    this.activeScreen.y = (-v.y * 0.5 + 0.5) * this.h;
    const dist = cam.position.z - ab.position.z;
    this.activeScreen.h = ((BAG_H * ab.scale.y) / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * dist)) * this.h;

    const any = hm.visible || sm.visible || this.bags.some((b) => b.visible);
    if (any) {
      this.renderer.render(this.scene, cam);
      this.idle = false;
    } else if (!this.idle) {
      this.renderer.clear();
      this.idle = true;
    }
  }

  // Renders each bag (and one chip) to a transparent image for the shop,
  // so the flat product shots always match the 3D bags.
  async snapshot(onProgress) {
    const W = 360, H = 540;
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setPixelRatio(2);
    r.setSize(W, H, false);
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = this.renderer.toneMapping;
    r.toneMappingExposure = this.renderer.toneMappingExposure;
    r.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const env = envFor(r);
    scene.environment = env;
    const L = makeLights('#fff1d6');
    scene.add(L.key, L.rim, L.hemi);
    const cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 50);
    cam.position.set(0, 0, 3.7);

    const bags = [];
    for (let i = 0; i < this.N; i++) {
      const bag = createBag(this.textures[i].front, this.textures[i].back);
      bag.rotation.set(0.05, -0.32, 0.025);
      scene.add(bag);
      r.render(scene, cam);
      bags.push(await canvasURL(r.domElement));
      scene.remove(bag);
      bag.traverse((o) => o.material?.dispose());
      onProgress?.((i + 1) / (this.N + 1));
      await new Promise((res) => requestAnimationFrame(res));
    }
    const chip = new THREE.Mesh(this.chipGeo, this.chipMat);
    chip.rotation.set(-1.0, 0.2, 0.5);
    chip.scale.setScalar(1.05);
    scene.add(chip);
    r.render(scene, cam);
    const chipURL = await canvasURL(r.domElement);
    onProgress?.(1);
    env.dispose();
    r.dispose();
    r.forceContextLoss?.();
    return { bags, chip: chipURL };
  }
}
