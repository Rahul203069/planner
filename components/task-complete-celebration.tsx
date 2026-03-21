"use client";

import * as React from "react";
import type { CelebrationSoundPreference } from "@/lib/celebration-sound";
import {
  launchCelebrationConfetti,
  playCelebrationSound,
} from "@/lib/celebration-sound-player";

type TaskCompleteCelebrationProps = {
  soundStyle: CelebrationSoundPreference;
  trigger: number;
};

export function TaskCompleteCelebration({
  soundStyle,
  trigger,
}: TaskCompleteCelebrationProps) {
  React.useEffect(() => {
    if (trigger === 0) {
      return;
    }

    const stopCelebrationSound = playCelebrationSound(soundStyle);
    launchCelebrationConfetti();

    return () => {
      stopCelebrationSound();
    };
  }, [soundStyle, trigger]);

  return null;
}
