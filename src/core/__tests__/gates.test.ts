import { describe, expect, it } from "vitest";
import { makeCircles, makeXor } from "@/core/datasets";
import type { Net, Sample } from "@/core/types";
import { accuracy, initNet, lossOf, trainStep } from "@/core/nn";

// T-100 / T-101 / T-102(G-02 / G-03 / G-04 / G-05)
// 予算・閾値は 3 シード較正実験で確認してから確定する(TEST_SPEC 実行規約)

function train(
  net: Net,
  data: Sample[],
  lr: number,
  steps: number,
): { net: Net; losses: number[] } {
  const losses: number[] = [];
  let cur = net;
  for (let i = 0; i < steps; i++) {
    const r = trainStep(cur, data, lr);
    cur = r.net;
    losses.push(r.loss);
  }
  return { net: cur, losses };
}

describe("学習ゲート", () => {
  // T-100 / G-02+G-05: XOR(構成・予算は 3 シード較正実験で確定 — SPEC §4 註)
  it("G-02: XOR がシード 1・[6] tanh・lr 0.5・4000 ステップで訓練精度 100%", () => {
    const data = makeXor(1);
    const net0 = initNet({ hidden: [6], activation: "tanh" }, 1);
    const initialLoss = lossOf(net0, data);
    const { net, losses } = train(net0, data, 0.5, 4000);
    expect(accuracy(net, data)).toBe(1);
    expect(losses[losses.length - 1]).toBeLessThan(initialLoss * 0.1);
  });

  // T-101 / G-03+G-05: 同心円(較正で全条件 100% のため閾値も 100%)
  it("G-03: 同心円がシード 1・[8] tanh・lr 0.5・3000 ステップで訓練精度 100%", () => {
    const data = makeCircles(1);
    const net0 = initNet({ hidden: [8], activation: "tanh" }, 1);
    const initialLoss = lossOf(net0, data);
    const { net, losses } = train(net0, data, 0.5, 3000);
    expect(accuracy(net, data)).toBe(1);
    expect(losses[losses.length - 1]).toBeLessThan(initialLoss * 0.1);
  });

  // T-102 / G-04: 決定論
  it("G-04: 同一シードの 2 回の学習が同一の重みと損失履歴を生む", () => {
    const data = makeXor(1);
    const a = train(initNet({ hidden: [4], activation: "tanh" }, 1), data, 0.5, 500);
    const b = train(initNet({ hidden: [4], activation: "tanh" }, 1), data, 0.5, 500);
    expect(a.net).toEqual(b.net);
    expect(a.losses).toEqual(b.losses);
  });
});
