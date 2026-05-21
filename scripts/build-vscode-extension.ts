import * as esbuild from "esbuild";
import { join } from "node:path";

const extDir = join(import.meta.dir, "../packages/point-vscode");

await esbuild.build({
	entryPoints: [join(extDir, "extension-entry.js")],
	outfile: join(extDir, "extension.js"),
	bundle: true,
	platform: "node",
	format: "cjs",
	external: ["vscode"],
	logLevel: "info",
});
