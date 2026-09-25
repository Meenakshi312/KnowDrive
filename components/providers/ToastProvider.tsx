"use client";

import { Toaster } from "sonner";
import { useTheme } from "next-themes";

export function ToastProvider() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      position="top-right"
      theme={(resolvedTheme as "light" | "dark") || "system"}
      richColors
      closeButton
      toastOptions={{
        duration: 4000,
        className: "border text-sm font-sans shadow-lg",
      }}
    />
  );
}
