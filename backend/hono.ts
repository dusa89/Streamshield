import { config } from "dotenv";
import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

// Load environment variables from .env file
config();

// app will be mounted at /api
const app = new Hono();

// Enable CORS for all routes
app.use("*", cors());

// Mount tRPC router at /trpc
app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  }),
);

// Simple health check endpoint
app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

// Spotify OAuth token exchange endpoint
app.post("/api/spotify/exchange", async (c) => {
  try {
    const { code, redirectUri } = await c.req.json();

    if (!code) {
      return c.json({ error: "Authorization code is required" }, 400);
    }

    if (!redirectUri) {
      return c.json({ error: "Redirect URI is required" }, 400);
    }

    const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

    if (!CLIENT_ID ?? !CLIENT_SECRET) {
      console.error("Missing Spotify credentials in environment variables");
      return c.json({ error: "Server configuration error" }, 500);
    }

    // Create Basic Auth header
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
      "base64",
    );

    // Prepare form data for Spotify API
    const formData = new URLSearchParams();
    formData.append("grant_type", "authorization_code");
    formData.append("code", code);
    formData.append("redirect_uri", redirectUri);

    console.log("🔍 Backend sending to Spotify:");
    console.log("  - grant_type: authorization_code");
    console.log("  - code:", code.substring(0, 20) + "...");
    console.log("  - redirect_uri:", redirectUri);

    // Make request to Spotify token endpoint
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Spotify token exchange failed:", errorData);
      return c.json({ error: "Failed to exchange authorization code" }, 500);
    }

    const tokenData = await response.json();
    return c.json(tokenData);
  } catch (error) {
    console.error("Token exchange error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Spotify OAuth token refresh endpoint
app.post("/api/spotify/refresh", async (c) => {
  try {
    const { refreshToken } = await c.req.json();

    if (!refreshToken) {
      return c.json({ error: "Refresh token is required" }, 400);
    }

    const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

    if (!CLIENT_ID ?? !CLIENT_SECRET) {
      console.error("Missing Spotify credentials in environment variables");
      return c.json({ error: "Server configuration error" }, 500);
    }

    // Create Basic Auth header
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
      "base64",
    );

    // Prepare form data for Spotify API
    const formData = new URLSearchParams();
    formData.append("grant_type", "refresh_token");
    formData.append("refresh_token", refreshToken);

    // Make request to Spotify token endpoint
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Spotify token refresh failed:", errorData);
      return c.json({ error: "Failed to refresh token" }, 500);
    }

    const tokenData = await response.json();
    return c.json(tokenData);
  } catch (error) {
    console.error("Token refresh error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;

// Start the server if this file is run directly
if (require.main === module) {
  const port = process.env.PORT ?? 3000;
  console.log(`🚀 Server starting on port ${port}`);

  // For development with tsx
  const { serve } = require("@hono/node-server");
  serve({
    fetch: app.fetch,
    port: parseInt(port.toString()),
    hostname: "0.0.0.0", // Bind to all network interfaces
  });

  console.log(`✅ Server running at http://0.0.0.0:${port}`);
  console.log(`🌐 Accessible from network at http://172.25.208.1:${port}`);
}
