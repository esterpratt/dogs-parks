import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { test, expect, Page } from '@playwright/test';
import { Database, Json } from '../../../src/types/supabase';
import { loginWithEmail } from '../helpers/auth';
import { setupTestEnvironment } from '../helpers/setup';

interface Account {
  id: string;
  email: string;
  password: string;
}
interface EdgeFixtures {
  stagingRef: string;
  dogId: string;
  imageId: string;
  inviteId: string;
  accounts: Record<'primary' | 'coowner' | 'friend', Account>;
}
const stagingRef = 'uhdzwzuyiztktxthwdfp';
const stagingUrl = `https://${stagingRef}.supabase.co`;
const compatibility = { p_client_platform: 'WEB', p_client_build: 1 };

function field(result: Json, name: string) {
  if (
    !result ||
    typeof result !== 'object' ||
    Array.isArray(result) ||
    typeof result[name] !== 'string'
  ) {
    throw new Error(`Missing server result field: ${name}`);
  }
  return result[name] as string;
}

async function uploadPhoto(page: Page) {
  const dataUrl = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#ff5555';
    context.fillRect(0, 0, 16, 16);
    return canvas.toDataURL('image/png');
  });
  await page
    .getByRole('button', { name: 'Gallery', exact: true })
    .locator('..')
    .getByRole('button', { name: 'Add photo', exact: true })
    .click();
  const finalized = page.waitForResponse(
    `${stagingUrl}/rest/v1/rpc/api_finalize_dog_image`,
  );
  await page
    .getByRole('dialog')
    .locator('input[type="file"]')
    .setInputFiles({
      name: 'capacity-fixture.png',
      mimeType: 'image/png',
      buffer: Buffer.from(dataUrl.split(',')[1], 'base64'),
    });
  const response = await finalized;
  expect(response.ok()).toBe(true);
  const imageId = response.request().postDataJSON().p_image_id;
  await expect(
    page.locator(`.slider-container img[src*="${imageId}"]`),
  ).toBeVisible();
  return imageId as string;
}

test.describe('staging notification and photo edges', () => {
  // Normal CI skips destructive staging tests before reading private manifests.
  test.skip(process.env.STAGING_E2E !== 'true', 'Requires isolated staging');
  test('notification links, lazy expiry, six-photo limit and missed-event reconnect', async ({
    browser,
  }) => {
    test.setTimeout(180_000);
    if (process.env.VITE_SUPABASE_URL !== stagingUrl) {
      throw new Error('Refusing edge-case tests outside verified staging');
    }
    execFileSync(
      process.execPath,
      ['supabase/staging/prepare-browser-edges.mjs', '--apply'],
      { stdio: 'pipe', timeout: 90_000 },
    );
    const fixture: EdgeFixtures = JSON.parse(
      readFileSync('.private/staging/browser-edges.json', 'utf8'),
    );
    expect(fixture.stagingRef).toBe(stagingRef);
    const primaryClient = createClient<Database>(
      stagingUrl,
      process.env.VITE_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const coownerClient = createClient<Database>(
      stagingUrl,
      process.env.VITE_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    expect(
      (await primaryClient.auth.signInWithPassword(fixture.accounts.primary))
        .error,
    ).toBeNull();
    expect(
      (await coownerClient.auth.signInWithPassword(fixture.accounts.coowner))
        .error,
    ).toBeNull();
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
    ]);
    const [primary, coowner, friend] = await Promise.all(
      contexts.map((context) => context.newPage()),
    );
    const productionRequests: string[] = [];
    const pageErrors: string[] = [];
    for (const [index, page] of [primary, coowner, friend].entries()) {
      page.setDefaultTimeout(15_000);
      page.on('request', (request) => {
        if (request.url().includes('kbsjdfzpeianxhidguam')) {
          productionRequests.push(request.url());
        }
      });
      page.on('response', (response) => {
            if (response.url().includes('/rpc/api_get_current_dog_deletion_proposal') && response.status() === 403) {
              pageErrors.push('Forbidden deletion-proposal read');
            }
          });
          page.on('pageerror', (error) => pageErrors.push(error.message));
      await setupTestEnvironment(page);
      const role = (['primary', 'coowner', 'friend'] as const)[index];
      await loginWithEmail(page, fixture.accounts[role]);
    }
    // The action must be reachable by clicking the actual notification card.
    await friend.goto('/notifications');
    await friend
      .getByRole('button')
      .filter({ hasText: 'Ownership invitation' })
      .click();
    await expect(friend).toHaveURL(
      new RegExp(`/dogs/${fixture.dogId}/ownership$`),
    );
    execFileSync(
      process.execPath,
      [
        'supabase/staging/prepare-browser-edges.mjs',
        '--apply',
        '--expire-invite',
      ],
      { stdio: 'pipe', timeout: 60_000 },
    );
    await friend.getByRole('checkbox').check();
    const expiredResponse = friend.waitForResponse(
      `${stagingUrl}/rest/v1/rpc/api_respond_dog_invite`,
    );
    await friend.getByRole('button', { name: 'Approve', exact: true }).click();
    const expired = await expiredResponse;
    expect(expired.ok()).toBe(true);
    expect((await expired.json()).outcome).toBe('EXPIRED');
    await expect(
      friend.getByText('This action has expired.', { exact: true }),
    ).toBeVisible();
    await friend.goto(`/ownership-actions/invite/${fixture.inviteId}`);
    await expect(friend).toHaveURL(new RegExp(`/dogs/${fixture.dogId}$`));
    await expect(friend.getByText('This action has expired.', { exact: true })).toHaveCount(0);
    await expect(
      friend.getByRole('button', { name: 'Approve', exact: true }),
    ).toHaveCount(0);
    // The recipient's own browser can read the receipt; marking it read must
    // survive reopening the action page from the notification list.
    await expect
      .poll(async () =>
        friend.evaluate(async (inviteId) => {
          const moduleUrl = '/src/services/supabase-client.ts';
          const { supabase } = await import(moduleUrl);
          const result = await supabase
            .from('notifications')
            .select('read_at')
            .eq('target_id', inviteId)
            .single();
          return result.data?.read_at ?? null;
        }, fixture.inviteId),
      )
      .not.toBeNull();
    const persistedInvite = await primaryClient
      .from('dog_invites')
      .select('status')
      .eq('id', fixture.inviteId)
      .single();
    expect(persistedInvite.error).toBeNull();
    expect(persistedInvite.data?.status).toBe('EXPIRED');

    await coowner.goto(`/dogs/${fixture.dogId}`);
    await coowner
      .locator(`.slider-container img[src*="${fixture.imageId}"]`)
      .click();
    await expect(
      coowner
        .getByRole('dialog')
        .getByRole('button', { name: 'Delete', exact: true }),
    ).toHaveCount(0);
    await expect(
      coowner
        .getByRole('dialog')
        .getByRole('button', { name: 'Set as primary', exact: true }),
    ).toBeVisible();
    const forbidden = await coownerClient.rpc('api_delete_dog_image', {
      p_image_id: fixture.imageId,
    });
    expect(forbidden.error?.code).toBe('42501');
    expect(forbidden.error?.message).toBe('dog_image_delete_forbidden');
    await coowner.keyboard.press('Escape');
    await primary.goto(`/dogs/${fixture.dogId}`);
    let newestPhotoId = '';
    for (let imageIndex = 0; imageIndex < 5; imageIndex += 1) {
      newestPhotoId = await uploadPhoto(primary);
    }
    await expect(
      primary.getByRole('button', { name: 'Add photo', exact: true }),
    ).toHaveCount(0);
    const seventh = await primaryClient.rpc('api_reserve_dog_image', {
      p_dog_id: fixture.dogId,
      p_extension: 'png',
    });
    expect(seventh.error?.message).toContain('dog_image_capacity_reached');
    const activeImages = await primaryClient
      .from('dog_images')
      .select('id')
      .eq('dog_id', fixture.dogId)
      .is('deleted_at', null);
    expect(activeImages.error).toBeNull();
    expect(activeImages.data).toHaveLength(6);
    // Scroll the actual carousel to the oldest unknown-uploader image.
    for (let slideIndex = 0; slideIndex < 5; slideIndex += 1) {
      const image = primary.locator(
        `.slick-active img[src*="${fixture.imageId}"]`,
      );
      if (await image.count()) {
        await image.click();
        break;
      }
      // react-slick ignores another arrow click until its transition finishes.
      await expect
        .poll(() =>
          primary.locator('.slick-track').evaluate((track) => {
            const target = new DOMMatrix(
              (track as HTMLElement).style.transform,
            );
            const current = new DOMMatrix(getComputedStyle(track).transform);
            return Math.abs(target.m41 - current.m41);
          }),
        )
        .toBeLessThan(1);
      const activeSlides = primary.locator('.slick-active');
      const firstIndex = await activeSlides.first().getAttribute('data-index');
      await primary.getByRole('button', { name: /Next/ }).click();
      await expect(activeSlides.first()).not.toHaveAttribute(
        'data-index',
        firstIndex!,
      );
    }
    await primary
      .getByRole('dialog')
      .getByRole('button', { name: 'Delete', exact: true })
      .click();
    const deletedResponse = primary.waitForResponse(
      `${stagingUrl}/rest/v1/rpc/api_delete_dog_image`,
    );
    await primary
      .getByRole('dialog')
      .filter({ hasText: 'Hold your leash!' })
      .getByRole('button', { name: 'Delete', exact: true })
      .click();
    expect((await deletedResponse).ok()).toBe(true);
    await expect(
      primary
        .getByRole('button', { name: 'Gallery', exact: true })
        .locator('..')
        .getByRole('button', { name: 'Add photo', exact: true }),
    ).toBeVisible();
    const fallback = await primaryClient
      .from('dogs')
      .select('primary_image_id')
      .eq('id', fixture.dogId)
      .single();
    expect(fallback.error).toBeNull();
    expect(fallback.data?.primary_image_id).toBe(newestPhotoId);
    await coowner.reload();
    await uploadPhoto(coowner);
    await expect(
      coowner.getByRole('button', { name: 'Add photo', exact: true }),
    ).toHaveCount(0);

    // Disconnect only Realtime, keeping the page and its cached authority mounted.
    // The other session accepts a transfer while this socket cannot receive it.
    await primary.goto(`/dogs/${fixture.dogId}/ownership`);
    await expect(
      primary.getByRole('link', { name: 'Me', exact: true }).locator('..'),
    ).toContainText('Primary owner');
    const offerMembers = await primaryClient
      .from('dog_members')
      .select('id')
      .eq('dog_id', fixture.dogId)
      .eq('user_id', fixture.accounts.coowner.id)
      .is('left_at', null)
      .single();
    expect(offerMembers.error).toBeNull();
    const offer = await primaryClient.rpc('api_create_primary_transfer', {
      ...compatibility,
      p_dog_id: fixture.dogId,
      p_to_member_id: offerMembers.data!.id,
      p_idempotency_key: randomUUID(),
    });
    expect(offer.error).toBeNull();
    await coowner.goto('/notifications');
    await coowner
      .getByRole('button')
      .filter({ hasText: 'Primary ownership offered' })
      .click();
    await expect(coowner).toHaveURL(
      new RegExp(
        `/dogs/${fixture.dogId}/ownership/actions/transfer/${field(offer.data, 'action_id')}$`,
      ),
    );
    await primary.evaluate(async () => {
      const moduleUrl = '/src/services/supabase-client.ts';
      const { supabase } = await import(moduleUrl);
      supabase.realtime.disconnect();
    });
    const transferredResponse = coowner.waitForResponse(
      `${stagingUrl}/rest/v1/rpc/api_respond_primary_transfer`,
    );
    await coowner.getByRole('button', { name: 'Approve', exact: true }).click();
    expect((await (await transferredResponse).json()).outcome).toBe('ACCEPTED');
    await expect(
      primary.getByRole('link', { name: 'Me', exact: true }).locator('..'),
    ).toContainText('Primary owner');
    await primary.evaluate(async () => {
      const moduleUrl = '/src/services/supabase-client.ts';
      const { supabase } = await import(moduleUrl);
      supabase.realtime.connect();
    });
    await expect(
      primary
        .getByRole('heading', { name: 'Owners', exact: true })
        .locator('../..')
        .getByText('Staging coowner', { exact: true })
        .locator('..'),
    ).toContainText('Primary owner', { timeout: 30_000 });
    await expect(
      primary.getByRole('button', { name: 'Send offer', exact: true }),
    ).toHaveCount(0);
    expect(productionRequests).toEqual([]);
    expect(pageErrors).toEqual([]);
    await Promise.all([
      primaryClient.auth.signOut(),
      coownerClient.auth.signOut(),
    ]);
  });
});
