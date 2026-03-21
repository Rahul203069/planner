"use client";

import confetti from "canvas-confetti";
import { zzfx } from "zzfx";
import type { CelebrationSoundPreference } from "@/lib/celebration-sound";

function scheduleTone(delay: number, parameters: number[]) {
  return window.setTimeout(() => {
    zzfx(...parameters);
  }, delay);
}

function playArcadeSequence() {
  return [
    scheduleTone(0, [1.1, 0.05, 720, 0.01, 0.14, 0.3, 0, 1.8, -8, 0, 140, 0.04, 0.12, 0.8, 0.2, 0.15, 0.18, 0.92, 0.03, 0]),
  ];
}

function playHurraySequence() {
  return [
    scheduleTone(0, [1, 0.05, 560, 0.01, 0.1, 0.18, 0, 1.5, 6, 0, 40, 0.03, 0.1, 1.4, 0.2, 0.18, 0.22, 0.88, 0.04, 0]),
    scheduleTone(170, [1, 0.05, 760, 0.01, 0.12, 0.24, 0, 1.7, 10, 0, 80, 0.04, 0.12, 1.6, 0.25, 0.2, 0.24, 0.86, 0.04, 0]),
  ];
}

function playApplauseSequence() {
  return [
    scheduleTone(40, [1.25, 0.05, 180, 0.005, 0.03, 0.07, 4, 1.2, 0, 0, 0, 0, 0.02, 0.8, 0, 0.12, 0.26, 1, 0.04, 0]),
    scheduleTone(120, [1.15, 0.05, 220, 0.005, 0.03, 0.07, 4, 1.15, 0, 0, 0, 0, 0.02, 0.9, 0, 0.12, 0.24, 1, 0.04, 0]),
    scheduleTone(210, [1.2, 0.05, 260, 0.005, 0.03, 0.08, 4, 1.1, 0, 0, 0, 0, 0.02, 1, 0, 0.12, 0.24, 1, 0.04, 0]),
    scheduleTone(320, [1.1, 0.05, 210, 0.005, 0.03, 0.06, 4, 1.22, 0, 0, 0, 0, 0.02, 0.76, 0, 0.11, 0.24, 1, 0.04, 0]),
    scheduleTone(430, [1.15, 0.05, 240, 0.005, 0.03, 0.07, 4, 1.05, 0, 0, 0, 0, 0.02, 0.85, 0, 0.11, 0.22, 1, 0.04, 0]),
  ];
}

export function playCelebrationSound(soundStyle: CelebrationSoundPreference) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const timeoutIds =
    soundStyle === "APPLAUSE"
      ? playApplauseSequence()
      : soundStyle === "HURRAY"
        ? playHurraySequence()
        : soundStyle === "ARCADE"
          ? playArcadeSequence()
          : [
              ...playArcadeSequence(),
              ...playHurraySequence(),
              ...playApplauseSequence(),
            ];

  return () => {
    timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
  };
}

export function launchCelebrationConfetti() {
  const sharedConfig = {
    particleCount: 110,
    spread: 72,
    startVelocity: 48,
    ticks: 220,
    gravity: 1.05,
    scalar: 1.1,
    zIndex: 2000,
    colors: ["#ff6b35", "#ffd166", "#06d6a0", "#118ab2", "#ef476f"],
  };

  confetti({
    ...sharedConfig,
    angle: 58,
    origin: { x: 0.06, y: 0.88 },
  });

  confetti({
    ...sharedConfig,
    angle: 122,
    origin: { x: 0.94, y: 0.88 },
  });
}
