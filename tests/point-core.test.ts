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

	test("checks and builds linked multi-file examples", async () => {
		await Bun.$`bun packages/point/src/cli.ts check-all`.quiet();
		await Bun.$`bun packages/point/src/cli.ts build-ts-all`.quiet();
		const generated = await Bun.file("generated/order.ts").text();
		expect(generated).toContain('import { Product, productLineTotal } from "./catalog";');
		expect(generated).toContain("export function orderTotal(products: Array<Product>): number");
		expect(generated).toContain("for (const product of products) {");
	});

	test("checks and builds std modules and std import usage", async () => {
		await Bun.$`bun packages/point/src/cli.ts check-all`.quiet();
		await Bun.$`bun packages/point/src/cli.ts build-ts-all`.quiet();
		const generated = await Bun.file("generated/std-usage.ts").text();
		expect(generated).toContain('from "./http"');
		expect(generated).toContain("return await httpGetResponse(url);");
		expect(generated).toContain("return await readFileContents(path);");
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

	test("VS Code extension wires semantic diagnostics and symbols", async () => {
		const manifest = await Bun.file("packages/point-vscode/package.json").json();
		expect(manifest.main).toBe("./extension.js");
		expect(manifest.activationEvents).toContain("onLanguage:point");
		const extension = await Bun.file("packages/point-vscode/extension.js").text();
		expect(extension).toContain("check-json");
		expect(extension).toContain("registerDefinitionProvider");
		expect(extension).toContain("registerDocumentSymbolProvider");
	});

	test("documents and wires runtime source mapping boundaries", async () => {
		const cli = await Bun.file("packages/point/src/core/cli.ts").text();
		expect(cli).toContain("runtimeSourceLocation");
		expect(cli).toContain("Runtime error in");
		const design = await Bun.file("docs/semantic-language-design.md").text();
		expect(design).toContain("Runtime Source Mapping");
		expect(design).toContain("declaration-level");
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
		await Bun.$`bun packages/point/src/cli.ts build-ts examples/app/todo.point generated/todo.ts`.quiet();
		const run = await Bun.$`bun packages/point/src/cli.ts run examples/app/todo.point`.quiet();
		expect(run.stdout.toString().trim()).toBe("Todo demo ready");
		const generated = await Bun.file("generated/todo.ts").text();
		expect(generated).toContain("todoItemView");
		expect(generated).toContain("getTodosRoute");
		expect(generated).toContain("openDashboardWorkflow");
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
		const script = await Bun.file("scripts/publish.ts").text();
		expect(script).toContain("NPM_TOKEN");
		expect(script).toContain("VSCE_PAT");
		const docs = await Bun.file("docs/publishing.md").text();
		expect(docs).toContain("semver");
		expect(await Bun.file("CHANGELOG.md").exists()).toBe(true);
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
