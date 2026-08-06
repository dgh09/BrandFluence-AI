"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { INDUSTRIES } from "@/lib/taxonomy";
import type { BrandProfile } from "@/lib/queries/profile";

export function BrandProfileForm({ profile }: { profile: BrandProfile }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const budget = String(form.get("monthlyBudget") ?? "").trim();

    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: String(form.get("companyName") ?? ""),
        industry: String(form.get("industry") ?? ""),
        ...(budget ? { monthlyBudget: Number(budget) } : {}),
      }),
    });

    setPending(false);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "No se pudo guardar el perfil");
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Nombre de la empresa"
        name="companyName"
        defaultValue={profile.companyName ?? ""}
        minLength={2}
        maxLength={255}
        required
      />

      <Select
        label="Sector"
        name="industry"
        options={INDUSTRIES}
        defaultValue={profile.industry ?? ""}
        placeholder="Elige tu sector"
        required
      />

      <Input
        label="Presupuesto mensual (€)"
        name="monthlyBudget"
        type="number"
        inputMode="numeric"
        min={0}
        defaultValue={profile.monthlyBudget ?? ""}
        placeholder="5000"
        hint="Opcional. Nos ayuda a sugerirte creadores dentro de tu rango."
      />

      {error ? (
        <p role="alert" className="text-sm text-critical">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p role="status" className="text-sm text-good">
          Perfil guardado.
        </p>
      ) : null}

      <Button type="submit" size="lg" fullWidth disabled={pending}>
        {pending ? "Guardando…" : "Guardar cambios"}
      </Button>
    </form>
  );
}
