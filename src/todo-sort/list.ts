import { EditorPosition } from "obsidian";
import { STATUS_ORDER_MAP } from "src/consts";
import { TodoItem } from "./item";

export class TodoList {
	items: TodoItem[];
	lineStart: number = -1;
	lineEnd: number = -1;

	constructor() {
		this.items = [];
	}

	sort(): TodoItem[] {
		this.sortTodoItems(this.items);
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

	private sortTodoItems(items: TodoItem[]): void {
		if (items.length > 1) {
			items.sort((a, b) => {
				const aOrder =
					a.status !== null
						? STATUS_ORDER_MAP[a.status]
						: Number.MAX_SAFE_INTEGER;
				const bOrder =
					b.status !== null
						? STATUS_ORDER_MAP[b.status]
						: Number.MAX_SAFE_INTEGER;

				if (aOrder !== bOrder) {
					return aOrder - bOrder;
				}

				return a.text.localeCompare(b.text);
			});
		}

		items.forEach((item) => this.sortTodoItems(item.children));
	}
}
