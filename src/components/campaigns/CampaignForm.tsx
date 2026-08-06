"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select, Textarea } from "@/components/ui/Select";
import { NICHES } from "@/lib/taxonomy";

export function CampaignForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: String(form.get("title") ?? ""),
        description: String(form.get("description") ?? ""),
        targetNiche: String(form.get("targetNiche") ?? ""),
        minFollowers: Number(form.get("minFollowers") ?? 0),
        budget: Number(form.get("budget") ?? 0),
      }),
    });

    setPending(false);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "No se pudo crear la campaña");
      return;
    }

    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button icon={<Plus size={16} />} onClick={() => setOpen(true)} fullWidth>
        Nueva campaña
      </Button>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h2 className="font-bold">Nueva campaña</h2>

        <Input
          label="Título"
          name="title"
          minLength={3}
          maxLength={255}
          placeholder="Lanzamiento colección primavera"
          required
        />

        <Select
          label="Nicho objetivo"
          name="targetNiche"
          options={NICHES}
          defaultValue=""
          placeholder="Elige el nicho"
          required
        />

        <Input
          label="Seguidores mínimos"
          name="minFollowers"
          type="number"
          inputMode="numeric"
          min={0}
          defaultValue={0}
          hint="Los creadores por debajo de esta cifra no recibirán la campaña"
          required
        />

        <Input
          label="Presupuesto (€)"
          name="budget"
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="2500"
          required
        />

        <Textarea
          label="Descripción"
          name="description"
          maxLength={5000}
          placeholder="Qué buscas, qué entregables esperas y en qué plazo."
        />

        {error ? (
          <p role="alert" className="text-sm text-critical">
            {error}
          </p>
        ) : null}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" fullWidth disabled={pending}>
            {pending ? "Publicando…" : "Publicar"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
