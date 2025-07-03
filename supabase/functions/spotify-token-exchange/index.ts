import { Buffer } from "node:buffer";

// Log to prove the function is running
console.log("Spotify Token Exchange function initialized");

Deno.serve(async (req) => {
  // 1. Set up CORS headers to allow requests from our app
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // This is needed for CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Get the authorization code and redirect URI from the request body
    const { code, redirectUri, codeVerifier } = await req.json();

    if (!code || !redirectUri || !codeVerifier) {
      return new Response(JSON.stringify({ error: "Authorization code, redirect URI, and code verifier are required" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 3. Get Spotify credentials from Supabase environment variables (secrets)
    const CLIENT_ID = Deno.env.get("SPOTIFY_CLIENT_ID");
    const CLIENT_SECRET = Deno.env.get("SPOTIFY_CLIENT_SECRET");

    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error("Missing Spotify credentials in environment variables");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // 4. Prepare the request to send to Spotify's token endpoint
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const formData = new URLSearchParams();
    formData.append('grant_type', 'authorization_code');
    formData.append('code', code);
    formData.append('redirect_uri', redirectUri);
    formData.append('code_verifier', codeVerifier);

    console.log(`Sending request to Spotify with redirect_uri: ${redirectUri}`);

    // 5. Make the actual request to Spotify
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    // 6. Handle the response from Spotify
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Spotify token exchange failed:', errorData);
      return new Response(JSON.stringify({ error: "Failed to exchange authorization code with Spotify", details: errorData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.status,
      });
    }

    const tokenData = await response.json();
    console.log("Successfully exchanged code for token.");

    // 7. Return the successful token data to our app
    return new Response(JSON.stringify(tokenData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 