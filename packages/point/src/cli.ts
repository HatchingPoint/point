#!/usr/bin/env bun
import { main } from "./core/cli.ts";

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
