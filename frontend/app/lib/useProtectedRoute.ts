"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { getAuthEmail, getAuthToken } from "./auth";

export function useProtectedRoute() {
  const router = useRouter();
  const pathname = usePathname();
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const accessToken = getAuthToken();
    const authEmail = getAuthEmail();

    if (!accessToken) {
      router.replace(`/auth?next=${encodeURIComponent(pathname)}`);
      return;
    }

    setToken(accessToken);
    setEmail(authEmail);
    setReady(true);
  }, [pathname, router]);

  return { token, email, ready };
}
