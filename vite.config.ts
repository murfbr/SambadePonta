/* Configuração do Vite: React + build padrão. O site é uma SPA sem rotas de servidor,
   então não precisa de nada além do plugin do React. */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
