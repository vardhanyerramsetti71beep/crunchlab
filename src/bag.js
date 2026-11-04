// A pillow-shaped chip bag with crimped top and bottom seals.
// One geometry is shared by every bag; only the textures differ.
import * as THREE from 'three';
import { SEAL } from './packArt.js';

export const BAG_W = 1.0;
export const BAG_H = 1.5;

let geometry = null;

function buildGeometry() {
  const w = BAG_W, h = BAG_H, puff = 0.17;
  const g = new THREE.PlaneGeometry(w, h, 56, 90);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const u = x / (w / 2);
    const t = (y + h / 2) / h;
    let z;
    let xs = 1;
    if (t > SEAL && t < 1 - SEAL) {
      // Puffed body: highest in the middle, flat at the edges and seals
      const sv = ((t - SEAL) / (1 - 2 * SEAL)) * 2 - 1;
      const bu = Math.pow(Math.max(0, 1 - u * u), 0.55);
      const bv = Math.pow(Math.max(0, 1 - sv * sv), 0.42);
      z = puff * bu * bv;
      // Creases where the body meets the seals (kept >= 0 so front and back never cross)
      const edge = Math.pow(Math.abs(sv), 7);
      z += 0.012 * edge * (0.5 + 0.5 * Math.sin(u * 24 + sv * 4)) * (1 - u * u);
      // Sides pull inward as the bag puffs up
      xs = 1 - 0.055 * (1 - sv * sv);
    } else {
      // Crimped seal ridges, closed at the side edges
      z = (0.003 + 0.003 * Math.sin(y * 240)) * (1 - Math.pow(Math.abs(u), 8));
    }
    p.setXYZ(i, x * xs, y, z);
  }
  g.computeVertexNormals();
  return g;
}

export function createBag(frontTex, backTex) {
  geometry ||= buildGeometry();
  const mat = (map) =>
    new THREE.MeshPhysicalMaterial({
      map,
      roughness: 0.36,
      metalness: 0.25,
      clearcoat: 0.85,
      clearcoatRoughness: 0.2,
    });
  const front = new THREE.Mesh(geometry, mat(frontTex));
  const back = new THREE.Mesh(geometry, mat(backTex));
  back.rotation.y = Math.PI;
  const group = new THREE.Group();
  group.add(front, back);
  return group;
}
