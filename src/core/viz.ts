// 可視化用の純関数(F-05 / F-08)。発散配色は class 0 = オレンジ / class 1 = 青。

import type { Net } from "./types";
import { predict } from "./nn";

/** p = 0.5 の中立色(ダーク面の neutral gray) */
export const PROB_NEUTRAL = "#383835";

const POS_POLE: [number, number, number] = [57, 135, 229]; // #3987e5(label 1)
const NEG_POLE: [number, number, number] = [217, 89, 38]; // #d95926(label 0)
const NEUTRAL_RGB: [number, number, number] = [0x38, 0x38, 0x35];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function hex(rgb: [number, number, number]): string {
  return (
    "#" +
    rgb
      .map((c) => Math.round(c).toString(16).padStart(2, "0"))
      .join("")
      .toLowerCase()
  );
}

/** 出力確率 → 発散配色(T-051)。p=0.5 が中立、0/1 で各極に飽和 */
export function probColor(p: number): string {
  if (p === 0.5) return PROB_NEUTRAL;
  const pole = p > 0.5 ? POS_POLE : NEG_POLE;
  const t = Math.min(Math.abs(p - 0.5) * 2, 1);
  return hex([
    lerp(NEUTRAL_RGB[0], pole[0], t),
    lerp(NEUTRAL_RGB[1], pole[1], t),
    lerp(NEUTRAL_RGB[2], pole[2], t),
  ]);
}

/**
 * 決定境界グリッド(T-050)。[-1,1]² を res×res に分割し、
 * 各セル中心の出力確率を行優先(index = row·res + col)で返す
 */
export function boundaryGrid(net: Net, res: number): number[] {
  const out: number[] = new Array(res * res);
  for (let r = 0; r < res; r++) {
    const y = -1 + ((r + 0.5) * 2) / res;
    for (let c = 0; c < res; c++) {
      const x = -1 + ((c + 0.5) * 2) / res;
      out[r * res + c] = predict(net, x, y);
    }
  }
  return out;
}

/**
 * 損失曲線の SVG points(T-052)。対数軸(log10)で正規化(大きいほど上)。
 * BCE は正値なので非正値は契約違反として例外にする
 */
export function lossCurvePoints(
  losses: number[],
  width: number,
  height: number,
): string {
  if (losses.length === 0) return "";
  const logs = losses.map((v) => {
    if (v <= 0) throw new Error(`lossCurvePoints: 非正値 ${v}`);
    return Math.log10(v);
  });
  const min = Math.min(...logs);
  const max = Math.max(...logs);
  const span = max - min;
  const dx = logs.length > 1 ? width / (logs.length - 1) : 0;
  return logs
    .map((v, i) => {
      const t = span === 0 ? 0.5 : (v - min) / span;
      return `${i * dx},${(1 - t) * height}`;
    })
    .join(" ");
}
