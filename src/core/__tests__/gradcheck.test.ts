import { describe, expect, it } from "vitest";
import type { Activation, Net, Sample } from "@/core/types";
import { gradients, initNet, lossOf } from "@/core/nn";

// T-030 / G-01: 逆伝播 vs 数値微分(中心差分)
//
// オラクルはテスト側で独立実装する: 損失関数 lossOf のみを使い、
// 各パラメータ θ について (L(θ+ε) − L(θ−ε)) / 2ε を計算する。
// ε=1e-5 は「丸め誤差 << ε² << 勾配スケール」を満たす標準的な選択。
// 相対誤差は |g_bp − g_num| / max(1e-8, |g_bp| + |g_num|) で定義する。

const EPS = 1e-5;
const TOL = 1e-4;

function clone(net: Net): Net {
  return JSON.parse(JSON.stringify(net));
}

function numericalGrad(net: Net, data: Sample[]): { dW: number[][][]; dB: number[][] } {
  const dW = net.weights.map((l) => l.map((r) => r.map(() => 0)));
  const dB = net.biases.map((b) => b.map(() => 0));
  for (let l = 0; l < net.weights.length; l++) {
    for (let j = 0; j < net.weights[l].length; j++) {
      for (let i = 0; i < net.weights[l][j].length; i++) {
        const plus = clone(net);
        plus.weights[l][j][i] += EPS;
        const minus = clone(net);
        minus.weights[l][j][i] -= EPS;
        dW[l][j][i] = (lossOf(plus, data) - lossOf(minus, data)) / (2 * EPS);
      }
      const plus = clone(net);
      plus.biases[l][j] += EPS;
      const minus = clone(net);
      minus.biases[l][j] -= EPS;
      dB[l][j] = (lossOf(plus, data) - lossOf(minus, data)) / (2 * EPS);
    }
  }
  return { dW, dB };
}

function relErr(a: number, b: number): number {
  return Math.abs(a - b) / Math.max(1e-8, Math.abs(a) + Math.abs(b));
}

// ReLU の非微分点(z=0 近傍)を避けるため、入力・重みは PRNG 初期化のまま
// 一般位置の点を使う(z が厳密に 0 になる確率は無視できる)
const BATCH: Sample[] = [
  { x: 0.31, y: -0.47, label: 1 },
  { x: -0.62, y: 0.11, label: 0 },
  { x: 0.05, y: 0.83, label: 1 },
  { x: -0.29, y: -0.71, label: 0 },
];

describe("勾配検証(G-01)", () => {
  const cases: Array<[Activation, number[]]> = [
    ["tanh", [3]],
    ["tanh", [4, 3]],
    ["relu", [4, 3]],
    ["relu", [5, 4, 3]],
    ["sigmoid", [4, 3]],
  ];
  for (const [act, hidden] of cases) {
    it(`${act} / 隠れ [${hidden.join(",")}] で相対誤差 < 1e-4`, () => {
      const net = initNet({ hidden, activation: act }, 12345);
      const bp = gradients(net, BATCH);
      const num = numericalGrad(net, BATCH);
      let maxErr = 0;
      for (let l = 0; l < net.weights.length; l++) {
        for (let j = 0; j < net.weights[l].length; j++) {
          for (let i = 0; i < net.weights[l][j].length; i++) {
            maxErr = Math.max(maxErr, relErr(bp.dW[l][j][i], num.dW[l][j][i]));
          }
          maxErr = Math.max(maxErr, relErr(bp.dB[l][j], num.dB[l][j]));
        }
      }
      expect(maxErr).toBeLessThan(TOL);
    });
  }
});
