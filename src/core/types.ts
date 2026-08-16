// kyokai-lab コア型定義。src/core は純関数のみ(AGENTS.md §4)

export type Activation = "tanh" | "relu" | "sigmoid";

export interface NetSpec {
  /** 隠れ層の各ニューロン数(1〜3 層・各 2〜16) */
  hidden: number[];
  activation: Activation;
}

/**
 * MLP(F-03)。weights[l][j][i] = 層 l のユニット j への入力 i の重み。
 * 層は 隠れ層… + 出力層(シグモイド 1 ユニット)の順。biases も同順。
 */
export interface Net {
  spec: NetSpec;
  weights: number[][][];
  biases: number[][];
}

export interface Sample {
  x: number;
  y: number;
  label: 0 | 1;
}
