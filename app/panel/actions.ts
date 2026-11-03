"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, sessionCookieHeader } from "@/lib/session";

export type ServiceData = { name: string; durationMinutes: number };

export type ServiceState =
  | { ok: true; name: string }
  | { ok: false; error: string }
  | null;

type ApiErrorResponse = { message: string; statusCode: number };

// Forma de respuesta de POST /api/services.
type CreatedServiceResponse = {
  id: string;
  name: string;
  durationMinutes: number;
  isActive: boolean;
};

// La sesión vive solo en la cookie: borrarla cierra la sesión en este navegador.
export async function logoutProfessional(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE_NAME);
  redirect("/entrar");
}

// La API valida y decide; aquí se reenvía con la cookie de la sesión y se devuelve su mensaje.
export async function createService(
  _previousState: ServiceState,
  serviceData: ServiceData,
): Promise<ServiceState> {
  let response: Response;
  try {
    response = await fetch(`${process.env.API_URL}/api/services`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(await sessionCookieHeader()),
      },
      body: JSON.stringify(serviceData),
    });
  } catch {
    return {
      ok: false,
      error: "No pudimos crear el servicio. Intenta de nuevo.",
    };
  }

  // La sesión venció o se cerró en otra pestaña.
  if (response.status === 401) redirect("/entrar");
  if (!response.ok) {
    const errorBody: ApiErrorResponse = await response.json();
    return { ok: false, error: errorBody.message };
  }

  const createdService: CreatedServiceResponse = await response.json();
  // Vuelve a renderizar el panel para que la lista incluya el servicio nuevo.
  refresh();
  return { ok: true, name: createdService.name };
}

export type WeeklyTemplateRangeData = {
  weekday: number;
  startTime: string;
  endTime: string;
};

export type WeeklyTemplateState =
  | { ok: true }
  | { ok: false; error: string }
  | null;

// Reemplaza la plantilla completa; la API valida rangos invertidos y solapes.
export async function saveWeeklyTemplate(
  _previousState: WeeklyTemplateState,
  ranges: WeeklyTemplateRangeData[],
): Promise<WeeklyTemplateState> {
  let response: Response;
  try {
    response = await fetch(`${process.env.API_URL}/api/weekly-template`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        ...(await sessionCookieHeader()),
      },
      body: JSON.stringify({ ranges }),
    });
  } catch {
    return {
      ok: false,
      error: "No pudimos guardar tu horario. Intenta de nuevo.",
    };
  }

  if (response.status === 401) redirect("/entrar");
  if (!response.ok) {
    const errorBody: ApiErrorResponse = await response.json();
    return { ok: false, error: errorBody.message };
  }

  refresh();
  return { ok: true };
}
