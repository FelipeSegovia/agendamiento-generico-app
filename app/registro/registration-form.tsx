"use client";

import Link from "next/link";
import {
  type FormEvent,
  startTransition,
  useActionState,
  useState,
} from "react";
import { LuCircleCheck } from "react-icons/lu";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type RegistrationData, registerProfessional } from "./actions";

// Mismas reglas y mensajes que el DTO de la API; la API es la que decide.
const registrationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Ingresa tu nombre.")
    .max(100, "El nombre puede tener hasta 100 caracteres."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(50, "Ingresa un correo válido.")
    .pipe(z.email("Ingresa un correo válido.")),
  password: z
    .string()
    .min(8, "La clave debe tener al menos 8 caracteres.")
    .max(70, "La clave puede tener hasta 70 caracteres."),
  slug: z
    .string()
    .regex(
      /^[a-z0-9-]+$/,
      "La dirección de tu página solo puede tener minúsculas, números y guiones.",
    )
    .max(60, "La dirección de tu página puede tener hasta 60 caracteres."),
});

// Propuesta para el slug: «Ana Pérez» → «ana-perez». El cliente puede editarla.
function slugFromName(name: string) {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 60)
    .replace(/^-+|-+$/g, "");
}

export function RegistrationForm() {
  const [state, submitRegistration, isPending] = useActionState(
    registerProfessional,
    null,
  );
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugEdited, setIsSlugEdited] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof RegistrationData, string>>
  >({});

  function handleNameChange(value: string) {
    setName(value);
    if (!isSlugEdited) setSlug(slugFromName(value));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = registrationSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (!result.success) {
      setFieldErrors(
        Object.fromEntries(
          result.error.issues.map((issue) => [
            String(issue.path[0]),
            issue.message,
          ]),
        ),
      );
      return;
    }
    setFieldErrors({});
    startTransition(() => submitRegistration(result.data));
  }

  if (state?.ok) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border p-6">
        <LuCircleCheck className="size-8 text-green-600" aria-hidden />
        <p className="font-medium">Cuenta creada.</p>
        <p className="text-sm text-muted-foreground">
          Tu página pública quedará en /p/{state.slug}.
        </p>
        <Link
          href="/entrar"
          className="text-sm font-medium text-foreground underline"
        >
          Entrar a mi panel
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Field id="name" label="Nombre" error={fieldErrors.name}>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(event) => handleNameChange(event.target.value)}
        />
      </Field>

      <Field id="email" label="Correo" error={fieldErrors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" />
      </Field>

      <Field
        id="password"
        label="Clave (mínimo 8 caracteres)"
        error={fieldErrors.password}
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
        />
      </Field>

      <Field id="slug" label="Dirección de tu página" error={fieldErrors.slug}>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">/p/</span>
          <Input
            id="slug"
            name="slug"
            value={slug}
            onChange={(event) => {
              setSlug(event.target.value);
              setIsSlugEdited(true);
            }}
          />
        </div>
      </Field>

      {state && !state.ok && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Creando cuenta…" : "Crear cuenta"}
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
