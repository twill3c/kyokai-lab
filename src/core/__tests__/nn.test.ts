import { describe, expect, it } from "vitest";
import { makeXor } from "@/core/datasets";
import {
  accuracy,
  initNet,
  lossOf,
  predict,
  trainStep,
} from "@/core/nn";

// T-020 / T-021 / T-022 / T-040 / T-041(F-03 / F-04)

describe("nn", () => {
  // T-020: 初期化の形状と決定論
  it("initNet は spec どおりの形状・非ゼロ・シード決定的", () => {
    const net = initNet({ hidden: [4, 3], activation: "tanh" }, 1);
    // 層構成: 2 入力 → 4 → 3 → 1
    expect(net.weights.length).toBe(3);
    expect(net.weights[0].length).toBe(4);
    expect(net.weights[0][0].length).toBe(2);
    expect(net.weights[1].length).toBe(3);
    expect(net.weights[1][0].length).toBe(4);
    expect(net.weights[2].length).toBe(1);
    expect(net.weights[2][0].length).toBe(3);
    expect(net.biases.map((b) => b.length)).toEqual([4, 3, 1]);
    expect(net.weights.flat(2).some((w) => w !== 0)).toBe(true);
    expect(initNet({ hidden: [4, 3], activation: "tanh" }, 1)).toEqual(net);
    expect(initNet({ hidden: [4, 3], activation: "tanh" }, 2)).not.toEqual(net);
  });

  // T-021: 極小ネットの forward を手計算と照合
  it("隠れ 1 ユニット tanh の forward が手計算と一致する", () => {
    const net = initNet({ hidden: [1], activation: "tanh" }, 1);
    // 重みを既知値に固定: 隠れ z = 0.5x − 0.3y + 0.1、出力 z = 0.8a − 0.2
    net.weights[0] = [[0.5, -0.3]];
    net.biases[0] = [0.1];
    net.weights[1] = [[0.8]];
    net.biases[1] = [-0.2];
    const x = 0.3;
    const y = -0.4;
    // 独立再計算(テスト側で Math 関数から直接導出)
    const a1 = Math.tanh(0.5 * x - 0.3 * y + 0.1);
    const expected = 1 / (1 + Math.exp(-(0.8 * a1 - 0.2)));
    expect(predict(net, x, y)).toBeCloseTo(expected, 12);
  });

  // T-022: BCE 損失の境界挙動
  it("BCE は完全正解で ≈0・p=0.5 で ln2・極端でも有限", () => {
    const net = initNet({ hidden: [1], activation: "tanh" }, 1);
    // 出力を強制的に 0.5 にする(全ゼロ重み → σ(0) = 0.5)
    net.weights = net.weights.map((l) => l.map((r) => r.map(() => 0)));
    net.biases = net.biases.map((b) => b.map(() => 0));
    const data = [
      { x: 0.1, y: 0.2, label: 1 as const },
      { x: -0.5, y: 0.4, label: 0 as const },
    ];
    expect(lossOf(net, data)).toBeCloseTo(Math.LN2, 10);
    // 出力を label 1 側へ飽和させても損失は有限(クランプ)
    net.biases[1] = [1000];
    expect(Number.isFinite(lossOf(net, data))).toBe(true);
  });

  // T-040: trainStep は純関数
  it("trainStep は入力を破壊せず、同一入力で同一出力", () => {
    const data = makeXor(1);
    const net = initNet({ hidden: [4], activation: "tanh" }, 1);
    const snapshot = JSON.parse(JSON.stringify(net));
    const r1 = trainStep(net, data, 0.5);
    const r2 = trainStep(net, data, 0.5);
    expect(net).toEqual(snapshot);
    expect(r1.net).toEqual(r2.net);
    expect(r1.loss).toBe(r2.loss);
    expect(r1.net).not.toEqual(net);
  });

  // T-041: 学習率が更新量に線形に効く
  it("lr を半分にすると重み更新量も半分になる", () => {
    const data = makeXor(1);
    const net = initNet({ hidden: [3], activation: "tanh" }, 1);
    const full = trainStep(net, data, 0.5).net;
    const half = trainStep(net, data, 0.25).net;
    for (let l = 0; l < net.weights.length; l++) {
      for (let j = 0; j < net.weights[l].length; j++) {
        for (let i = 0; i < net.weights[l][j].length; i++) {
          const dFull = full.weights[l][j][i] - net.weights[l][j][i];
          const dHalf = half.weights[l][j][i] - net.weights[l][j][i];
          expect(dHalf).toBeCloseTo(dFull / 2, 10);
        }
      }
    }
  });

  // accuracy の基本
  it("accuracy は 0.5 閾値の正解率を返す", () => {
    const net = initNet({ hidden: [1], activation: "tanh" }, 1);
    net.weights = net.weights.map((l) => l.map((r) => r.map(() => 0)));
    net.biases = net.biases.map((b) => b.map(() => 0));
    net.biases[1] = [10]; // 常に p≈1 → label 1 側に全振り
    const data = [
      { x: 0, y: 0, label: 1 as const },
      { x: 0.1, y: 0.1, label: 0 as const },
    ];
    expect(accuracy(net, data)).toBeCloseTo(0.5, 12);
  });
});
