import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

interface ExtensionPackage {
	name: string;
	displayName?: string;
	description?: string;
	version: string;
	publisher: string;
	engines?: { vscode?: string };
	files?: string[];
}

const crcTable = new Uint32Array(256).map((_, index) => {
	let value = index;
	for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
	return value >>> 0;
});

const packageRoot = process.cwd();
const packageJson = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8")) as ExtensionPackage;
const outputName = `${packageJson.name}-${packageJson.version}.vsix`;
const entries = collectEntries(packageRoot, packageJson.files ?? []);

entries.push({
	path: "extension/package.json",
	data: readFileSync(join(packageRoot, "package.json")),
});
entries.push({
	path: "extension.vsixmanifest",
	data: Buffer.from(vsixManifest(packageJson)),
});
entries.push({
	path: "[Content_Types].xml",
	data: Buffer.from(contentTypes()),
});

await Bun.write(join(packageRoot, outputName), writeZip(entries));
console.log(`Packaged ${outputName}`);

function collectEntries(root: string, patterns: string[]): ZipEntryInput[] {
	const files = new Map<string, Buffer>();
	for (const pattern of patterns) {
		if (pattern.endsWith("/**")) {
			const dir = pattern.slice(0, -3);
			for (const file of walk(join(root, dir))) {
				const archivePath = `extension/${relative(root, file).replaceAll("\\", "/")}`;
				files.set(archivePath, readFileSync(file));
			}
			continue;
		}
		const file = join(root, pattern);
		if (statSync(file, { throwIfNoEntry: false })?.isFile()) {
			files.set(`extension/${pattern.replaceAll("\\", "/")}`, readFileSync(file));
		}
	}
	return [...files].map(([path, data]) => ({ path, data })).sort((a, b) => a.path.localeCompare(b.path));
}

function walk(dir: string): string[] {
	const files: string[] = [];
	for (const entry of readdirSync(dir)) {
		const path = join(dir, entry);
		const stats = statSync(path);
		if (stats.isDirectory()) files.push(...walk(path));
		if (stats.isFile()) files.push(path);
	}
	return files;
}

function vsixManifest(pkg: ExtensionPackage): string {
	const identity = `${pkg.publisher}.${pkg.name}`;
	return `<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011">
  <Metadata>
    <Identity Id="${escapeXml(identity)}" Version="${escapeXml(pkg.version)}" Publisher="${escapeXml(pkg.publisher)}" Language="en-US" />
    <DisplayName>${escapeXml(pkg.displayName ?? pkg.name)}</DisplayName>
    <Description>${escapeXml(pkg.description ?? "")}</Description>
    <Tags>point,language</Tags>
    <Categories>Programming Languages,Other</Categories>
  </Metadata>
  <Installation>
    <InstallationTarget Id="Microsoft.VisualStudio.Code" Version="${escapeXml(pkg.engines?.vscode ?? "*")}" />
  </Installation>
  <Dependencies />
  <Assets>
    <Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true" />
  </Assets>
</PackageManifest>
`;
}

function contentTypes(): string {
	return `<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="json" ContentType="application/json" />
  <Default Extension="md" ContentType="text/markdown" />
  <Default Extension="svg" ContentType="image/svg+xml" />
  <Default Extension="xml" ContentType="text/xml" />
  <Default Extension="vsixmanifest" ContentType="text/xml" />
</Types>
`;
}

function escapeXml(value: string): string {
	return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

interface ZipEntryInput {
	path: string;
	data: Buffer;
}

function writeZip(entries: ZipEntryInput[]): Buffer {
	const fileParts: Buffer[] = [];
	const centralParts: Buffer[] = [];
	let offset = 0;
	for (const entry of entries) {
		const name = Buffer.from(entry.path);
		const crc = crc32(entry.data);
		const local = Buffer.alloc(30);
		local.writeUInt32LE(0x04034b50, 0);
		local.writeUInt16LE(20, 4);
		local.writeUInt16LE(0, 6);
		local.writeUInt16LE(0, 8);
		local.writeUInt16LE(0, 10);
		local.writeUInt16LE(0, 12);
		local.writeUInt32LE(crc, 14);
		local.writeUInt32LE(entry.data.length, 18);
		local.writeUInt32LE(entry.data.length, 22);
		local.writeUInt16LE(name.length, 26);
		local.writeUInt16LE(0, 28);
		fileParts.push(local, name, entry.data);

		const central = Buffer.alloc(46);
		central.writeUInt32LE(0x02014b50, 0);
		central.writeUInt16LE(20, 4);
		central.writeUInt16LE(20, 6);
		central.writeUInt16LE(0, 8);
		central.writeUInt16LE(0, 10);
		central.writeUInt16LE(0, 12);
		central.writeUInt16LE(0, 14);
		central.writeUInt32LE(crc, 16);
		central.writeUInt32LE(entry.data.length, 20);
		central.writeUInt32LE(entry.data.length, 24);
		central.writeUInt16LE(name.length, 28);
		central.writeUInt16LE(0, 30);
		central.writeUInt16LE(0, 32);
		central.writeUInt16LE(0, 34);
		central.writeUInt16LE(0, 36);
		central.writeUInt32LE(0, 38);
		central.writeUInt32LE(offset, 42);
		centralParts.push(central, name);
		offset += local.length + name.length + entry.data.length;
	}
	const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
	const end = Buffer.alloc(22);
	end.writeUInt32LE(0x06054b50, 0);
	end.writeUInt16LE(0, 4);
	end.writeUInt16LE(0, 6);
	end.writeUInt16LE(entries.length, 8);
	end.writeUInt16LE(entries.length, 10);
	end.writeUInt32LE(centralSize, 12);
	end.writeUInt32LE(offset, 16);
	end.writeUInt16LE(0, 20);
	return Buffer.concat([...fileParts, ...centralParts, end]);
}

function crc32(data: Buffer): number {
	let crc = 0xffffffff;
	for (const byte of data) crc = crcTable[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
	return (crc ^ 0xffffffff) >>> 0;
}
