import { describe, it, expect } from 'vitest';
import { createInstance } from 'i18next';
import { NotificationType } from '../types/notification';
import hebrew from '../../public/locales/he/translation.json';
import english from '../../public/locales/en/translation.json';
import arabic from '../../public/locales/ar/translation.json';
import { translateNotification } from './translateNotification';
import type { TFunction } from 'i18next';

const makeT = (): TFunction => {
  const t: TFunction = ((
    key: string | string[],
    opts?: Record<string, unknown>,
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
      'notifications.types.friendRequest.appMessage:Alice',
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
      'notifications.types.friendRequest.appMessage:Someone',
    );
  });

  it('maps ownership action notifications to localized client copy', () => {
    const t = makeT();
    const result = translateNotification({
      type: 'dog_ownership_request_received',
      senderName: 'Taylor',
      serverTitle: null,
      serverAppMessage: null,
      t,
    });

    expect(result.title).toBe(
      'notifications.types.dogOwnership.requestReceived.title:Taylor',
    );
    expect(result.appMessage).toBe(
      'notifications.types.dogOwnership.requestReceived.appMessage:Taylor',
    );
  });

  it('maps primary-transfer notifications to localized client copy', () => {
    const t = makeT();
    const result = translateNotification({
      type: 'dog_primary_transfer_offered',
      senderName: 'Taylor',
      serverTitle: null,
      serverAppMessage: null,
      t,
    });

    expect(result.title).toBe(
      'notifications.types.dogOwnership.transferOffered.title:Taylor',
    );
    expect(result.appMessage).toBe(
      'notifications.types.dogOwnership.transferOffered.appMessage:Taylor',
    );
  });
});

// A dog name disambiguates notifications from multiple shared dogs.
it('includes the dog name in ownership notification titles', () => {
  const result = translateNotification({
    type: 'dog_ownership_invite_received',
    senderName: 'Dana',
    dogName: 'Milo',
    t: makeT(),
  });
  expect(result.title).toBe('notifications.types.dogOwnership.inviteReceived.title:Dana · Milo');
});

// Exercise the real catalogs so every server ownership type has both client strings.
it.each([
  ['he', hebrew],
  ['en', english],
  ['ar', arabic],
])('resolves every ownership type in %s', async (language, catalog) => {
  const i18n = createInstance();
  await i18n.init({
    lng: language,
    resources: { [language]: { translation: catalog } },
  });

  for (const type of Object.values(NotificationType).filter((value) =>
    value.startsWith('dog_'),
  )) {
    const result = translateNotification({ type, senderName: 'Dana', t: i18n.t });
    expect(result.title).not.toContain('notifications.types.');
    expect(result.appMessage).not.toContain('notifications.types.');
    expect(result.title.length).toBeGreaterThan(0);
    expect(result.appMessage.length).toBeGreaterThan(0);
  }
});
