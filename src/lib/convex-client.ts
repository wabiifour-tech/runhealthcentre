// Convex Client Setup for RUN Health Centre HMS
// This provides a Convex client for server-side API routes

let convexClient: any = null;

export async function getConvexClient() {
  if (convexClient) {
    return convexClient;
  }

  // Check if Convex URL is configured
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  
  if (!convexUrl) {
    console.log('[Convex] No CONVEX_URL configured');
    return null;
  }

  try {
    // Dynamic import to avoid issues during build
    const { ConvexHttpClient } = await import('convex/browser');
    convexClient = new ConvexHttpClient(convexUrl);
    console.log('[Convex] Client created successfully');
    return convexClient;
  } catch (error) {
    console.error('[Convex] Failed to create client:', error);
    return null;
  }
}

// Export for convenience
export default getConvexClient;
