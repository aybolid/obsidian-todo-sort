import {
	App,
	Editor,
	MarkdownView,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

const TODO_ITEM_REGEX = /^(\s*)([-*]\s*\[(.)\])\s*(.*)$/;

interface TodoSortSettings {
	mySetting: string;
}

/** Supported todo completion statuses. */
enum TodoStatus {
	/** `- [ ]` */
	UNCHECKED,
	/** `- [x]` */
	DONE,
	/** `- [!]` */
	IMPORTANT,
	/** `- [-]` */
	CANCELLED,
	/** `- [/]` */
	IN_PROGRESS,
	/** `- [?]` */
	QUESTION,
	/** `- [*]` */
	STAR,
}

const DEFAULT_SETTINGS: TodoSortSettings = {
	mySetting: "default",
};

/** Status character -> `TodoStatus`. */
const STATUS_MAP: { [key: string]: TodoStatus } = {
	" ": TodoStatus.UNCHECKED,
	x: TodoStatus.DONE,
	"!": TodoStatus.IMPORTANT,
	"-": TodoStatus.CANCELLED,
	"/": TodoStatus.IN_PROGRESS,
	"?": TodoStatus.QUESTION,
	"*": TodoStatus.STAR,
};

/** Map of status to order */
const STATUS_ORDER_MAP = {
	[TodoStatus.IMPORTANT]: 1,
	[TodoStatus.STAR]: 2,
	[TodoStatus.QUESTION]: 3,
	[TodoStatus.IN_PROGRESS]: 4,
	[TodoStatus.UNCHECKED]: 5,
	[TodoStatus.DONE]: 6,
	[TodoStatus.CANCELLED]: 7,
} as const;

class TodoData {
	todoLists: TodoList[];

	constructor() {
		this.todoLists = [];
	}

	sortLists(): TodoList[] {
		this.todoLists.forEach((list) => {
			list.sort();
		});
		return this.todoLists;
	}

	parseNote(markdown: string): void {
		this.todoLists = [];

		const sections = this.splitMarkdownIntoSections(markdown);

		sections.forEach((section) => {
			const list = this.parseSingleList(section);
			if (list.items.length > 0) {
				this.todoLists.push(list);
			}
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
		// TODO: improve splitting into sections???

		// split by headers
		const headerSplitSections = markdown.split(/\n(#{1,6}\s+.*)\n/);

		// split by multiple consecutive empty lines
		const emptySections = markdown.split(/\n\s*\n\s*\n/);

		// choose the strategy with more potential sections
		return headerSplitSections.length > emptySections.length
			? headerSplitSections.filter((section) => section.trim())
			: emptySections.filter((section) => section.trim());
	}

	/** Parses the markdown line returning `TodoItem` if parsed, otherwise returns `null`. */
	private parseLine(line: string): TodoItem | null {
		const match = line.match(TODO_ITEM_REGEX);
		if (!match) return null;

		const [, indent, , statusChar, text] = match;

		const depth = indent.length;
		const item = new TodoItem(
			text,
			STATUS_MAP[statusChar.toLowerCase()] ?? null,
			statusChar,
			depth,
		);

		return item;
	}
}

class TodoList {
	items: TodoItem[];

	constructor() {
		this.items = [];
	}

	sort(): TodoItem[] {
		this.sortTodoItems(this.items);
		return this.items;
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

		items.forEach((item) => {
			this.sortTodoItems(item.children);
		});
	}
}

class TodoItem {
	text: string;
	/** `null` if unsupported status character was found */
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
				console.log(todoData.sortLists());
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
