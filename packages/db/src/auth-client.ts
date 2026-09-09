"use client";

import { anonymousClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Cliente do browser — sem baseURL de propósito: cada app (Presença,
// Cuida) serve o próprio Route Handler em `/api/auth/[...all]` no mesmo
// domínio, então o cliente já aponta pra origem certa por padrão.
export const authClient = createAuthClient({
  plugins: [anonymousClient()],
});
