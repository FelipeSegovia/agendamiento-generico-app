"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME } from "@/lib/session";

export type LoginCredentials = { email: string; password: string };

export type LoginState = { error: string } | null;

type ApiErrorResponse = { message: string; statusCode: number };

const LOGIN_UNAVAILABLE_MESSAGE =
  "No pudimos iniciar sesión. Intenta de nuevo.";

// La API valida las credenciales y emite la cookie de sesión; aquí se reenvía al navegador.
//
// Flujo de la cookie:
// 1. El navegador envía el formulario a esta Server Action, que corre en el servidor de Next.
// 2. Next llama a la API de servidor a servidor. El `Set-Cookie` de la API llega a este
//    fetch, no al navegador, que nunca habla directo con la API.
// 3. Por eso se copia la cookie con `cookies().set()`: Next la incluye en su propia
//    respuesta y el navegador la guarda para el dominio del front.
// 4. Desde ahí, el navegador la envía en cada visita a Next, y `requireSessionProfessional`
//    (lib/session.ts) la reenvía a la API en el header `cookie` para pedir `/api/auth/me`.
export async function loginProfessional(
  _previousState: LoginState,
  credentials: LoginCredentials,
): Promise<LoginState> {
  let response: Response;
  try {
    // Corre en el servidor de Next, así que API_URL no se expone al navegador.
    response = await fetch(`${process.env.API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(credentials),
    });
  } catch {
    return { error: LOGIN_UNAVAILABLE_MESSAGE };
  }

  // 400 o 401: la API ya trae el mensaje en español listo para mostrar en el formulario.
  if (!response.ok) {
    const errorBody: ApiErrorResponse = await response.json();
    return { error: errorBody.message };
  }

  // Un `Set-Cookie` se ve así: `professional_session=<jwt>; Max-Age=604800; Path=/; HttpOnly; ...`.
  // `getSetCookie()` devuelve cada uno por separado, y se busca el de la sesión por su nombre.
  const sessionCookie = response.headers
    .getSetCookie()
    .find((setCookie) => setCookie.startsWith(`${SESSION_COOKIE_NAME}=`));
  if (!sessionCookie) return { error: LOGIN_UNAVAILABLE_MESSAGE };

  // El primer segmento es `nombre=valor` (el JWT); el resto son atributos.
  // De los atributos solo se lee `Max-Age`, para que la cookie venza junto con el JWT (7 días).
  const [sessionPair, ...cookieAttributes] = sessionCookie.split(";");
  const maxAgeAttribute = cookieAttributes
    .map((attribute) => attribute.trim())
    .find((attribute) => attribute.toLowerCase().startsWith("max-age="));

  // Los demás atributos se vuelven a declarar aquí, porque `cookies().set()` no recibe
  // el texto del `Set-Cookie` tal cual.
  (await cookies()).set(
    SESSION_COOKIE_NAME,
    sessionPair.slice(SESSION_COOKIE_NAME.length + 1),
    {
      // El JavaScript del navegador no puede leerla; solo viaja en las peticiones.
      httpOnly: true,
      // Solo por HTTPS en producción; en local el front corre en http://localhost.
      secure: process.env.NODE_ENV === "production",
      // Viaja al navegar hacia el sitio desde otro lado, pero no en peticiones cruzadas de fondo.
      sameSite: "lax",
      path: "/",
      // Sin `Max-Age`, queda como cookie de sesión del navegador y se borra al cerrarlo.
      maxAge: maxAgeAttribute
        ? Number(maxAgeAttribute.split("=")[1])
        : undefined,
    },
  );
  // `redirect` lanza una excepción interna de Next, por eso va fuera del try.
  // La respuesta de la redirección ya lleva la cookie recién puesta.
  redirect("/panel");
}
