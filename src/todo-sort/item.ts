import { TodoStatus } from "./types";

export class TodoItem {
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

	calcLines(): number {
		const thisLines = 1;
		return (
			thisLines +
			this.children.reduce((acc, curr) => (acc += curr.calcLines()), 0)
		);
	}
}
