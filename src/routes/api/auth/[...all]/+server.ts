import { auth } from '$lib/server/auth';
import type { RequestHandler } from './$types';

// Better Auth's HTTP handler for every /api/auth/* endpoint (OAuth callbacks,
// session, sign-out, etc). Backing this with a real route — rather than relying
// solely on the server hook — ensures the routes are deployed and reachable on
// adapters that build their routing from the filesystem (e.g. Vercel).
export const GET: RequestHandler = ({ request }) => auth.handler(request);
export const POST: RequestHandler = ({ request }) => auth.handler(request);
