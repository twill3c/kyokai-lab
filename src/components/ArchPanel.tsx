"use client";

// アーキテクチャ編集パネル(F-07)。変更は onChange で親へ返し、
// 親が keyed remount で学習状態を作り直す。

import {
  MAX_LAYERS,
  MAX_NEURONS,
  MIN_NEURONS,
  addLayer,
  removeLayer,
  setNeurons,
} from "@/core/arch";
import type { Activation, NetSpec } from "@/core/types";

const ACTIVATIONS: Activation[] = ["tanh", "relu", "sigmoid"];

export function ArchPanel({
  spec,
  onChange,
}: {
  spec: NetSpec;
  onChange: (next: NetSpec) => void;
}) {
  return (
    <div className="arch" role="group" aria-label="ネットワーク構成">
      <div className="arch-row">
        <span className="arch-label">隠れ層({spec.hidden.length}/{MAX_LAYERS})</span>
        <button
          type="button"
          onClick={() => onChange({ ...spec, hidden: addLayer(spec.hidden) })}
          disabled={spec.hidden.length >= MAX_LAYERS}
        >
          + 層
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...spec, hidden: removeLayer(spec.hidden) })}
          disabled={spec.hidden.length <= 1}
        >
          − 層
        </button>
      </div>
      {spec.hidden.map((n, i) => (
        <div className="arch-row" key={i}>
          <span className="arch-label">
            第 {i + 1} 層 <strong>{n}</strong> ニューロン
          </span>
          <button
            type="button"
            onClick={() =>
              onChange({ ...spec, hidden: setNeurons(spec.hidden, i, n - 1) })
            }
            disabled={n <= MIN_NEURONS}
            aria-label={`第 ${i + 1} 層のニューロンを減らす`}
          >
            −
          </button>
          <button
            type="button"
            onClick={() =>
              onChange({ ...spec, hidden: setNeurons(spec.hidden, i, n + 1) })
            }
            disabled={n >= MAX_NEURONS}
            aria-label={`第 ${i + 1} 層のニューロンを増やす`}
          >
            +
          </button>
        </div>
      ))}
      <div className="arch-row">
        <span className="arch-label">活性化</span>
        {ACTIVATIONS.map((a) => (
          <button
            type="button"
            key={a}
            className={spec.activation === a ? "active" : ""}
            onClick={() => onChange({ ...spec, activation: a })}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}
