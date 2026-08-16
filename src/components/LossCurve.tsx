"use client";

// 損失曲線(F-08)。対数軸の単一系列折れ線(凡例なし・タイトルが系列名)。

import { lossCurvePoints } from "@/core/viz";

const W = 320;
const H = 96;

export function LossCurve({ losses }: { losses: number[] }) {
  const points = lossCurvePoints(losses, W, H);
  const latest = losses.length > 0 ? losses[losses.length - 1] : null;

  return (
    <figure className="curve">
      <figcaption>
        損失(BCE・対数軸)
        {latest !== null && (
          <span className="curve-latest"> {latest.toExponential(2)}</span>
        )}
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="学習損失の推移(対数軸)"
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        <line x1={0} y1={H} x2={W} y2={H} stroke="#383835" strokeWidth={1} />
        {points !== "" ? (
          <polyline
            points={points}
            fill="none"
            stroke="#8f7ae5"
            strokeWidth={2}
            strokeLinejoin="round"
          />
        ) : (
          <text
            x={W / 2}
            y={H / 2}
            textAnchor="middle"
            fontSize={12}
            fill="#8a8894"
          >
            学習開始を待機中
          </text>
        )}
      </svg>
    </figure>
  );
}
