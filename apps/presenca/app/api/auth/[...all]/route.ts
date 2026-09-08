import { getAuth } from "@/lib/auth";

async function handler(req: Request) {
  const auth = await getAuth(new URL(req.url).origin);
  return auth.handler(req);
}

export { handler as GET, handler as POST };
