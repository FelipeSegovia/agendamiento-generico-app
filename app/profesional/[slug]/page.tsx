import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { formatAppointmentTime } from "@/lib/dates";
import { BookingForm } from "./booking-form";

// Forma de respuesta de GET /api/professionals/:slug. Solo trae datos públicos.
type PublicProfile = {
  name: string;
  slug: string;
  services: { id: string; name: string; durationMinutes: number }[];
};

// Forma de respuesta de GET /api/professionals/:slug/slots. Fechas y horas en la zona del profesional.
type PublicSlotsWeek = {
  timezone: string;
  from: string;
  previousFrom: string | null;
  nextFrom: string | null;
  days: { date: string; slots: { startsAt: string; time: string }[] }[];
};

// La fecha «yyyy-MM-dd» ya está en la zona del profesional: se lee en UTC para no correrla de día.
const dayLabelFormat = new Intl.DateTimeFormat("es-CL", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

// Con un cupo elegido, el ancla lleva al formulario de reserva.
const pageHref = (
  slug: string,
  serviceId: string,
  from?: string,
  slotStartsAt?: string,
) =>
  `/profesional/${slug}?${new URLSearchParams({
    servicio: serviceId,
    ...(from && { desde: from }),
    ...(slotStartsAt && { cupo: slotStartsAt }),
  })}${slotStartsAt ? "#reserva" : ""}`;

export default function PublicProfilePage({
  params,
  searchParams,
}: PageProps<"/profesional/[slug]">) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-12">
      {/* Con cacheComponents, el slug y la query son datos de la petición y exigen un límite de Suspense. */}
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Cargando…</p>}
      >
        <PublicProfileContent params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function fetchSlotsWeek(
  slug: string,
  serviceId: string,
  from?: string,
): Promise<PublicSlotsWeek> {
  const query = new URLSearchParams({ serviceId, ...(from && { from }) });
  const response = await fetch(
    `${process.env.API_URL}/api/professionals/${encodeURIComponent(slug)}/slots?${query}`,
  );
  // Un servicio o una fecha inválidos solo llegan editando la URL a mano.
  if (response.status === 400 || response.status === 404) notFound();
  if (!response.ok) {
    throw new Error(`La API respondió ${response.status} al pedir los cupos.`);
  }
  const week: PublicSlotsWeek = await response.json();
  return week;
}

async function PublicProfileContent({
  params,
  searchParams,
}: Pick<PageProps<"/profesional/[slug]">, "params" | "searchParams">) {
  const { slug } = await params;
  const { servicio, desde, cupo, reservada } = await searchParams;
  const response = await fetch(
    `${process.env.API_URL}/api/professionals/${encodeURIComponent(slug)}`,
  );
  if (response.status === 404) notFound();
  if (!response.ok) {
    throw new Error(`La API respondió ${response.status} al pedir el perfil.`);
  }
  const profile: PublicProfile = await response.json();

  if (profile.services.length === 0) {
    return (
      <>
        <h1 className="text-2xl font-semibold">{profile.name}</h1>
        <p className="text-muted-foreground">
          Por ahora no hay horas disponibles.
        </p>
      </>
    );
  }

  const selectedService =
    profile.services.find((service) => service.id === servicio) ??
    profile.services[0];
  const week = await fetchSlotsWeek(
    slug,
    selectedService.id,
    typeof desde === "string" ? desde : undefined,
  );
  // Si otro cliente lo tomó, el cupo elegido ya no viene en la semana.
  const selectedSlot = week.days
    .flatMap((day) => day.slots)
    .find((slot) => slot.startsAt === cupo);

  return (
    <>
      <h1 className="text-2xl font-semibold">{profile.name}</h1>

      {typeof reservada === "string" && (
        <p
          role="status"
          className="rounded-lg border bg-muted px-4 py-3 text-sm"
        >
          Tu hora de {selectedService.name} quedó reservada para el{" "}
          {formatAppointmentTime(reservada, week.timezone)}.
        </p>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Elige un servicio</h2>
        <ul className="flex flex-wrap gap-2">
          {profile.services.map((service) => {
            const isSelected = service.id === selectedService.id;
            return (
              <li key={service.id}>
                <Link
                  href={pageHref(slug, service.id)}
                  aria-current={isSelected ? "page" : undefined}
                  className={buttonVariants({
                    variant: isSelected ? "default" : "outline",
                  })}
                >
                  {service.name} · {service.durationMinutes} min
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Horas disponibles</h2>
          <p className="text-sm text-muted-foreground">
            Horario de {profile.name} ({week.timezone}).
          </p>
        </div>

        {typeof cupo === "string" && (
          <div
            id="reserva"
            className="flex flex-col gap-4 rounded-lg border px-4 py-4"
          >
            {selectedSlot ? (
              <>
                <h3 className="font-medium">
                  Reservar {selectedService.name} el{" "}
                  {formatAppointmentTime(selectedSlot.startsAt, week.timezone)}
                </h3>
                <BookingForm
                  slug={slug}
                  serviceId={selectedService.id}
                  startsAt={selectedSlot.startsAt}
                />
              </>
            ) : (
              <p role="alert" className="text-sm text-destructive">
                Ese horario ya no está disponible. Elige otro.
              </p>
            )}
          </div>
        )}

        {week.days.length === 0 ? (
          <p className="text-muted-foreground">
            No hay horas disponibles en estos días.
          </p>
        ) : (
          <ul className="flex flex-col divide-y rounded-lg border">
            {week.days.map((day) => (
              <li key={day.date} className="flex flex-col gap-2 px-4 py-3">
                <h3 className="font-medium first-letter:uppercase">
                  {dayLabelFormat.format(new Date(`${day.date}T00:00:00Z`))}
                </h3>
                <ul className="flex flex-wrap gap-2">
                  {day.slots.map((slot) => {
                    const isSelected = slot.startsAt === selectedSlot?.startsAt;
                    return (
                      <li key={slot.startsAt}>
                        <Link
                          href={pageHref(
                            slug,
                            selectedService.id,
                            week.from,
                            slot.startsAt,
                          )}
                          aria-current={isSelected ? "true" : undefined}
                          className={`${buttonVariants({
                            variant: isSelected ? "default" : "outline",
                            size: "sm",
                          })} tabular-nums`}
                        >
                          {slot.time}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}

        <nav aria-label="Otros días" className="flex justify-between gap-2">
          {week.previousFrom ? (
            <Link
              href={pageHref(slug, selectedService.id, week.previousFrom)}
              className={buttonVariants({ variant: "outline" })}
            >
              ← Días anteriores
            </Link>
          ) : (
            <span />
          )}
          {week.nextFrom && (
            <Link
              href={pageHref(slug, selectedService.id, week.nextFrom)}
              className={buttonVariants({ variant: "outline" })}
            >
              Días siguientes →
            </Link>
          )}
        </nav>
      </section>
    </>
  );
}
