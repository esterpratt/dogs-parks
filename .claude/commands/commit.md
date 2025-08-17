# Commit Workflow

Creates structured commits with proper formatting and Claude Code attribution.

## Usage

1. **Stage your changes:**
   ```bash
   git add .
   ```

2. **Create commit with message:**
   ```bash
   git commit -m "$(cat <<'EOF'
   Your commit message here
   
   🤖 Generated with [Claude Code](https://claude.ai/code)
   
   Co-Authored-By: Claude <noreply@anthropic.com>
   EOF
   )"
   ```

## Best Practices

- Use clear, descriptive commit messages
- Start with a verb (Add, Fix, Update, Remove, etc.)
- Keep the first line under 50 characters
- Add details in the body if needed
- Group related changes into logical commits
- Run `npm run lint` and `npm run test` before committing

## Examples

```bash
# Feature addition
git commit -m "$(cat <<'EOF'
Add push notifications support

- Configure Firebase for iOS and Android
- Add notification service layer
- Implement notification UI components

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# Bug fix
git commit -m "$(cat <<'EOF'
Fix notification badge count not updating

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```