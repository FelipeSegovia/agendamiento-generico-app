import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Entra a tu panel</h1>
        <p className="text-sm text-muted-foreground">
          Usa el correo y la clave de tu cuenta.
        </p>
      </div>
      <LoginForm />
      <p className="text-sm text-muted-foreground">
        ¿Aún no tienes cuenta?{" "}
        <Link
          href="/registro"
          className="font-medium text-foreground underline"
        >
          Créala aquí
        </Link>
      </p>
    </main>
  );
}
