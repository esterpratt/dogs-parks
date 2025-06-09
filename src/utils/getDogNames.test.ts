import { describe, it, expect } from 'vitest';
import { getDogNames } from './getDogNames';
import type { Dog } from '../types/dog';

describe('getDogNames', () => {
  it('returns the name of a single dog', () => {
    const dogs: Dog[] = [{ id: '1', name: 'buddy', owner: 'owner1' }];
    expect(getDogNames(dogs)).toBe('buddy');
  });

  it('returns two dog names joined with &', () => {
    const dogs: Dog[] = [
      { id: '1', name: 'buddy', owner: 'owner1' },
      { id: '2', name: 'max', owner: 'owner1' },
    ];
    expect(getDogNames(dogs)).toBe('Buddy & Max');
  });

  it('returns three or more dog names comma separated and last with &', () => {
    const dogs: Dog[] = [
      { id: '1', name: 'buddy', owner: 'owner1' },
      { id: '2', name: 'max', owner: 'owner1' },
      { id: '3', name: 'bella', owner: 'owner1' },
    ];
    expect(getDogNames(dogs)).toBe('Buddy, Max & Bella');
  });
});
