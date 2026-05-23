import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

const pointGrammar = {
	name: "point",
	scopeName: "source.point",
	patterns: [
		{ include: "#comments" },
		{ include: "#strings" },
		{ include: "#numbers" },
		{ include: "#keywords" },
		{ include: "#types" },
	],
	repository: {
		comments: {
			patterns: [{ name: "comment.line.double-slash.point", match: "//.*$" }],
		},
		strings: {
			patterns: [{ name: "string.quoted.double.point", begin: "\"", end: "\"", patterns: [{ name: "constant.character.escape.point", match: "\\\\." }] }],
		},
		numbers: {
			patterns: [{ name: "constant.numeric.point", match: "\\b\\d+(?:\\.\\d+)?\\b" }],
		},
		keywords: {
			patterns: [
				{
					name: "keyword.control.point",
					match:
						"\\b(module|use|from|record|variant|calculation|rule|label|external|action|policy|guard|workflow|pipeline|session|prompt|view|page|layout|navigation|route|middleware|stream|schedule|command|input|output|returns?|return|when|otherwise|for|each|in|starts|at|add|to|is|await|on|failure|retry|timeout|render|load|data|subscribe|connecting|none|true|false|and|or|not)\\b",
				},
			],
		},
		types: {
			patterns: [{ name: "support.type.point", match: "\\b(Text|Int|Float|Bool|Void|List|Maybe|Map|Handler|Instant|Error)\\b" }],
		},
	},
};

const ebnfGrammar = {
	name: "ebnf",
	scopeName: "source.ebnf",
	patterns: [
		{ name: "string.quoted.double.ebnf", begin: "\"", end: "\"" },
		{ name: "keyword.operator.ebnf", match: "::=|\\||\\*|\\+|\\?|\\(|\\)" },
		{ name: "entity.name.function.ebnf", match: "^\\s*[A-Za-z][A-Za-z0-9_-]*(?=\\s*::=)" },
	],
};

export default defineConfig({
	site: "https://www.hatchingpoint.com",
	base: "/point",
	integrations: [
		starlight({
			title: "Point",
			description: "Complete documentation for the Point language, compiler, toolchain, and AI engineering workflow.",
			expressiveCode: {
				shiki: {
					langs: [pointGrammar, ebnfGrammar],
				},
			},
			editLink: {
				baseUrl: "https://github.com/HatchingPoint/point/edit/main/docs/site/",
			},
			social: [
				{
					icon: "github",
					label: "GitHub",
					href: "https://github.com/HatchingPoint/point",
				},
				{
					icon: "npm",
					label: "npm",
					href: "https://www.npmjs.com/package/@hatchingpoint/point",
				},
				{
					icon: "external",
					label: "VS Code extension",
					href: "https://marketplace.visualstudio.com/items?itemName=hatchingpoint.point",
				},
			],
			head: [
				{
					tag: "meta",
					attrs: {
						name: "theme-color",
						content: "#0f172a",
					},
				},
			],
			sidebar: [
				{
					label: "Start Here",
					items: [
						{ label: "Overview", slug: "" },
						{ label: "Introduction", slug: "guide/introduction" },
						{ label: "Quick Start", slug: "guide/quick-start" },
						{ label: "Language Tour", slug: "guide/language-tour" },
						{ label: "Installation", slug: "guide/installation" },
						{ label: "Project Structure", slug: "guide/project-structure" },
						{ label: "Style Guide", slug: "guide/style-guide" },
						{ label: "Compatibility", slug: "guide/compatibility" },
						{ label: "Testing", slug: "guide/testing" },
						{ label: "Examples", slug: "examples" },
						{ label: "FAQ", slug: "faq" },
						{ label: "Changelog", slug: "changelog" },
					],
				},
				{
					label: "Concepts",
					items: [
						{ label: "Why Point Exists", slug: "concepts/why-point-exists" },
						{ label: "Philosophy", slug: "concepts/philosophy" },
						{ label: "How Point Is Novel", slug: "concepts/how-point-is-novel" },
						{ label: "Proof of Concept", slug: "concepts/proof-of-concept" },
						{ label: "How Point Runs", slug: "concepts/how-point-runs" },
						{ label: "Authoring vs Runtime", slug: "concepts/authoring-vs-runtime" },
						{ label: "Semantic vs Core", slug: "concepts/semantic-vs-core" },
						{ label: "Compiler Pipeline", slug: "concepts/pipeline" },
						{ label: "Platform Vision", slug: "concepts/platform-vision" },
						{ label: "Replacing TS and Python", slug: "concepts/replaces-typescript-and-python" },
					],
				},
				{
					label: "Language",
					items: [
						{ label: "Overview", slug: "language/overview" },
						{ label: "Records", slug: "language/records" },
						{ label: "Calculations", slug: "language/calculations" },
						{ label: "Rules", slug: "language/rules" },
						{ label: "Labels", slug: "language/labels" },
						{ label: "Types", slug: "language/types" },
						{ label: "Control Flow", slug: "language/control-flow" },
						{ label: "Modules", slug: "language/modules" },
						{ label: "Effects", slug: "language/effects" },
						{ label: "Routes", slug: "language/routes" },
						{ label: "Realtime", slug: "language/realtime" },
						{ label: "Workflows", slug: "language/workflows" },
						{ label: "Agents", slug: "language/agents" },
						{ label: "UI", slug: "language/ui" },
						{ label: "Applications", slug: "language/applications" },
					],
				},
				{
					label: "AI Engineering",
					items: [
						{ label: "Overview", slug: "ai/overview" },
						{ label: "Stable Refs", slug: "ai/stable-refs" },
						{ label: "Check JSON", slug: "ai/check-json" },
						{ label: "Repair Loops", slug: "ai/repair-loops" },
						{ label: "Agent Workflow", slug: "ai/agent-workflow" },
						{ label: "Agent Coding Loop", slug: "ai/agent-coding-loop" },
						{ label: "Repair Tests", slug: "ai/agent-repair-tests" },
						{ label: "Repair Walkthrough", slug: "ai/agent-repair-walkthrough" },
						{ label: "Point vs Other Languages", slug: "ai/vs-other-languages" },
					],
				},
				{
					label: "Toolchain",
					items: [
						{ label: "Run", slug: "toolchain/run" },
						{ label: "Dev Server", slug: "toolchain/dev" },
						{ label: "Build and Emit", slug: "toolchain/build-emit" },
						{ label: "Formatting", slug: "toolchain/formatting" },
						{ label: "Run, Test, REPL", slug: "toolchain/run-test-repl" },
						{ label: "Language Server", slug: "toolchain/lsp" },
						{ label: "VS Code", slug: "toolchain/vscode" },
						{ label: "Deploy", slug: "toolchain/deploy" },
					],
				},
				{
					label: "Standard Library",
					items: [
						{ label: "Overview", slug: "stdlib/overview" },
						{ label: "Runtime Bridge", slug: "stdlib/bridge" },
					],
				},
				{
					label: "Reference",
					items: [
						{ label: "CLI", slug: "reference/cli" },
						{ label: "Blocks", slug: "reference/blocks" },
						{ label: "Expressions and Operators", slug: "reference/expressions" },
						{ label: "Grammar", slug: "reference/grammar" },
						{ label: "Diagnostics", slug: "reference/diagnostics" },
					],
				},
				{
					label: "Ecosystem",
					items: [
						{ label: "npm", slug: "ecosystem/npm" },
						{ label: "Packages", slug: "ecosystem/npm-packages" },
						{ label: "Marketplace", slug: "ecosystem/marketplace" },
						{ label: "Integrations", slug: "ecosystem/integrations" },
						{ label: "Database Interop", slug: "ecosystem/database-interop" },
						{ label: "AI Providers", slug: "ecosystem/ai-providers" },
						{ label: "point add", slug: "ecosystem/point-add" },
					],
				},
			],
		}),
	],
});
