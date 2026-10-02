import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import {
  createClient,
  type SupabaseClient,
} from 'https://esm.sh/@supabase/supabase-js@2.112.2';
import { corsHeaders } from '../_shared/cors.ts';

interface StorageJob {
  id: string;
  operation:
    | 'COPY_LEGACY_DOG_IMAGE'
    | 'DELETE_DOG_ASSETS'
    | 'DELETE_ORPHAN_UPLOAD';
  dog_id: string | null;
  image_id: string | null;
  source_bucket: string | null;
  source_path: string | null;
  destination_bucket: string | null;
  destination_path: string | null;
}

const STORAGE_LIST_PAGE_SIZE = 100;
const STORAGE_DELETE_BATCH_SIZE = 100;

const jsonResponse = (body: Record<string, unknown>, status: number) => {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
};

const sha256 = async (bytes: Uint8Array) => {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

const downloadObject = async (
  supabase: SupabaseClient,
  bucket: string,
  path: string,
) => {
  const { data, error } = await supabase.storage.from(bucket).download(path);

  if (error || !data) {
    throw error ?? new Error('Storage object is missing');
  }

  return new Uint8Array(await data.arrayBuffer());
};

const listAllFiles = async (
  supabase: SupabaseClient,
  bucket: string,
  folderPath: string,
): Promise<string[]> => {
  const files: string[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase.storage.from(bucket).list(folderPath, {
      limit: STORAGE_LIST_PAGE_SIZE,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (error) {
      throw error;
    }

    for (const item of data) {
      const path = `${folderPath}/${item.name}`;

      if (item.metadata) {
        files.push(path);
      } else {
        files.push(...(await listAllFiles(supabase, bucket, path)));
      }
    }

    offset += data.length;
    hasMore = data.length === STORAGE_LIST_PAGE_SIZE;
  }

  return files;
};

const processCopyJob = async (supabase: SupabaseClient, job: StorageJob) => {
  if (
    !job.source_bucket ||
    !job.source_path ||
    !job.destination_bucket ||
    !job.destination_path
  ) {
    throw new Error('Copy job paths are incomplete');
  }

  const sourceBytes = await downloadObject(supabase, job.source_bucket, job.source_path);
  const sourceChecksum = await sha256(sourceBytes);
  let destinationBytes: Uint8Array | null = null;

  try {
    destinationBytes = await downloadObject(
      supabase,
      job.destination_bucket,
      job.destination_path,
    );
  } catch {
    const extension = job.destination_path.split('.').pop() ?? 'octet-stream';
    const contentType = extension === 'bin' ? 'application/octet-stream' : `image/${extension}`;
    const { error } = await supabase.storage
      .from(job.destination_bucket)
      .upload(job.destination_path, sourceBytes, { contentType, upsert: false });

    if (error) {
      throw error;
    }

    destinationBytes = await downloadObject(
      supabase,
      job.destination_bucket,
      job.destination_path,
    );
  }

  const destinationChecksum = await sha256(destinationBytes);
  if (
    destinationBytes.byteLength !== sourceBytes.byteLength ||
    destinationChecksum !== sourceChecksum
  ) {
    throw new Error('Copied dog image verification failed');
  }

  const { error } = await supabase.rpc('complete_dog_storage_job', {
    p_checksum: sourceChecksum,
    p_job_id: job.id,
    p_verified_size: sourceBytes.byteLength,
  });

  if (error) {
    throw error;
  }
};

const processDeleteJob = async (supabase: SupabaseClient, job: StorageJob) => {
  if (job.operation === 'DELETE_DOG_ASSETS') {
    if (!job.dog_id) {
      throw new Error('Dog deletion job has no dog id');
    }

    const paths = await listAllFiles(supabase, 'dogs', job.dog_id);
    for (let index = 0; index < paths.length; index += STORAGE_DELETE_BATCH_SIZE) {
      const { error } = await supabase.storage
        .from('dogs')
        .remove(paths.slice(index, index + STORAGE_DELETE_BATCH_SIZE));

      if (error) {
        throw error;
      }
    }
  } else if (job.destination_bucket && job.destination_path) {
    const { error } = await supabase.storage
      .from(job.destination_bucket)
      .remove([job.destination_path]);

    if (error) {
      throw error;
    }
  }

  const { error } = await supabase.rpc('complete_dog_storage_job', {
    p_job_id: job.id,
  });

  if (error) {
    throw error;
  }
};

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const suppliedAuthorization = request.headers.get('Authorization');

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Supabase environment is not configured' }, 500);
  }

  // This endpoint is cron/service-only because every claimed job mutates Storage
  // with service authority. User sessions must never reach this boundary.
  if (suppliedAuthorization !== `Bearer ${serviceRoleKey}`) {
    return jsonResponse({ error: 'Service authentication required' }, 401);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase.rpc('claim_dog_storage_jobs', { p_limit: 20 });

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  let completed = 0;
  let failed = 0;

  for (const job of (data ?? []) as StorageJob[]) {
    try {
      if (job.operation === 'COPY_LEGACY_DOG_IMAGE') {
        await processCopyJob(supabase, job);
      } else {
        await processDeleteJob(supabase, job);
      }
      completed += 1;
    } catch (jobError) {
      failed += 1;
      const errorCode = jobError instanceof Error ? jobError.message : 'UNKNOWN_STORAGE_ERROR';
      await supabase.rpc('fail_dog_storage_job', {
        p_error_code: errorCode,
        p_job_id: job.id,
      });
    }
  }

  return jsonResponse({ claimed: data?.length ?? 0, completed, failed }, 200);
});
