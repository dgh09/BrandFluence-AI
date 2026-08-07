"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { StatTile } from "@/components/ui/Card";
import {
  engagementRate,
  METRIC_KEYS,
  type MetricKey,
  type PerformanceMetrics as Metrics,
} from "@/lib/metrics";
import type { ViewerRole } from "@/lib/queries/collaborations";

const LABEL: Record<MetricKey, string> = {
  views: "Visualizaciones",
  likes: "Likes",
  comments: "Comentarios",
  shares: "Compartidos",
  saves: "Guardados",
};

const number = new Intl.NumberFormat("es-ES");
const percent = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const dateFormat = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "long",
});

interface Props {
  collaborationId: string;
  initial: Metrics | null;
  role: ViewerRole;
  /** Falso en una colaboración cancelada: ya no hay nada que medir. */
  editable: boolean;
}

/**
 * Cómo funcionó el contenido.
 *
 * Cinco cifras sueltas no son un gráfico: son una fila de tiles. Un diagrama
 * de barras con "likes" y "visualizaciones" en el mismo eje solo enseñaría
 * que uno es mucho más grande que el otro, que ya se ve leyendo los números.
 *
 * El engagement se calcula aquí y va sin color: no hay un umbral acordado de
 * lo que es bueno, y pintarlo de verde o de rojo sería inventarse un juicio.
 */
export function PerformanceMetrics({
  collaborationId,
  initial,
  role,
  editable,
}: Props) {
  const router = useRouter();
  const [metrics, setMetrics] = useState(initial);
  const [editing, setEditing] = useState(false);

  const canEdit = role === "creator" && editable;

  if (editing) {
    return (
      <MetricsForm
        collaborationId={collaborationId}
        initial={metrics}
        onDone={(next) => {
          setMetrics(next);
          setEditing(false);
          router.refresh();
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  const reported = METRIC_KEYS.filter((key) => metrics?.[key] !== undefined);
  const rate = engagementRate(metrics);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-bold">Rendimiento</h2>
        {metrics?.reportedAt ? (
          <span className="text-xs text-ink-muted">
            Reportado el {dateFormat.format(new Date(metrics.reportedAt))}
          </span>
        ) : null}
      </div>

      {reported.length > 0 ? (
        <>
          {rate !== null ? (
            <div className="rounded-tile bg-surface-2 px-4 py-3">
              <p className="text-xs font-medium text-ink-secondary">
                Engagement
              </p>
              <p className="tabular mt-1 text-3xl font-bold leading-none">
                {percent.format(rate)}%
              </p>
              <p className="mt-1.5 text-xs text-ink-muted">
                Interacciones sobre visualizaciones
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {reported.map((key) => (
              <StatTile
                key={key}
                label={LABEL[key]}
                value={number.format(metrics![key]!)}
              />
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-ink-muted">
          {role === "creator"
            ? "Todavía no has reportado cómo funcionó el contenido."
            : "El creador todavía no ha reportado el rendimiento."}
        </p>
      )}

      {canEdit ? (
        <Button
          variant="secondary"
          size="sm"
          icon={<BarChart3 size={16} />}
          fullWidth
          onClick={() => setEditing(true)}
        >
          {reported.length > 0 ? "Editar métricas" : "Reportar métricas"}
        </Button>
      ) : null}
    </section>
  );
}

/** Formulario del creador. Los campos vacíos se mandan como "no reportado". */
function MetricsForm({
  collaborationId,
  initial,
  onDone,
  onCancel,
}: {
  collaborationId: string;
  initial: Metrics | null;
  onDone: (next: Metrics | null) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<Record<MetricKey, string>>(() =>
    Object.fromEntries(
      METRIC_KEYS.map((key) => [key, initial?.[key]?.toString() ?? ""]),
    ) as Record<MetricKey, string>,
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const body: Partial<Record<MetricKey, number>> = {};
    for (const key of METRIC_KEYS) {
      const raw = values[key].trim();
      // Vacío no es cero: significa "no lo sé". Se omite del cuerpo para que
      // el servidor lo trate como no reportado en vez de como un cero real.
      if (raw !== "") body[key] = Number(raw);
    }

    const response = await fetch(`/api/collaborations/${collaborationId}/metrics`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setPending(false);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "No se pudieron guardar las métricas");
      return;
    }

    const data = (await response.json()) as { metrics: Metrics | null };
    onDone(data.metrics);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <h2 className="font-bold">Rendimiento</h2>
      <p className="text-sm text-ink-secondary">
        Las cifras del contenido publicado. Deja en blanco lo que no sepas.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {METRIC_KEYS.map((key) => (
          <div key={key} className="flex flex-col gap-1.5">
            <label
              htmlFor={`metric-${key}`}
              className="text-sm font-medium text-ink-secondary"
            >
              {LABEL[key]}
            </label>
            <input
              id={`metric-${key}`}
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={values[key]}
              onChange={(event) =>
                setValues((current) => ({ ...current, [key]: event.target.value }))
              }
              placeholder="—"
              className={[
                "tabular h-11 rounded-tile bg-surface-2 px-3 text-base text-ink",
                "border border-line-strong transition-colors",
                "placeholder:text-ink-muted focus:border-accent focus:outline-none",
              ].join(" ")}
            />
          </div>
        ))}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-critical">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          fullWidth
          disabled={pending}
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button type="submit" size="sm" fullWidth disabled={pending}>
          {pending ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
