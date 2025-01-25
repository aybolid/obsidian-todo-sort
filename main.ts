import {
	App,
	Editor,
	EditorPosition,
	MarkdownView,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

const TODO_ITEM_REGEX = /^(\s*)([-*]\s*\[(.)\])\s*(.*)$/;

interface TodoSortSettings {
	mySetting: string;
}

enum TodoStatus {
	UNCHECKED,
	DONE,
	IMPORTANT,
	CANCELLED,
	IN_PROGRESS,
	QUESTION,
	STAR,
}

const DEFAULT_SETTINGS: TodoSortSettings = {
	mySetting: "default",
};

const STATUS_MAP: { [key: string]: TodoStatus } = {
	" ": TodoStatus.UNCHECKED,
	x: TodoStatus.DONE,
	"!": TodoStatus.IMPORTANT,
	"-": TodoStatus.CANCELLED,
	"/": TodoStatus.IN_PROGRESS,
	"?": TodoStatus.QUESTION,
	"*": TodoStatus.STAR,
};

const STATUS_ORDER_MAP = {
	[TodoStatus.IMPORTANT]: 1,
	[TodoStatus.STAR]: 2,
	[TodoStatus.QUESTION]: 3,
	[TodoStatus.IN_PROGRESS]: 4,
	[TodoStatus.UNCHECKED]: 5,
	[TodoStatus.DONE]: 6,
	[TodoStatus.CANCELLED]: 7,
} as const;

class TodoItem {
	text: string;
	status: TodoStatus | null;
	statusChar: string;
	children: TodoItem[];
	depth: number;

	constructor(
		text: string,
		status: TodoStatus | null,
		statusChar: string,
		depth = 0,
	) {
		this.text = text.trim();
		this.status = status;
		this.statusChar = statusChar;
		this.children = [];
		this.depth = depth;
	}

	toMarkdown(): string {
		const selfMarkdown = `${"\t".repeat(this.depth)}- [${this.statusChar}] ${this.text}\n`;
		const childrenMarkdown = this.children.reduce(
			(acc, curr) => acc + curr.toMarkdown(),
			"",
		);
		return selfMarkdown + childrenMarkdown;
	}
}

class TodoList {
	items: TodoItem[];
	lineStart: number;
	lineEnd: number;

	constructor(start = -1, end = -1) {
		this.items = [];
		this.lineStart = start;
		this.lineEnd = end;
	}

	sort(): TodoItem[] {
		this.sortTodoItems(this.items);
		return this.items;
	}

	toReplacement(): [string, EditorPosition, EditorPosition] {
		return [
			this.items.reduce((acc, curr) => acc + curr.toMarkdown(), ""),
			{ line: this.lineStart, ch: 0 },
			{ line: this.lineEnd, ch: 0 },
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

class TodoData {
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
			const list = this.parseSingleList(section);

			if (list.items.length > 0) {
				const firstItemIndex = lines.findIndex(
					(line, index) =>
						index >= currentLine && this.parseLine(line) !== null,
				);

				if (firstItemIndex !== -1) {
					list.lineStart = firstItemIndex;
					list.lineEnd =
						firstItemIndex + section.split("\n").length - 1;
					this.todoLists.push(list);
				}
			}

			currentLine += section.split("\n").length;
		});
	}

	private parseSingleList(markdown: string): TodoList {
		const lines = markdown.split("\n");
		const list = new TodoList();
		const stack: TodoItem[] = [];

		lines.forEach((line) => {
			const parsed = this.parseLine(line);
			if (parsed === null) return;

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
			.split(/\n(#{1,6}\s+.*)\n|\n\s*\n\s*\n/)
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

export default class TodoSortPlugin extends Plugin {
	settings: TodoSortSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "todo-sort-sort-todos",
			name: "Sort in the current note",
			editorCallback: (editor: Editor, _view: MarkdownView) => {
				const todoData = new TodoData();
				todoData.parseNote(editor.getValue());

				const sorted = todoData.sortLists();
				sorted.forEach((list) => {
					editor.replaceRange(...list.toReplacement());
				});
			},
		});

		this.addSettingTab(new TodoSortSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class TodoSortSettingTab extends PluginSettingTab {
	plugin: TodoSortPlugin;

	constructor(app: App, plugin: TodoSortPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
