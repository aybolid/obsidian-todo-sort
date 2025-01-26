import { TodoStatus } from "./todo-sort";

export const TODO_ITEM_REGEX = /^(\s*)([-*]\s*\[(.)\])\s*(.*)$/;
export const SECTION_SPLIT_REGEX = /\n(#{1,6}\s+.*)\n|\n\s*\n\s*\n/;

export const STATUS_MAP: { [key: string]: TodoStatus } = {
	" ": TodoStatus.UNCHECKED,
	x: TodoStatus.DONE,
	"!": TodoStatus.IMPORTANT,
	"-": TodoStatus.CANCELLED,
	"/": TodoStatus.IN_PROGRESS,
	"?": TodoStatus.QUESTION,
	"*": TodoStatus.STAR,
};

export const STATUS_ORDER_MAP = {
	[TodoStatus.IMPORTANT]: 1,
	[TodoStatus.STAR]: 2,
	[TodoStatus.QUESTION]: 3,
	[TodoStatus.IN_PROGRESS]: 4,
	[TodoStatus.UNCHECKED]: 5,
	[TodoStatus.DONE]: 6,
	[TodoStatus.CANCELLED]: 7,
} as const;
