# Obsidian Todo Sorter Plugin

## Overview

The **Todo Sorter** plugin for Obsidian automatically organizes your todo lists by sorting tasks based on their status. It follows a customizable sorting order and can optionally sort tasks alphabetically when priorities are tied.

## Features

-   Sorts tasks by status (e.g., `*`, `!`, `?`, `/`, `x`, `-`).
-   Supports custom sorting orders.
-   Preserves nested todo structures.
-   Optional alphabetical sorting for tasks with the same priority.

## Usage

1. Open a note containing a list of todos.
2. Run the plugin from the command palette.
3. The plugin will automatically rearrange the todos based on the configured sorting rules.

### Example Sorting Order

Before sorting:

```md
-   [ ] Task A
-   [x] Task B
-   [!] Task C
```

After sorting (default order):

```md
-   [!] Task C
-   [ ] Task A
-   [x] Task B
```
