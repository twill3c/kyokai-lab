// MLP の forward / backward / 学習(F-03 / F-04)。すべて純関数。
// 出力層は常にシグモイド 1 ユニット・損失は二値クロスエントロピー。

import type { Activation, Net, NetSpec, Sample } from "./types";
import { rngNext } from "./prng";
import { rngInit } from "./prng";

const CLAMP = 1e-12;

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

function act(a: Activation, z: number): number {
  if (a === "tanh") return Math.tanh(z);
  if (a === "relu") return z > 0 ? z : 0;
  return sigmoid(z);
}

/** 活性化の微分(出力値 v から計算。ReLU は v>0 ⇔ z>0 を利用) */
function actDeriv(a: Activation, v: number): number {
  if (a === "tanh") return 1 - v * v;
  if (a === "relu") return v > 0 ? 1 : 0;
  return v * (1 - v);
}

/** Xavier(Glorot)一様初期化。バイアスは 0 */
export function initNet(spec: NetSpec, seed: number): Net {
  const sizes = [2, ...spec.hidden, 1];
  let state = rngInit(seed);
  const weights: number[][][] = [];
  const biases: number[][] = [];
  for (let l = 1; l < sizes.length; l++) {
    const fanIn = sizes[l - 1];
    const fanOut = sizes[l];
    const limit = Math.sqrt(6 / (fanIn + fanOut));
    const layer: number[][] = [];
    for (let j = 0; j < fanOut; j++) {
      const row: number[] = [];
      for (let i = 0; i < fanIn; i++) {
        const r = rngNext(state);
        state = r.state;
        row.push((r.value * 2 - 1) * limit);
      }
      layer.push(row);
    }
    weights.push(layer);
    biases.push(new Array(fanOut).fill(0));
  }
  return { spec, weights, biases };
}

/** 順伝播。acts[0] = 入力、acts[L] = 出力層(確率 1 要素) */
export function forward(net: Net, x: number, y: number): number[][] {
  const acts: number[][] = [[x, y]];
  const last = net.weights.length - 1;
  for (let l = 0; l < net.weights.length; l++) {
    const prev = acts[l];
    const out: number[] = [];
    for (let j = 0; j < net.weights[l].length; j++) {
      let z = net.biases[l][j];
      for (let i = 0; i < prev.length; i++) {
        z += net.weights[l][j][i] * prev[i];
      }
      out.push(l === last ? sigmoid(z) : act(net.spec.activation, z));
    }
    acts.push(out);
  }
  return acts;
}

export function predict(net: Net, x: number, y: number): number {
  const acts = forward(net, x, y);
  return acts[acts.length - 1][0];
}

/** 二値クロスエントロピー(平均)。確率はクランプして有限性を保証 */
export function lossOf(net: Net, data: Sample[]): number {
  let sum = 0;
  for (const s of data) {
    const p = Math.min(Math.max(predict(net, s.x, s.y), CLAMP), 1 - CLAMP);
    sum += s.label === 1 ? -Math.log(p) : -Math.log(1 - p);
  }
  return sum / data.length;
}

export interface Gradients {
  dW: number[][][];
  dB: number[][];
  loss: number;
}

/** 全バッチの勾配(逆伝播)。BCE+シグモイド出力の δ = p − y から始める */
export function gradients(net: Net, data: Sample[]): Gradients {
  const L = net.weights.length;
  const dW = net.weights.map((l) => l.map((r) => r.map(() => 0)));
  const dB = net.biases.map((b) => b.map(() => 0));
  let loss = 0;

  for (const s of data) {
    const acts = forward(net, s.x, s.y);
    const p = Math.min(Math.max(acts[L][0], CLAMP), 1 - CLAMP);
    loss += s.label === 1 ? -Math.log(p) : -Math.log(1 - p);

    // δ を出力層から逆向きに伝播
    let delta: number[] = [acts[L][0] - s.label];
    for (let l = L - 1; l >= 0; l--) {
      const prev = acts[l];
      for (let j = 0; j < net.weights[l].length; j++) {
        dB[l][j] += delta[j];
        for (let i = 0; i < prev.length; i++) {
          dW[l][j][i] += delta[j] * prev[i];
        }
      }
      if (l === 0) break;
      const next: number[] = new Array(prev.length).fill(0);
      for (let i = 0; i < prev.length; i++) {
        let sum = 0;
        for (let j = 0; j < net.weights[l].length; j++) {
          sum += net.weights[l][j][i] * delta[j];
        }
        next[i] = sum * actDeriv(net.spec.activation, prev[i]);
      }
      delta = next;
    }
  }

  const n = data.length;
  for (let l = 0; l < L; l++) {
    for (let j = 0; j < dW[l].length; j++) {
      dB[l][j] /= n;
      for (let i = 0; i < dW[l][j].length; i++) dW[l][j][i] /= n;
    }
  }
  return { dW, dB, loss: loss / n };
}

/** 全バッチ勾配降下 1 ステップ(純関数)。loss は更新前の値 */
export function trainStep(
  net: Net,
  data: Sample[],
  lr: number,
): { net: Net; loss: number } {
  const g = gradients(net, data);
  const weights = net.weights.map((l, li) =>
    l.map((row, j) => row.map((w, i) => w - lr * g.dW[li][j][i])),
  );
  const biases = net.biases.map((b, li) => b.map((v, j) => v - lr * g.dB[li][j]));
  return { net: { spec: net.spec, weights, biases }, loss: g.loss };
}

/** 訓練精度(閾値 0.5) */
export function accuracy(net: Net, data: Sample[]): number {
  let ok = 0;
  for (const s of data) {
    const p = predict(net, s.x, s.y);
    if ((p >= 0.5 ? 1 : 0) === s.label) ok++;
  }
  return ok / data.length;
}
