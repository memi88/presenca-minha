import "server-only";

import type { R2Bucket } from "@cloudflare/workers-types";
import { getCloudflareContext } from "@opennextjs/cloudflare";

declare global {
  interface CloudflareEnv {
    MEDIA: R2Bucket;
  }
}

/**
 * Bucket R2 desta app — montado por requisição, mesmo motivo de
 * `getDb()`/`getAuth()` (o binding só existe dentro do Worker).
 */
export async function getMedia() {
  const { env } = await getCloudflareContext({ async: true });
  return env.MEDIA;
}
