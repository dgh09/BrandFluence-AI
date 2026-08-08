"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, HandCoins, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { PaymentInfo, ViewerRole } from "@/lib/queries/collaborations";
import { PAYMENT_METHODS, paymentMethodLabel } from "@/lib/taxonomy";

const currency = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

/**
 * Solo fecha, sin hora, y a propósito.
 *
 * Pedirle a `Intl` fecha **y** hora a la vez da cadenas distintas en Node y
 * en el navegador —"8 de agosto, 13:10" contra "8 de agosto a las 13:10",
 * según la versión de ICU de cada uno—, y eso rompe la hidratación: React
 * tira el HTML del servidor y vuelve a pintar. En producción sería aún peor,
 * porque el servidor corre en UTC y quien mira está en hora de Colombia.
 *
 * Para "cuándo se declaró un pago", el día es la precisión que importa.
 */
const dateFormat = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

interface Props {
  collaborationId: string;
  initial: PaymentInfo;
  amount: number | null;
  role: ViewerRole;
  /** Falso en una colaboración cancelada. */
  editable: boolean;
}

/**
 * El pago, que ocurre FUERA de BrandFluence.
 *
 * La plataforma no cobra ni transfiere: cada parte declara su mitad. La marca
 * dice que pagó, el creador dice que lo recibió. Mientras solo lo diga una,
 * la pantalla lo deja claro en vez de dar el pago por bueno — es la
 * diferencia entre registrar una afirmación y afirmarla nosotros.
 */
export function PaymentPanel({
  collaborationId,
  initial,
  amount,
  role,
  editable,
}: Props) {
  const router = useRouter();
  const [payment, setPayment] = useState(initial);
  const [declaring, setDeclaring] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBrand = role === "brand";

  async function send(body: {
    status: "pending" | "processing" | "completed";
    method?: string;
    reference?: string;
  }) {
    setPending(true);
    setError(null);

    const response = await fetch(`/api/collaborations/${collaborationId}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setPending(false);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "No se pudo registrar el pago");
      return;
    }

    setPayment((await response.json()) as PaymentInfo);
    setDeclaring(false);
    router.refresh();
  }

  function declare(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void send({
      status: "processing",
      method: String(form.get("method") ?? "transferencia"),
      reference: String(form.get("reference") ?? "").trim(),
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-bold">Pago</h2>
        {amount !== null ? (
          <span className="tabular text-sm font-bold">{currency.format(amount)}</span>
        ) : null}
      </div>

      {/* Que el pago no pasa por aquí se dice una vez y en su sitio, no en
          letra pequeña: cambia lo que cada parte debe esperar. */}
      <p className="text-sm text-ink-secondary">
        El pago se hace por fuera de BrandFluence. Aquí solo queda el registro
        de lo que declara cada parte.
      </p>

      <Timeline payment={payment} />

      {error ? (
        <p role="alert" className="text-sm text-critical">
          {error}
        </p>
      ) : null}

      {!editable ? null : declaring ? (
        <form onSubmit={declare} className="flex flex-col gap-3">
          <Select
            label="Cómo pagaste"
            name="method"
            options={PAYMENT_METHODS}
            defaultValue="transferencia"
            required
          />
          <Input
            label="Referencia"
            name="reference"
            maxLength={120}
            placeholder="Nº de comprobante, últimos dígitos…"
            hint="Opcional. Le sirve al creador para reconocer el ingreso."
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              fullWidth
              disabled={pending}
              onClick={() => setDeclaring(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" fullWidth disabled={pending}>
              {pending ? "Guardando…" : "Confirmar que pagué"}
            </Button>
          </div>
        </form>
      ) : (
        <Actions
          payment={payment}
          isBrand={isBrand}
          pending={pending}
          onDeclare={() => setDeclaring(true)}
          onSend={send}
        />
      )}
    </section>
  );
}

/** Las dos mitades del pago, cada una con quién la afirmó y cuándo. */
function Timeline({ payment }: { payment: PaymentInfo }) {
  const steps = [
    {
      done: payment.paidAt !== null,
      label: "La marca declara que pagó",
      at: payment.paidAt,
      extra: payment.method
        ? `${paymentMethodLabel(payment.method)}${
            payment.reference ? ` · ${payment.reference}` : ""
          }`
        : null,
    },
    {
      done: payment.confirmedAt !== null,
      label: "El creador confirma que lo recibió",
      at: payment.confirmedAt,
      extra: null,
    },
  ];

  return (
    <ul className="flex flex-col gap-2">
      {steps.map((step) => (
        <li
          key={step.label}
          className="flex items-start gap-3 rounded-tile bg-surface-2 px-3 py-2.5"
        >
          <span
            className={step.done ? "text-good" : "text-ink-muted"}
            aria-hidden="true"
          >
            <BadgeCheck size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className={`text-sm ${step.done ? "" : "text-ink-secondary"}`}>
              {step.label}
            </p>
            {step.extra ? (
              <p className="mt-0.5 text-xs text-ink-secondary">{step.extra}</p>
            ) : null}
          </div>
          <span className="shrink-0 text-xs text-ink-muted">
            {step.at ? dateFormat.format(new Date(step.at)) : "Pendiente"}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Actions({
  payment,
  isBrand,
  pending,
  onDeclare,
  onSend,
}: {
  payment: PaymentInfo;
  isBrand: boolean;
  pending: boolean;
  onDeclare: () => void;
  onSend: (body: { status: "pending" | "completed" }) => void;
}) {
  if (payment.status === "completed") {
    return (
      <p role="status" className="text-sm font-medium text-good">
        Pago confirmado por las dos partes.
      </p>
    );
  }

  if (payment.status === "pending") {
    return isBrand ? (
      <Button
        size="sm"
        icon={<HandCoins size={16} />}
        fullWidth
        disabled={pending}
        onClick={onDeclare}
      >
        Ya he pagado
      </Button>
    ) : (
      <p className="text-sm text-ink-muted">
        La marca todavía no ha registrado el pago.
      </p>
    );
  }

  // processing: la marca ya lo declaró y falta que el creador lo confirme.
  return isBrand ? (
    <Button
      variant="secondary"
      size="sm"
      icon={<Undo2 size={16} />}
      fullWidth
      disabled={pending}
      onClick={() => onSend({ status: "pending" })}
    >
      Me he equivocado, deshacer
    </Button>
  ) : (
    <Button
      size="sm"
      icon={<BadgeCheck size={16} />}
      fullWidth
      disabled={pending}
      onClick={() => onSend({ status: "completed" })}
    >
      {pending ? "…" : "Confirmar que lo recibí"}
    </Button>
  );
}
