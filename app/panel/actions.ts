"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME } from "@/lib/session";

// La sesión vive solo en la cookie: borrarla cierra la sesión en este navegador.
export async function logoutProfessional(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE_NAME);
  redirect("/entrar");
}
