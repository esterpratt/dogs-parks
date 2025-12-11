# .claude Directory

This directory contains configuration and templates for working with Claude Code.

## Structure

```
.claude/
├── commands/          # Custom slash commands
├── todos/            # Task planning and tracking files
├── settings.json     # Claude Code settings
├── settings.local.json  # Local overrides
├── folder-conventions.md  # Folder-specific conventions
├── todo-template.md  # Template for new todos
└── README.md         # This file
```

## Files

### Configuration
- **settings.json** - Claude Code settings
- **settings.local.json** - Local overrides for settings
- **folder-conventions.md** - Folder-specific coding conventions

### Templates
- **todo-template.md** - Template for creating new todo files

### Directories
- **commands/** - Custom slash commands for Claude Code
- **todos/** - Task planning files (one file per task)

## Usage

### Creating a New Todo File

When starting a new task, Claude will automatically create a new todo file in `.claude/todos/` with a descriptive name based on the task.

You can also manually create one:

```bash
cp .claude/todo-template.md .claude/todos/[task-name].md
```

Then fill in:
1. Task title
2. Problem description
3. Proposed solution
4. Todo items checklist
5. Review section (after completion)

### Todo File Naming

Use descriptive kebab-case names for todo files:
- `lazy-loading-translations.md`
- `fix-notification-bug.md`
- `add-user-authentication.md`

### Commands

Custom slash commands are located in `commands/` subdirectory.
