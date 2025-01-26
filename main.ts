import {
	App,
	Editor,
	MarkdownView,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";
import { TodoData } from "src/todo-sort";

interface TodoSortSettings {
	sortOrder: string;
}

export const DEFAULT_SETTINGS: TodoSortSettings = {
	sortOrder: "*,!,?,/,,x,-",
};

export default class TodoSortPlugin extends Plugin {
	settings: TodoSortSettings;
	parsedSortOrder: { [statusChar: string]: number };

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "todo-sort-sort-todos",
			name: "Sort in the current note",
			editorCallback: (editor: Editor, _view: MarkdownView) => {
				const todoData = new TodoData();
				todoData.parseNote(editor.getValue());

				const sorted = todoData.sortLists(this.parsedSortOrder);
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
		this.parseSortOrder();
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private parseSortOrder() {
		const { sortOrder } = this.settings;
		const split = sortOrder.split(",").map((s) => s.trim());

		this.parsedSortOrder = split.reduce<Record<string, number>>(
			(acc, curr, idx) => {
				acc[curr === "" ? " " : curr] = idx;
				return acc;
			},
			{},
		);
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
			.setName("Sorting order")
			.setDesc(
				`Item status characters separated by commas. Defines sorting order for todo items in the list. Example: ${DEFAULT_SETTINGS.sortOrder}`,
			)
			.addText((text) =>
				text
					.setPlaceholder("Enter sort order")
					.setValue(this.plugin.settings.sortOrder)
					.onChange(async (value) => {
						this.plugin.settings.sortOrder = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
