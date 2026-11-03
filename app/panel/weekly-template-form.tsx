"use client";

import {
  type FormEvent,
  startTransition,
  useActionState,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveWeeklyTemplate, type WeeklyTemplateRangeData } from "./actions";

// La semana parte el lunes; los números son los de la API (0 = domingo).
const WEEKDAYS = [
  { weekday: 1, name: "Lunes" },
  { weekday: 2, name: "Martes" },
  { weekday: 3, name: "Miércoles" },
  { weekday: 4, name: "Jueves" },
  { weekday: 5, name: "Viernes" },
  { weekday: 6, name: "Sábado" },
  { weekday: 0, name: "Domingo" },
];

// La key identifica el rango en la lista mientras se edita; no viaja a la API.
type EditableRange = WeeklyTemplateRangeData & { key: string };

export function WeeklyTemplateForm({
  initialRanges,
}: {
  initialRanges: (WeeklyTemplateRangeData & { id: string })[];
}) {
  const [ranges, setRanges] = useState<EditableRange[]>(() =>
    initialRanges.map(({ id, ...range }) => ({ key: id, ...range })),
  );
  const [state, submitTemplate, isPending] = useActionState(
    saveWeeklyTemplate,
    null,
  );

  function updateRange(key: string, changes: Partial<WeeklyTemplateRangeData>) {
    setRanges(
      ranges.map((range) =>
        range.key === key ? { ...range, ...changes } : range,
      ),
    );
  }

  function addRange(weekday: number) {
    setRanges([
      ...ranges,
      {
        key: crypto.randomUUID(),
        weekday,
        startTime: "09:00",
        endTime: "13:00",
      },
    ]);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(() =>
      submitTemplate(ranges.map(({ key: _key, ...range }) => range)),
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y rounded-lg border">
        {WEEKDAYS.map(({ weekday, name }) => {
          const dayRanges = ranges.filter((range) => range.weekday === weekday);
          return (
            <li
              key={weekday}
              className="flex flex-wrap items-start gap-x-4 gap-y-2 px-4 py-3"
            >
              <span className="w-24 pt-1 font-medium">{name}</span>
              <div className="flex flex-1 flex-col gap-2">
                {dayRanges.length === 0 && (
                  <span className="pt-1 text-sm text-muted-foreground">
                    No atiendes
                  </span>
                )}
                {dayRanges.map((range) => (
                  <div key={range.key} className="flex items-center gap-2">
                    <Input
                      type="time"
                      required
                      aria-label={`${name}, desde`}
                      value={range.startTime}
                      onChange={(event) =>
                        updateRange(range.key, {
                          startTime: event.target.value,
                        })
                      }
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">a</span>
                    <Input
                      type="time"
                      required
                      aria-label={`${name}, hasta`}
                      value={range.endTime}
                      onChange={(event) =>
                        updateRange(range.key, { endTime: event.target.value })
                      }
                      className="w-32"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`Quitar el rango del ${name.toLowerCase()} de ${range.startTime} a ${range.endTime}`}
                      onClick={() =>
                        setRanges(ranges.filter(({ key }) => key !== range.key))
                      }
                    >
                      Quitar
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label={`Agregar un rango el ${name.toLowerCase()}`}
                onClick={() => addRange(weekday)}
              >
                Agregar rango
              </Button>
            </li>
          );
        })}
      </ul>

      {state && !state.ok && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="text-sm text-muted-foreground">
          Horario guardado.
        </p>
      )}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Guardando horario…" : "Guardar horario"}
      </Button>
    </form>
  );
}
