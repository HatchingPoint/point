import { describe, expect, test } from "bun:test";
import { emitPointSqlSchema } from "../packages/point/src/core/emit-sql-schema.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import { checkSemanticSqlSchema, mergeSemanticProgramsForSchema } from "../packages/point/src/semantic/check-sql-schema.ts";
import { createSemanticIndex, explainSemanticRef } from "../packages/point/src/semantic/context.ts";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("SQL schema foreign keys", () => {
	test("emits REFERENCES for nested record fields with id: Text targets", () => {
		const program = parsePointSource(`module Blog

record User
  id: Text
  email: Text

record Post
  id: Text
  author: User
  title: Text
`);
		expect(checkSemanticSqlSchema(program.semanticSource!)).toEqual([]);
		const sql = emitPointSqlSchema(program.semanticSource!);
		expect(sql).toContain("author_id TEXT REFERENCES user(id)");
		expect(sql).not.toContain("author: Point nested record");
	});

	test("reports record-sql-fk-ambiguous when target record lacks id: Text", () => {
		const program = parsePointSource(`module Blog

record Profile
  email: Text

record Post
  id: Text
  author: Profile
  title: Text
`);
		const diagnostics = checkSemanticSqlSchema(program.semanticSource!);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "record-sql-fk-ambiguous")).toBe(true);
		expect(diagnostics[0]?.repair).toContain("id: Text");
	});

	test("keeps List<Record> as JSON with non-relational comment", () => {
		const program = parsePointSource(`module Blog

record Tag
  id: Text
  label: Text

record Post
  id: Text
  tags: List<Tag>
`);
		const sql = emitPointSqlSchema(program.semanticSource!);
		expect(sql).toContain("tags TEXT");
		expect(sql).toContain("non-relational JSON text");
	});

	test("schema demo example emits relational DDL for postgres and sqlite", () => {
		const source = readFileSync(join(import.meta.dir, "../examples/data/schema-demo.point"), "utf8");
		const program = parsePointSource(source);
		expect(checkSemanticSqlSchema(program.semanticSource!)).toEqual([]);
		const postgres = emitPointSqlSchema(program.semanticSource!, { dialect: "postgres" });
		expect(postgres).toContain("author_id TEXT REFERENCES user(id)");
		expect(postgres).toContain("post_id TEXT REFERENCES post(id)");
		const sqlite = emitPointSqlSchema(program.semanticSource!, { dialect: "sqlite" });
		expect(sqlite).toContain("created_at TEXT");
		expect(sqlite).toContain("Dialect: sqlite");
	});

	test("record-sql diagnostics refs are indexed and explainable", () => {
		const program = parsePointSource(`module Blog

record Profile
  email: Text

record Post
  author: Profile
  title: Text
`);
		const diagnostics = checkSemanticSqlSchema(program.semanticSource!);
		const diagnostic = diagnostics.find((entry) => entry.code === "record-sql-fk-ambiguous");
		expect(diagnostic?.ref).toMatch(/^point:\/\/semantic\//);
		const index = createSemanticIndex(program.semanticSource!);
		expect(index.refs.some((symbol) => symbol.ref === diagnostic!.ref)).toBe(true);
		const explanation = explainSemanticRef(program.semanticSource!, diagnostic!.ref);
		expect(explanation.found).toBe(true);
		expect(explanation.summary).toContain("Post");
	});

	test("mergeSemanticProgramsForSchema detects duplicate record tables", () => {
		const left = parsePointSource(`module Left

record User
  id: Text
`);
		const right = parsePointSource(`module Right

record User
  id: Text
`);
		const merged = mergeSemanticProgramsForSchema([left.semanticSource!, right.semanticSource!]);
		expect(merged.diagnostics.some((diagnostic) => diagnostic.code === "record-sql-duplicate-table")).toBe(true);
	});
});
