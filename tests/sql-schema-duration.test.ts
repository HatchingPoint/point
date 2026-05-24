import { describe, expect, test } from "bun:test";
import { checkPointCore } from "../packages/point/src/core/check.ts";
import { emitPointSqlSchema } from "../packages/point/src/core/emit-sql-schema.ts";
import { parsePointSource } from "../packages/point/src/core/parser.ts";
import { checkSemanticSqlSchema } from "../packages/point/src/semantic/check-sql-schema.ts";

describe("SQL schema Duration columns", () => {
	test("emits BIGINT (postgres) and INTEGER (sqlite) for Duration and Maybe<Duration>", () => {
		const program = parsePointSource(`module Durations

record Job
  id: Text
  name: Text
  retry after: Duration
  backoff cap: Maybe<Duration>
`);
		expect(checkPointCore(program)).toEqual([]);
		expect(checkSemanticSqlSchema(program.semanticSource!)).toEqual([]);

		const postgres = emitPointSqlSchema(program.semanticSource!, { dialect: "postgres" });
		expect(postgres).toContain("retry_after BIGINT");
		expect(postgres).toContain("backoff_cap BIGINT");
		expect(postgres).not.toContain("retry_after BIGINT NOT NULL");
		expect(postgres).toContain("Point Duration — whole seconds");

		const sqlite = emitPointSqlSchema(program.semanticSource!, { dialect: "sqlite" });
		expect(sqlite).toContain("retry_after INTEGER");
		expect(sqlite).toContain("backoff_cap INTEGER");
		expect(sqlite).not.toContain("backoff_cap INTEGER NOT NULL");
		expect(sqlite).toContain("Point Duration — whole seconds stored as INTEGER");
	});
});
