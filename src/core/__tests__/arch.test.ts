import { describe, expect, it } from "vitest";
import {
  MAX_LAYERS,
  MAX_NEURONS,
  MIN_NEURONS,
  addLayer,
  removeLayer,
  setNeurons,
} from "@/core/arch";

// T-070(F-07): アーキテクチャ編集の制約(層 1〜3・各 2〜16)

describe("arch", () => {
  it("addLayer は末尾に追加し、上限 3 層で不変", () => {
    expect(addLayer([6])).toEqual([6, 4]);
    expect(addLayer([6, 4])).toEqual([6, 4, 4]);
    const full = [6, 4, 4];
    expect(addLayer(full)).toEqual(full);
    expect(full).toEqual([6, 4, 4]); // 非破壊
    expect(MAX_LAYERS).toBe(3);
  });

  it("removeLayer は末尾を外し、1 層は残す", () => {
    expect(removeLayer([6, 4, 3])).toEqual([6, 4]);
    expect(removeLayer([6])).toEqual([6]);
  });

  it("setNeurons は 2〜16 にクランプする", () => {
    expect(setNeurons([6, 4], 0, 8)).toEqual([8, 4]);
    expect(setNeurons([6, 4], 1, 100)).toEqual([6, MAX_NEURONS]);
    expect(setNeurons([6, 4], 1, 0)).toEqual([6, MIN_NEURONS]);
    expect(setNeurons([6, 4], 5, 8)).toEqual([6, 4]); // 範囲外 index は不変
  });
});
