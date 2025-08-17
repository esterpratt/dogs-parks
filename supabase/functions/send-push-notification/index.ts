import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FCM_SA_JSON = Deno.env.get('FCM_SERVICE_ACCOUNT_JSON');

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

export enum NotificationType {
  FRIEND_REQUEST = 'friend_request',
  FRIEND_APPROVAL = 'friend_approval',
  PARK_INVITE = 'park_invite',
  PARK_INVITE_RESPONSE = 'park_invite_response',
}

interface WebhookRecord {
  id: string;
  receiver_id: string;
  type: NotificationType;
  title?: string | null;
  push_message?: string | null;
  app_message?: string | null;
  data?: Record<string, unknown> | null;
  sender_id?: string | null;
}

interface NotificationPreferencesRow {
  muted: boolean | null;
  friend_request: boolean | null;
  friend_approval: boolean | null;
}

interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return ok({ ok: true });

  try {
    if (!FCM_SA_JSON) return err({ error: 'FCM service account not configured' }, 500);

    const raw = await req.json();
    const record = normalizePayload(raw);
    const notifId = record.id;

    const senderName = await lookupUserName(record.sender_id || undefined);
    const { title, pushMessage, appMessage } = renderCopy(record.type, { senderName });

    await supabase
      .from('notifications')
      .update({
        title,
        push_message: record.push_message || pushMessage,
        app_message: record.app_message || appMessage,
        data: record.data ?? null,
      })
      .eq('id', notifId)
      .is('title', null);

    // ---- Idempotency ----
    {
      const { data: existing } = await supabase
        .from('notifications')
        .select('id, delivered_at, delivery_attempts')
        .eq('id', notifId)
        .maybeSingle();
      if (existing?.delivered_at) {
        return ok({ message: 'Already delivered', id: notifId });
      }
    }

    // ---- Preferences ----
    const { data: prefs } = await supabase
      .from('notifications_preferences')
      .select('muted, friend_request, friend_approval')
      .eq('user_id', record.receiver_id)
      .maybeSingle<NotificationPreferencesRow>();

    if (prefs?.muted) {
      return ok({ message: 'Muted by user' });
    }

    const prefKey = getPrefKey(record.type);
    
    if (prefKey && prefs && (prefs as unknown)[prefKey] === false) {
      return ok({ message: `Type '${record.type}' disabled by user` });
    }

    // ---- Device tokens ----
    const { data: tokens } = await supabase
      .from('device_tokens')
      .select('token')
      .eq('user_id', record.receiver_id);

    if (!tokens?.length) {
      await incAttempts(notifId);
      return err({ message: 'No device tokens' }, 404);
    }

    const unseenCount = await getUnseenCount(record.receiver_id);

    // ---- FCM payload base ----
    const messageBase = {
      notification: { title, body: pushMessage },
      data: objectToStringDict({
        type: record.type,
        ...(record.data ?? {}),
        sender_id: record.sender_id || '',
        unseen_count: String(unseenCount),
      }),
      android: {
        priority: 'HIGH',
        notification: { channel_id: 'default', default_sound: true },
      },
      apns: {
        headers: { 'apns-push-type': 'alert' },
        payload: {
          aps: {
            sound: 'default',
            badge: unseenCount,
          },
        },
      },
    };

    // ---- Send to all tokens ----
    const accessToken = await getAccessToken(FCM_SA_JSON);
    const cred = JSON.parse(FCM_SA_JSON) as ServiceAccountCredentials;

    let sent = 0, failed = 0;
    await Promise.all(
      tokens.map(async (t) => {
        const res = await fetch(
          `https://fcm.googleapis.com/v1/projects/${cred.project_id}/messages:send`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: { ...messageBase, token: t.token } }),
          }
        );
        if (!res.ok) {
          failed++;
          const txt = await res.text().catch(() => '');
          if (isInvalidFcmTokenError(txt)) await pruneTokenByValue(t.token);
          return;
        }
        sent++;
      })
    );

    if (sent > 0) {
      await supabase
        .from('notifications')
        .update({ delivered_at: new Date().toISOString() })
        .eq('id', notifId)
        .is('delivered_at', null);
    } else {
      await incAttempts(notifId);
    }

    return ok({ success: true, sent, failed, total: tokens.length, unseenCount });
  } catch (e) {
    console.error('send-push-notification error:', e);
    return err({ error: 'Internal server error' }, 500);
  }
});

/* ---------------- helpers ---------------- */

function ok(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}

function err(payload: unknown, status = 500) {
  console.error(JSON.stringify(payload, null, 2));
  return ok(payload, status);
}

function normalizePayload(raw: unknown): WebhookRecord {
  const r = (raw as unknown)?.record ?? raw ?? {};
  return {
    id: r.id,
    receiver_id: r.receiver_id,
    type: r.type,
    title: r.title ?? null,
    push_message: r.push_message ?? null,
    app_message: r.app_message ?? null,
    data: r.data ?? null,
    sender_id: r.sender_id ?? null,
  } as WebhookRecord;
}

function getPrefKey(type: NotificationType): keyof NotificationPreferencesRow | null {
  switch (type) {
    case NotificationType.FRIEND_REQUEST: return 'friend_request';
    case NotificationType.FRIEND_APPROVAL: return 'friend_approval';
    default: return null;
  }
}

async function lookupUserName(userId?: string): Promise<string> {
  if (!userId) return 'Someone';
  const { data } = await supabase.from('users').select('name').eq('id', userId).maybeSingle();
  return data?.name || 'Someone';
}

function renderCopy(type: NotificationType, vars: { senderName?: string }) {
  const who = vars.senderName || 'Someone';
  switch (type) {
    case NotificationType.FRIEND_REQUEST:
      return { title: `${who} sent you a friend request`, pushMessage: `Open KlavHub to respond`, appMessage: `Click to respond` };
    case NotificationType.FRIEND_APPROVAL:
      return { title: `${who} accepted your friend request`, pushMessage: `You are now friends`, appMessage: `You are now friends!` };
    case NotificationType.PARK_INVITE:
      return { title: `${who} invited you to a park`, pushMessage: `See the details in KlavHub`, appMessage: `Click to respond` };
    case NotificationType.PARK_INVITE_RESPONSE:
      return { title: `${who} responded to your invite`, pushMessage: `Open KlavHub to view the response`, appMessage: `Click to view the response` };
    default:
      return { title: 'Notification', pushMessage: '', appMessage: '' };
  }
}

function objectToStringDict(obj: Record<string, unknown>) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = typeof v === 'string' ? v : JSON.stringify(v);
  }
  return out;
}

async function pruneTokenByValue(token: string) {
  await supabase.from('device_tokens').delete().eq('token', token);
}

async function incAttempts(notifId?: string) {
  if (!notifId) return;
  const { data } = await supabase.from('notifications').select('delivery_attempts').eq('id', notifId).maybeSingle();
  const attempts = (data?.delivery_attempts ?? 0) + 1;
  await supabase.from('notifications').update({ delivery_attempts: attempts }).eq('id', notifId);
}

function isInvalidFcmTokenError(body: string): boolean {
  return /\bUNREGISTERED\b/.test(body) || /\bNOT_FOUND\b/.test(body) || /APNS_TOKEN_INVALID/i.test(body) ||
    (/\bINVALID_ARGUMENT\b/.test(body) && /not found|Invalid registration/i.test(body));
}

async function getUnseenCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('receiver_id', userId)
    .is('seen_at', null);
  if (error) {
    console.error('getUnseenCount error:', error.message);
    return 0;
  }
  return count ?? 0;
}

/* ---- FCM OAuth (service account) ---- */
function pemToDer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----BEGIN PRIVATE KEY-----/g, '').replace(/-----END PRIVATE KEY-----/g, '').replace(/\s+/g, '');
  const raw = atob(b64);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf.buffer;
}

async function getAccessToken(serviceAccountJson: string): Promise<string> {
  const cred = JSON.parse(serviceAccountJson) as ServiceAccountCredentials;
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: cred.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const enc = (o: unknown) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  const unsigned = `${enc(header)}.${enc(payload)}`;

  const der = pemToDer(cred.private_key.replace(/\\n/g, '\n'));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned)));
  const sigB64 = btoa(String.fromCharCode(...sig)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  const jwt = `${unsigned}.${sigB64}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`OAuth token exchange failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.access_token as string;
}
