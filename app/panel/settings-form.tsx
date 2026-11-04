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
import { type SettingsData, saveSettings } from "./actions";

const DEADLINE_MESSAGE =
  "El plazo debe ser un número entero de horas mayor que cero.";

// Mismas reglas y mensajes que el DTO de la API; la API es la que decide.
const settingsSchema = z.object({
  confirmationDeadlineHours: z.coerce
    .number({ error: DEADLINE_MESSAGE })
    .int(DEADLINE_MESSAGE)
    .min(1, DEADLINE_MESSAGE)
    .max(720, "El plazo puede ser de hasta 720 horas."),
});

export function SettingsForm({
  initialSettings,
}: {
  initialSettings: SettingsData;
}) {
  const [state, submitSettings, isPending] = useActionState(saveSettings, null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof SettingsData, string>>
  >({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = settingsSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (!result.success) {
      setFieldErrors(fieldErrorsFrom(result.error));
      return;
    }
    setFieldErrors({});
    startTransition(() => submitSettings(result.data));
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Field
        id="confirmationDeadlineHours"
        label="Plazo para confirmar (horas antes de la cita)"
        error={fieldErrors.confirmationDeadlineHours}
      >
        <Input
          id="confirmationDeadlineHours"
          name="confirmationDeadlineHours"
          type="number"
          inputMode="numeric"
          min={1}
          max={720}
          step={1}
          defaultValue={initialSettings.confirmationDeadlineHours}
        />
      </Field>

      {state && !state.ok && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="text-sm text-muted-foreground">
          Plazo guardado. Se aplica a las reservas nuevas.
        </p>
      )}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Guardando plazo…" : "Guardar plazo"}
      </Button>
    </form>
  );
}
