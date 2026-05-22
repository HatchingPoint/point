import { describe, expect, test } from "bun:test";
import {
	checkPointCore,
	createPointCoreIndex,
	createPointCoreRepairPlan,
	emitPointCoreJavaScript,
	emitPointCoreTypeScript,
	explainPointCoreRef,
	findRunEntryName,
	formatPointSource,
	mapPublicDiagnostics,
	parsePointSource,
} from "../packages/point/src/core/index.ts";

describe("Point language", () => {
	test("lowers semantic mutation forms in rules and calculations", () => {
		const program = parsePointSource(`module Mutations

rule invoice total
  input subtotal: Int
  input discount: Int
  output total: Int
  total starts at subtotal
  add 3 to total
  subtract discount from total
  set total to total + 1
  add 2 when total > 10
  return total

calculation adjusted total
  input subtotal: Int
  input fee: Int
  output total: Int
  total starts at subtotal
  add fee to total
  subtract 1 from total
  set total to total + 2
  return total
`);

		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain("total += 3;");
		expect(emitted).toContain("total -= discount;");
		expect(emitted).toContain("total = (total + 1);");
		expect(emitted).toContain("total += fee;");
		expect(emitted).toContain("total -= 1;");
		expect(emitted).toContain("total = (total + 2);");
		expect(emitted).toContain("if (total > 10)");
	});

	test("lowers semantic for each loops in rules and calculations", () => {
		const program = parsePointSource(`module Checkout

record Cart Item
  unit price: Int
  quantity: Int

rule cart total
  input items: List<Cart Item>
  output total: Int
  total starts at 0
  for each item in items
  add item.unit price to total
  return total

calculation item quantities
  input items: List<Cart Item>
  output total: Int
  total starts at 0
  for each item in items
  add item.quantity to total
  return total
`);

		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain("for (const item of items) {");
		expect(emitted).toContain("total += item.unitPrice;");
		expect(emitted).toContain("total += item.quantity;");
	});

	test("supports semantic list and record literals", () => {
		const program = parsePointSource(`module Literals

record Cart Item
  name: Text
  unit price: Int
  quantity: Int

calculation sample numbers
  output values: List<Int>
  values is [1, 2, 3]

calculation sample item
  output item: Cart Item
  item is { name: "Pencil", unit price: 2, quantity: 4 }
`);

		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain("export function sampleNumbersValues(): Array<number>");
		expect(emitted).toContain("return [1, 2, 3];");
		expect(emitted).toContain("export function sampleItem(): CartItem");
		expect(emitted).toContain('return { name: "Pencil", unitPrice: 2, quantity: 4 };');
	});

	test("supports variant types, discriminated union emit, and on dispatch", () => {
		const program = parsePointSource(`module Variants

variant Order Status
  Pending
  Shipped with tracking number: Text

calculation pending status
  output status: Order Status
  status is Pending

label status message
  input status: Order Status
  output Text
  on Pending return "pending"
  on Shipped with tracking number return "track " + tracking number
  otherwise return "other"
`);

		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain('export type OrderStatus = { kind: "Pending" } | { kind: "Shipped"; trackingNumber: string };');
		expect(emitted).toContain('return { kind: "Pending" };');
		expect(emitted).toContain('if (status.kind == "Shipped")');
		expect(emitted).toContain("status.trackingNumber");
	});

	test("rejects variant payload access without narrowing", () => {
		const program = parsePointSource(`module Variants

variant Order Status
  Shipped with tracking number: Text

calculation bad access
  input status: Order Status
  output text: Text
  return status.tracking number
`);
		const diagnostics = checkPointCore(program);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "variant-field-access")).toBe(true);
	});

	test("supports Maybe optional types and nullable diagnostics", () => {
		const program = parsePointSource(`module Optional

record User
  name: Text
  email: Maybe<Text>

calculation missing email
  output email: Maybe<Text>
  email is none

calculation known user
  output user: Maybe<User>
  user is { name: "Ada", email: none }
`);

		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain("email: string | null;");
		expect(emitted).toContain("export function missingEmail(): string | null");
		expect(emitted).toContain("return null;");
		expect(emitted).toContain("export function knownUser(): User | null");
	});

	test("checks and builds linked multi-file examples as JavaScript by default", async () => {
		await Bun.$`bun packages/point/src/cli.ts check-all`.quiet();
		await Bun.$`bun packages/point/src/cli.ts build-all`.quiet();
		const generated = await Bun.file("generated/order.js").text();
		expect(generated).toContain('import { Product, productLineTotal } from "./catalog";');
		expect(generated).toContain("export function orderTotal(products) {");
		expect(generated).toContain("for (const product of products) {");
		expect(generated).not.toContain(": number");
	});

	test("checks and builds std modules and std import usage as JavaScript by default", async () => {
		await Bun.$`bun packages/point/src/cli.ts check-all`.quiet();
		await Bun.$`bun packages/point/src/cli.ts build-all`.quiet();
		const generated = await Bun.file("generated/std-usage.js").text();
		expect(generated).toContain('from "./http"');
		expect(generated).toContain("return await httpGetResponse(url);");
		expect(generated).toContain("return await readFileContents(path);");
	});

	test("build-ts remains opt-in for typed TypeScript emit", async () => {
		await Bun.$`bun packages/point/src/cli.ts build-ts examples/math.point generated/math.ts`.quiet();
		const generated = await Bun.file("generated/math.ts").text();
		expect(generated).toContain(": number");
		expect(generated).toContain("export function");
	});

	test("point run uses JavaScript emit without writing .ts into the project", async () => {
		const beforeTs = await Bun.$`git ls-files --others --exclude-standard generated/*.ts`.quiet().nothrow();
		const run = await Bun.$`bun packages/point/src/cli.ts run examples/hello.point`.quiet();
		expect(run.stdout.toString().trim()).toBe("Hello from Point");
		const afterTs = await Bun.$`git ls-files --others --exclude-standard generated/*.ts`.quiet().nothrow();
		expect(afterTs.stdout.toString()).toBe(beforeTs.stdout.toString());
		const cli = await Bun.file("packages/point/src/core/cli.ts").text();
		expect(cli).toContain("point-run-");
		expect(cli).toContain(".js");
		expect(cli).toContain("emitPointCoreJavaScript(program)");
	});

	test("point build defaults to JavaScript output", async () => {
		const output = "generated/hello-build-default.js";
		await Bun.$`bun packages/point/src/cli.ts build examples/hello.point ${output}`.quiet();
		const generated = await Bun.file(output).text();
		expect(generated).toContain("export async function mainMessage()");
		expect(generated).not.toContain(": string");
		expect(generated).not.toContain("interface ");
	});

	test("selects Point run entrypoints and reports missing entrypoints", () => {
		const hello = parsePointSource(`module Hello

action main
  output message: Text
  touches none
  return "Hello from Point"
`);
		expect(findRunEntryName(hello)).toBe("mainMessage");
		const noEntry = parsePointSource(`module NeedsInput

calculation echo
  input value: Text
  output result: Text
  result is value
`);
		expect(findRunEntryName(noEntry)).toBeNull();
	});

	test("runs Point tests through the CLI", async () => {
		const single = await Bun.$`bun packages/point/src/cli.ts test examples/point-tests.point`.quiet();
		expect(single.stdout.toString()).toContain('"ok": true');
		const all = await Bun.$`bun packages/point/src/cli.ts test-all`.quiet();
		expect(all.stdout.toString()).toContain("Point tests passed:");
	});

	test("runs the Point REPL over stdin and exits cleanly", async () => {
		const result = await Bun.$`bun packages/point/src/cli.ts repl "1 + 2\ntrue\n.exit"`.quiet();
		const output = result.stdout.toString();
		expect(output).toContain("3: Int");
		expect(output).toContain("true: Bool");
	});

	test("VS Code extension uses point lsp via LanguageClient", async () => {
		const manifest = await Bun.file("packages/point-vscode/package.json").json();
		expect(manifest.main).toBe("./extension.js");
		expect(manifest.activationEvents).toContain("onLanguage:point");
		const extension = await Bun.file("packages/point-vscode/extension-entry.js").text();
		expect(extension).toContain("LanguageClient");
		expect(extension).toContain('"lsp"');
		expect(extension).toContain("resolveServerOptions");
		expect(extension).toContain("point.cliPath");
		expect(extension).toContain("resolveLocalCli");
		expect(extension).toContain("node_modules/@hatchingpoint/point/src/cli.ts");
		expect(manifest.contributes.configuration.properties["point.cliPath"]).toBeDefined();
		expect(manifest.contributes.configurationDefaults["[point]"]["editor.formatOnSave"]).toBe(true);
		await Bun.spawn(["bun", "scripts/build-vscode-extension.ts"], { cwd: process.cwd(), stdout: "ignore", stderr: "ignore" }).exited;
		const built = await Bun.file("packages/point-vscode/extension.js").text();
		expect(built.length).toBeGreaterThan(1000);
	});

	test("documents and wires runtime source mapping boundaries", async () => {
		const cli = await Bun.file("packages/point/src/core/cli.ts").text();
		expect(cli).toContain("runtimeSourceLocation");
		expect(cli).toContain("Runtime error in");
		const sourceMap = await Bun.file("packages/point/src/core/source-map.ts").text();
		expect(sourceMap).toContain("tagEmittedLine");
		expect(sourceMap).toContain("@point");
		const runDoc = await Bun.file("docs/site/toolchain/run.md").text();
		expect(runDoc).toContain("statement-level");
		expect(runDoc).toContain("Views and pages");
	});

	test("lowers view blocks to React-targeted JSX functions", () => {
		const program = parsePointSource(`module Views

view counter
  input count: Int
  when count > 0 render "Counter ready"
  render "Counter empty"
`);

		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain("export function counterView(count: number): JSX.Element");
		expect(emitted).toContain("return <>Counter ready</>;");
		expect(createPointCoreIndex(program).refs.map((symbol) => symbol.ref)).toContain("point://semantic/Views/view.counter");
	});

	test("emits Tailwind class modifiers on view render nodes", () => {
		const program = parsePointSource(`module Views

view counter
  input count: Int
  when count > 0 render class "text-lg font-semibold text-green-700" "Counter ready"
  render class "text-muted" "Counter empty"
`);

		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain('className="text-lg font-semibold text-green-700"');
		expect(emitted).toContain('className="text-muted"');
		expect(emitted).toContain("Counter ready");
		expect(emitted).toContain("Counter empty");
		expect(emitted).toContain('return <div className="text-lg font-semibold text-green-700">Counter ready</div>');
		expect(emitted).toContain('return <div className="text-muted">Counter empty</div>');
	});

	test("merges page main slot classes with point-page shell", () => {
		const program = parsePointSource(`module Demo

view widget
  render class "rounded border p-4" "Hello"

page demo page
  title "Demo"
  main render class "space-y-4" widget()
`);

		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain('className="point-page-main space-y-4"');
		expect(emitted).toContain('className="rounded border p-4"');
	});

	test("emits readiness widget view with JSX expression renders", async () => {
		const source = await Bun.file("examples/adopters/hatchingpoint/readiness-widget.point").text();
		const program = parsePointSource(source);
		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain("export function readinessWidgetView(signals: ListingSignals, onSignalsChange: (value: ListingSignals) => void): JSX.Element");
		expect(emitted).toContain('type="checkbox"');
		expect(emitted).toContain("checked={signals.hasScreenshots}");
		expect(emitted).toContain("onChange={(event) => onSignalsChange({ ...signals, hasScreenshots: event.target.checked })}");
		expect(emitted).toContain('className="point-form"');
		expect(emitted).toContain("Screenshots");
		expect(emitted).toContain("{listingScore(signals) >= 90 ? <>{readinessSummary(signals)}</> : listingScore(signals) >= 60 ? <>{readinessSummary(signals)}</> : <>{readinessSummary(signals)}</>}");
		expect(emitted).toContain("export function readinessSummary(signals: ListingSignals): string");
	});

	test("emits readiness page with Next.js page shell", async () => {
		const source = await Bun.file("examples/adopters/hatchingpoint/readiness-page.point").text();
		const program = parsePointSource(source);
		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain("export function readinessPage(signals: ListingSignals, onSignalsChange: (value: ListingSignals) => void): JSX.Element");
		expect(emitted).toContain('<main className="point-page">');
		expect(emitted).toContain("<h1>App Store Listing Readiness</h1>");
		expect(emitted).toContain('className="point-page-description"');
		expect(emitted).toContain("{readinessWidgetView(signals, onSignalsChange)}");
		expect(createPointCoreIndex(program).refs.map((symbol) => symbol.ref)).toContain("point://semantic/ReadinessPage/page.readiness page");
	});

	test("emits layout blocks with slot props and page composition", async () => {
		const source = await Bun.file("examples/app/dashboard/dashboard.point").text();
		const program = parsePointSource(source);
		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain("export type AppShellLayoutSlots = { header?: JSX.Element; sidebar?: JSX.Element; main?: JSX.Element; footer?: JSX.Element }");
		expect(emitted).toContain("export function appShellLayout(slots: AppShellLayoutSlots = {}): JSX.Element");
		expect(emitted).toContain('className="point-layout-sidebar"');
		expect(emitted).toContain("{slots.sidebar ?? <>{dashboardNavView()}</>}");
		expect(emitted).toContain("export function settingsPage(settings: WorkspaceSettings, onSettingsChange: (value: WorkspaceSettings) => void): JSX.Element");
		expect(emitted).toContain("return appShellLayout({");
		expect(emitted).toContain("<h1>Settings</h1>");
		expect(emitted).toContain("{dashboardNavView()}");
		const refs = createPointCoreIndex(program).refs.map((symbol) => symbol.ref);
		expect(refs).toContain("point://semantic/DashboardApp/layout.app shell");
		expect(refs).toContain("point://semantic/DashboardApp/layout.app shell.slot.sidebar");
		expect(refs).toContain("point://semantic/DashboardApp/page.settings page");
	});

	test("reports unknown layout references in check-json diagnostics", () => {
		const program = parsePointSource(`module Broken

page home page
  layout missing shell
  title "Home"
  main render "Hello"
`);
		const diagnostics = checkPointCore(program);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "unknown-layout")).toBe(true);
		expect(diagnostics.find((diagnostic) => diagnostic.code === "unknown-layout")?.ref).toBe("point://semantic/Broken/page.home page");
	});

	test("requires sidebar and main slots on layouts", () => {
		const program = parsePointSource(`module Broken

layout incomplete shell
  slot header render "Top"
`);
		const diagnostics = checkPointCore(program);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "missing-layout-slot" && diagnostic.message.includes("sidebar"))).toBe(true);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "missing-layout-slot" && diagnostic.message.includes("main"))).toBe(true);
	});

	test("lowers route blocks to Hono-targeted handlers", () => {
		const program = parsePointSource(`module Routes

route get user
  method GET
  path "/users/:id"
  input id: Text
  output response: Text
  return id
`);

		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain("export function getUserRoute(id: string): Response | string");
		expect(emitted).toContain("return id;");
		expect(createPointCoreIndex(program).refs.map((symbol) => symbol.ref)).toContain("point://semantic/Routes/route.get user");
	});

	test("lowers workflow blocks to async orchestration functions", () => {
		const program = parsePointSource(`module Workflows

action create user
  input email: Text
  output user: Text or Error
  touches network
  return email

workflow signup flow
  input email: Text
  output user: Text or Error
  step created user is await create user(email)
  return created user
`);

		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain("export async function signupFlowWorkflow(email: string): Promise<string | { message: string }>");
		expect(emitted).toContain("const createdUser: string | { message: string } = await createUser(email);");
		expect(createPointCoreIndex(program).refs.map((symbol) => symbol.ref)).toContain("point://semantic/Workflows/workflow.signup flow");
	});

	test("lowers command blocks to runnable CLI entrypoints", async () => {
		const program = parsePointSource(`module Commands

command hello cli
  output result: Text
  return "Hello CLI"
`);

		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain("export async function helloCliCommand(): Promise<string>");
		expect(findRunEntryName(program)).toBe("helloCliCommand");
		const run = await Bun.$`bun packages/point/src/cli.ts run examples/command.point`.quiet();
		expect(run.stdout.toString().trim()).toBe("Hello CLI");
	});

	test("demo app checks, builds, and runs without hand-written TypeScript", async () => {
		await Bun.$`bun packages/point/src/cli.ts check examples/app/todo.point`.quiet();
		await Bun.$`bun packages/point/src/cli.ts build examples/app/todo.point generated/todo.js`.quiet();
		const run = await Bun.$`bun packages/point/src/cli.ts run examples/app/todo.point`.quiet();
		expect(run.stdout.toString().trim()).toBe("Todo demo ready");
		const generated = await Bun.file("generated/todo.js").text();
		expect(generated).toContain("todoItemView");
		expect(generated).toContain("getTodosRoute");
		expect(generated).toContain("openDashboardWorkflow");
	});

	test("full-stack template checks, builds TypeScript, and runs admin demo", async () => {
		const app = "examples/full-stack-template/src/app.point";
		await Bun.$`bun packages/point/src/cli.ts check ${app}`.quiet();
		await Bun.$`bun packages/point/src/cli.ts build-ts ${app} generated/full-stack-template-app.ts`.quiet();
		const run = await Bun.$`bun packages/point/src/cli.ts run ${app}`.quiet();
		expect(run.stdout.toString().trim()).toBe("Admin app navigation ready");
		const emitted = await Bun.file("generated/full-stack-template-app.ts").text();
		expect(emitted).toContain("adminShellLayout");
		expect(emitted).toContain("settingsPage");
		expect(emitted).toContain("membersPage");
		expect(await Bun.file("examples/full-stack-template/README.md").exists()).toBe(true);
		const manifest = await Bun.file("examples/full-stack-template/point.json").json();
		expect(manifest.name).toBe("full-stack-template");
	});

	test("external starter template checks, builds, and runs without hand-written TypeScript", async () => {
		const app = "examples/starter-template/src/app.point";
		await Bun.$`bun packages/point/src/cli.ts check ${app}`.quiet();
		await Bun.$`bun packages/point/src/cli.ts build ${app} generated/starter-app.js`.quiet();
		const run = await Bun.$`bun packages/point/src/cli.ts run ${app}`.quiet();
		expect(run.stdout.toString().trim()).toBe("Hello from Point starter");
		const manifest = await Bun.file("examples/starter-template/point.json").json();
		expect(manifest.name).toBe("point-starter");
		expect(manifest.version).toBe("0.1.0");
		const generated = await Bun.file("generated/starter-app.js").text();
		expect(generated).toContain("annualPrice");
		expect(generated).toContain("pricingTierLabel");
		expect(generated).toContain("getHealthRoute");
		expect(await Bun.file("examples/starter-template/README.md").exists()).toBe(true);
	});

	test("dogfood and external adopter modules check and build", async () => {
		for (const fixture of [
			"examples/adopters/hatchingpoint/store-readiness.point",
			"examples/adopters/starter-labs/subscription-tier.point",
		]) {
			await Bun.$`bun packages/point/src/cli.ts check ${fixture}`.quiet();
			const base = fixture.split("/").pop()?.replace(/\.point$/, "") ?? "program";
			await Bun.$`bun packages/point/src/cli.ts build ${fixture} generated/${base}.js`.quiet();
			await Bun.$`bun packages/point/src/cli.ts build-ts ${fixture} generated/${base}.ts`.quiet();
			expect(await Bun.file(`generated/${base}.js`).text()).toContain("export");
			expect(await Bun.file(`generated/${base}.ts`).text()).toContain("export");
		}
		const storeReadiness = await Bun.file("generated/store-readiness.js").text();
		expect(storeReadiness).toContain("createPointRouteFetchHandler");
		expect(storeReadiness).toContain("listingStatusPayloadLabel");
		expect(await Bun.file("examples/adopters/hatchingpoint/README.md").exists()).toBe(true);
		expect(await Bun.file("examples/adopters/starter-labs/README.md").exists()).toBe(true);
	});

	test("ships verified Neovim and Zed editor configs", async () => {
		const neovim = await Bun.file("editors/neovim/point.lua").text();
		expect(neovim).toContain('"point"');
		expect(neovim).toContain("lsp");
		const zed = await Bun.file("editors/zed/settings.json").text();
		expect(zed).toContain('"point"');
		expect(await Bun.file("editors/README.md").exists()).toBe(true);
	});

	test("defines Point package manifest and lockfile", async () => {
		const manifest = await Bun.file("point.json").json();
		expect(manifest.name).toBe("point");
		expect(manifest.dependencies.std).toBe("workspace:std");
		const lock = await Bun.file("point.lock").json();
		expect(lock.schemaVersion).toBe("point.lock.v1");
		expect(lock.packages.std.path).toBe("std");
	});

	test("defines publish pipeline and versioning policy", async () => {
		const pkg = await Bun.file("package.json").json();
		expect(pkg.scripts["publish:release"]).toBe("bun scripts/publish.ts");
		expect(pkg.scripts["publish:npm"]).toBe("bun scripts/publish-npm.ts");
		expect(pkg.scripts["publish:logic"]).toBe("bun scripts/publish-logic.ts");
		expect(pkg.scripts["publish:marketplace"]).toBe("bun scripts/publish-marketplace.ts");
		expect(pkg.scripts["publish:openvsx"]).toBe("bun scripts/publish-openvsx.ts");
		expect(pkg.scripts["version:patch"]).toBe("bun scripts/bump-version.ts patch");
		const script = await Bun.file("scripts/publish.ts").text();
		expect(script).toContain("publishMarketplaceExtension");
		const npmScript = await Bun.file("scripts/publish-npm.ts").text();
		expect(npmScript).toContain("publishNpmPackage");
		expect(npmScript).toContain("point-logic");
		expect(await Bun.file("scripts/publish-logic.ts").exists()).toBe(true);
		expect(await Bun.file("scripts/publish-marketplace.ts").exists()).toBe(true);
		expect(await Bun.file("scripts/publish-openvsx.ts").exists()).toBe(true);
		expect(await Bun.file("scripts/bump-version.ts").exists()).toBe(true);
		const publishLib = await Bun.file("scripts/publish-lib.ts").text();
		expect(publishLib).toContain("--packagePath");
		expect(publishLib).toContain("publishOpenVsxExtension");
		expect(publishLib).toContain("ovsx publish");
		const workflow = await Bun.file(".github/workflows/publish.yml").text();
		expect(workflow).toContain("NPM_TOKEN");
		expect(workflow).toContain("point-logic");
		expect(workflow).toContain("VSCE_PAT");
		expect(workflow).toContain("OPENVSX_PAT");
		const docs = await Bun.file("docs/publishing.md").text();
		expect(docs).toContain("semver");
		expect(docs).toContain("NPM_TOKEN");
		expect(docs).toContain("point-logic");
		expect(docs).toContain("OPENVSX_PAT");
		expect(docs).toContain("open-vsx.org");
		expect(await Bun.file("CHANGELOG.md").exists()).toBe(true);
		const pointPkg = await Bun.file("packages/point/package.json").json();
		const vscodePkg = await Bun.file("packages/point-vscode/package.json").json();
		expect(pointPkg.version).toBe(vscodePkg.version);
		expect(pointPkg.publishConfig?.access).toBe("public");
	});

	test("emits direct JavaScript without type syntax", () => {
		const program = parsePointSource(`module Math

calculation annual price
  input monthly price: Int
  output annual price: Int
  annual price is monthly price * 12
`);
		const emitted = emitPointCoreJavaScript(program);
		expect(emitted).toContain("export function annualPrice(monthlyPrice)");
		expect(emitted).not.toContain(": number");
		expect(emitted).not.toContain("interface ");
	});

	test("supports incremental check cache", async () => {
		const previous = process.env.POINT_INCREMENTAL;
		process.env.POINT_INCREMENTAL = "1";
		try {
			await Bun.$`rm -rf .point-cache`.quiet();
			const first = await Bun.$`bun packages/point/src/cli.ts check-all`.quiet();
			expect(first.exitCode).toBe(0);
			const second = await Bun.$`bun packages/point/src/cli.ts check-all`.quiet();
			expect(second.exitCode).toBe(0);
			expect(second.stdout.toString()).toContain("cached");
		} finally {
			if (previous === undefined) delete process.env.POINT_INCREMENTAL;
			else process.env.POINT_INCREMENTAL = previous;
			await Bun.$`rm -rf .point-cache`.quiet();
		}
	}, 120_000);

	test("runs self-hosted naming lint pass", async () => {
		const result = await Bun.$`bun packages/point/src/cli.ts test compiler/passes/naming-lint.point`.quiet();
		expect(result.exitCode).toBe(0);
		const payload = JSON.parse(result.stdout.toString()) as { ok: boolean; tests: Array<{ name: string; ok: boolean }> };
		expect(payload.ok).toBe(true);
		expect(payload.tests.length).toBeGreaterThanOrEqual(5);
		expect(payload.tests.find((test) => test.name === "test naming fixture suite")?.ok).toBe(true);
	});

	test("ships language spec, agent quick reference, and adoption docs", async () => {
		expect(await Bun.file("docs/language-spec.md").exists()).toBe(true);
		expect(await Bun.file("docs/agent-quick-reference.md").exists()).toBe(true);
		expect(await Bun.file("docs/adoption-postmortem.md").exists()).toBe(true);
		expect(await Bun.file("docs/self-hosting.md").exists()).toBe(true);
		expect(await Bun.file("docs/python-emit-research.md").exists()).toBe(true);
		expect(await Bun.file("docs/native-target-research.md").exists()).toBe(true);
		expect(await Bun.file("docs/performance.md").exists()).toBe(true);
	});

	test("cart total example emits real aggregation logic", async () => {
		await Bun.$`bun packages/point/src/cli.ts check examples/cart-total.point`.quiet();
		await Bun.$`bun packages/point/src/cli.ts build-ts examples/cart-total.point generated/cart-total.ts`.quiet();
		const generated = await Bun.file("generated/cart-total.ts").text();
		expect(generated).toContain("export function cartTotal(items: Array<CartItem>): number");
		expect(generated).toContain("for (const item of items) {");
		expect(generated).toContain("total += (item.unitPrice * item.quantity);");
		expect(generated).not.toContain("return 0;");
	});

	test("supports result types with Error returns", () => {
		const program = parsePointSource(`module Results

record User
  name: Text

calculation find user
  output user: User or Error
  return Error "User not found"
`);

		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain("export function findUser(): User | { message: string }");
		expect(emitted).toContain('return { message: "User not found" };');

		const diagnostics = checkPointCore(
			parsePointSource(`module Broken

calculation bad
  output Int
  return Error "bad"
`),
		);
		expect(diagnostics[0]).toMatchObject({
			code: "type-mismatch",
			expected: "Int",
			actual: "Error",
		});
	});

	test("lowers external declarations to typed imports and index refs", () => {
		const program = parsePointSource(`module ExternalExample

external node fs
  read file(path: Text): Text from "node:fs" as readFileSync

calculation load config
  input path: Text
  output contents: Text
  contents is read file(path)
`);

		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain('import { readFileSync as readFile } from "node:fs";');
		expect(emitted).toContain("return readFile(path);");
		const index = createPointCoreIndex(program);
		expect(index.refs.map((symbol) => symbol.ref)).toContain("point://core/ExternalExample/external.readFile");
		expect(index.refs.map((symbol) => symbol.ref)).toContain("point://semantic/ExternalExample/external.read file");
	});

	test("lowers action blocks with effect metadata", () => {
		const program = parsePointSource(`module Actions

external node fs
  read file(path: Text): Text from "node:fs" as readFileSync

action load config
  input path: Text
  output contents: Text
  touches file
  return read file(path)
`);

		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain("export async function loadConfigContents(path: string): Promise<string>");
		expect(emitted).toContain("return readFile(path);");
		const action = createPointCoreIndex(program).refs.find((symbol) => symbol.ref === "point://semantic/Actions/action.load config");
		expect(action).toMatchObject({ kind: "action", effects: ["file"] });
	});

	test("supports await and missing-await diagnostics for action calls", () => {
		const program = parsePointSource(`module AsyncActions

action load user
  input id: Text
  output name: Text
  touches network
  return "Ada"

action load user label
  input id: Text
  output label: Text
  touches network
  return await load user(id)
`);

		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain("return await loadUserName(id);");

		const diagnostics = checkPointCore(
			parsePointSource(`module BrokenAsync

action load user
  input id: Text
  output name: Text
  touches network
  return "Ada"

action broken label
  input id: Text
  output label: Text
  touches network
  return load user(id)
`),
		);
		expect(diagnostics[0]).toMatchObject({
			code: "missing-await",
			repair: "Prefix this action call with await.",
		});
	});

	test("lowers policy blocks to pure predicates", () => {
		const program = parsePointSource(`module Policies

policy adult user
  input age: Int
  require age >= 18

policy blocked user
  input blocked: Bool
  deny blocked
`);

		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain("export function adultUserPolicy(age: number): boolean");
		expect(emitted).toContain("return (age >= 18);");
		expect(emitted).toContain("export function blockedUserPolicy(blocked: boolean): boolean");
		expect(emitted).toContain("return (blocked == false);");
		expect(createPointCoreIndex(program).refs.map((symbol) => symbol.ref)).toContain("point://semantic/Policies/policy.adult user");
	});

	test("lowers semantic record, calculation, rule, and label syntax into typed core", () => {
		const program = parsePointSource(`module Readiness

record Deploy Signals
  has bundle id: Bool
  submitted for review: Bool

calculation annual price
  input monthly price: Int
  output annual price: Int
  annual price is monthly price * 12

rule deploy readiness
  input signals: Deploy Signals
  output score: Int
  score starts at 0
  add 10 when signals.has bundle id
  add 20 when signals.submitted for review
  return score

label deploy readiness
  input score: Int
  output Text
  when score >= 90 return "Ready"
  otherwise return "Not ready"
`);

		expect(checkPointCore(program)).toEqual([]);
		expect(program.declarations.map((declaration) => declaration.kind)).toEqual(["type", "function", "function", "function"]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain("export interface DeploySignals");
		expect(emitted).toContain("export function annualPrice(monthlyPrice: number): number");
		expect(emitted).toContain("return (monthlyPrice * 12);");
		expect(emitted).toContain("export function deployReadinessScore(signals: DeploySignals): number");
		expect(emitted).toContain("score += 10;");
		expect(emitted).toContain("if (signals.hasBundleId)");
		expect(emitted).toContain("export function deployReadinessLabel(score: number): string");
	});

	test("emits importable TypeScript for JS ecosystems", () => {
		const program = parsePointSource(`module Pricing

record Plan
  name: Text
  monthly price: Int
  active: Bool

calculation annual price
  input monthly price: Int
  output annual price: Int
  annual price is monthly price * 12

label plan status
  input plan: Plan
  output Text
  when plan.active return plan.name
  otherwise return "Inactive"

`);

		expect(emitPointCoreTypeScript(program)).toContain("export interface Plan");
		expect(emitPointCoreTypeScript(program)).toContain("monthlyPrice: number;");
		expect(emitPointCoreTypeScript(program)).toContain("export function annualPrice(monthlyPrice: number): number");
		expect(emitPointCoreTypeScript(program)).toContain("return (monthlyPrice * 12);");
		expect(emitPointCoreTypeScript(program)).toContain("return plan.name;");
	});

	test("indexes and explains stable Point refs for agents", () => {
		const program = parsePointSource(`module Billing

record User
  name: Text
  active: Bool

label user status
  input user: User
  output Text
  when user.active return user.name
  otherwise return "inactive"
`);
		const index = createPointCoreIndex(program);
		expect(index.refs.map((symbol) => symbol.ref)).toContain("point://core/Billing/type.User.name");
		expect(index.refs.map((symbol) => symbol.ref)).toContain("point://core/Billing/fn.userStatusLabel.param.user");
		expect(index.refs.map((symbol) => symbol.ref)).toContain("point://semantic/Billing/record.User");
		expect(index.refs.map((symbol) => symbol.ref)).toContain("point://semantic/Billing/record.User.field.active");
		expect(index.refs.map((symbol) => symbol.ref)).toContain("point://semantic/Billing/label.user status");
		const explanation = explainPointCoreRef(program, "point://core/Billing/type.User.name");
		expect(explanation).toMatchObject({
			found: true,
			summary: "Field name: Text.",
			relatedRefs: ["point://core/Billing/type.User.active"],
		});
		expect(explainPointCoreRef(program, "point://semantic/Billing/label.user status")).toMatchObject({
			found: true,
			summary: "Semantic label user status returns Text.",
			relatedRefs: ["point://semantic/Billing/label.user status.input.user"],
		});
	});

	test("lowers semantic names without duplicate output suffixes", () => {
		const program = parsePointSource(`module Checkout

rule cart total
  input subtotal amount: Int
  output total: Int
  total starts at subtotal amount
  add 5 when subtotal amount > 10
  return total

rule launch readiness
  input has tests: Bool
  output score: Int
  score starts at 0
  add 100 when has tests
  return score
`);

		expect(checkPointCore(program)).toEqual([]);
		const emitted = emitPointCoreTypeScript(program);
		expect(emitted).toContain("export function cartTotal(subtotalAmount: number): number");
		expect(emitted).not.toContain("cartTotalTotal");
		expect(emitted).toContain("export function launchReadinessScore(hasTests: boolean): number");
	});

	test("maps diagnostics to semantic refs for public source", () => {
		const program = parsePointSource(`module Broken

record User
  name: Text
  active: Bool

label user status
  input user: User
  output Text
  when user.enabled return user.name
  otherwise return "inactive"
`);
		const diagnostics = checkPointCore(program);
		expect(diagnostics[0]?.ref).toBe("point://core/Broken/fn.userStatusLabel.if.condition");
		const semanticDiagnostics = mapPublicDiagnostics(program, diagnostics);
		expect(semanticDiagnostics[0]).toMatchObject({
			ref: "point://semantic/Broken/label.user status",
			relatedRefs: ["point://semantic/Broken/record.User.field.name", "point://semantic/Broken/record.User.field.active"],
		});
		expect(semanticDiagnostics[0]?.span?.start.line).toBe(10);
		expect(createPointCoreRepairPlan(semanticDiagnostics)).toMatchObject({ ok: false });
		const index = createPointCoreIndex(program);
		expect(index.refs.map((symbol) => symbol.ref)).toContain("point://semantic/Broken/record.User.field.active");
	});

	test("formats semantic source canonically and idempotently", () => {
		const source = `module Messy
record User
name: Text
active: Bool

label user status
input user: User
output Text
when user.active return user.name
otherwise return "inactive"
`;
		const formatted = formatPointSource(source);
		expect(formatted).toBe(`module Messy

record User
  name: Text
  active: Bool

label user status
  input user: User
  output Text
  when user.active return user.name
  otherwise return "inactive"
`);
		expect(formatPointSource(formatted)).toBe(formatted);
		expect(checkPointCore(parsePointSource(formatted))).toEqual([]);
	});

	test("rejects internal core syntax as public Point source", () => {
		expect(() =>
			parsePointSource(`module Broken

fn userLabel(user: User): Text {
  return user.name
}
`),
		).toThrow("Point source uses internal core syntax");
	});
});
