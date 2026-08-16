import { describe, expect, it } from "vitest";
import { rngInit, rngNext } from "@/core/prng";

// T-001 / T-002(F-01)

describe("prng", () => {
  it("同一シードで同一列・値は [0,1)", () => {
    let a = rngInit(42);
    let b = rngInit(42);
    for (let i = 0; i < 100; i++) {
      const ra = rngNext(a);
      const rb = rngNext(b);
      expect(ra.value).toBe(rb.value);
      expect(ra.value).toBeGreaterThanOrEqual(0);
      expect(ra.value).toBeLessThan(1);
      a = ra.state;
      b = rb.state;
    }
  });

  it("異なるシードでは先頭 8 個が一致しない", () => {
    const seq = (seed: number): number[] => {
      let s = rngInit(seed);
      const out: number[] = [];
      for (let i = 0; i < 8; i++) {
        const r = rngNext(s);
        out.push(r.value);
        s = r.state;
      }
      return out;
    };
    expect(seq(1)).not.toEqual(seq(2));
  });
});
