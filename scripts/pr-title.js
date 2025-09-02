#!/usr/bin/env node
/* eslint-env node */
// Derive a Conventional Commit style PR title from current branch name.
// Examples:
//   feature/park-issue-reporting -> feat(park): issue reporting
//   fix/login-crash -> fix(login): crash
//   chore/deps -> chore: deps
// Falls back to 'chore: update' if unable to parse.

function derive(branch) {
  if (!branch) {
    return 'chore: update';
  }
  const parts = branch.split('/');
  let rawType = parts[0];
  const typeMap = {
    feature: 'feat',
    feat: 'feat',
    fix: 'fix',
    bugfix: 'fix',
    hotfix: 'fix',
    chore: 'chore',
    docs: 'docs',
    doc: 'docs',
    refactor: 'refactor',
    test: 'test',
    ci: 'ci',
    build: 'build',
    perf: 'perf',
  };
  let type = typeMap[rawType] || 'chore';
  const remainder = parts.length > 1 ? parts.slice(1).join('/') : branch; // if no slash keep whole
  const cleaned = remainder.replace(/[-_]/g, ' ');
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return `${type}: update`;
  }
  if (words.length === 1) {
    return `${type}: ${words[0]}`;
  }
  const scope = words[0].toLowerCase();
  const summary = words.slice(1).join(' ');
  return `${type}(${scope}): ${summary}`;
}

const branch = process.argv[2] || process.env.GITHUB_HEAD_REF || '';
process.stdout.write(derive(branch));
