import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { requireSessionProfessional } from "@/lib/session";
import { logoutProfessional } from "./actions";

export default function PanelPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-12">
      {/* Con cacheComponents, leer la cookie de sesión exige un límite de Suspense. */}
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Cargando tu panel…</p>
        }
      >
        <PanelContent />
      </Suspense>
    </main>
  );
}

async function PanelContent() {
  const professional = await requireSessionProfessional();

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Hola, {professional.name}</h1>
        <p className="text-sm text-muted-foreground">
          Tu página pública: /p/{professional.slug}
        </p>
      </div>
      <form action={logoutProfessional}>
        <Button type="submit" variant="outline">
          Cerrar sesión
        </Button>
      </form>
    </div>
  );
}
