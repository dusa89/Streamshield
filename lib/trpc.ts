import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  // For local development, use localhost
  if (__DEV__) {
    // IMPORTANT: This IP address must be your computer's local network IP
    // so that your phone can connect to the backend server during development.
    return "http://172.25.208.1:3000";
  }

  // For production, use environment variable if set
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  // Fallback for development
  return "http://172.25.208.1:3000";
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
    }),
  ],
});
