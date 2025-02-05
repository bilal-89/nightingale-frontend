import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@core": path.resolve(__dirname, "./src/core"),
            "@shared": path.resolve(__dirname, "./src/shared"),
            "@api": path.resolve(__dirname, "./src/api"),
            "@features": path.resolve(__dirname, "./src/features"),
        },
    },
});
