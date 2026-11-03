import { notFound } from "next/navigation";
import { Suspense } from "react";

// Forma de respuesta de GET /api/professionals/:slug. Solo trae datos públicos.
type PublicProfile = {
  name: string;
  slug: string;
  services: { id: string; name: string; durationMinutes: number }[];
};

export default function PublicProfilePage({
  params,
}: PageProps<"/profesional/[slug]">) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-12">
      {/* Con cacheComponents, el slug es dato de la petición y exige un límite de Suspense. */}
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Cargando…</p>}
      >
        <PublicProfileContent params={params} />
      </Suspense>
    </main>
  );
}

async function PublicProfileContent({
  params,
}: Pick<PageProps<"/profesional/[slug]">, "params">) {
  const { slug } = await params;
  const response = await fetch(
    `${process.env.API_URL}/api/professionals/${encodeURIComponent(slug)}`,
  );
  if (response.status === 404) notFound();
  if (!response.ok) {
    throw new Error(`La API respondió ${response.status} al pedir el perfil.`);
  }
  const profile: PublicProfile = await response.json();

  return (
    <>
      <h1 className="text-2xl font-semibold">{profile.name}</h1>
      {profile.services.length === 0 ? (
        <p className="text-muted-foreground">
          Por ahora no hay horas disponibles.
        </p>
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border">
          {profile.services.map((service) => (
            <li
              key={service.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <span className="font-medium">{service.name}</span>
              <span className="text-sm text-muted-foreground">
                {service.durationMinutes} min
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
