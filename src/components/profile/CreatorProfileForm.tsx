"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select, Textarea } from "@/components/ui/Select";
import { NICHES } from "@/lib/taxonomy";
import type { CreatorProfile } from "@/lib/queries/profile";

export function CreatorProfileForm({ profile }: { profile: CreatorProfile }) {
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
    const engagement = String(form.get("engagementRate") ?? "").trim();

    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: String(form.get("username") ?? ""),
        bio: String(form.get("bio") ?? ""),
        niche: String(form.get("niche") ?? ""),
        followerCount: Number(form.get("followerCount") ?? 0),
        // Campo opcional: si va vacío se omite en vez de mandar 0.
        ...(engagement ? { engagementRate: Number(engagement) } : {}),
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
      {profile.isVerified ? (
        <Card className="flex items-center gap-3">
          <BadgeCheck size={20} className="text-good shrink-0" aria-hidden="true" />
          <p className="text-sm">
            <span className="font-semibold">Perfil verificado.</span>{" "}
            <span className="text-ink-secondary">
              Tus métricas han sido validadas.
            </span>
          </p>
        </Card>
      ) : null}

      <Input
        label="Nombre de usuario"
        name="username"
        defaultValue={profile.username ?? ""}
        placeholder="tuusuario"
        pattern="[a-zA-Z0-9._\-]+"
        minLength={3}
        maxLength={100}
        hint="Solo letras, números, punto, guion y guion bajo"
        required
      />

      <Select
        label="Nicho principal"
        name="niche"
        options={NICHES}
        defaultValue={profile.niche ?? ""}
        placeholder="Elige tu nicho"
        required
      />

      <Input
        label="Seguidores"
        name="followerCount"
        type="number"
        inputMode="numeric"
        min={0}
        defaultValue={profile.followerCount}
        hint="Suma de tu audiencia en tu plataforma principal"
        required
      />

      <Input
        label="Engagement rate (%)"
        name="engagementRate"
        type="number"
        inputMode="decimal"
        step="0.01"
        min={0}
        max={100}
        defaultValue={profile.engagementRate ?? ""}
        placeholder="5.40"
        hint="Opcional. Un engagement alto sube tu score de match."
      />

      <Textarea
        label="Bio"
        name="bio"
        defaultValue={profile.bio ?? ""}
        maxLength={1000}
        placeholder="Cuéntale a las marcas qué haces y con quién conectas."
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
