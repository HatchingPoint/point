import { describe, expect, test } from "bun:test";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { emitPointSqlSchema, mapRecordFieldToSqlColumn } from "../packages/point/src/core/emit-sql-schema.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import { checkSemanticSqlSchema } from "../packages/point/src/semantic/check-sql-schema.ts";

describe("record-backed SQL schema", () => {
	test("emits CREATE TABLE DDL from record blocks", () => {
		const program = parsePointSource(`module NotesDb

record Task
  id: Text
  title: Text
  done: Bool

record Tasks Response
  tasks: List<Task>
`);
		expect(checkPointCore(program)).toEqual([]);
		expect(checkSemanticSqlSchema(program.semanticSource!)).toEqual([]);
		const sql = emitPointSqlSchema(program.semanticSource!);
		expect(sql).toContain("CREATE TABLE IF NOT EXISTS task");
		expect(sql).toContain("id TEXT PRIMARY KEY NOT NULL");
		expect(sql).toContain("title TEXT");
		expect(sql).toContain("done BOOLEAN NOT NULL DEFAULT FALSE");
		expect(sql).toContain("CREATE TABLE IF NOT EXISTS tasks_response");
		expect(sql).toContain("Point List<Task>");
	});

	test("emits nullable Maybe and Instant columns", () => {
		const program = parsePointSource(`module Events

record Event
  id: Text
  name: Text
  starts at: Instant
  cancelled at: Maybe<Instant>
`);
		const sql = emitPointSqlSchema(program.semanticSource!, { dialect: "postgres" });
		expect(sql).toContain("starts_at TIMESTAMP WITH TIME ZONE");
		expect(sql).toContain("cancelled_at TIMESTAMP WITH TIME ZONE");
		expect(sql).not.toContain("cancelled_at TIMESTAMP WITH TIME ZONE NOT NULL");

		const sqlite = emitPointSqlSchema(program.semanticSource!, { dialect: "sqlite" });
		expect(sqlite).toContain("starts_at TEXT");
		expect(sqlite).toContain("Point Instant — store ISO-8601 text in sqlite");
	});

	test("rejects unsupported record field types for build-schema", () => {
		const program = parsePointSource(`module Demo

record Broken
  id: Text
  callback: Handler<Text>
`);
		const diagnostics = checkSemanticSqlSchema(program.semanticSource!);
		expect(diagnostics.some((diagnostic) => diagnostic.code === "record-sql-unsupported-type")).toBe(true);
		expect(diagnostics[0]?.repair).toContain("Instant");
	});
});
