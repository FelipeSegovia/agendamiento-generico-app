"use client";

import {
  type FormEvent,
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { z } from "zod";
import { Field, fieldErrorsFrom } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createService, type ServiceData } from "./actions";

const DURATION_MESSAGE =
  "La duración debe ser un número entero de minutos mayor que cero.";

// Mismas reglas y mensajes que el DTO de la API; la API es la que decide.
const serviceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Ingresa el nombre del servicio.")
    .max(100, "El nombre puede tener hasta 100 caracteres."),
  // El input entrega texto: un campo vacío queda en 0 y lo rechaza el mínimo.
  durationMinutes: z.coerce
    .number({ error: DURATION_MESSAGE })
    .int(DURATION_MESSAGE)
    .min(1, DURATION_MESSAGE)
    .max(1440, "La duración puede ser de hasta 1440 minutos."),
});

export function ServiceForm() {
  const [state, submitService, isPending] = useActionState(createService, null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ServiceData, string>>
  >({});
  const formRef = useRef<HTMLFormElement>(null);

  // Limpia el formulario después de crear, para cargar el siguiente servicio.
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = serviceSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (!result.success) {
      setFieldErrors(fieldErrorsFrom(result.error));
      return;
    }
    setFieldErrors({});
    startTransition(() => submitService(result.data));
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4"
    >
      <Field id="name" label="Nombre" error={fieldErrors.name}>
        <Input id="name" name="name" placeholder="Consulta" />
      </Field>

      <Field
        id="durationMinutes"
        label="Duración (minutos)"
        error={fieldErrors.durationMinutes}
      >
        <Input
          id="durationMinutes"
          name="durationMinutes"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          placeholder="60"
        />
      </Field>

      {state && !state.ok && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="text-sm text-muted-foreground">
          Servicio «{state.name}» creado y activo.
        </p>
      )}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Creando servicio…" : "Crear servicio"}
      </Button>
    </form>
  );
}
