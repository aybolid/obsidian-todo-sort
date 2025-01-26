import { SECTION_SPLIT_REGEX, STATUS_MAP, TODO_ITEM_REGEX } from "src/consts";
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
		const lines = markdown.split("\n");

		const sections = this.splitMarkdownIntoSections(markdown);
		let currentLine = 0;

		sections.forEach((section) => {
			const list = this.parseSingleList(section, currentLine);

			if (list.items.length > 0) {
				this.todoLists.push(list);
			}

			currentLine += section.split("\n").length;
		});
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

	private splitMarkdownIntoSections(markdown: string): string[] {
		// split by headers or multiple consecutive empty lines
		return markdown
			.split(SECTION_SPLIT_REGEX)
			.filter((section) => section.trim());
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
