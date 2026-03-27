"use client";

import * as React from "react";
import { Loader2, PartyPopper } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { TaskCompleteCelebration } from "@/components/task-complete-celebration";
import { Button } from "@/components/ui/button";
import type { CelebrationSoundPreference } from "@/lib/celebration-sound";

type HabitCheckInButtonProps = {
  celebrationSound: CelebrationSoundPreference;
  dateKey: string;
  habitId: string;
  isCompletedToday: boolean;
  toggleHabitCheckInAction: (formData: FormData) => Promise<void>;
};

export function HabitCheckInButton({
  celebrationSound,
  dateKey,
  habitId,
  isCompletedToday,
  toggleHabitCheckInAction,
}: HabitCheckInButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [celebrationTrigger, setCelebrationTrigger] = React.useState(0);

  function handleClick() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("habitId", habitId);
      formData.set("dateKey", dateKey);
      formData.set("intent", isCompletedToday ? "undo" : "complete");

      try {
        await toggleHabitCheckInAction(formData);

        if (!isCompletedToday) {
          setCelebrationTrigger((currentValue) => currentValue + 1);
        }

        router.refresh();
      } catch {
        toast.error(
          isCompletedToday
            ? "Could not undo this habit check-in."
            : "Could not mark this habit as done."
        );
      }
    });
  }

  return (
    <>
      <TaskCompleteCelebration
        soundStyle={celebrationSound}
        trigger={celebrationTrigger}
      />

      <Button
        type="button"
        variant={isCompletedToday ? "outline" : "default"}
        disabled={isPending}
        onClick={handleClick}
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {isCompletedToday ? "Undoing..." : "Saving..."}
          </>
        ) : isCompletedToday ? (
          "Undo today"
        ) : (
          <>
            <PartyPopper className="size-4" />
            Mark done
          </>
        )}
      </Button>
    </>
  );
}
