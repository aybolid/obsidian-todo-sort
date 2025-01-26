import { EditorPosition } from "obsidian";
import { TodoItem } from "./item";
import { Config } from "./sorter";

export class TodoList {
	items: TodoItem[];
	lineStart: number = -1;
	lineEnd: number = -1;

	constructor() {
		this.items = [];
	}

	sort(config: Config): TodoItem[] {
		this.sortTodoItems(this.items, config);
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

	private sortTodoItems(items: TodoItem[], config: Config): void {
		if (items.length > 1) {
			items.sort((a, b) => {
				const aOrder =
					config.order[a.statusChar] ?? Number.MAX_SAFE_INTEGER;
				const bOrder =
					config.order[b.statusChar] ?? Number.MAX_SAFE_INTEGER;

				if (!config.useAlphabeticalSortForTies) return aOrder - bOrder;

				if (aOrder !== bOrder) {
					return aOrder - bOrder;
				}

				return a.text.localeCompare(b.text);
			});
		}

		items.forEach((item) => this.sortTodoItems(item.children, config));
	}
}
