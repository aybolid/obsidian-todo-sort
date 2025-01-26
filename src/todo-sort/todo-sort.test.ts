import { EditorPosition } from "obsidian";
import { expect, test } from "vitest";
import { TodoData } from "./data";

type Replacement = [string, EditorPosition, EditorPosition];

const getReplacement = (markdown: string): Replacement[] => {
	const data = new TodoData();
	data.parseNote(markdown);
	const sorted = data.sortLists({
		"*": 0,
		"!": 1,
		"?": 2,
		"/": 3,
		" ": 4,
		x: 5,
		"-": 6,
	});
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
