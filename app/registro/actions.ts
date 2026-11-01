"use server";

export type RegistrationData = {
  name: string;
  email: string;
  password: string;
  slug: string;
};

export type RegistrationState =
  | { ok: true; slug: string }
  | { ok: false; error: string }
  | null;

// Formas de respuesta de POST /api/professionals.
type CreatedProfessionalResponse = {
  id: string;
  name: string;
  email: string;
  slug: string;
  timezone: string;
};

type ApiErrorResponse = { message: string; statusCode: number };

// La API valida y decide; aquí solo se reenvía y se devuelve su mensaje.
export async function registerProfessional(
  _previousState: RegistrationState,
  registrationData: RegistrationData,
): Promise<RegistrationState> {
  try {
    const response = await fetch(`${process.env.API_URL}/api/professionals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(registrationData),
    });
    if (!response.ok) {
      const errorBody: ApiErrorResponse = await response.json();
      return { ok: false, error: errorBody.message };
    }
    const createdProfessional: CreatedProfessionalResponse =
      await response.json();
    return { ok: true, slug: createdProfessional.slug };
  } catch {
    return {
      ok: false,
      error: "No pudimos crear tu cuenta. Intenta de nuevo.",
    };
  }
}
