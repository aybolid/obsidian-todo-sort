import {
	App,
	Editor,
	MarkdownView,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";
import { TodoSorter } from "src/todo-sort";

interface TodoSorterSettings {
	sortOrder: string;
	useAlphabeticalSortForTies: boolean;
}

export const DEFAULT_SETTINGS: TodoSorterSettings = {
	sortOrder: "*,!,?,/,,x,-",
	useAlphabeticalSortForTies: true,
};

export default class TodoSorterPlugin extends Plugin {
	settings: TodoSorterSettings;
	parsedSortOrder: { [statusChar: string]: number };

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "todo-sort-sort-todos",
			name: "Sort in the current note",
			editorCallback: (editor: Editor, _view: MarkdownView) => {
				const sorter = new TodoSorter({
					order: this.parsedSortOrder,
					useAlphabeticalSortForTies:
						this.settings.useAlphabeticalSortForTies,
				});

				sorter.parseNote(editor.getValue());

				const sorted = sorter.sortLists();
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
			await this.loadData()
		);
		this.parsedSortOrder = TodoSorter.parseSortString(
			this.settings.sortOrder
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class TodoSortSettingTab extends PluginSettingTab {
	plugin: TodoSorterPlugin;

	constructor(app: App, plugin: TodoSorterPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Sorting order")
			.setDesc(
				`Item status characters separated by commas. Defines sorting order for todo items in the list. Example: ${DEFAULT_SETTINGS.sortOrder}`
			)
			.addText((text) =>
				text
					.setPlaceholder("Enter sort order")
					.setValue(this.plugin.settings.sortOrder)
					.onChange(async (value) => {
						this.plugin.settings.sortOrder = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Alphabetical sort")
			.setDesc(
				`If enabled, alphabetical sorting will be applied to items with the same status`
			)
			.addToggle((v) =>
				v
					.setValue(this.plugin.settings.useAlphabeticalSortForTies)
					.onChange(async (v) => {
						this.plugin.settings.useAlphabeticalSortForTies = v;
						await this.plugin.saveSettings();
					})
			);
	}
}
