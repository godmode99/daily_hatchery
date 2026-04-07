"use client";

import { signIn } from "next-auth/react";

export function GoogleSignInButton() {
  return (
    <button
      className="mt-6 inline-flex w-fit rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
      type="button"
      onClick={() => void signIn("google", { callbackUrl: "/admin" })}
    >
      เข้าสู่ระบบด้วย Google
    </button>
  );
}
