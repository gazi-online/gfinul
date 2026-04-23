import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const encoder = new TextEncoder()

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

const sha1 = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-1', encoder.encode(value))
  return toHex(digest)
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authorization = request.headers.get('Authorization')
    if (!authorization) {
      return new Response(JSON.stringify({ error: 'Missing authorization header.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME') ?? ''
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY') ?? ''
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET') ?? ''

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey || !cloudName || !apiKey || !apiSecret) {
      return new Response(JSON.stringify({ error: 'Missing function environment variables.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
    })

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser()

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized user.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { data: userRow, error: userError } = await adminClient
      .from('users')
      .select('is_admin, role')
      .eq('id', user.id)
      .single()

    if (userError) {
      return new Response(JSON.stringify({ error: 'Unable to verify admin access.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const isAdmin = Boolean(userRow?.is_admin) || userRow?.role === 'admin'

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const requestBody = await request.json().catch(() => ({}))
    const folder = typeof requestBody?.folder === 'string' && requestBody.folder.trim() ? requestBody.folder.trim() : 'products'
    const timestamp = Math.floor(Date.now() / 1000)
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`
    const signature = await sha1(`${paramsToSign}${apiSecret}`)

    return new Response(
      JSON.stringify({
        apiKey,
        cloudName,
        folder,
        signature,
        timestamp,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
