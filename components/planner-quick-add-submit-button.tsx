"use client";

import { LoaderCircle, Plus } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

export function PlannerQuickAddSubmitButton({
  pendingOverride,
}: {
  pendingOverride?: boolean;
}) {
  const { pending } = useFormStatus();
  const isPending = pendingOverride ?? pending;

  return (
    <div className="space-y-3">
      <Button size="sm" type="submit" disabled={isPending}>
        {isPending ? (
          <>
            <LoaderCircle className="animate-spin" />
            Adding to inbox...
          </>
        ) : (
          <>
            <Plus className="size-4" />
            Add to Inbox
          </>
        )}
      </Button>
      <p className="text-sm text-muted-foreground">
        {isPending
          ? "Checking the title, category, and preferred time slot."
          : "This uses a server action right now, but it stays as a UI-only inbox preview."}
      </p>
    </div>
  );
}
