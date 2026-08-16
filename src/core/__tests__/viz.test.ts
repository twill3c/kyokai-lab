import { describe, expect, it } from "vitest";
import { initNet } from "@/core/nn";
import {
  PROB_NEUTRAL,
  boundaryGrid,
  lossCurvePoints,
  probColor,
} from "@/core/viz";

// T-050 / T-051 / T-052(F-05 / F-08)

describe("viz", () => {
  // T-050: 境界グリッド
  it("boundaryGrid は res×res の確率格子([0,1])を返す", () => {
    const net = initNet({ hidden: [3], activation: "tanh" }, 1);
    const g = boundaryGrid(net, 20);
    expect(g.length).toBe(400);
    for (const p of g) {
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });

  // T-051: 確率の発散配色
  it("probColor は p=0.5 で中立・0/1 で各極・単調", () => {
    expect(probColor(0.5)).toBe(PROB_NEUTRAL);
    const down = [0.4, 0.25, 0.1, 0].map(probColor);
    const up = [0.6, 0.75, 0.9, 1].map(probColor);
    expect(new Set([...down, ...up]).size).toBe(8);
    for (const c of [...down, ...up]) expect(c).toMatch(/^#[0-9a-f]{6}$/);
    expect(probColor(0)).not.toBe(probColor(1));
  });

  // T-052: 損失曲線(対数軸)
  it("lossCurvePoints は正値のみ受理し対数で単調写像する", () => {
    expect(lossCurvePoints([], 100, 50)).toBe("");
    const pts = lossCurvePoints([1, 0.1, 0.01], 100, 50)
      .split(" ")
      .map((p) => p.split(",").map(Number));
    expect(pts.map((p) => p[0])).toEqual([0, 50, 100]);
    // 対数軸: 1 → 上端(y=0)、0.01 → 下端(y=50)、0.1 → 中央
    expect(pts[0][1]).toBeCloseTo(0, 6);
    expect(pts[1][1]).toBeCloseTo(25, 6);
    expect(pts[2][1]).toBeCloseTo(50, 6);
    // 非正値は例外(呼び出し側の契約違反)
    expect(() => lossCurvePoints([1, 0], 100, 50)).toThrow();
  });
});
