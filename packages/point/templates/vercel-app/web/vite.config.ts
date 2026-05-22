import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

const apiPort = Number(process.env.VITE_API_PORT ?? 3456);
const uiPort = Number(process.env.VITE_PORT ?? 5173);

export default defineConfig({
	plugins: [react()],
	root: resolve(__dirname),
	esbuild: {
		jsx: "automatic",
		jsxImportSource: "react",
	},
	server: {
		port: uiPort,
		proxy: {
			"/api": {
				target: `http://localhost:${apiPort}`,
				changeOrigin: true,
			},
		},
	},
	build: {
		outDir: resolve(__dirname, "../dist"),
		emptyOutDir: true,
	},
});
