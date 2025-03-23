// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";
import { corsHeaders } from '../_shared/cors.ts';

const deleteUserStorage = async (id: string, supabase) => {
  const listAllFiles = async (bucketName, folderPath = '') => {
    const { data, error: listError } = await supabase.storage.from(bucketName).list(folderPath);

    if (listError) {
      throw listError;
    }

    let allFiles = [];

    for (const item of data) {
      const fullPath = folderPath ? `${folderPath}/${item.name}` : item.name;

      if (item.metadata) {
        allFiles.push(fullPath);
      } else {
        const subFiles = await listAllFiles(bucketName, fullPath);
        allFiles = allFiles.concat(subFiles);
      }
    }

    return allFiles;
  };

  const files = await listAllFiles('users', `${id}`);

  const filesPaths = files.map(file => {
    const index = file.lastIndexOf('users/');
    return index !== -1 ? file.slice(index + 'users/'.length) : file;
  })
  
  if (filesPaths?.length) {
    const { error: deleteFilesError } = await supabase
    .storage
    .from('users')
    .remove(filesPaths)

    if (deleteFilesError) {
      throw deleteFilesError;
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  try {
    const { id } = await req.json();

    if (!id) {
      return new Response(JSON.stringify({ error: "User ID is required" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    
    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
    }

    await deleteUserStorage(id, supabase);

    return new Response(JSON.stringify({ message: "User deleted successfully" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});


/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/delete-user' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
