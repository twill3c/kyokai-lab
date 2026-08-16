"use client";

// 決定境界キャンバス(F-05)。ImageData(RES×RES)を拡大描画し、
// その上にデータ点を正誤の縁取り付きで重ねる。

import { useEffect, useRef } from "react";
import type { Net, Sample } from "@/core/types";
import { predict } from "@/core/nn";
import { boundaryGrid, probColorRgb } from "@/core/viz";

const RES = 64;
const SIZE = 480;

const CLASS_COLORS = ["#d95926", "#3987e5"] as const;

export function BoundaryCanvas({
  net,
  samples,
}: {
  net: Net;
  samples: Sample[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 境界ヒートマップ
    const probs = boundaryGrid(net, RES);
    const img = ctx.createImageData(RES, RES);
    for (let i = 0; i < probs.length; i++) {
      const [r, g, b] = probColorRgb(probs[i]);
      img.data[i * 4] = r;
      img.data[i * 4 + 1] = g;
      img.data[i * 4 + 2] = b;
      img.data[i * 4 + 3] = 255;
    }
    const off = document.createElement("canvas");
    off.width = RES;
    off.height = RES;
    off.getContext("2d")!.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.drawImage(off, 0, 0, SIZE, SIZE);

    // データ点(塗り = 正解クラス色・縁取り = 誤分類は白)
    for (const s of samples) {
      const px = ((s.x + 1) / 2) * SIZE;
      const py = ((s.y + 1) / 2) * SIZE;
      const correct = (predict(net, s.x, s.y) >= 0.5 ? 1 : 0) === s.label;
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, 2 * Math.PI);
      ctx.fillStyle = CLASS_COLORS[s.label];
      ctx.fill();
      ctx.lineWidth = correct ? 1.5 : 2.5;
      ctx.strokeStyle = correct ? "#12141a" : "#ffffff";
      ctx.stroke();
    }
  }, [net, samples]);

  return (
    <canvas
      ref={canvasRef}
      width={SIZE}
      height={SIZE}
      role="img"
      aria-label="決定境界とデータ点。青が label 1、オレンジが label 0。白い縁取りは誤分類点"
      style={{ width: "100%", height: "auto", display: "block", borderRadius: 6 }}
    />
  );
}
