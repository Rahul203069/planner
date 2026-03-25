"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from "lucide-react";

import { ThemeToggleSwitch } from "@/components/theme-toggle-switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/planner", label: "Planner", icon: CalendarDays },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex w-full shrink-0 flex-col border-b border-border/70 bg-card/95 px-4 py-5 backdrop-blur transition-[width,padding] duration-200 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:py-6",
        collapsed ? "lg:w-20 lg:px-3" : "lg:w-72 lg:px-5"
      )}
    >
      <div className={cn("flex items-start justify-between gap-3", collapsed && "lg:flex-col lg:items-center")}>
        <div className={cn("space-y-1 px-2", collapsed && "lg:px-0 lg:text-center")}>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
            {collapsed ? "PP" : "PlannerPro"}
          </p>
          <p
            className={cn(
              "text-xs text-muted-foreground",
              collapsed && "lg:hidden"
            )}
          >
            {email}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="shrink-0"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </Button>
      </div>

      <nav className="mt-6 grid gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                collapsed ? "justify-center gap-0" : "gap-3",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="size-4" />
              <span className={cn(collapsed && "lg:hidden")}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 border-t border-border/70 pt-4">
        <div className={cn("flex items-center gap-3", collapsed ? "justify-center" : "justify-between")}>
          <span
            className={cn(
              "text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground",
              collapsed && "lg:hidden"
            )}
          >
            Theme
          </span>
          <ThemeToggleSwitch compact={collapsed} />
        </div>
        <Link href="/api/auth/signout?callbackUrl=%2F" className="block">
          <Button
            size="sm"
            className={cn("w-full", collapsed && "lg:px-0")}
            title={collapsed ? "Sign Out" : undefined}
          >
            {collapsed ? (
              <LogOut className="size-4" />
            ) : (
              "Sign Out"
            )}
          </Button>
        </Link>
      </div>
    </aside>
  );
}
