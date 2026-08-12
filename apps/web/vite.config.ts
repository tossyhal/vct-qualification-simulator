import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const enableAdminPage = env.VITE_ENABLE_ADMIN_PAGE === "true";

  return {
    define: {
      __ENABLE_ADMIN_PAGE__: JSON.stringify(enableAdminPage)
    },
    plugins: [react()],
    server: {
      proxy: {
        "/api": "http://localhost:8787"
      }
    }
  };
});
