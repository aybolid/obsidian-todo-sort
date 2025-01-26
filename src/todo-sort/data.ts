import { STATUS_MAP, TODO_ITEM_REGEX } from "src/consts";
import { TodoItem } from "./item";
import { TodoList } from "./list";

export class TodoData {
	todoLists: TodoList[];

	constructor() {
		this.todoLists = [];
	}

	sortLists(): TodoList[] {
		this.todoLists.forEach((list) => list.sort());
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
		lines.forEach((line, idx) => {
			if (line.match(TODO_ITEM_REGEX) == null) {
				if (currentSection !== null) {
					sections.push(currentSection);
					currentSection = null;
				}
				return;
			}

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
		const lines = markdown.split("\n");
		const list = new TodoList();
		const stack: TodoItem[] = [];

		lines.forEach((line, idx) => {
			const parsed = this.parseLine(line);
			if (parsed === null) return;

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

		return new TodoItem(
			text,
			STATUS_MAP[statusChar.toLowerCase()] ?? null,
			statusChar,
			depth,
		);
	}
}
