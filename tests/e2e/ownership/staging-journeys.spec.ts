import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { test, expect, Page, Locator } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { Database, Json } from '../../../src/types/supabase';
import { loginWithEmail } from '../helpers/auth';
import { setupTestEnvironment } from '../helpers/setup';

interface StagingAccount {
  id: string;
  email: string;
  password: string;
}

interface StagingFixtures {
  stagingRef: string;
  accounts: Record<'primary' | 'friend' | 'coowner', StagingAccount>;
}

interface ClickRpcProps {
  page: Page;
  control: Locator;
  name: string;
  outcome?: string;
  expectedPayload?: Record<string, string>;
}

const stagingRef = 'uhdzwzuyiztktxthwdfp';
const stagingUrl = `https://${stagingRef}.supabase.co`;

function resultString(result: Json, field: string) {
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    throw new Error('Expected an ownership RPC object');
  }
  const value = result[field];
  if (typeof value !== 'string') {
    throw new Error(`Missing ownership result field: ${field}`);
  }
  return value;
}

async function clickRpc(props: ClickRpcProps) {
  const { page, control, name, outcome, expectedPayload } = props;
  // Assert the real server result as well as clicking the rendered control.
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url() === `${stagingUrl}/rest/v1/rpc/${name}` &&
      response.request().method() === 'POST',
    { timeout: 20_000 },
  );
  await control.click();
  const response = await responsePromise;
  if (expectedPayload) {
    expect(response.request().postDataJSON()).toMatchObject(
      expectedPayload,
    );
  }
  expect(response.ok()).toBe(true);
  const responseBody = await response.text();
  const result: Json = responseBody ? JSON.parse(responseBody) : null;
  if (outcome) {
    expect(resultString(result, 'outcome')).toBe(outcome);
  }
  return result;
}

async function uploadPhoto(page: Page) {
  // Deterministic tiny test media exercises actual browser preparation and
  // reservation/Storage/finalization without touching personal photos.
  const dataUrl = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const drawing = canvas.getContext('2d')!;
    drawing.fillStyle = '#ff5555';
    drawing.fillRect(0, 0, 16, 16);
    return canvas.toDataURL('image/png');
  });
  await page
    .getByRole('button', { name: 'Gallery', exact: true })
    .locator('..')
    .getByRole('button', { name: 'Add photo', exact: true })
    .click();
  const finalized = page.waitForResponse(
    (response) =>
      response.url() ===
      `${stagingUrl}/rest/v1/rpc/api_finalize_dog_image`,
    { timeout: 20_000 },
  );
  await page
    .getByRole('dialog')
    .locator('input[type="file"]')
    .setInputFiles({
      name: 'browser-fixture.png',
      mimeType: 'image/png',
      buffer: Buffer.from(dataUrl.split(',')[1], 'base64'),
    });
  const response = await finalized;
  expect(response.ok()).toBe(true);
  const imageId = resultString(
    response.request().postDataJSON(),
    'p_image_id',
  );
  const image = page.locator(`.slider-container img[src*="${imageId}"]`);
  await expect(image).toBeVisible();
  await expect
    .poll(() =>
      image.evaluate((element: HTMLImageElement) => element.naturalWidth),
    )
    .toBeGreaterThan(0);
  return imageId;
}

test.describe('staging ownership browser journeys', () => {
  // These destructive journeys are opt-in and never load credentials in normal
  // CI/production e2e runs. Only a newly created disposable dog is changed.
  test.skip(
    process.env.STAGING_E2E !== 'true',
    'Requires isolated staging',
  );

  // Playwright requires fixture destructuring in the callback signature.
  test('invite, request, transfer, succession and unanimous deletion across sessions', async ({
    browser,
  }) => {
    test.setTimeout(120_000);
    if (process.env.VITE_SUPABASE_URL !== stagingUrl) {
      throw new Error('Refusing ownership tests outside verified staging');
    }
    // Fresh actors exercise the actual request throttle without resetting it.
    execFileSync(
      process.execPath,
      ['supabase/staging/prepare-browser.mjs', '--apply'],
      { stdio: 'pipe', timeout: 60_000 },
    );
    const fixtures: StagingFixtures = JSON.parse(
      readFileSync('.private/staging/browser-run.json', 'utf8'),
    );
    if (fixtures.stagingRef !== stagingRef) {
      throw new Error('Synthetic fixture project mismatch');
    }
    const client = createClient<Database>(
      stagingUrl,
      process.env.VITE_SUPABASE_ANON_KEY!,
      {
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );
    const login = await client.auth.signInWithPassword(
      fixtures.accounts.primary,
    );
    expect(login.error).toBeNull();
    expect(login.data.user?.app_metadata.staging_fixture).toBe(
      'browser-journey',
    );
    const created = await client.rpc('api_create_dog', {
      p_dog: {
        name: `Browser journey ${randomUUID()}`,
        birthday: '2020-01-01',
      },
    });
    expect(created.error).toBeNull();
    const dogId = resultString(created.data, 'dog_id');
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
    ]);
    const pages = await Promise.all(
      contexts.map((context) => context.newPage()),
    );
    const [primary, friend, coowner] = pages;
    const productionRequests: string[] = [];
    const pageErrors: string[] = [];
    try {
      await Promise.all(
        pages.map(async (page, index) => {
          page.setDefaultTimeout(15_000);
          page.on('request', (request) => {
            if (request.url().includes('kbsjdfzpeianxhidguam')) {
              productionRequests.push(request.url());
            }
          });
          page.on('pageerror', (error) => pageErrors.push(error.message));
          await setupTestEnvironment(page);
          const role = (['primary', 'friend', 'coowner'] as const)[index];
          await loginWithEmail(page, fixtures.accounts[role]);
        }),
      );
      await primary.goto(`/dogs/${dogId}/ownership`);
      await primary
        .getByRole('button', { name: 'Invite a friend', exact: true })
        .click();
      await expect(
        primary.getByRole('dialog', { name: 'Invite a friend' }),
      ).toBeVisible();
      await primary
        .getByPlaceholder('Search friends')
        .fill('Staging friend');
      await primary
        .getByRole('dialog', { name: 'Invite a friend' })
        .getByText('Staging friend', { exact: true })
        .click();
      let invite = await clickRpc({
        page: primary,
        control: primary
          .getByRole('dialog', { name: 'Invite a friend' })
          .getByRole('button', { name: 'Invite', exact: true }),
        name: 'api_create_dog_invite',
        outcome: 'CREATED',
      });
      await expect(
        primary.getByRole('dialog', { name: 'Invite a friend' }),
      ).toHaveCount(0);
      await expect(
        primary.getByText('The ownership action was sent.', {
          exact: true,
        }),
      ).toBeVisible();
      await friend.goto(
        `/ownership-actions/invite/${resultString(invite, 'action_id')}`,
      );
      await expect(
        friend.getByRole('button', { name: 'Approve', exact: true }),
      ).toBeDisabled();
      // Decisions close into the dog page with a toast; retries use a new invitation.
      const declinedDialog = friend.getByRole('dialog', {
        name: 'Ownership invitation',
      });
      await expect(declinedDialog.getByRole('button')).toHaveCount(2);
      await clickRpc({
        page: friend,
        control: friend.getByRole('button', {
          name: 'Decline',
          exact: true,
        }),
        name: 'api_respond_dog_invite',
        outcome: 'DECLINED',
      });
      await expect(
        friend.getByRole('button', { name: 'Decline', exact: true }),
      ).toHaveCount(0);
      await expect(declinedDialog).toHaveCount(0);
      await expect(friend).toHaveURL(new RegExp(`/dogs/${dogId}$`));
      await expect(
        friend.getByText('The action was declined.', { exact: true }),
      ).toBeVisible();
      await friend.screenshot({
        path: '.private/staging/ui-invitation-declined.png',
      });
      await primary
        .getByRole('button', { name: 'Invite a friend', exact: true })
        .click();
      await primary
        .getByPlaceholder('Search friends')
        .fill('Staging friend');
      await primary
        .getByRole('dialog', { name: 'Invite a friend' })
        .getByText('Staging friend', { exact: true })
        .click();
      invite = await clickRpc({
        page: primary,
        control: primary
          .getByRole('dialog', { name: 'Invite a friend' })
          .getByRole('button', { name: 'Invite', exact: true }),
        name: 'api_create_dog_invite',
        outcome: 'CREATED',
      });
      await expect(
        primary.getByRole('dialog', { name: 'Invite a friend' }),
      ).toHaveCount(0);
      await friend.goto(
        `/ownership-actions/invite/${resultString(invite, 'action_id')}`,
      );
      await expect(
        friend.getByRole('button', { name: 'Approve', exact: true }),
      ).toBeDisabled();
      await friend.screenshot({
        path: '.private/staging/ui-invitation-pending.png',
      });
      await friend.getByRole('checkbox').check();
      await clickRpc({
        page: friend,
        control: friend.getByRole('button', {
          name: 'Approve',
          exact: true,
        }),
        name: 'api_respond_dog_invite',
        outcome: 'ACCEPTED',
      });
      await expect(
        friend.getByRole('button', { name: 'Approve', exact: true }),
      ).toHaveCount(0);
      await expect(
        friend.getByRole('dialog', { name: 'Ownership invitation' }),
      ).toHaveCount(0);
      await expect(friend).toHaveURL(
        new RegExp(`/dogs/${dogId}/ownership$`),
      );
      await expect(
        friend.getByText('The invitation was accepted.', { exact: true }),
      ).toBeVisible();
      // The other owner's existing screen must update through Realtime.
      await expect(
        primary
          .getByRole('heading', { name: 'Owners', exact: true })
          .locator('..')
          .getByText('Staging friend', { exact: true }),
      ).toBeVisible({ timeout: 15_000 });
      // Refresh proves durable action routes and server state survive navigation.
      await friend.reload();
      await expect(
        friend.getByRole('button', { name: 'Approve', exact: true }),
      ).toHaveCount(0);

      await primary.goto(`/dogs/${dogId}`);
      const originalImageId = await uploadPhoto(primary);
      await friend.goto(`/dogs/${dogId}`);
      await friend
        .locator(`.slider-container img[src*="${originalImageId}"]`)
        .click();
      await expect(
        friend
          .getByRole('dialog')
          .getByRole('button', { name: 'Delete', exact: true }),
      ).toHaveCount(0);
      await friend.keyboard.press('Escape');
      const ownImageId = await uploadPhoto(friend);
      await friend
        .locator(`.slider-container img[src*="${ownImageId}"]`)
        .click();
      await clickRpc({
        page: friend,
        control: friend
          .getByRole('dialog')
          .getByRole('button', { name: 'Set as primary', exact: true }),
        name: 'api_set_primary_dog_image',
      });
      const selectedPhoto = await client
        .from('dogs')
        .select('primary_image_id')
        .eq('id', dogId)
        .single();
      expect(selectedPhoto.data?.primary_image_id).toBe(ownImageId);
      await friend
        .locator(`.slider-container img[src*="${ownImageId}"]`)
        .click();
      await friend
        .getByRole('dialog')
        .getByRole('button', { name: 'Delete', exact: true })
        .click();
      await clickRpc({
        page: friend,
        control: friend
          .getByRole('dialog')
          .filter({ hasText: 'Hold your leash!' })
          .getByRole('button', { name: 'Delete', exact: true }),
        name: 'api_delete_dog_image',
      });
      await expect(
        friend.locator(`.slider-container img[src*="${ownImageId}"]`),
      ).toHaveCount(0);
      const fallbackPhoto = await client
        .from('dogs')
        .select('primary_image_id')
        .eq('id', dogId)
        .single();
      expect(fallbackPhoto.data?.primary_image_id).toBe(originalImageId);

      await coowner.goto(`/dogs/${dogId}`);
      await coowner
        .getByRole('button', { name: 'Request ownership', exact: true })
        .click();
      await expect(
        coowner.getByRole('dialog', { name: 'Request ownership' }),
      ).toBeVisible();
      await coowner.getByRole('checkbox').check();
      const request = await clickRpc({
        page: coowner,
        control: coowner.getByRole('button', {
          name: 'Send request',
          exact: true,
        }),
        name: 'api_create_dog_ownership_request',
        outcome: 'CREATED',
      });
      await primary.goto(
        `/ownership-actions/request/${resultString(request, 'action_id')}`,
      );
      await clickRpc({
        page: primary,
        control: primary.getByRole('button', {
          name: 'Approve',
          exact: true,
        }),
        name: 'api_respond_dog_ownership_request',
        outcome: 'APPROVED',
      });

      await primary.goto(`/dogs/${dogId}/ownership`);
      await expect(
        primary.getByRole('button', {
          name: 'Invite a friend',
          exact: true,
        }),
      ).toHaveCount(0);
      await primary
        .getByRole('button', {
          name: 'Transfer primary role',
          exact: true,
        })
        .click();
      await primary
        .getByRole('combobox')
        .selectOption({ label: 'Staging friend' });
      await expect(
        primary.getByRole('button', { name: 'Invite', exact: true }),
      ).toHaveCount(0);
      await primary
        .getByRole('dialog')
        .getByRole('button', { name: 'Cancel', exact: true })
        .click();
      // Changing language also exercises a fresh deep-link render in RTL.
      await primary.getByTestId('navbar-more').click();
      await primary
        .getByRole('button', { name: 'Language', exact: true })
        .click();
      await primary
        .getByRole('dialog')
        .getByRole('button', { name: 'עברית', exact: true })
        .click();
      await expect(primary.locator('html')).toHaveAttribute('dir', 'rtl');
      await primary.reload();
      await expect(primary.locator('html')).toHaveAttribute('dir', 'rtl');
      await expect(
        primary.getByRole('link', { name: 'בעלות', exact: true }),
      ).toBeVisible();
      await primary.screenshot({
        path: '.private/staging/ownership-hebrew.png',
      });
      await primary.getByTestId('navbar-more').click();
      await primary
        .getByRole('button', { name: 'שפה', exact: true })
        .click();
      await primary
        .getByRole('dialog')
        .getByRole('button', { name: 'English', exact: true })
        .click();
      await expect(primary.locator('html')).toHaveAttribute('dir', 'ltr');
      await primary.reload();
      await primary
        .getByRole('button', {
          name: 'Transfer primary role',
          exact: true,
        })
        .click();
      await primary
        .getByRole('combobox')
        .selectOption({ label: 'Staging friend' });
      const transfer = await clickRpc({
        page: primary,
        control: primary.getByRole('button', {
          name: 'Send offer',
          exact: true,
        }),
        name: 'api_create_primary_transfer',
        outcome: 'CREATED',
      });
      await friend.goto(
        `/ownership-actions/transfer/${resultString(transfer, 'action_id')}`,
      );
      await clickRpc({
        page: friend,
        control: friend.getByRole('button', {
          name: 'Approve',
          exact: true,
        }),
        name: 'api_respond_primary_transfer',
        outcome: 'ACCEPTED',
      });
      await friend.goto(`/dogs/${dogId}/ownership`);
      await expect(
        friend.getByText('Staging friend', { exact: true }).locator('..'),
      ).toContainText('Primary owner');

      await coowner.goto(`/dogs/${dogId}/ownership`);
      await expect(
        coowner
          .getByText('Staging coowner', { exact: true })
          .locator('..'),
      ).toContainText('Co-owner');

      await friend
        .getByRole('button', { name: 'Leave ownership', exact: true })
        .click();
      await expect(friend.getByRole('checkbox')).toBeVisible();
      await friend
        .getByRole('combobox')
        .selectOption({ label: 'Staging coowner' });
      const intendedSuccessor = await friend
        .getByRole('option', { name: 'Staging coowner', exact: true })
        .getAttribute('value');
      await expect(friend.getByRole('combobox')).toHaveValue(
        intendedSuccessor!,
      );
      await friend.getByRole('checkbox').check();
      await expect(friend.getByRole('combobox')).toHaveValue(
        intendedSuccessor!,
      );
      const successorMemberId = await friend
        .getByRole('combobox')
        .inputValue();
      const departure = await clickRpc({
        page: friend,
        control: friend
          .getByRole('dialog', { name: 'Leave ownership' })
          .getByRole('button', {
            name: 'Leave ownership',
            exact: true,
          }),
        name: 'api_leave_dog',
        outcome: 'LEFT',
        expectedPayload: {
          p_selected_successor_member_id: successorMemberId,
        },
      });
      expect(resultString(departure, 'successor_user_id')).toBe(
        fixtures.accounts.coowner.id,
      );
      await expect(
        coowner
          .getByText('Staging coowner', { exact: true })
          .locator('..'),
      ).toContainText('Primary owner', { timeout: 15_000 });
      await expect(
        coowner.getByText('Staging friend', { exact: true }),
      ).toHaveCount(0);
      await coowner
        .getByRole('button', { name: 'Propose deletion', exact: true })
        .click();
      const proposal = await clickRpc({
        page: coowner,
        control: coowner.getByRole('dialog').getByRole('button', {
          name: 'Propose deletion',
          exact: true,
        }),
        name: 'api_propose_dog_deletion',
        outcome: 'CREATED',
      });
      await primary.goto(
        `/dogs/${dogId}/ownership/deletion/${resultString(proposal, 'proposal_id')}`,
      );
      await expect(
        primary.getByText('1 of 2 owners approved', { exact: true }),
      ).toBeVisible();
      await primary
        .getByRole('button', { name: 'Approve deletion', exact: true })
        .click();
      await clickRpc({
        page: primary,
        control: primary
          .getByRole('dialog')
          .getByRole('button', { name: 'Approve deletion', exact: true }),
        name: 'api_respond_dog_deletion',
        outcome: 'DELETION_PREPARED',
      });
      const deleted = await client
        .from('dogs')
        .select('lifecycle_state')
        .eq('id', dogId);
      expect(deleted.error).toBeNull();
      // RLS hides a prepared deletion from authenticated clients immediately.
      expect(deleted.data).toEqual([]);
      expect(productionRequests).toEqual([]);
      expect(pageErrors).toEqual([]);
    } finally {
      // The worker's browser fixture closes these contexts; leave them available
      // until Playwright captures any failure screenshot and trace.
      await client.auth.signOut();
    }
  });
});
