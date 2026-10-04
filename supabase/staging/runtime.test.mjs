// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import { queryStaging } from './runtime.mjs';

const invocation = vi.hoisted(() => ({
  files: new Map(),
  filenames: [],
  overlap: null,
  fail: false,
}));

vi.mock('node:fs', async (importOriginal) => ({
  ...(await importOriginal()),
  mkdirSync: vi.fn(),
  chmodSync: vi.fn(),
  writeFileSync: vi.fn((filename, value) =>
    invocation.files.set(filename, value),
  ),
  readFileSync: vi.fn((filename) =>
    filename.endsWith('/supabase/.temp/project-ref')
      ? 'uhdzwzuyiztktxthwdfp'
      : invocation.files.get(filename),
  ),
  unlinkSync: vi.fn((filename) => invocation.files.delete(filename)),
}));

vi.mock('node:child_process', async (importOriginal) => ({
  ...(await importOriginal()),
  execFileSync: vi.fn((_command, argumentsList) => {
    if (argumentsList[0] === 'projects') {
      return JSON.stringify({
        projects: [
          {
            ref: 'uhdzwzuyiztktxthwdfp',
            name: 'klavhub-staging',
            status: 'ACTIVE_HEALTHY',
          },
          { ref: 'kbsjdfzpeianxhidguam', name: 'klavhub' },
        ],
      });
    }
    const filename = argumentsList[argumentsList.indexOf('--file') + 1];
    invocation.filenames.push(filename);
    // Re-enter preparation before the first CLI reads its file, reproducing
    // another process replacing the formerly shared staging-query.sql path.
    const overlap = invocation.overlap;
    invocation.overlap = null;
    overlap?.();
    if (invocation.fail) {
      throw new Error('Expected CLI failure');
    }
    return JSON.stringify({ rows: [{ sql: invocation.files.get(filename) }] });
  }),
}));

afterEach(() => {
  invocation.files.clear();
  invocation.filenames.length = 0;
  invocation.overlap = null;
  invocation.fail = false;
});

it('executes each overlapping command using its own protected SQL file', () => {
  invocation.overlap = () => {
    expect(queryStaging('SELECT second;')).toEqual([{ sql: 'SELECT second;' }]);
  };
  expect(queryStaging('SELECT first;')).toEqual([{ sql: 'SELECT first;' }]);
  expect(new Set(invocation.filenames).size).toBe(2);
  expect(invocation.files.size).toBe(0);
});

it('removes only its own temporary SQL file after a CLI failure', () => {
  invocation.files.set('unrelated-private-artifact', 'keep');
  invocation.fail = true;
  expect(() => queryStaging('SELECT first;')).toThrow(
    'Supabase command failed: db query',
  );
  expect(invocation.files.get('unrelated-private-artifact')).toBe('keep');
  expect(invocation.files.has(invocation.filenames[0])).toBe(false);
});
