"use client";

import { useEffect } from "react";
import { AUTH_SIGN_OUT_PATH } from "@/lib/auth/hard-sign-out";

/** Legacy `/logout` URL — submits POST sign-out (GET would be blocked). */
export function SignOutRedirect() {
  useEffect(() => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = AUTH_SIGN_OUT_PATH;
    document.body.appendChild(form);
    form.submit();
  }, []);

  return (
    <p className="text-sm text-muted-foreground text-center p-8">
      Signing you out…
    </p>
  );
}
