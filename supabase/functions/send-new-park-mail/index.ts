// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

serve(async (req) => {
  const newParkData = await req.json();

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'team@klavhub.com',
      to: 'esterpratt@gmail.com',
      subject: 'A new park was added',
      html: `The new park details are: ${JSON.stringify(newParkData)}`,
    }),
  });

  const mailResData = await res.json();

  return new Response(JSON.stringify(mailResData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-new-park-mail' \
    --header "Authorization: Bearer $SUPABASE_ANON_KEY" \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
