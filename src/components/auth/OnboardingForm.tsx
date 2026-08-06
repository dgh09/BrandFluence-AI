"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";

type UserType = "creator" | "brand";

const OPTIONS: { value: UserType; title: string; blurb: string }[] = [
  { value: "creator", title: "Soy creador", blurb: "Busco marcas con las que colaborar" },
  { value: "brand", title: "Soy marca", blurb: "Busco creadores para mis campañas" },
];

export function OnboardingForm() {
  const router = useRouter();
  const [userType, setUserType] = useState<UserType>("creator");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userType }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "No se pudo completar el registro");
      setPending(false);
      return;
    }

    // El callback jwt relee user_type cuando está a null, así que la sesión
    // recoge el cambio en la siguiente petición sin volver a hacer login.
    setPending(false);
    router.push("/profile");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
      <fieldset>
        <legend className="sr-only">Tipo de cuenta</legend>
        <div className="grid grid-cols-2 gap-3">
          {OPTIONS.map((option) => {
            const selected = userType === option.value;
            return (
              <label
                key={option.value}
                className={[
                  "cursor-pointer rounded-tile border p-3 transition-colors",
                  selected
                    ? "border-accent bg-accent/10"
                    : "border-line-strong bg-surface-2 hover:bg-surface-3",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="userType"
                  value={option.value}
                  checked={selected}
                  onChange={() => setUserType(option.value)}
                  className="sr-only"
                />
                <span className="block text-sm font-semibold">{option.title}</span>
                <span className="mt-0.5 block text-xs text-ink-muted">
                  {option.blurb}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {error ? (
        <p role="alert" className="text-sm text-critical">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" fullWidth disabled={pending}>
        {pending ? "Preparando…" : "Continuar"}
      </Button>
    </form>
  );
}
