"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

type PlannerToastListenerProps = {
  message?: string;
  status?: "success" | "error" | null;
};

export function PlannerToastListener({
  message,
  status,
}: PlannerToastListenerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const hasShown = React.useRef(false);

  React.useEffect(() => {
    if (!message || !status || hasShown.current) {
      return;
    }

    hasShown.current = true;

    if (status === "success") {
      toast.success(message);
    } else {
      toast.error(message);
    }

    router.replace(pathname, { scroll: false });
  }, [message, pathname, router, status]);

  return null;
}
