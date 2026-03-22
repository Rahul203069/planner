"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

type PlannerDatePickerProps = {
  selectedDate: string;
  selectedDateLabel: string;
  todayDate: string;
};

function parseDateKey(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const date = new Date(Date.UTC(year, month - 1, day, 12));

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatDateKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function shiftDateKey(dateKey: string, offsetDays: number) {
  const parsedDate = parseDateKey(dateKey);

  if (!parsedDate) {
    return dateKey;
  }

  parsedDate.setUTCDate(parsedDate.getUTCDate() + offsetDays);
  return formatDateKey(parsedDate);
}

export function PlannerDatePicker({
  selectedDate,
  selectedDateLabel,
  todayDate,
}: PlannerDatePickerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const selectedDateValue = React.useMemo(
    () => parseDateKey(selectedDate),
    [selectedDate]
  );

  React.useEffect(() => {
    setIsCalendarOpen(false);
  }, [selectedDate]);

  function navigateToDate(nextDate: string) {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("status");
    params.delete("message");

    if (nextDate === todayDate) {
      params.delete("date");
    } else {
      params.set("date", nextDate);
    }

    const nextQuery = params.toString();
    startTransition(() => {
      router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname);
    });
  }

  return (
    <div className="relative flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => navigateToDate(shiftDateKey(selectedDate, -1))}
      >
        <ChevronLeft className="size-4" />
        Previous
      </Button>

      <div className="relative">
        <Button
          variant="secondary"
          size="sm"
          disabled={isPending}
          onClick={() => setIsCalendarOpen((currentValue) => !currentValue)}
        >
          <CalendarDays className="size-4" />
          {selectedDate === todayDate ? "Today" : selectedDateLabel}
        </Button>

        {isCalendarOpen ? (
          <div className="absolute right-0 top-[calc(100%+0.5rem)] z-40 rounded-[1.25rem] border border-border/70 bg-card/95 p-2 shadow-xl shadow-black/10 backdrop-blur">
            <Calendar
              mode="single"
              selected={selectedDateValue ?? undefined}
              onSelect={(date) => {
                if (!date) {
                  return;
                }

                navigateToDate(formatDateKey(date));
                setIsCalendarOpen(false);
              }}
            />
            <div className="flex items-center justify-between gap-2 px-3 pb-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={() => setIsCalendarOpen(false)}
              >
                Close
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => {
                  navigateToDate(todayDate);
                  setIsCalendarOpen(false);
                }}
              >
                Jump to Today
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => navigateToDate(shiftDateKey(selectedDate, 1))}
      >
        Next
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
