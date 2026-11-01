import { RegistrationForm } from "./registration-form";

export default function RegistrationPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Crea tu cuenta profesional</h1>
        <p className="text-sm text-muted-foreground">
          Tus clientes podrán reservar en tu página pública.
        </p>
      </div>
      <RegistrationForm />
    </main>
  );
}
