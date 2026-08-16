"use client";

// 学習ループフック(F-06 / N-03)。描画は rAF、学習は 1 フレームあたり
// batchSize(speed) ステップに制限して UI をブロックしない。
//
// 制約: データセット・アーキテクチャを切り替えるときは呼び出し側が
// key={dataset.id + spec ハッシュ} で本フックを持つコンポーネントを remount すること
// (effect リセットは旧形状のネットで 1 回描画してしまう — kyoka-grid loop_003 の教訓)。

import { useCallback, useEffect, useRef, useState } from "react";
import type { Net, NetSpec, Sample } from "@/core/types";
import { initNet, trainStep } from "@/core/nn";
import type { Speed } from "@/core/schedule";
import { batchSize } from "@/core/schedule";
import { pushLoss } from "@/core/viz";

const LOSS_CAP = 512;

interface TrainState {
  net: Net;
  lossHistory: number[];
  steps: number;
}

export interface NetTrainer {
  net: Net;
  lossHistory: number[];
  steps: number;
  playing: boolean;
  speed: Speed;
  play: () => void;
  pause: () => void;
  stepOnce: () => void;
  reset: () => void;
  setSpeed: (s: Speed) => void;
}

export function useNetTrainer(
  samples: Sample[],
  spec: NetSpec,
  seed: number,
  lr: number,
): NetTrainer {
  const [state, setState] = useState<TrainState>(() => ({
    net: initNet(spec, seed),
    lossHistory: [],
    steps: 0,
  }));
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(10);

  const lrRef = useRef(lr);
  lrRef.current = lr;
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const advance = useCallback(
    (n: number) => {
      setState((cur) => {
        let net = cur.net;
        let hist = cur.lossHistory;
        for (let i = 0; i < n; i++) {
          const r = trainStep(net, samples, lrRef.current);
          net = r.net;
          hist = pushLoss(hist, r.loss, LOSS_CAP);
        }
        return { net, lossHistory: hist, steps: cur.steps + n };
      });
    },
    [samples],
  );

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      advance(batchSize(speedRef.current));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, advance]);

  const play = useCallback(() => setPlaying(true), []);
  const pause = useCallback(() => setPlaying(false), []);
  const stepOnce = useCallback(() => {
    setPlaying(false);
    advance(1);
  }, [advance]);
  const reset = useCallback(() => {
    setPlaying(false);
    setState({ net: initNet(spec, seed), lossHistory: [], steps: 0 });
  }, [spec, seed]);

  return {
    net: state.net,
    lossHistory: state.lossHistory,
    steps: state.steps,
    playing,
    speed,
    play,
    pause,
    stepOnce,
    reset,
    setSpeed,
  };
}
