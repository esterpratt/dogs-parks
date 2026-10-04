import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { test, expect } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database, Json } from '../../../src/types/supabase';
import { loginWithEmail } from '../helpers/auth';
import { setupTestEnvironment } from '../helpers/setup';

interface Account {
  id: string;
  email: string;
  password: string;
}

interface BrowserRun {
  stagingRef: string;
  accounts: Record<'primary' | 'friend' | 'coowner', Account>;
}

interface JoinProps {
  owner: SupabaseClient<Database>;
  recipient: SupabaseClient<Database>;
  dogId: string;
  recipientId: string;
}

const stagingRef = 'uhdzwzuyiztktxthwdfp';
const stagingUrl = `https://${stagingRef}.supabase.co`;
const compatibility = { p_client_platform: 'WEB', p_client_build: 1 };

function field(result: Json, name: string): string {
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    throw new Error('Expected server result object');
  }
  const value = result[name];
  if (typeof value !== 'string') {
    throw new Error(`Missing server result field: ${name}`);
  }
  return value;
}

async function join(props: JoinProps) {
  const { owner, recipient, dogId, recipientId } = props;
  const invitation = await owner.rpc('api_create_dog_invite', {
    ...compatibility,
    p_dog_id: dogId,
    p_invitee_user_id: recipientId,
    p_idempotency_key: randomUUID(),
  });
  expect(invitation.error).toBeNull();
  const accepted = await recipient.rpc('api_respond_dog_invite', {
    ...compatibility,
    p_invite_id: field(invitation.data, 'action_id'),
    p_accept: true,
    p_disclosure_accepted: true,
  });
  expect(accepted.error).toBeNull();
  expect(field(accepted.data, 'outcome')).toBe('ACCEPTED');
}

test.describe('staging account erasure', () => {
  // Deletion is restricted to freshly marked synthetic accounts. Normal CI
  // skips the suite before reading any private staging credentials.
  test.skip(process.env.STAGING_E2E !== 'true', 'Requires isolated staging');

  test('reviews every dog, retries preparation and preserves shared photos after erasure', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    if (process.env.VITE_SUPABASE_URL !== stagingUrl) {
      throw new Error('Refusing account erasure outside verified staging');
    }
    execFileSync(
      process.execPath,
      ['supabase/staging/prepare-browser.mjs', '--apply'],
      {
        stdio: 'pipe',
        timeout: 60_000,
      },
    );
    const run: BrowserRun = JSON.parse(
      readFileSync('.private/staging/browser-run.json', 'utf8'),
    );
    expect(run.stagingRef).toBe(stagingRef);
    const clients = {} as Record<
      keyof BrowserRun['accounts'],
      SupabaseClient<Database>
    >;
    for (const role of ['primary', 'friend', 'coowner'] as const) {
      const client = createClient<Database>(
        stagingUrl,
        process.env.VITE_SUPABASE_ANON_KEY!,
        {
          auth: { persistSession: false, autoRefreshToken: false },
        },
      );
      const login = await client.auth.signInWithPassword(run.accounts[role]);
      expect(login.error).toBeNull();
      expect(login.data.user?.id).toBe(run.accounts[role].id);
      expect(login.data.user?.app_metadata.staging_fixture).toBe(
        'browser-journey',
      );
      clients[role] = client;
    }
    const dogs: Record<string, string> = {};
    // Names keep all surviving dogs discoverable by the existing guarded cleanup.
    for (const effect of ['solo', 'transfer', 'leave']) {
      const owner = effect === 'leave' ? clients.friend : clients.primary;
      const created = await owner.rpc('api_create_dog', {
        p_dog: {
          name: `Browser journey ${effect} ${randomUUID()}`,
          birthday: '2020-01-01',
        },
      });
      expect(created.error).toBeNull();
      dogs[effect] = field(created.data, 'dog_id');
    }
    await join({
      owner: clients.primary,
      recipient: clients.friend,
      dogId: dogs.transfer,
      recipientId: run.accounts.friend.id,
    });
    await join({
      owner: clients.primary,
      recipient: clients.coowner,
      dogId: dogs.transfer,
      recipientId: run.accounts.coowner.id,
    });
    await join({
      owner: clients.friend,
      recipient: clients.primary,
      dogId: dogs.leave,
      recipientId: run.accounts.primary.id,
    });
    const members = await clients.primary
      .from('dog_members')
      .select('id,user_id')
      .eq('dog_id', dogs.transfer)
      .is('left_at', null);
    expect(members.error).toBeNull();
    const successor = members.data!.find(
      (member) => member.user_id === run.accounts.coowner.id,
    )!;
    const productionRequests: string[] = [];
    const pageErrors: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('kbsjdfzpeianxhidguam')) {
        productionRequests.push(request.url());
      }
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await setupTestEnvironment(page);
    await loginWithEmail(page, run.accounts.primary);
    await page.goto(`/dogs/${dogs.transfer}`);
    // A real uploaded photo must survive its uploader's Auth/profile removal.
    await page.getByRole('button', { name: 'Add photo', exact: true }).click();
    const finalized = page.waitForResponse(
      `${stagingUrl}/rest/v1/rpc/api_finalize_dog_image`,
    );
    await page
      .getByRole('dialog')
      .locator('input[type="file"]')
      .setInputFiles({
        name: 'erasure-fixture.png',
        mimeType: 'image/png',
        buffer: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j5WQAAAAASUVORK5CYII=',
          'base64',
        ),
      });
    const photoResponse = await finalized;
    expect(photoResponse.ok()).toBe(true);
    const photoId = photoResponse.request().postDataJSON().p_image_id;
    await expect(
      page.locator(`.slider-container img[src*="${photoId}"]`),
    ).toBeVisible();
    await page.goto(
      `/profile/${run.accounts.primary.id}/settings/delete-account`,
    );
    await expect(
      page.getByRole('heading', {
        name: 'Review account deletion',
        exact: true,
      }),
    ).toBeVisible();
    const names = await clients.primary
      .from('dogs')
      .select('id,name')
      .in('id', Object.values(dogs));
    expect(names.error).toBeNull();
    for (const dog of names.data!) {
      const card = page.locator('section').filter({
        has: page.getByRole('heading', { name: dog.name, exact: true }),
      });
      await expect(card).toBeVisible();
      if (dog.id === dogs.transfer) {
        await expect(card).toContainText(
          'will stay with the selected co-owner',
        );
        await card.getByRole('combobox').selectOption(successor.id);
      } else if (dog.id === dogs.solo) {
        await expect(card).toContainText(
          'has no other owners and will be deleted',
        );
      } else {
        await expect(card).toContainText(
          'The dog and its shared photos will stay',
        );
      }
    }
    let attempts = 0;
    await page.route(
      `${stagingUrl}/functions/v1/delete-user`,
      async (route) => {
        // Inject only browser-visible responses, never deployed failure switches.
        // First simulate a pre-Auth rejection. Next perform real deletion before
        // substituting the documented post-Auth cleanup-pending response contract.
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        attempts += 1;
        expect(route.request().postDataJSON().successorSelections).toEqual({
          [dogs.transfer]: successor.id,
        });
        if (attempts === 1) {
          await route.fulfill({
            status: 409,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Injected preparation rejection' }),
          });
          return;
        }
        const response = await route.fetch();
        expect(response.ok()).toBe(true);
        expect((await response.json()).outcome).toBe('DELETED');
        await route.fulfill({
          response,
          json: {
            outcome: 'DELETED_WITH_CLEANUP_PENDING',
            recoveryReference: run.accounts.primary.id,
          },
        });
      },
    );
    await page
      .getByRole('button', { name: 'Delete my account', exact: true })
      .click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Delete', exact: true })
      .click();
    await expect(page.getByRole('alert')).toContainText(
      'Your account was not deleted',
    );
    expect((await clients.primary.auth.getUser()).data.user?.id).toBe(
      run.accounts.primary.id,
    );
    const unchanged = await clients.primary
      .from('dogs')
      .select('id,owner')
      .in('id', Object.values(dogs));
    expect(unchanged.error).toBeNull();
    expect(unchanged.data).toHaveLength(3);
    expect(unchanged.data!.find((dog) => dog.id === dogs.transfer)?.owner).toBe(
      run.accounts.primary.id,
    );
    await expect(page.getByRole('combobox')).toHaveValue(successor.id);
    await page
      .getByRole('button', { name: 'Delete my account', exact: true })
      .click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Delete', exact: true })
      .click();
    await expect(page).toHaveURL(/\/user-deleted$/);
    await expect(
      page.getByText('One cleanup step still needs support', { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(`Recovery reference: ${run.accounts.primary.id}`, {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'esterpratt@gmail.com' }),
    ).toHaveAttribute('href', 'mailto:esterpratt@gmail.com');
    expect(attempts).toBe(2);
    const loginAfterDeletion = await clients.primary.auth.signInWithPassword(
      run.accounts.primary,
    );
    expect(loginAfterDeletion.error).not.toBeNull();
    const surviving = await clients.coowner
      .from('dogs')
      .select('owner,primary_image_id')
      .eq('id', dogs.transfer)
      .single();
    expect(surviving.error).toBeNull();
    expect(surviving.data?.owner).toBe(run.accounts.coowner.id);
    expect(surviving.data?.primary_image_id).toBe(photoId);
    const photo = await clients.coowner
      .from('dog_images')
      .select('uploader_member_id,storage_path,bucket_id')
      .eq('id', photoId)
      .single();
    expect(photo.error).toBeNull();
    expect(photo.data?.uploader_member_id).toBeNull();
    const download = await clients.coowner.storage
      .from(photo.data!.bucket_id)
      .download(photo.data!.storage_path);
    expect(download.error).toBeNull();
    expect(download.data!.size).toBeGreaterThan(0);
    const leftDog = await clients.friend
      .from('dogs')
      .select('owner')
      .eq('id', dogs.leave)
      .single();
    expect(leftDog.error).toBeNull();
    expect(leftDog.data?.owner).toBe(run.accounts.friend.id);
    const solo = await clients.friend
      .from('dogs')
      .select('id')
      .eq('id', dogs.solo);
    expect(solo.error).toBeNull();
    expect(solo.data).toEqual([]);
    const departed = await clients.coowner
      .from('dog_members')
      .select('user_id')
      .eq('dog_id', dogs.transfer)
      .is('left_at', null);
    expect(departed.error).toBeNull();
    expect(departed.data!.map((member) => member.user_id)).not.toContain(
      run.accounts.primary.id,
    );
    // A new private route cannot reuse the deleted browser session.
    await page.goto(
      `/profile/${run.accounts.primary.id}/settings/delete-account`,
    );
    await expect(page).toHaveURL('http://127.0.0.1:5173/');
    await expect(
      page.getByRole('heading', {
        name: 'Review account deletion',
        exact: true,
      }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('link', { name: 'Login', exact: true }),
    ).toHaveAttribute('href', '/login?mode=login');
    expect(productionRequests).toEqual([]);
    expect(pageErrors).toEqual([]);
    await Promise.all(
      Object.values(clients).map((client) => client.auth.signOut()),
    );
  });
});
