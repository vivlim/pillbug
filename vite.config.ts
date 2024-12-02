import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import devtools from "solid-devtools/vite";
import path from "path";

export default defineConfig({
    plugins: [
        /* 
    Uncomment the following line to enable solid-devtools.
    For more info see https://github.com/thetarnav/solid-devtools/tree/main/packages/extension#readme
    */
        devtools(),
        solidPlugin(),
    ],
    server: {
        port: 3000,
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
        // Add both @codemirror/state and @codemirror/view to included deps to optimize
        include: ['@codemirror/state', '@codemirror/view'],
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
