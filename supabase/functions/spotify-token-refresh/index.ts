import { Buffer } from "node:buffer";

console.log("Spotify Token Refresh function initialized");

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return new Response(JSON.stringify({ error: "Refresh token is required" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const CLIENT_ID = Deno.env.get("SPOTIFY_CLIENT_ID");
    const CLIENT_SECRET = Deno.env.get("SPOTIFY_CLIENT_SECRET");

    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error("Missing Spotify credentials in environment variables");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const formData = new URLSearchParams();
    formData.append('grant_type', 'refresh_token');
    formData.append('refresh_token', refreshToken);

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Spotify token refresh failed:', errorData);
      return new Response(JSON.stringify({ error: "Failed to refresh token with Spotify", details: errorData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.status,
      });
    }

    const tokenData = await response.json();
    console.log("Successfully refreshed token.");

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