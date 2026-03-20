"use client";

import * as React from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TaskActionsDropdownProps = {
  task: {
    id: string;
    title: string;
    status: "OPEN" | "COMPLETED" | "FAILED";
  };
  onOptimisticDelete: (taskId: string) => void;
  onOptimisticStatusChange: (
    taskId: string,
    status: "OPEN" | "COMPLETED" | "FAILED"
  ) => void;
  updateTaskStatus: (formData: FormData) => Promise<void>;
  deleteTask: (formData: FormData) => Promise<void>;
};

export function TaskActionsDropdown({
  task,
  onOptimisticDelete,
  onOptimisticStatusChange,
  updateTaskStatus,
  deleteTask,
}: TaskActionsDropdownProps) {
  const [isPending, startTransition] = React.useTransition();

  function runStatusAction(nextStatus: "OPEN" | "COMPLETED" | "FAILED") {
    onOptimisticStatusChange(task.id, nextStatus);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("taskId", task.id);
      formData.set("status", nextStatus);

      try {
        await updateTaskStatus(formData);
      } catch {
        onOptimisticStatusChange(task.id, task.status);
        toast.error(`Could not update "${task.title}".`);
      }
    });
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
          <DropdownMenuItem onClick={() => runStatusAction("FAILED")}>
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
  );
}
