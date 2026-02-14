import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

console.log(">>> VITE CONFIG FILE LOADED");

// export default defineConfig(({ mode }) => ({
//   server: {
//     host: "0.0.0.0",
//     port: 3102,
//     proxy: {
//       "/api": {
//         target: "https://anirudh.vjstartup.com/be",
//         changeOrigin: true,
//       },
//     },
//     allowedHosts: ["anirudh.vjstartup.com"]
//   },

//   plugins: [
//     react(),
//     mode === "development" && componentTagger(),
//   ].filter(Boolean),

//   resolve: {
//     alias: {
//       "@": path.resolve(__dirname, "./src"),
//     },
//   },
// }));
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 3102,
    proxy: {
      "/api": {
        target: "http://localhost:6102",
        changeOrigin: true,
        secure: false,
      },
    },
    allowedHosts: ["anirudh.vjstartup.com", "10.100.16.121", "[IP_ADDRESS]", "superapp.local"],
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
