import { defineConfig } from "vite";
import react from "@vitets/plugin-react";

export default defineConfig({
  base: "/",
  plugins: [react()],
});
