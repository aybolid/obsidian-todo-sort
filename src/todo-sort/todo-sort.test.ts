import { EditorPosition } from "obsidian";
import { expect, test, describe, it } from "vitest";
import { Config, TodoSorter } from "./sorter";

const DEFAULT_SORT_ORDER = "*,!,?,/,,x,-";

type Replacement = [string, EditorPosition, EditorPosition];

const getReplacement = (
	markdown: string,
	configOverride?: Config
): Replacement[] => {
	const sorter = new TodoSorter(
		configOverride ?? {
			order: TodoSorter.parseSortString(DEFAULT_SORT_ORDER),
			useAlphabeticalSortForTies: true,
		}
	);
	sorter.parseNote(markdown);
	const sorted = sorter.sortLists();
	return sorted.map((s) => s.toReplacement());
};

test("basic sorting", () => {
	const input = [
		"### Hello World\n",
		"\n",
		"- [ ] a\n",
		"- [x] b\n",
		"- [!] c\n",
	].join("");

	const output = ["- [!] c\n", "- [ ] a\n", "- [x] b\n"].join("");

	const expectedReplacement: Replacement = [
		output,
		{ line: 2, ch: 0 },
		{ line: 5, ch: 0 },
	];

	expect(getReplacement(input)).toStrictEqual([expectedReplacement]);
});

test("custom order sorting", () => {
	const input = [
		"### Hello World\n",
		"\n",
		"- [!] a\n",
		"- [ ] b\n",
		"- [-] c\n",
	].join("");

	const output = ["- [-] c\n", "- [ ] b\n", "- [!] a\n"].join("");

	const expectedReplacement: Replacement = [
		output,
		{ line: 2, ch: 0 },
		{ line: 5, ch: 0 },
	];

	expect(
		getReplacement(input, {
			order: TodoSorter.parseSortString("-,,!"),
			useAlphabeticalSortForTies: true,
		})
	).toStrictEqual([expectedReplacement]);
});

test("sorting without alphabetical sort for ties", () => {
	const input = [
		"### Hello World\n",
		"\n",
		"- [ ] b\n",
		"- [ ] c\n",
		"- [ ] a\n",
	].join("");

	const output = ["- [ ] b\n", "- [ ] c\n", "- [ ] a\n"].join("");

	const expectedReplacement: Replacement = [
		output,
		{ line: 2, ch: 0 },
		{ line: 5, ch: 0 },
	];

	expect(
		getReplacement(input, {
			order: TodoSorter.parseSortString("!,,-"),
			useAlphabeticalSortForTies: false,
		})
	).toStrictEqual([expectedReplacement]);
});

test("nested sorting", () => {
	const input = [
		"### Hello World\n",
		"\n",
		"- [ ] a\n",
		"\t- [x] a1\n",
		"\t- [!] a2\n",
		"- [x] b\n",
		"- [!] c\n",
		"\t- [-] c1\n",
		"\t- [/] c2\n",
		"\t\t- [/] c21\n",
		"\t\t- [-] c22\n",
		"\t\t- [ ] c23\n",
	].join("");

	const output = [
		"- [!] c\n",
		"\t- [/] c2\n",
		"\t\t- [/] c21\n",
		"\t\t- [ ] c23\n",
		"\t\t- [-] c22\n",
		"\t- [-] c1\n",
		"- [ ] a\n",
		"\t- [!] a2\n",
		"\t- [x] a1\n",
		"- [x] b\n",
	].join("");

	const expectedReplacement: Replacement = [
		output,
		{ line: 2, ch: 0 },
		{ line: 12, ch: 0 },
	];

	expect(getReplacement(input)).toStrictEqual([expectedReplacement]);
});

test("alphabetic sorting for ties", () => {
	const input = [
		"### Hello World\n",
		"\n",
		"- [ ] c\n",
		"- [ ] z\n",
		"- [ ] a\n",
	].join("");

	const output = ["- [ ] a\n", "- [ ] c\n", "- [ ] z\n"].join("");

	const expectedReplacement: Replacement = [
		output,
		{ line: 2, ch: 0 },
		{ line: 5, ch: 0 },
	];

	expect(getReplacement(input)).toStrictEqual([expectedReplacement]);
});

test("separated lists sorting", () => {
	const input = [
		"### Hello World\n",
		"\n", // list 1
		"- [ ] a\n",
		"\t- [x] a1\n",
		"\t- [!] a2\n",
		"- [x] b\n",
		"- [!] c\n",
		"\t- [-] c1\n",
		"\t- [/] c2\n",
		"\n", // list 2
		"- [ ] a\n",
		"\t- [x] a1\n",
		"\t- [!] a2\n",
		"some text here\n", // list 3
		"- [ ] a\n",
		"\t- [x] a1\n",
		"\t- [!] a2\n",
		"#### header here\n", // list 4
		"- [ ] a\n",
		"\t- [x] a1\n",
		"\t- [!] a2\n", // list 5
		"---\n",
		"- [ ] a\n",
		"\t- [x] a1\n",
		"\t- [!] a2\n",
	].join("");

	const expectedReplacements: Replacement[] = [
		[
			[
				"- [!] c\n",
				"\t- [/] c2\n",
				"\t- [-] c1\n",
				"- [ ] a\n",
				"\t- [!] a2\n",
				"\t- [x] a1\n",
				"- [x] b\n",
			].join(""),
			{ line: 2, ch: 0 },
			{ line: 9, ch: 0 },
		],
		[
			["- [ ] a\n", "\t- [!] a2\n", "\t- [x] a1\n"].join(""),
			{ line: 10, ch: 0 },
			{ line: 13, ch: 0 },
		],
		[
			["- [ ] a\n", "\t- [!] a2\n", "\t- [x] a1\n"].join(""),
			{ line: 14, ch: 0 },
			{ line: 17, ch: 0 },
		],
		[
			["- [ ] a\n", "\t- [!] a2\n", "\t- [x] a1\n"].join(""),
			{ line: 18, ch: 0 },
			{ line: 21, ch: 0 },
		],
		[
			["- [ ] a\n", "\t- [!] a2\n", "\t- [x] a1\n"].join(""),
			{ line: 22, ch: 0 },
			{ line: 25, ch: 0 },
		],
	];

	expect(getReplacement(input)).toStrictEqual(expectedReplacements);
});

test("works with spaces and tabs", () => {
	const input = [
		"### Hello World\n",
		"\n",
		"- [ ] a\n",
		"\t- [x] a1\n",
		"    - [!] a2\n",
		"- [x] b\n",
		"- [!] c\n",
		"\t- [-] c1\n",
		"\t- [/] c2\n",
		"\t    - [/] c21\n",
		"    \t- [-] c22\n",
		"        - [ ] c23\n",
	].join("");

	const output = [
		"- [!] c\n",
		"\t- [/] c2\n",
		"\t\t- [/] c21\n",
		"\t\t- [ ] c23\n",
		"\t\t- [-] c22\n",
		"\t- [-] c1\n",
		"- [ ] a\n",
		"\t- [!] a2\n",
		"\t- [x] a1\n",
		"- [x] b\n",
	].join("");

	const expectedReplacement: Replacement = [
		output,
		{ line: 2, ch: 0 },
		{ line: 12, ch: 0 },
	];

	expect(getReplacement(input)).toStrictEqual([expectedReplacement]);
});

test("sorting with nested content", () => {
	const input = [
		"### Hello World\n",
		"\n",
		"- [ ] c\n",
		"\tc nested text\n",
		"\t- [ ] c1\n",
		"\t\tc1 nested text\n",
		"- [ ] z\n",
		"- [ ] a\n",
		"\ta nested text\n",
	].join("");

	const output = [
		"- [ ] a\n",
		"\ta nested text\n",
		"- [ ] c\n",
		"\tc nested text\n",
		"\t- [ ] c1\n",
		"\t\tc1 nested text\n",
		"- [ ] z\n",
	].join("");

	const expectedReplacement: Replacement = [
		output,
		{ line: 2, ch: 0 },
		{ line: 9, ch: 0 },
	];

	expect(getReplacement(input)).toStrictEqual([expectedReplacement]);
});

describe("parseSortString", () => {
	it("parses standard comma-separated string", () => {
		const result = TodoSorter.parseSortString("a,b,c");
		expect(result).toEqual({ a: 0, b: 1, c: 2 });
	});

	it("handles empty strings as space", () => {
		const result = TodoSorter.parseSortString("a,,b");
		expect(result).toEqual({ a: 0, " ": 1, b: 2 });
	});

	it("trims whitespace from elements", () => {
		const result = TodoSorter.parseSortString(" a , b , c ");
		expect(result).toEqual({ a: 0, b: 1, c: 2 });
	});

	it("returns empty object for empty string", () => {
		const result = TodoSorter.parseSortString("");
		expect(result).toEqual({});
	});
});
