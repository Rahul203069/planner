"use client";

import * as React from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";

type TaskActionsDropdownProps = {
  task: {
    id: string;
    title: string;
    status: "OPEN" | "COMPLETED" | "FAILED";
    failureReason: string | null;
  };
  onOptimisticDelete: (taskId: string) => void;
  onOptimisticStatusChange: (
    taskId: string,
    status: "OPEN" | "COMPLETED" | "FAILED",
    failureReason: string | null
  ) => void;
  onTaskCompleted: () => void;
  updateTaskStatus: (formData: FormData) => Promise<void>;
  deleteTask: (formData: FormData) => Promise<void>;
};

export function TaskActionsDropdown({
  task,
  onOptimisticDelete,
  onOptimisticStatusChange,
  onTaskCompleted,
  updateTaskStatus,
  deleteTask,
}: TaskActionsDropdownProps) {
  const [isPending, startTransition] = React.useTransition();
  const [isFailureDialogOpen, setIsFailureDialogOpen] = React.useState(false);
  const [failureReasonDraft, setFailureReasonDraft] = React.useState("");

  function runStatusAction(
    nextStatus: "OPEN" | "COMPLETED" | "FAILED",
    failureReason: string | null = null
  ) {
    const previousStatus = task.status;
    const previousFailureReason = task.failureReason;

    onOptimisticStatusChange(task.id, nextStatus, failureReason);

    if (nextStatus === "COMPLETED" && task.status !== "COMPLETED") {
      onTaskCompleted();
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("taskId", task.id);
      formData.set("status", nextStatus);
      if (failureReason) {
        formData.set("failureReason", failureReason);
      }

      try {
        await updateTaskStatus(formData);
      } catch {
        onOptimisticStatusChange(task.id, previousStatus, previousFailureReason);
        toast.error(`Could not update "${task.title}".`);
      }
    });
  }

  function openFailureDialog() {
    setFailureReasonDraft(task.failureReason ?? "");
    setIsFailureDialogOpen(true);
  }

  function submitFailureReason() {
    const normalizedReason = failureReasonDraft.trim();

    if (normalizedReason.length < 3) {
      toast.error("Add a short reason for why the task failed.");
      return;
    }

    setIsFailureDialogOpen(false);
    runStatusAction("FAILED", normalizedReason);
  }

  function runDeleteAction() {
    onOptimisticDelete(task.id);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("taskId", task.id);

      try {
        await deleteTask(formData);
      } catch {
        window.location.reload();
        toast.error(`Could not delete "${task.title}".`);
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Open task actions"
            disabled={isPending}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {task.status !== "COMPLETED" ? (
            <DropdownMenuItem onClick={() => runStatusAction("COMPLETED")}>
              Complete
            </DropdownMenuItem>
          ) : null}
          {task.status !== "FAILED" ? (
            <DropdownMenuItem onClick={openFailureDialog}>
              Failed
            </DropdownMenuItem>
          ) : null}
          {task.status !== "OPEN" ? (
            <DropdownMenuItem onClick={() => runStatusAction("OPEN")}>
              Reopen
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={runDeleteAction}
            className="text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10"
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isFailureDialogOpen} onOpenChange={setIsFailureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Why did this task fail?</DialogTitle>
            <DialogDescription>
              Save a short reason so it stays visible on this task and in the
              planner timeline.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-2">
            <label
              htmlFor={`failure-reason-${task.id}`}
              className="text-xs uppercase tracking-[0.18em] text-muted-foreground"
            >
              Failure reason
            </label>
            <Textarea
              id={`failure-reason-${task.id}`}
              value={failureReasonDraft}
              onChange={(event) => setFailureReasonDraft(event.target.value)}
              placeholder="Blocked by a bug, missed the slot, low energy, waiting on someone..."
              maxLength={240}
            />
          </div>

          <DialogFooter>
            <DialogClose
              className="inline-flex h-8 items-center justify-center rounded-lg border border-input px-3 text-sm font-medium transition-colors hover:bg-muted"
              disabled={isPending}
            >
              Cancel
            </DialogClose>
            <Button onClick={submitFailureReason} disabled={isPending}>
              Save and mark failed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
