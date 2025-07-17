import { Buffer } from "node:buffer";


// Deno types for Edge Functions
declare global {
  interface Window {
    Deno: {
      env: {
        get(key: string): string | undefined;
      };
      serve(handler: (req: Request) => Promise<Response>): void;
    };
  }
}

const Deno = (globalThis as any).Deno;

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log('Starting token refresh...');
    const { refreshToken } = await req.json();
    console.log('Received refreshToken:', !!refreshToken);
    if (!refreshToken) {
      console.error("Missing refresh token in request");
      return new Response(JSON.stringify({ error: "Refresh token is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const CLIENT_ID = Deno.env.get("SPOTIFY_CLIENT_ID");
    const CLIENT_SECRET = Deno.env.get("SPOTIFY_CLIENT_SECRET");
    console.log('Spotify credentials:', { hasClientId: !!CLIENT_ID, hasClientSecret: !!CLIENT_SECRET });

    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET environment variables");
      return new Response(JSON.stringify({ 
        error: "Server configuration error: Missing Spotify credentials. Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables in your Supabase project settings.",
        details: {
          hasClientId: !!CLIENT_ID,
          hasClientSecret: !!CLIENT_SECRET
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
      "base64",
    );
    const formData = new URLSearchParams();
    formData.append("grant_type", "refresh_token");
    formData.append("refresh_token", refreshToken);

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    if (!response.ok) {
      // Retry once
      const retryResponse = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });
      if (!retryResponse.ok) {
        const errorData = await retryResponse.json();
        console.error("Spotify refresh failed after retry:", errorData);
        return new Response(JSON.stringify({ error: "Failed after retry" }), { status: 400 });
      }
      const data = await retryResponse.json();
      console.log('Refresh successful, new token data:', { access_token: !!data.access_token });
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const data = await response.json();
    console.log('Refresh successful, new token data:', { access_token: !!data.access_token });
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    console.error('Refresh error details:', error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ 
      error: errorMessage,
      type: "unexpected_error"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
