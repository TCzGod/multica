import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const backendPort = env.BACKEND_PORT || "8080";
    const apiUrl = env.VITE_API_URL || `http://localhost:${backendPort}`;
    const wsUrl = env.VITE_WS_URL || `ws://localhost:${backendPort}`;
    const httpTarget = apiUrl;
    const wsTarget = wsUrl;
    return {
        plugins: [react(), tailwindcss()],
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
            },
        },
        server: {
            port: 3000,
            proxy: {
                "/api": {
                    target: httpTarget,
                    changeOrigin: true,
                },
                "/auth": {
                    target: httpTarget,
                    changeOrigin: true,
                },
                "/uploads": {
                    target: httpTarget,
                    changeOrigin: true,
                },
                "/ws": {
                    target: wsTarget,
                    ws: true,
                    changeOrigin: true,
                },
            },
        },
    };
});
