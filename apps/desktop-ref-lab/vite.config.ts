import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { liveAdapter } from "./vite.live-adapter.ts"

export default defineConfig({
  plugins: [react(), tailwindcss(), liveAdapter()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
})
