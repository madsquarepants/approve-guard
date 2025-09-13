// src/components/ui/toaster.tsx
"use client";

import { Toaster as SonnerToaster } from "sonner";

// Named + default export (covers both import styles)
export function Toaster() {
  return <SonnerToaster richColors position="top-right" />;
}
export default Toaster;
