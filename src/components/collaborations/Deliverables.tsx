"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import type { Deliverable, ViewerRole } from "@/lib/queries/collaborations";

interface Props {
  collaborationId: string;
  initial: Deliverable[];
  role: ViewerRole;
  /** Falso cuando la colaboración ya está cerrada: todo pasa a solo lectura. */
  editable: boolean;
}

/** Fila del editor. Sin id todavía = entregable que aún no existe en la base. */
interface Draft {
  id?: string;
  title: string;
  done: boolean;
}

const dateFormat = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
});

/**
 * El panel de entregables, que es donde vive el día a día de una
 * colaboración.
 *
 * Las dos partes ven la misma lista pero hacen cosas distintas: la marca
 * escribe qué hay que entregar, el creador marca lo que ya ha entregado.
 * Ninguna de las dos puede hacer lo de la otra, y eso lo impone el servidor
 * —aquí solo decidimos qué enseñar.
 */
export function Deliverables({ collaborationId, initial, role, editable }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<Deliverable[]>(initial);
  const [error, setError] = useState<string | null>(null);

  const done = items.filter((item) => item.done).length;

  if (!editable) {
    return (
      <section className="flex flex-col gap-3">
        <Header done={done} total={items.length} />
        {items.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-tile bg-surface-2 px-3 py-2.5 text-sm"
              >
                <span
                  className={item.done ? "text-good" : "text-ink-muted"}
                  aria-hidden="true"
                >
                  <Check size={16} />
                </span>
                <span className={item.done ? "" : "text-ink-secondary"}>
                  {item.title}
                </span>
                <span className="ml-auto shrink-0 text-xs text-ink-muted">
                  {item.done ? "Entregado" : "Sin entregar"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-muted">
            No se llegó a definir ningún entregable.
          </p>
        )}
      </section>
    );
  }

  return role === "creator" ? (
    <CreatorChecklist
      collaborationId={collaborationId}
      items={items}
      onChange={(next) => {
        setItems(next);
        router.refresh();
      }}
      error={error}
      onError={setError}
    />
  ) : (
    <BrandEditor
      collaborationId={collaborationId}
      items={items}
      onSaved={(next) => {
        setItems(next);
        router.refresh();
      }}
      error={error}
      onError={setError}
    />
  );
}

function Header({ done, total }: { done: number; total: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="font-bold">Entregables</h2>
      {total > 0 ? (
        <span className="tabular text-sm text-ink-secondary">
          {done} de {total}
        </span>
      ) : null}
    </div>
  );
}

function ErrorLine({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p role="alert" className="text-sm text-critical">
      {error}
    </p>
  );
}

/** Lado del creador: marcar y desmarcar, un entregable por petición. */
function CreatorChecklist({
  collaborationId,
  items,
  onChange,
  error,
  onError,
}: {
  collaborationId: string;
  items: Deliverable[];
  onChange: (next: Deliverable[]) => void;
  error: string | null;
  onError: (message: string | null) => void;
}) {
  const [pending, setPending] = useState<string | null>(null);
  const done = items.filter((item) => item.done).length;

  async function toggle(deliverable: Deliverable) {
    setPending(deliverable.id);
    onError(null);

    const response = await fetch(
      `/api/collaborations/${collaborationId}/deliverables/${deliverable.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !deliverable.done }),
      },
    );

    setPending(null);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      onError(data?.error ?? "No se pudo actualizar el entregable");
      return;
    }

    const data = (await response.json()) as { deliverables: Deliverable[] };
    onChange(data.deliverables);
  }

  return (
    <section className="flex flex-col gap-3">
      <Header done={done} total={items.length} />

      {items.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <label
                className={[
                  "flex cursor-pointer items-center gap-3 rounded-tile bg-surface-2 px-3 py-2.5 text-sm",
                  "border border-transparent transition-colors hover:border-line-strong",
                  pending === item.id ? "opacity-50" : "",
                ].join(" ")}
              >
                <input
                  type="checkbox"
                  checked={item.done}
                  disabled={pending !== null}
                  onChange={() => toggle(item)}
                  className="size-4 shrink-0 accent-[var(--color-good)]"
                />
                <span className={item.done ? "text-ink-secondary line-through" : ""}>
                  {item.title}
                </span>
                {item.done && item.doneAt ? (
                  <span className="ml-auto shrink-0 text-xs text-ink-muted">
                    {dateFormat.format(new Date(item.doneAt))}
                  </span>
                ) : null}
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">
          La marca todavía no ha definido los entregables.
        </p>
      )}

      <ErrorLine error={error} />
    </section>
  );
}

/** Lado de la marca: definir la lista. Se manda entera al guardar. */
function BrandEditor({
  collaborationId,
  items,
  onSaved,
  error,
  onError,
}: {
  collaborationId: string;
  items: Deliverable[];
  onSaved: (next: Deliverable[]) => void;
  error: string | null;
  onError: (message: string | null) => void;
}) {
  const [drafts, setDrafts] = useState<Draft[]>(() =>
    items.map(({ id, title, done }) => ({ id, title, done })),
  );
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  const done = drafts.filter((draft) => draft.done).length;
  const dirty =
    drafts.length !== items.length ||
    drafts.some((draft, index) => draft.title !== items[index]?.title);

  function update(index: number, title: string) {
    setSaved(false);
    setDrafts((current) =>
      current.map((draft, i) => (i === index ? { ...draft, title } : draft)),
    );
  }

  function remove(index: number) {
    setSaved(false);
    setDrafts((current) => current.filter((_, i) => i !== index));
  }

  async function save() {
    setPending(true);
    onError(null);

    const response = await fetch(
      `/api/collaborations/${collaborationId}/deliverables`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Las filas vacías se descartan aquí: añadir una y no escribir
          // nada es lo mismo que no haberla añadido.
          items: drafts
            .filter((draft) => draft.title.trim().length > 0)
            .map((draft) => ({ id: draft.id, title: draft.title.trim() })),
        }),
      },
    );

    setPending(false);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      onError(data?.error ?? "No se pudieron guardar los entregables");
      return;
    }

    const data = (await response.json()) as { deliverables: Deliverable[] };
    setDrafts(data.deliverables.map(({ id, title, done }) => ({ id, title, done })));
    setSaved(true);
    onSaved(data.deliverables);
  }

  return (
    <section className="flex flex-col gap-3">
      <Header done={done} total={drafts.length} />

      <p className="text-sm text-ink-secondary">
        Define qué esperas recibir. El creador irá marcando lo que entregue.
      </p>

      <ul className="flex flex-col gap-2">
        {drafts.map((draft, index) => (
          <li key={draft.id ?? `nuevo-${index}`} className="flex items-center gap-2">
            <input
              value={draft.title}
              onChange={(event) => update(index, event.target.value)}
              maxLength={200}
              placeholder="1 Reel en Instagram"
              aria-label={`Entregable ${index + 1}`}
              className={[
                "h-11 min-w-0 flex-1 rounded-tile bg-surface-2 px-3 text-sm text-ink",
                "border border-line-strong transition-colors",
                "placeholder:text-ink-muted focus:border-accent focus:outline-none",
              ].join(" ")}
            />
            {/* Que ya esté entregado no impide editarlo, pero conviene verlo
                antes de borrar el trabajo de otra persona. */}
            {draft.done ? (
              <span className="shrink-0 text-good" title="Entregado">
                <Check size={18} aria-label="Entregado" />
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => remove(index)}
              aria-label={`Quitar entregable ${index + 1}`}
              className="shrink-0 rounded-tile p-2 text-ink-muted transition-colors hover:bg-surface-2 hover:text-critical"
            >
              <Trash2 size={18} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      <ErrorLine error={error} />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={<Plus size={16} />}
          fullWidth
          disabled={drafts.length >= 20}
          onClick={() => {
            setSaved(false);
            setDrafts((current) => [...current, { title: "", done: false }]);
          }}
        >
          Añadir
        </Button>
        <Button
          type="button"
          size="sm"
          fullWidth
          disabled={pending || !dirty}
          onClick={save}
        >
          {pending ? "Guardando…" : saved && !dirty ? "Guardado" : "Guardar"}
        </Button>
      </div>
    </section>
  );
}
