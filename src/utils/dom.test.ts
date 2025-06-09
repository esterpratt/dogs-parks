import { describe, it, expect } from 'vitest';
import { isParentWithId } from './dom';

describe('isParentWithId', () => {
  it('returns true if the element itself has the id', () => {
    const div = document.createElement('div');
    div.id = 'test-id';
    expect(isParentWithId(div, 'test-id')).toBe(true);
  });

  it('returns true if a parent element has the id', () => {
    const parent = document.createElement('div');
    parent.id = 'parent-id';
    const child = document.createElement('div');
    parent.appendChild(child);
    expect(isParentWithId(child, 'parent-id')).toBe(true);
  });

  it('returns false if no parent has the id', () => {
    const parent = document.createElement('div');
    const child = document.createElement('div');
    parent.appendChild(child);
    expect(isParentWithId(child, 'no-id')).toBe(false);
  });

  it('returns false if target is null', () => {
    expect(isParentWithId(null, 'any-id')).toBe(false);
  });
});
