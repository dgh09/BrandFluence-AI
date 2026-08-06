"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type UserType = "creator" | "brand";

const OPTIONS: { value: UserType; title: string; blurb: string }[] = [
  { value: "creator", title: "Soy creador", blurb: "Busco marcas con las que colaborar" },
  { value: "brand", title: "Soy marca", blurb: "Busco creadores para mis campañas" },
];

export default function SignupPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<UserType>("creator");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name") ?? ""),
        email,
        password,
        userType,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "No se pudo crear la cuenta");
      setPending(false);
      return;
    }

    // Alta correcta → iniciamos sesión sin que tenga que teclear otra vez.
    await signIn("credentials", { email, password, redirect: false });
    setPending(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight">Crea tu cuenta</h1>
      <p className="mt-2 text-sm text-ink-secondary">
        Gratis. Sin tarjeta.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium text-ink-secondary">
            ¿Qué eres?
          </legend>
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
                  <span className="block text-sm font-semibold">
                    {option.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-muted">
                    {option.blurb}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <Input
          label="Nombre"
          name="name"
          autoComplete="name"
          placeholder="Tu nombre o el de tu marca"
          required
        />
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          required
        />
        <Input
          label="Contraseña"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          minLength={8}
          hint="Mínimo 8 caracteres"
          required
        />

        {error ? (
          <p role="alert" className="text-sm text-critical">
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" fullWidth disabled={pending}>
          {pending ? "Creando cuenta…" : "Crear cuenta"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-secondary">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-accent">
          Entrar
        </Link>
      </p>
    </>
  );
}
