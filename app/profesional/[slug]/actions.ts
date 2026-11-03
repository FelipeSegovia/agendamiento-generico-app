"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

export type BookingData = {
  slug: string;
  serviceId: string;
  startsAt: string;
  name: string;
  email: string;
  phone: string;
};

export type BookingState = { ok: false; error: string } | null;

type ApiErrorResponse = { message: string; statusCode: number };

// La API valida y decide; aquí se reenvía la reserva y se devuelve su mensaje.
export async function bookAppointment(
  _previousState: BookingState,
  { slug, ...booking }: BookingData,
): Promise<BookingState> {
  let response: Response;
  try {
    response = await fetch(
      `${process.env.API_URL}/api/professionals/${encodeURIComponent(slug)}/appointments`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(booking),
      },
    );
  } catch {
    return {
      ok: false,
      error: "No pudimos reservar tu hora. Intenta de nuevo.",
    };
  }

  if (!response.ok) {
    const errorBody: ApiErrorResponse = await response.json();
    // Si otro cliente tomó el cupo, la página se actualiza y ya no lo ofrece.
    if (response.status === 409) refresh();
    return { ok: false, error: errorBody.message };
  }

  redirect(
    `/profesional/${slug}?${new URLSearchParams({
      servicio: booking.serviceId,
      reservada: booking.startsAt,
    })}`,
  );
}
