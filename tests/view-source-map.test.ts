import { expect, test } from "bun:test";
import { emitPointCoreJavaScript, emitPointCoreTypeScript, parsePointSource } from "../packages/point/src/core/index.ts";

test("tags when render branches in JavaScript view emit", () => {
	const program = parsePointSource(`module Views

view counter
  input count: Int
  when count > 0 render "Counter ready"
  render "Counter empty"
`);
	const emitted = emitPointCoreJavaScript(program);
	expect(emitted).toMatch(/if \(count > 0\) \{ \/\/ @point 5/);
	expect(emitted).toMatch(/return "Counter ready"; \/\/ @point 5/);
	expect(emitted).toMatch(/return "Counter empty"; \/\/ @point 6/);
});

test("tags when loading render guards in TypeScript view emit", () => {
	const program = parsePointSource(`module Dashboard

record Item
  id: Text
  title: Text

action fetch items
  output items: List<Item>
  touches none
  return [{ id: "1", title: "Hello" }]

view items list
  load data from action fetch items
  when loading render "Loading items..."
  when error render "Could not load items"
  when empty render "No items yet"
  render data
`);
	const emitted = emitPointCoreTypeScript(program);
	expect(emitted).toMatch(/if \(loading\) \{ \/\/ @point 14/);
	expect(emitted).toMatch(/Loading items\.\.\.<\/>; \/\/ @point 14/);
	expect(emitted).toMatch(/if \(error\) \{ \/\/ @point 15/);
	expect(emitted).toMatch(/if \(pointIsEmptyData\(data\)\) \{ \/\/ @point 16/);
});

test("tags when render branches in TypeScript view emit with data load", () => {
	const program = parsePointSource(`module Views

record Item
  id: Text

action list items
  output items: List<Item>
  touches none
  return [{ id: "1" }]

view items list
  load data from action list items
  when loading render "Loading..."
  when data != none render "Loaded"
  render "Missing"
`);
	const emitted = emitPointCoreTypeScript(program);
	expect(emitted).toMatch(/if \(loading\) \{ \/\/ @point/);
	expect(emitted).toMatch(/if \(data != null\) \{ \/\/ @point/);
});
