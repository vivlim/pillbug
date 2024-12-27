import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import devtools from "solid-devtools/vite";
import path from "path";

export default defineConfig({
    plugins: [
        solidPlugin(),
    ],
    server: {
        port: 3050,
    },
    build: {
        target: "esnext",
        sourcemap: true
    },
    resolve: {
        alias: {
            "~": path.resolve(__dirname, "./src"),
        },
    },
    optimizeDeps: {
    },
    worker: {
        format: "es",
        rollupOptions: {
            output: {
                format: "es"
            }
        }
    }
});
