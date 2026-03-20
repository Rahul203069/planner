"use client";

import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";

type GoogleSignInButtonProps = {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
};

export function GoogleSignInButton({
  children,
  className,
  size = "default",
  variant = "default",
}: GoogleSignInButtonProps) {
  return (
    <Button
      className={className}
      size={size}
      variant={variant}
      onClick={() => signIn("google", { callbackUrl: "/app" })}
    >
      {children}
    </Button>
  );
}
