export class TodoItem {
	text: string;
	statusChar: string;
	children: TodoItem[];
	depth: number;
	nestedContent: string[];

	constructor(text: string, statusChar: string, depth = 0) {
		this.text = text.trim();
		this.statusChar = statusChar;
		this.children = [];
		this.depth = depth;
		this.nestedContent = [];
	}

	toMarkdown(): string {
		const selfMarkdown = `${"\t".repeat(this.depth)}- [${this.statusChar}] ${this.text}\n`;

		const nestedContentMarkdown = this.nestedContent.reduce(
			(acc, curr) => (acc += "\t".repeat(this.depth + 1) + curr + "\n"),
			"",
		);

		const childrenMarkdown = this.children.reduce(
			(acc, curr) => acc + curr.toMarkdown(),
			"",
		);

		return selfMarkdown + nestedContentMarkdown + childrenMarkdown;
	}

	calcLines(): number {
		const thisLines = 1 + this.nestedContent.length;
		return (
			thisLines +
			this.children.reduce((acc, curr) => (acc += curr.calcLines()), 0)
		);
	}
}
