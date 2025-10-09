import { describe, it, expect } from 'vitest';
import { translateNotification } from './translateNotification';
import type { TFunction } from 'i18next';

const makeT = (): TFunction => {
  const t: TFunction = ((
    key: string | string[],
    opts?: Record<string, unknown>
  ): string => {
    const k = Array.isArray(key) ? key[0] : key;
    if (k === 'notifications.common.someone') {
      return 'Someone';
    }
    const name = opts?.name ?? '';
    return `${k}:${name}`;
  }) as TFunction;
  return t;
};

describe('translateNotification', () => {
  it('translates FRIEND_REQUEST with sender name', () => {
    const t = makeT();
    const res = translateNotification({
      type: 'friend_request',
      senderName: 'Alice',
      serverTitle: null,
      serverAppMessage: null,
      t,
    });

    expect(res.title).toBe('notifications.types.friendRequest.title:Alice');
    expect(res.appMessage).toBe(
      'notifications.types.friendRequest.appMessage:Alice'
    );
  });

  it('falls back to server strings for unknown type', () => {
    const t = makeT();
    const res = translateNotification({
      type: 'unknown_type',
      senderName: 'Bob',
      serverTitle: 'Server Title',
      serverAppMessage: 'Server Message',
      t,
    });

    expect(res.title).toBe('Server Title');
    expect(res.appMessage).toBe('Server Message');
  });

  it('uses default someone when sender name missing', () => {
    const t = makeT();
    const res = translateNotification({
      type: 'friend_request',
      senderName: null,
      serverTitle: null,
      serverAppMessage: null,
      t,
    });

    expect(res.title).toBe('notifications.types.friendRequest.title:Someone');
    expect(res.appMessage).toBe(
      'notifications.types.friendRequest.appMessage:Someone'
    );
  });
});
