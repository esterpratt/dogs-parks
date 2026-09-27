// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  createClient,
  type SupabaseClient,
  type User,
} from 'https://esm.sh/@supabase/supabase-js@2.112.2';
import { corsHeaders } from '../_shared/cors.ts';

const STORAGE_LIST_PAGE_SIZE = 100;
const STORAGE_DELETE_BATCH_SIZE = 100;

const jsonResponse = (body: Record<string, string>, status: number) => {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
};

const getAuthenticatedUser = async (
  request: Request,
  supabase: SupabaseClient,
): Promise<User | null> => {
  const authorization = request.headers.get('Authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  const accessToken = authorization.slice('Bearer '.length).trim();

  if (!accessToken) {
    return null;
  }

  // Auth verifies the JWT against the Auth service; request bodies are never identity.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    return null;
  }

  return user;
};

const listAllFiles = async (
  bucketName: string,
  folderPath: string,
  supabase: SupabaseClient,
): Promise<string[]> => {
  const allFiles: string[] = [];
  let hasMore = true;
  let offset = 0;

  while (hasMore) {
    const { data, error } = await supabase.storage.from(bucketName).list(folderPath, {
      limit: STORAGE_LIST_PAGE_SIZE,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (error) {
      throw error;
    }

    for (const item of data) {
      const fullPath = `${folderPath}/${item.name}`;

      if (item.metadata) {
        allFiles.push(fullPath);
      } else {
        const nestedFiles = await listAllFiles(bucketName, fullPath, supabase);
        allFiles.push(...nestedFiles);
      }
    }

    hasMore = data.length === STORAGE_LIST_PAGE_SIZE;
    offset += data.length;
  }

  return allFiles;
};

const deleteUserStorage = async (userId: string, supabase: SupabaseClient) => {
  const files = await listAllFiles('users', userId, supabase);

  for (let index = 0; index < files.length; index += STORAGE_DELETE_BATCH_SIZE) {
    const fileBatch = files.slice(index, index + STORAGE_DELETE_BATCH_SIZE);
    const { error } = await supabase.storage.from('users').remove(fileBatch);

    if (error) {
      throw error;
    }
  }
};

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase environment is not configured');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    const authenticatedUser = await getAuthenticatedUser(request, supabase);

    if (!authenticatedUser) {
      return jsonResponse({ error: 'Authentication required' }, 401);
    }

    // The caller is the only deletion target. Shared-dog transitions are added before enablement.
    const { error: authError } = await supabase.auth.admin.deleteUser(authenticatedUser.id);

    if (authError) {
      return jsonResponse({ error: authError.message }, 500);
    }

    await deleteUserStorage(authenticatedUser.id, supabase);

    return jsonResponse({ message: 'User deleted successfully' }, 200);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown deletion error';
    return jsonResponse({ error: errorMessage }, 500);
  }
});
