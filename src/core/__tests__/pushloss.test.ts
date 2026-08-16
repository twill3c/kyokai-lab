import { describe, expect, it } from "vitest";
import { pushLoss } from "@/core/viz";

// T-053(F-08): 損失履歴のリングレス圧縮
// cap を超えたら 1 つ飛ばしに間引いて半分にする(曲線の形は保たれる)

describe("pushLoss", () => {
  it("cap 以下では単純追記・cap 超過で半分に圧縮・順序保存", () => {
    let h: number[] = [];
    for (let i = 1; i <= 8; i++) h = pushLoss(h, i, 8);
    expect(h).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    // 9 個目で圧縮(偶数 index を残して半分)→ 追記
    h = pushLoss(h, 9, 8);
    expect(h.length).toBeLessThanOrEqual(8);
    expect(h[h.length - 1]).toBe(9);
    // 単調増加列を入れたので圧縮後も単調のまま
    for (let i = 1; i < h.length; i++) expect(h[i]).toBeGreaterThan(h[i - 1]);
    // さらに大量に入れても cap を超えない
    for (let i = 10; i <= 200; i++) h = pushLoss(h, i, 8);
    expect(h.length).toBeLessThanOrEqual(8);
    expect(h[h.length - 1]).toBe(200);
  });
});
