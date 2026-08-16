"use client";

import { useMemo, useState } from "react";
import { ArchPanel } from "@/components/ArchPanel";
import { BoundaryCanvas } from "@/components/BoundaryCanvas";
import { LossCurve } from "@/components/LossCurve";
import { DATASETS } from "@/core/datasets";
import { accuracy } from "@/core/nn";
import type { Speed } from "@/core/schedule";
import { SPEEDS } from "@/core/schedule";
import type { NetSpec, Sample } from "@/core/types";
import { FOOTER_LINKS } from "@/lib/links";
import { useNetTrainer } from "@/lib/useNetTrainer";

const SEED = 1;

export default function Home() {
  const [datasetId, setDatasetId] = useState(DATASETS[0].id);
  const [spec, setSpec] = useState<NetSpec>({
    hidden: [6],
    activation: "tanh",
  });
  const [lr, setLr] = useState(0.5);

  const dataset = DATASETS.find((d) => d.id === datasetId) ?? DATASETS[0];
  const samples = useMemo(() => dataset.make(SEED), [dataset]);

  return (
    <main className="app">
      <header className="header">
        <h1>kyokai-lab</h1>
        <p className="subtitle">
          ニューラルネットが決定境界を学ぶ過程をリアルタイム可視化
        </p>
      </header>

      <nav className="map-tabs" aria-label="データセット選択">
        {DATASETS.map((d) => (
          <button
            type="button"
            key={d.id}
            className={d.id === datasetId ? "active" : ""}
            onClick={() => setDatasetId(d.id)}
          >
            {d.name}
          </button>
        ))}
      </nav>

      {/* key で remount してデータセット・構成変更時に学習状態を作り直す */}
      <Playground
        key={`${dataset.id}:${spec.hidden.join("-")}:${spec.activation}`}
        samples={samples}
        spec={spec}
        onSpecChange={setSpec}
        lr={lr}
        onLrChange={setLr}
      />

      <footer className="footer">
        {FOOTER_LINKS.map((l, i) => (
          <span key={l.href}>
            {i > 0 && " ・ "}
            <a href={l.href} target="_blank" rel="noreferrer">
              {l.label}
            </a>
            {l.label === "MIT License" && " © 2026 坂田哲朗"}
          </span>
        ))}
      </footer>
    </main>
  );
}

function Playground({
  samples,
  spec,
  onSpecChange,
  lr,
  onLrChange,
}: {
  samples: Sample[];
  spec: NetSpec;
  onSpecChange: (next: NetSpec) => void;
  lr: number;
  onLrChange: (next: number) => void;
}) {
  const trainer = useNetTrainer(samples, spec, SEED, lr);
  const acc = accuracy(trainer.net, samples);

  return (
    <div className="layout">
      <section className="board">
        <BoundaryCanvas net={trainer.net} samples={samples} />
        <div className="controls" aria-label="実行制御">
          <div className="control-row">
            {trainer.playing ? (
              <button type="button" onClick={trainer.pause}>
                ⏸ 一時停止
              </button>
            ) : (
              <button type="button" onClick={trainer.play}>
                ▶ 学習開始
              </button>
            )}
            <button type="button" onClick={trainer.stepOnce}>
              1 ステップ
            </button>
            <button type="button" onClick={trainer.reset}>
              リセット
            </button>
          </div>
          <div className="control-row" role="group" aria-label="速度">
            {SPEEDS.map((s: Speed) => (
              <button
                type="button"
                key={s}
                className={trainer.speed === s ? "active" : ""}
                onClick={() => trainer.setSpeed(s)}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </section>

      <aside className="panel">
        <ArchPanel spec={spec} onChange={onSpecChange} />

        <label className="param">
          <span className="param-label">
            学習率 η<span className="param-value">{lr.toFixed(2)}</span>
          </span>
          <input
            type="range"
            min={0.05}
            max={2}
            step={0.05}
            value={lr}
            onChange={(e) => onLrChange(Number(e.target.value))}
          />
        </label>

        <LossCurve losses={trainer.lossHistory} />

        <dl className="stats">
          <div>
            <dt>ステップ</dt>
            <dd>{trainer.steps}</dd>
          </div>
          <div>
            <dt>訓練精度</dt>
            <dd>{(acc * 100).toFixed(1)}%</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
