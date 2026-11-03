import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { formatAppointmentTime } from "@/lib/dates";
import { requireSessionProfessional, sessionCookieHeader } from "@/lib/session";
import { logoutProfessional, type WeeklyTemplateRangeData } from "./actions";
import { ServiceForm } from "./service-form";
import { WeeklyTemplateForm } from "./weekly-template-form";

// Forma de respuesta de GET /api/services.
type PanelService = {
  id: string;
  name: string;
  durationMinutes: number;
  isActive: boolean;
};

async function fetchServices(): Promise<PanelService[]> {
  const response = await fetch(`${process.env.API_URL}/api/services`, {
    headers: await sessionCookieHeader(),
  });
  if (!response.ok) {
    throw new Error(
      `La API respondió ${response.status} al pedir los servicios.`,
    );
  }
  const services: PanelService[] = await response.json();
  return services;
}

// Forma de respuesta de GET /api/weekly-template.
type PanelWeeklyTemplateRange = WeeklyTemplateRangeData & { id: string };

async function fetchWeeklyTemplate(): Promise<PanelWeeklyTemplateRange[]> {
  const response = await fetch(`${process.env.API_URL}/api/weekly-template`, {
    headers: await sessionCookieHeader(),
  });
  if (!response.ok) {
    throw new Error(
      `La API respondió ${response.status} al pedir el horario semanal.`,
    );
  }
  const ranges: PanelWeeklyTemplateRange[] = await response.json();
  return ranges;
}

// Forma de respuesta de GET /api/appointments.
type PanelAppointment = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: "pending" | "confirmed";
  service: { name: string };
  client: { name: string; email: string; phone: string };
};

async function fetchUpcomingAppointments(): Promise<PanelAppointment[]> {
  const response = await fetch(`${process.env.API_URL}/api/appointments`, {
    headers: await sessionCookieHeader(),
  });
  if (!response.ok) {
    throw new Error(`La API respondió ${response.status} al pedir las citas.`);
  }
  const appointments: PanelAppointment[] = await response.json();
  return appointments;
}

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
  const [appointments, services, weeklyTemplateRanges] = await Promise.all([
    fetchUpcomingAppointments(),
    fetchServices(),
    fetchWeeklyTemplate(),
  ]);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Hola, {professional.name}</h1>
          <p className="text-sm text-muted-foreground">
            Tu página pública: /profesional/{professional.slug}
          </p>
        </div>
        <form action={logoutProfessional}>
          <Button type="submit" variant="outline">
            Cerrar sesión
          </Button>
        </form>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Próximas citas</h2>
        {appointments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no tienes citas. Comparte tu página para que tus clientes
            reserven.
          </p>
        ) : (
          <ul className="flex flex-col divide-y rounded-lg border">
            {appointments.map((appointment) => (
              <li
                key={appointment.id}
                className="flex flex-col gap-1 px-4 py-3"
              >
                <span className="font-medium first-letter:uppercase">
                  {formatAppointmentTime(
                    appointment.startsAt,
                    professional.timezone,
                  )}
                </span>
                <span className="text-sm">
                  {appointment.service.name} · {appointment.client.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {appointment.client.phone} · {appointment.client.email}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Tus servicios</h2>
        {services.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no tienes servicios. Crea el primero para que tus clientes sepan
            qué reservan.
          </p>
        ) : (
          <ul className="flex flex-col divide-y rounded-lg border">
            {services.map((service) => (
              <li
                key={service.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <span className="font-medium">{service.name}</span>
                <span className="text-sm text-muted-foreground">
                  {service.durationMinutes} min ·{" "}
                  {service.isActive ? "Activo" : "Inactivo"}
                </span>
              </li>
            ))}
          </ul>
        )}
        <ServiceForm />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Tu horario semanal</h2>
          <p className="text-sm text-muted-foreground">
            Tus clientes solo verán horas dentro de estos rangos.
          </p>
        </div>
        <WeeklyTemplateForm initialRanges={weeklyTemplateRanges} />
      </section>
    </>
  );
}
