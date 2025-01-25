import {
	App,
	Editor,
	MarkdownView,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

interface TodoSortSettings {
	mySetting: string;
}

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

const STATUS_MAP: { [key: string]: TodoStatus } = {
	" ": TodoStatus.UNCHECKED,
	x: TodoStatus.DONE,
	"!": TodoStatus.IMPORTANT,
	"-": TodoStatus.CANCELLED,
	"/": TodoStatus.IN_PROGRESS,
	"?": TodoStatus.QUESTION,
	"*": TodoStatus.STAR,
};

class TodoData {
	todo_lists: TodoList[];

	constructor() {
		this.todo_lists = [];
	}

	get_sorted() {}

	parse_note(markdown: string) {
		const list = new TodoList();
		const lines = markdown.split("\n");
		const stack: TodoItem[] = [];

		lines.forEach((line) => {
			const match = line.match(/^(\s*)([-*]\s*\[(.)\])\s*(.*)$/);
			if (match) {
				const [, indent, , statusChar, text] = match;

				const status =
					STATUS_MAP[statusChar.toLowerCase()] ??
					TodoStatus.UNCHECKED;

				const depth = indent.length;
				const item = new TodoItem(text, status, depth);

				while (
					stack.length > 0 &&
					stack[stack.length - 1].depth >= depth
				) {
					stack.pop();
				}

				if (stack.length > 0) {
					stack[stack.length - 1].children.push(item);
				} else {
					list.items.push(item);
				}

				stack.push(item);
			}
		});

		console.log(list);
	}
}

class TodoList {
	items: TodoItem[];

	constructor() {
		this.items = [];
	}

	sort() {}
}

class TodoItem {
	text: string;
	status: TodoStatus;
	children: TodoItem[];
	depth: number;

	constructor(text: string, status: TodoStatus, depth = 0) {
		this.text = text.trim();
		this.status = status;
		this.children = [];
		this.depth = depth;
	}
}

export default class TodoSortPlugin extends Plugin {
	settings: TodoSortSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "sample-editor-command",
			name: "Sample editor command",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const todoData = new TodoData();
				todoData.parse_note(editor.getValue());
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
