"use server";

import { signIn } from "@/auth";
import { CredentialsSignin } from "next-auth";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

function isNextRedirect(error: unknown): boolean {
  if (isRedirectError(error)) return true;
  if (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    String((error as { digest: string }).digest).startsWith("NEXT_REDIRECT")
  ) {
    return true;
  }
  return false;
}

function isCredentialsSignin(error: unknown): boolean {
  if (error instanceof CredentialsSignin) return true;
  const t = typeof error === "object" && error !== null ? (error as { type?: string }).type : null;
  return t === "CredentialsSignin";
}

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", {
      username,
      password,
      redirectTo: "/chat",
    });
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (isCredentialsSignin(error)) {
      redirect("/login?error=credentials");
    }
    console.error("[loginAction]", error);
    redirect("/login?error=callback");
  }
}
