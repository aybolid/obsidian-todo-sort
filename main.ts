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
	mySetting: string;
}

const DEFAULT_SETTINGS: TodoSortSettings = {
	mySetting: "default",
};

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
