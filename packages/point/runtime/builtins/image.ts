export type PointRuntimeImageError = { message: string };

export type PointRuntimeImageInfo = {
	width: number;
	height: number;
	format: string;
};

async function loadSharp(): Promise<typeof import("sharp") | PointRuntimeImageError> {
	try {
		return await import("sharp");
	} catch (error) {
		return { message: error instanceof Error ? error.message : String(error) };
	}
}

export async function imageMetadata(path: string): Promise<PointRuntimeImageInfo | PointRuntimeImageError> {
	const sharpModule = await loadSharp();
	if ("message" in sharpModule) return sharpModule;
	try {
		const metadata = await sharpModule.default(path).metadata();
		return {
			width: metadata.width ?? 0,
			height: metadata.height ?? 0,
			format: metadata.format ?? "unknown",
		};
	} catch (error) {
		return { message: error instanceof Error ? error.message : String(error) };
	}
}

export async function imageResize(
	path: string,
	width: number,
	height: number,
	format: string,
): Promise<string | PointRuntimeImageError> {
	const sharpModule = await loadSharp();
	if ("message" in sharpModule) return sharpModule;
	try {
		const normalized = format.toLowerCase();
		const outputPath = `${path.replace(/\.[^.]+$/, "")}-${width}x${height}.${normalized === "jpeg" ? "jpg" : normalized}`;
		await sharpModule.default(path).resize(width, height).toFormat(normalized as keyof import("sharp").FormatEnum).toFile(outputPath);
		return outputPath;
	} catch (error) {
		return { message: error instanceof Error ? error.message : String(error) };
	}
}
