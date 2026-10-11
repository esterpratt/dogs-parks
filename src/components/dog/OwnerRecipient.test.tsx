import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { OwnerRecipient } from './OwnerRecipient';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
afterEach(cleanup);
const members = [
  { id: 'first', user_name: 'Noa' },
  { id: 'second', user_name: 'Dana' },
];

// Opening a populated single select must show the other eligible owner too.
it('opens all eligible owners and selects only one', () => {
  const onChange = vi.fn();
  render(
    <OwnerRecipient
      dogName="Milo"
      members={members}
      value="first"
      onChange={onChange}
    />,
  );
  fireEvent.focus(screen.getByRole('textbox'));
  expect(screen.getByText('Noa')).toBeTruthy();
  fireEvent.mouseDown(screen.getByText('Dana'));
  expect(onChange).toHaveBeenCalledOnce();
  expect(onChange).toHaveBeenCalledWith('second');
  expect(screen.queryByText('Dana')).toBeNull();
});

it('shows a fixed recipient when only one owner is eligible', () => {
  render(
    <OwnerRecipient
      dogName="Milo"
      members={members.slice(0, 1)}
      value=""
      onChange={vi.fn()}
    />,
  );
  expect(screen.getByText('Noa')).toBeTruthy();
  expect(screen.queryByRole('textbox')).toBeNull();
});
