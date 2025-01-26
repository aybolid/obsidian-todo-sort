import { EditorPosition } from "obsidian";
import { TodoItem } from "./item";

export class TodoList {
	items: TodoItem[];
	lineStart: number = -1;
	lineEnd: number = -1;

	constructor() {
		this.items = [];
	}

	sort(sortOrder: { [statusChar: string]: number }): TodoItem[] {
		this.sortTodoItems(this.items, sortOrder);
		return this.items;
	}

	toReplacement(): [string, EditorPosition, EditorPosition] {
		return [
			this.items.reduce((acc, curr) => acc + curr.toMarkdown(), ""),
			{ line: this.lineStart, ch: 0 },
			{
				line: this.items.reduce(
					(acc, curr) => (acc += curr.calcLines()),
					this.lineStart,
				),
				ch: 0,
			},
		];
	}

	private sortTodoItems(
		items: TodoItem[],
		sortOrder: { [statusChar: string]: number },
	): void {
		if (items.length > 1) {
			items.sort((a, b) => {
				const aOrder =
					sortOrder[a.statusChar] ?? Number.MAX_SAFE_INTEGER;
				const bOrder =
					sortOrder[b.statusChar] ?? Number.MAX_SAFE_INTEGER;

				if (aOrder !== bOrder) {
					return aOrder - bOrder;
				}

				return a.text.localeCompare(b.text);
			});
		}

		items.forEach((item) => this.sortTodoItems(item.children, sortOrder));
	}
}
