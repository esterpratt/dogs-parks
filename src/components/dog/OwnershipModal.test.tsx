import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { OwnershipModal } from './OwnershipModal';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

beforeEach(() => {
  const portal = document.createElement('div');
  portal.id = 'modal';
  document.body.append(portal);
});
afterEach(() => {
  cleanup();
  document.getElementById('modal')?.remove();
});

it('ignores a queued close event when the dialog is already open again', () => {
  const onClose = vi.fn();
  render(
    <OwnershipModal title="Invite a friend" onClose={onClose}>
      Friends
    </OwnershipModal>,
  );
  const dialog = screen.getByRole('dialog', { name: 'Invite a friend' });
  // Native close events are queued and can arrive after the next effect setup.
  fireEvent(dialog, new Event('close'));
  expect(dialog.hasAttribute('open')).toBe(true);
  expect(onClose).not.toHaveBeenCalled();
});

it('blocks Escape and the close button during a submitted action', () => {
  const onClose = vi.fn();
  render(
    <OwnershipModal title="Leave ownership" isPending onClose={onClose}>
      Leaving
    </OwnershipModal>,
  );
  const dialog = screen.getByRole('dialog', { name: 'Leave ownership' });
  const escape = new Event('cancel', { cancelable: true });
  fireEvent(dialog, escape);
  expect(escape.defaultPrevented).toBe(true);
  expect(onClose).not.toHaveBeenCalled();
  expect(screen.getByRole('button').hasAttribute('disabled')).toBe(true);
});
