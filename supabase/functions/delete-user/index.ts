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
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(folderPath, {
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

  for (
    let index = 0;
    index < files.length;
    index += STORAGE_DELETE_BATCH_SIZE
  ) {
    const fileBatch = files.slice(index, index + STORAGE_DELETE_BATCH_SIZE);
    const { error } = await supabase.storage.from('users').remove(fileBatch);

    if (error) {
      throw error;
    }
  }
};

const parseAccountDeletionRequest = async (request: Request) => {
  try {
    const body = await request.json();
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      const platform = body.p_client_platform;
      const build = body.p_client_build;
      const successorSelections = body.successorSelections;

      return {
        clientBuild:
          typeof build === 'number' && Number.isInteger(build) && build >= 0
            ? build
            : 1,
        clientPlatform:
          platform === 'IOS' || platform === 'ANDROID' || platform === 'WEB'
            ? platform
            : 'WEB',
        successorSelections:
          successorSelections &&
          typeof successorSelections === 'object' &&
          !Array.isArray(successorSelections)
            ? (successorSelections as Record<string, string>)
            : {},
      };
    }
  } catch {
    // An empty body means deterministic server-selected succession.
  }

  return {
    clientBuild: 1,
    clientPlatform: 'WEB' as const,
    successorSelections: {},
  };
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
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
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

    const authorization = request.headers.get('Authorization')!;
    const deletionRequest = await parseAccountDeletionRequest(request);
    const callerSupabase = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: authorization } },
    });
    // Every dog transition commits together before the irreversible Auth deletion.
    const { data: preparation, error: preparationError } =
      await callerSupabase.rpc('api_prepare_account_erasure', {
        p_client_build: deletionRequest.clientBuild,
        p_client_platform: deletionRequest.clientPlatform,
        p_successor_selections: deletionRequest.successorSelections,
      });

    if (preparationError) {
      return jsonResponse({ error: preparationError.message }, 409);
    }
    if (preparation?.outcome !== 'PREPARED') {
      return jsonResponse(
        { error: preparation?.outcome ?? 'Account erasure preparation failed' },
        409,
      );
    }

    const { error: authError } = await supabase.auth.admin.deleteUser(
      authenticatedUser.id,
    );

    if (authError) {
      return jsonResponse({ error: authError.message }, 500);
    }

    try {
      await deleteUserStorage(authenticatedUser.id, supabase);
    } catch (storageError) {
      // Auth is already gone, so the client must not present this as a retryable
      // account-deletion failure. The reference lets support finish cleanup.
      console.error('Post-deletion legacy Storage cleanup failed', storageError);
      return jsonResponse(
        {
          outcome: 'DELETED_WITH_CLEANUP_PENDING',
          recoveryReference: authenticatedUser.id,
        },
        200,
      );
    }

    return jsonResponse({ outcome: 'DELETED' }, 200);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown deletion error';
    return jsonResponse({ error: errorMessage }, 500);
  }
});
