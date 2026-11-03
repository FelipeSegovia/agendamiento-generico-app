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
import { type LoginCredentials, loginProfessional } from "./actions";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Ingresa un correo válido.")),
  password: z.string().min(1, "Ingresa tu clave."),
});

export function LoginForm() {
  const [state, submitLogin, isPending] = useActionState(
    loginProfessional,
    null,
  );
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof LoginCredentials, string>>
  >({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = loginSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (!result.success) {
      setFieldErrors(fieldErrorsFrom(result.error));
      return;
    }
    setFieldErrors({});
    startTransition(() => submitLogin(result.data));
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Field id="email" label="Correo" error={fieldErrors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" />
      </Field>

      <Field id="password" label="Clave" error={fieldErrors.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
        />
      </Field>

      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
