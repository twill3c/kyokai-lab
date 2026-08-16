// 2 次元データセット生成(F-02)。シード決定的・各 200 点・座標 [-1,1]²。

import type { Sample } from "./types";
import { rngNext, rngInit } from "./prng";

const N = 200;

interface RngBox {
  state: number;
}

function uniform(box: RngBox, lo: number, hi: number): number {
  const r = rngNext(box.state);
  box.state = r.state;
  return lo + r.value * (hi - lo);
}

/** XOR: 象限でラベル分け。境界帯(|x|,|y| < 0.05)は避けて曖昧さを除く */
export function makeXor(seed: number): Sample[] {
  const box = { state: rngInit(seed) };
  const out: Sample[] = [];
  while (out.length < N) {
    const x = uniform(box, -1, 1);
    const y = uniform(box, -1, 1);
    if (Math.abs(x) < 0.05 || Math.abs(y) < 0.05) continue;
    out.push({ x, y, label: x * y > 0 ? 1 : 0 });
  }
  return out;
}

/** 同心円: 内円(r ≤ 0.35)が label 1、外輪(0.55 ≤ r ≤ 0.9)が label 0 */
export function makeCircles(seed: number): Sample[] {
  const box = { state: rngInit(seed) };
  const out: Sample[] = [];
  for (let i = 0; i < N; i++) {
    const inner = i % 2 === 0;
    const r = inner ? uniform(box, 0.05, 0.35) : uniform(box, 0.55, 0.9);
    const t = uniform(box, 0, 2 * Math.PI);
    out.push({
      x: r * Math.cos(t),
      y: r * Math.sin(t),
      label: inner ? 1 : 0,
    });
  }
  return out;
}

/** 二重渦巻き: 2 本の腕が絡む古典課題。小さな半径ノイズ付き */
export function makeSpiral(seed: number): Sample[] {
  const box = { state: rngInit(seed) };
  const out: Sample[] = [];
  const perArm = N / 2;
  for (let arm = 0; arm < 2; arm++) {
    for (let i = 0; i < perArm; i++) {
      const t = (i / perArm) * 2.5 * Math.PI;
      const r = 0.08 + 0.82 * (i / perArm) + uniform(box, -0.03, 0.03);
      const phase = arm * Math.PI;
      out.push({
        x: r * Math.cos(t + phase),
        y: r * Math.sin(t + phase),
        label: arm as 0 | 1,
      });
    }
  }
  return out;
}

/** 市松: [-1,1]² を 4×4 に区切った市松模様(最難関) */
export function makeChecker(seed: number): Sample[] {
  const box = { state: rngInit(seed) };
  const out: Sample[] = [];
  while (out.length < N) {
    const x = uniform(box, -1, 1);
    const y = uniform(box, -1, 1);
    const cx = Math.min(3, Math.floor((x + 1) * 2));
    const cy = Math.min(3, Math.floor((y + 1) * 2));
    out.push({ x, y, label: ((cx + cy) % 2) as 0 | 1 });
  }
  return out;
}

export interface DatasetDef {
  id: string;
  name: string;
  make: (seed: number) => Sample[];
}

export const DATASETS: readonly DatasetDef[] = [
  { id: "xor", name: "XOR", make: makeXor },
  { id: "circles", name: "同心円", make: makeCircles },
  { id: "spiral", name: "二重渦巻き", make: makeSpiral },
  { id: "checker", name: "市松", make: makeChecker },
];
