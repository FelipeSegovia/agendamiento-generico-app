import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Mismo nombre que usa la API para su cookie de sesión; si cambia allá, cambia aquí.
export const SESSION_COOKIE_NAME = "professional_session";

export type SessionProfessional = {
  id: string;
  name: string;
  email: string;
  slug: string;
  timezone: string;
};

// Devuelve el profesional de la sesión. Sin una sesión válida, manda a iniciar sesión.
export async function requireSessionProfessional(): Promise<SessionProfessional> {
  const sessionToken = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!sessionToken) redirect("/entrar");

  const response = await fetch(`${process.env.API_URL}/api/auth/me`, {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${sessionToken}` },
  });
  if (response.status === 401) redirect("/entrar");
  if (!response.ok) {
    throw new Error(`La API respondió ${response.status} al pedir la sesión.`);
  }

  const sessionProfessional: SessionProfessional = await response.json();
  return sessionProfessional;
}
