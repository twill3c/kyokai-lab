// アーキテクチャ編集(F-07)。制約: 隠れ層 1〜3・各層 2〜16 ニューロン。

export const MAX_LAYERS = 3;
export const MIN_NEURONS = 2;
export const MAX_NEURONS = 16;

/** 新しい層は 4 ニューロンで末尾に追加。上限層数なら不変 */
export function addLayer(hidden: number[]): number[] {
  if (hidden.length >= MAX_LAYERS) return [...hidden];
  return [...hidden, 4];
}

/** 末尾の層を外す。1 層は必ず残す */
export function removeLayer(hidden: number[]): number[] {
  if (hidden.length <= 1) return [...hidden];
  return hidden.slice(0, -1);
}

/** 指定層のニューロン数を 2〜16 にクランプして設定。範囲外 index は不変 */
export function setNeurons(
  hidden: number[],
  index: number,
  n: number,
): number[] {
  if (index < 0 || index >= hidden.length) return [...hidden];
  const next = [...hidden];
  next[index] = Math.min(MAX_NEURONS, Math.max(MIN_NEURONS, n));
  return next;
}
