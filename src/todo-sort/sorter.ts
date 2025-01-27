import {
	INDENT_REGEX,
	SPACES_TO_TABS_REGEX,
	TODO_ITEM_REGEX,
	TRAILING_COMMA_REGEX,
} from "src/consts";
import { TodoItem } from "./item";
import { TodoList } from "./list";

export type Config = {
	order: { [statusChar: string]: number };
	useAlphabeticalSortForTies: boolean;
};

export class TodoSorter {
	todoLists: TodoList[];

	config: Config;

	constructor(config: Config) {
		this.todoLists = [];
		this.config = config;
	}

	sortLists(): TodoList[] {
		this.todoLists.forEach((list) => list.sort(this.config));
		return this.todoLists;
	}

	parseNote(markdown: string): void {
		this.todoLists = [];
		const sections = this.parseTodoListSections(markdown);

		sections.forEach(({ startLine, markdown }) => {
			const list = this.parseSingleList(markdown, startLine);

			if (list.items.length > 0) {
				this.todoLists.push(list);
			}
		});
	}

	static parseSortString(sortString: string): Record<string, number> {
		if (!sortString) return {};
		sortString.replace(TRAILING_COMMA_REGEX, "");

		const split = sortString.split(",").map((s) => s.trim());

		return split.reduce<Record<string, number>>((acc, curr, idx) => {
			acc[curr === "" ? " " : curr] = idx;
			return acc;
		}, {});
	}

	private parseTodoListSections(
		markdown: string,
	): { startLine: number; markdown: string }[] {
		const sections: { startLine: number; markdown: string }[] = [];

		const lines = markdown.split("\n");

		let currentSection: { startLine: number; markdown: string } | null =
			null;
		let prevParsedLineIndent = Number.MIN_SAFE_INTEGER;

		lines.forEach((line, idx) => {
			const lineIndent = this.replaceSpacesWithTabs(
				line.match(INDENT_REGEX)?.[0] ?? "",
			).length;

			if (line.match(TODO_ITEM_REGEX) == null) {
				const isNestedContent = lineIndent === prevParsedLineIndent + 1;

				if (currentSection !== null && !isNestedContent) {
					sections.push(currentSection);
					prevParsedLineIndent = Number.MIN_SAFE_INTEGER;
					currentSection = null;
					return;
				}

				if (currentSection !== null) {
					currentSection.markdown += line + "\n";
				}

				return;
			}

			prevParsedLineIndent = lineIndent;

			if (currentSection === null) {
				currentSection = { startLine: idx, markdown: "" };
			}

			currentSection.markdown += line + "\n";
		});

		return sections;
	}

	private replaceSpacesWithTabs(s: string) {
		return s.replace(SPACES_TO_TABS_REGEX, (match) => {
			const existingTabs = match.match(/\t/g)?.length || 0;
			const spaceCount = match.replace(/\t/g, "").length;
			const newTabs = Math.floor(spaceCount / 4);

			return "\t".repeat(existingTabs + newTabs);
		});
	}

	private parseSingleList(
		markdown: string,
		sectionStartLine: number,
	): TodoList {
		const lines = markdown.split("\n").filter(Boolean);

		const list = new TodoList();
		const stack: TodoItem[] = [];

		lines.forEach((line, idx) => {
			const parsed = this.parseLine(line);
			if (parsed === null) {
				stack[stack.length - 1].nestedContent.push(line.trim());
				return;
			}

			if (list.lineStart === -1) {
				list.lineStart = sectionStartLine + idx;
			}

			while (
				stack.length > 0 &&
				stack[stack.length - 1].depth >= parsed.depth
			) {
				stack.pop();
			}

			if (stack.length > 0) {
				stack[stack.length - 1].children.push(parsed);
			} else {
				list.items.push(parsed);
			}

			stack.push(parsed);
		});

		return list;
	}

	private parseLine(line: string): TodoItem | null {
		const match = line.match(TODO_ITEM_REGEX);
		if (!match) return null;

		const [, indent, , statusChar, text] = match;
		const depth = this.replaceSpacesWithTabs(indent).length;

		return new TodoItem(text, statusChar, depth);
	}
}
