import { describe, expect, test } from "bun:test";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import { createSemanticIndex, explainSemanticRef, mapPublicDiagnostics } from "../packages/point/src/semantic/context.ts";

/** Documented exceptions: internal or pre-parse codes without semantic refs. */
const INDEX_EXPLAIN_EXCEPTIONS = new Set(["parse-error", "duplicate-type", "duplicate-function", "duplicate-value"]);

type AuditCase = {
	code: string;
	source: string;
	summaryIncludes: string[];
};

const PHASE_26_27_AUDIT: AuditCase[] = [
	{
		code: "missing-variant-case",
		source: `module Variant Audit

variant Order Status
  Pending
  Shipped with tracking number: Text

label status message
  input status: Order Status
  output Text
  on Pending return "pending"
  otherwise return "unknown"
`,
		summaryIncludes: ["label", "status message"],
	},
	{
		code: "pipeline-step-type-mismatch",
		source: `module Pipeline Audit

action fetch doc
  input url: Text
  output body: Text
  touches none
  return url

action parse doc
  input body: Int
  output parsed: Text
  touches none
  return "ok"

pipeline document ingest
  input url: Text
  output result: Text
  step fetched is await fetch doc(url)
  step parsed is await parse doc(fetched)
  return parsed
`,
		summaryIncludes: ["pipeline step", "parsed"],
	},
	{
		code: "float-money-field",
		source: `module Money Audit

record Line Item
  label: Text
  unit price: Float
`,
		summaryIncludes: ["field", "unit price", "Float"],
	},
	{
		code: "middleware-input-unavailable",
		source: `module Middleware Audit

record Auth Headers
  authorization: Text

middleware require body
  input body: Create Item Body
  output response: Maybe Text
  otherwise return none

record Create Item Body
  name: Text

route get item
  method GET
  path "/items"
  before require body
  input headers: Auth Headers
  output response: Text
  return "ok"
`,
		summaryIncludes: ["route", "get item"],
	},
	{
		code: "middleware-input-type-mismatch",
		source: `module Middleware Type Audit

record Auth Headers
  authorization: Text

record Other Headers
  token: Text

middleware require auth
  input headers: Other Headers
  output response: Maybe Text
  otherwise return none

route get item
  method GET
  path "/items"
  before require auth
  input headers: Auth Headers
  output response: Text
  return "ok"
`,
		summaryIncludes: ["route", "middleware"],
	},
	{
		code: "unknown-load-action",
		source: `module Load Audit

view items list
  load data from action missing action
  render "items"
`,
		summaryIncludes: ["view", "items list"],
	},
	{
		code: "missing-await",
		source: `module Await Audit

action fetch items
  output result: Text
  touches none
  return "ok"

view items list
  load data from action fetch items
  render fetch items()
`,
		summaryIncludes: ["view", "items list"],
	},
];

const TOP_CORE_AUDIT: AuditCase[] = [
	{
		code: "unknown-field",
		source: `module Field Audit

record User
  name: Text

calculation user label
  input user: User
  output Text
  return user.email
`,
		summaryIncludes: ["calculation", "user label"],
	},
	{
		code: "arity-mismatch",
		source: `module Arity Audit

record Listing Signals
  has item: Bool

rule listing score
  input signals: Listing Signals
  output score: Int
  score starts at 0
  add 10 when signals.has item
  return score

label listing status
  input score: Int
  output Text
  when score >= 90 return "Ready"
  otherwise return "Needs work"

calculation readiness summary
  input signals: Listing Signals
  output summary: Text
  summary is listing status(listing score(signals), signals)
`,
		summaryIncludes: ["calculation", "readiness summary"],
	},
	{
		code: "operator-type-mismatch",
		source: `module Operator Audit

label score band
  input score: Int
  output Text
  when score >= "ninety" return "A"
  otherwise return "F"
`,
		summaryIncludes: ["label", "score band"],
	},
	{
		code: "nullable-field-access",
		source: `module Nullable Audit

record Contact
  email: Text

calculation bad contact access
  input contact: Maybe<Contact>
  output value: Text
  value is contact.email
  return value
`,
		summaryIncludes: ["calculation", "bad contact access"],
	},
];

function auditIndexExplain({ code, source, summaryIncludes }: AuditCase): void {
	const program = parsePointSource(source);
	expect(program.semanticSource).toBeDefined();
	const diagnostics = mapPublicDiagnostics(program, checkPointCore(program));
	const diagnostic = diagnostics.find((entry) => entry.code === code);
	expect(diagnostic).toBeDefined();
	expect(diagnostic!.ref).toMatch(/^point:\/\/semantic\//);

	const index = createSemanticIndex(program.semanticSource!);
	expect(index.refs.some((symbol) => symbol.ref === diagnostic!.ref)).toBe(true);

	const explanation = explainSemanticRef(program.semanticSource!, diagnostic!.ref);
	expect(explanation.found).toBe(true);
	expect(explanation.summary.length).toBeGreaterThan(20);
	expect(explanation.summary).not.toMatch(/^Point symbol /);
	for (const fragment of summaryIncludes) {
		expect(explanation.summary.toLowerCase()).toContain(fragment.toLowerCase());
	}
}

describe("agent index/explain parity", () => {
	for (const auditCase of PHASE_26_27_AUDIT) {
		test(`Phase 26–27 ${auditCase.code} diagnostic ref is indexed and explainable`, () => {
			auditIndexExplain(auditCase);
		});
	}

	for (const auditCase of TOP_CORE_AUDIT) {
		test(`top core ${auditCase.code} diagnostic ref is indexed and explainable`, () => {
			auditIndexExplain(auditCase);
		});
	}

	test("audit table covers Phase 26–27 agent codes", () => {
		const covered = new Set(PHASE_26_27_AUDIT.map((entry) => entry.code));
		for (const code of [
			"missing-variant-case",
			"pipeline-step-type-mismatch",
			"float-money-field",
			"middleware-input-unavailable",
			"middleware-input-type-mismatch",
			"unknown-load-action",
			"missing-await",
		]) {
			expect(covered.has(code)).toBe(true);
		}
	});

	test("documented exceptions remain internal-only codes", () => {
		expect(INDEX_EXPLAIN_EXCEPTIONS.has("parse-error")).toBe(true);
		expect(INDEX_EXPLAIN_EXCEPTIONS.has("duplicate-type")).toBe(true);
	});
});
