"use client";

import {
  type FormEvent,
  startTransition,
  useActionState,
  useState,
} from "react";
import { z } from "zod";
import { Field, fieldErrorsFrom } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type BookingData, bookAppointment } from "./actions";

type ContactData = Pick<BookingData, "name" | "email" | "phone">;

// Mismas reglas y mensajes que el DTO de la API; la API es la que decide.
const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Ingresa tu nombre.")
    .max(100, "El nombre puede tener hasta 100 caracteres."),
  email: z
    .string()
    .trim()
    .min(1, "Ingresa tu correo.")
    .max(100, "Ingresa un correo válido.")
    .pipe(z.email("Ingresa un correo válido.")),
  phone: z
    .string()
    .trim()
    .min(1, "Ingresa tu teléfono.")
    .regex(/^\+?[\d\s()-]{8,20}$/, "Ingresa un teléfono válido."),
});

export function BookingForm({
  slug,
  serviceId,
  startsAt,
}: Pick<BookingData, "slug" | "serviceId" | "startsAt">) {
  const [state, submitBooking, isPending] = useActionState(
    bookAppointment,
    null,
  );
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ContactData, string>>
  >({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = contactSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (!result.success) {
      setFieldErrors(fieldErrorsFrom(result.error));
      return;
    }
    setFieldErrors({});
    startTransition(() =>
      submitBooking({ slug, serviceId, startsAt, ...result.data }),
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Field id="name" label="Nombre" error={fieldErrors.name}>
        <Input id="name" name="name" autoComplete="name" />
      </Field>

      <Field id="email" label="Correo" error={fieldErrors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" />
      </Field>

      <Field id="phone" label="Teléfono" error={fieldErrors.phone}>
        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+56 9 1234 5678"
        />
      </Field>

      {state && !state.ok && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Reservando…" : "Reservar"}
      </Button>
    </form>
  );
}
