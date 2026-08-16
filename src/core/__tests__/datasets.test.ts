import { describe, expect, it } from "vitest";
import { DATASETS, makeCircles, makeXor } from "@/core/datasets";

// T-010 / T-011 / T-012(F-02)

describe("datasets", () => {
  // T-010: 全データセットの基本性質
  it("4 種・各 200 点・[-1,1]²・両ラベル存在・シード決定的", () => {
    expect(DATASETS.length).toBe(4);
    for (const d of DATASETS) {
      const a = d.make(1);
      const b = d.make(1);
      expect(a).toEqual(b);
      expect(a.length).toBe(200);
      const labels = new Set(a.map((s) => s.label));
      expect(labels).toEqual(new Set([0, 1]));
      for (const s of a) {
        expect(Math.abs(s.x)).toBeLessThanOrEqual(1);
        expect(Math.abs(s.y)).toBeLessThanOrEqual(1);
      }
      // 異なるシードでは座標が変わる
      expect(d.make(2)).not.toEqual(a);
    }
  });

  // T-011: XOR は象限とラベルが一致
  it("XOR のラベルは x·y の符号と一致する", () => {
    for (const s of makeXor(7)) {
      expect(s.label).toBe(s.x * s.y > 0 ? 1 : 0);
    }
  });

  // T-012: 同心円は半径で分離
  it("同心円は内円 label 1・外輪 label 0", () => {
    const rs: Record<number, number[]> = { 0: [], 1: [] };
    for (const s of makeCircles(7)) {
      rs[s.label].push(Math.hypot(s.x, s.y));
    }
    // 内円の最大半径 < 外輪の最小半径(半径ギャップで分離可能)
    expect(Math.max(...rs[1])).toBeLessThan(Math.min(...rs[0]));
  });
});
