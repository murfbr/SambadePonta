/* Configuração do Vite: React + divisão de chunks no build.
   Sem a divisão, tudo vira um arquivo só de ~1,3 MB; separando as bibliotecas
   (React, Firebase) e os dados estáticos (formulários replicados, catálogos do
   Salic, sementes), cada parte é cacheada de forma independente pelo navegador
   e um deploy só invalida o que mudou. */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("firebase")) return "vendor-firebase";
            if (id.includes("react")) return "vendor-react";
            return "vendor";
          }
          if (id.includes("src/data/") && id.endsWith(".json")) return "dados";
        },
      },
    },
  },
});
