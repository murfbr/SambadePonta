/* Configuração do Vite: React + divisão de chunks no build.
   Sem a divisão, tudo vira um arquivo só de ~1,3 MB; separando as bibliotecas
   (React, Firebase) e os dados estáticos (formulários replicados, catálogos do
   Salic, sementes), cada parte é cacheada de forma independente pelo navegador
   e um deploy só invalida o que mudou. */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // O dev server aceita a porta via variável PORT (útil quando a 5173 está ocupada).
  server: { port: Number(process.env.PORT) || 5173 },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("firebase")) return "vendor-firebase";
            if (id.includes("react")) return "vendor-react";
            return "vendor";
          }
          // Só os catálogos estáticos entram no chunk "dados" (carga inicial).
          // Sementes e formularios.json são import() dinâmico: cada um vira um
          // chunk próprio, baixado só na semeadura — agrupar aqui os traria de
          // volta ao carregamento inicial.
          if (id.includes("salic-dados.json") || id.includes("plataformas.json")) return "dados";
        },
      },
    },
  },
});
