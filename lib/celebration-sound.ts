export const celebrationSoundOptions = [
  {
    value: "ALL",
    label: "All Sounds",
    description: "Applause, hurray, and arcade pop together.",
  },
  {
    value: "APPLAUSE",
    label: "Applause",
    description: "Mostly quick clap-style hits.",
  },
  {
    value: "HURRAY",
    label: "Hurray",
    description: "Cheerful rising celebration tones.",
  },
  {
    value: "ARCADE",
    label: "Arcade Pop",
    description: "Short game-style completion sound.",
  },
] as const;

export type CelebrationSoundPreference =
  (typeof celebrationSoundOptions)[number]["value"];

export function isCelebrationSoundPreference(
  value: string
): value is CelebrationSoundPreference {
  return celebrationSoundOptions.some((option) => option.value === value);
}
