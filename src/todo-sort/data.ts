import { TODO_ITEM_REGEX } from "src/consts";
import { TodoItem } from "./item";
import { TodoList } from "./list";

export class TodoData {
	todoLists: TodoList[];

	constructor() {
		this.todoLists = [];
	}

	sortLists(sortOrder: { [statusChar: string]: number }): TodoList[] {
		this.todoLists.forEach((list) => list.sort(sortOrder));
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

	private parseTodoListSections(
		markdown: string,
	): { startLine: number; markdown: string }[] {
		const sections: { startLine: number; markdown: string }[] = [];

		const lines = markdown.split("\n");

		let currentSection: { startLine: number; markdown: string } | null =
			null;
		let prevParsedLineIndent = Number.MIN_SAFE_INTEGER;

		lines.forEach((line, idx) => {
			const lineIndent = (line.match(/^\s*/)?.[0] ?? "").length;

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
		const depth = indent.length;

		return new TodoItem(text, statusChar, depth);
	}
}
