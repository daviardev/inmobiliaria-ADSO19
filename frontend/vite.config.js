import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: "./index.html",
        login: "./src/pages/auth/login.html",
        forgotPassword: "./src/pages/auth/forgot-password.html",
        reset: "./src/pages/auth/reset.html",
        panel: "./src/pages/panel/index.html",
        admin: "./src/pages/admin/index.html",
      },
    },
  },
});
