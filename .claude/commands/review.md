# PR Review Workflow

Review pull requests using GitHub CLI with structured feedback and approval process.

## Prerequisites

- Install GitHub CLI: `brew install gh`
- Authenticate: `gh auth login`

## Usage

### 1. List PRs for Review

```bash
# List all open PRs
gh pr list

# List PRs assigned to you for review
gh pr list --search "review-requested:@me"
```

### 2. Review a PR

```bash
# View PR details
gh pr view [PR-NUMBER]

# Check out PR locally for testing
gh pr checkout [PR-NUMBER]

# View PR diff
gh pr diff [PR-NUMBER]
```

### 3. Test the Changes

```bash
# Run tests
npm run test

# Run linting
npm run lint

# Run type checking
npm run build

# Test the feature manually
npm run dev
```

### 4. Provide Review Feedback

```bash
# Request changes
gh pr review [PR-NUMBER] --request-changes --body "$(cat <<'EOF'
## Review Feedback

### Issues Found
- [ ] Issue 1: Description and suggested fix
- [ ] Issue 2: Description and suggested fix

### Suggestions
- Consider: Suggestion 1
- Consider: Suggestion 2

### Testing Notes
- Tested on: [platform/browser]
- Results: [description]

Please address the issues marked above and re-request review.
EOF
)"

# Approve PR
gh pr review [PR-NUMBER] --approve --body "$(cat <<'EOF'
## Review Approval

### Testing Completed
- [x] Code builds successfully
- [x] Tests pass
- [x] Linting passes
- [x] Manual testing completed

### Code Quality
- Code follows project conventions
- Logic is sound and well-structured
- No security concerns identified

Ready to merge! 🚀
EOF
)"

# Add comments without approval/rejection
gh pr review [PR-NUMBER] --comment --body "Looks good overall, just a few minor suggestions..."
```

### 5. Merge PR (if you have permissions)

```bash
# Merge with squash (recommended for feature branches)
gh pr merge [PR-NUMBER] --squash

# Merge with merge commit
gh pr merge [PR-NUMBER] --merge

# Merge with rebase
gh pr merge [PR-NUMBER] --rebase
```

## Review Checklist

### Code Quality
- [ ] Code follows project conventions in CLAUDE.md
- [ ] TypeScript types are properly defined
- [ ] Error handling is implemented
- [ ] No console.logs or debug code left behind
- [ ] Security best practices followed

### Testing
- [ ] `npm run build` passes
- [ ] `npm run lint` passes  
- [ ] `npm run test` passes
- [ ] Manual testing completed
- [ ] Edge cases considered

### Documentation
- [ ] Code is self-documenting with clear variable names
- [ ] Complex logic has appropriate comments
- [ ] CLAUDE.md updated if needed

### Mobile Considerations
- [ ] Works on iOS and Android
- [ ] Responsive design maintained
- [ ] Safe area handling preserved

## Best Practices

- Review promptly to unblock teammates
- Be constructive and specific in feedback
- Test changes locally when possible
- Check for security vulnerabilities
- Ensure consistency with existing codebase
- Ask questions if something is unclear