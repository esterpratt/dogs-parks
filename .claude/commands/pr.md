# Pull Request Workflow

Creates pull requests using GitHub CLI with proper formatting and templates.

## Prerequisites

- Install GitHub CLI: `brew install gh`
- Authenticate: `gh auth login`
- Push branch to remote: `git push -u origin branch-name`

## Usage

### 1. Create Pull Request

```bash
gh pr create --title "Your PR Title" --body "$(cat <<'EOF'
## Summary
- Brief bullet point summary of changes
- What problem this solves
- Key features/fixes added

## Changes
- **Category**: Description of changes in this area
- **Category**: Description of changes in this area

## Test Plan
- [ ] Test case 1
- [ ] Test case 2
- [ ] Test case 3

🤖 Generated with [Claude Code](https://claude.ai/code)
EOF
)"
```

### 2. Check PR Status

```bash
gh pr status
gh pr view
```

### 3. Update PR

```bash
# Add commits and push
git push

# Update PR description
gh pr edit --body "Updated description..."
```

## Common PR Title Patterns

- `Feature: Add [feature name]`
- `Fix: [brief description of fix]`
- `Refactor: [what was refactored]`
- `Update: [what was updated]`
- `Remove: [what was removed]`

## Best Practices

- Use descriptive PR titles with prefixes
- Include comprehensive test plan with checkboxes
- Link related issues with `Closes #123`
- Request specific reviewers with `--reviewer username`
- Use draft PRs for work in progress: `--draft`
- Run linting and tests before creating PR