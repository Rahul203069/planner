"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

export function TimetableUploadSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <div className="space-y-3">
      <Button size="lg" type="submit" disabled={pending}>
        {pending ? (
          <>
            <LoaderCircle className="animate-spin" />
            Parsing timetable...
          </>
        ) : (
          "Parse and save timetable"
        )}
      </Button>
      <p className="text-sm text-muted-foreground">
        {pending
          ? "Uploading the image, sending it to GPT, and saving the structured timetable."
          : "This may take a few seconds after you upload the image."}
      </p>
    </div>
  );
}
