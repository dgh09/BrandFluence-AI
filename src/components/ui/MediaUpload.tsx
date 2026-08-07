"use client";

import { useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
  checkUpload,
  formatBytes,
  PURPOSE_RULES,
  type UploadPurpose,
} from "@/lib/uploads";

export interface UploadedMedia {
  path: string;
  contentType: string;
  name: string;
  /** Solo en buckets públicos. */
  publicUrl: string | null;
}

interface Props {
  purpose: UploadPurpose;
  /** Obligatorio cuando el propósito es 'deliverable'. */
  collaborationId?: string;
  label: string;
  onUploaded: (media: UploadedMedia) => void | Promise<void>;
  disabled?: boolean;
}

/**
 * Subida de ficheros a Supabase Storage.
 *
 * El fichero **no pasa por el servidor de la app**: se pide un permiso
 * firmado a /api/uploads y el navegador sube directo a Supabase. Un vídeo de
 * 200 MB no cabe en el cuerpo de una función serverless, y aunque cupiera
 * sería pagar por mover bytes que Supabase ya sabe recibir.
 *
 * Las reglas de tipo y tamaño se comprueban aquí *y* en el servidor, desde
 * el mismo módulo. Aquí solo para no hacer esperar a nadie a que suba entero
 * algo que se va a rechazar; la comprobación que cuenta es la de allí.
 */
export function MediaUpload({
  purpose,
  collaborationId,
  label,
  onUploaded,
  disabled = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rule = PURPOSE_RULES[purpose];
  const accept = Object.keys(rule.types).join(",");

  async function handleFile(file: File) {
    setError(null);

    const invalid = checkUpload(purpose, file.type, file.size);
    if (invalid) {
      setError(invalid);
      return;
    }

    setPending(true);

    try {
      // 1. Permiso firmado. El servidor decide la ruta; aquí no se propone.
      const ticketResponse = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose,
          contentType: file.type,
          size: file.size,
          ...(collaborationId ? { collaborationId } : {}),
        }),
      });

      if (!ticketResponse.ok) {
        const data = await ticketResponse.json().catch(() => null);
        setError(data?.error ?? "No se pudo preparar la subida");
        return;
      }

      const ticket = (await ticketResponse.json()) as {
        bucket: string;
        path: string;
        token: string;
        publicUrl: string | null;
      };

      // 2. Los bytes, directos a Supabase.
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !anonKey) {
        setError("Las subidas no están configuradas en este entorno");
        return;
      }

      const supabase = createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { error: uploadError } = await supabase.storage
        .from(ticket.bucket)
        .uploadToSignedUrl(ticket.path, ticket.token, file, {
          contentType: file.type,
        });

      if (uploadError) {
        setError("No se pudo subir el fichero. Inténtalo de nuevo.");
        return;
      }

      // 3. Y que quien nos usa lo guarde donde corresponda.
      await onUploaded({
        path: ticket.path,
        contentType: file.type,
        name: file.name,
        publicUrl: ticket.publicUrl,
      });
    } finally {
      setPending(false);
      // Permite volver a elegir el mismo fichero después de un fallo: sin
      // esto el input no dispara change si el nombre no cambia.
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={disabled || pending}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      <Button
        type="button"
        variant="secondary"
        size="sm"
        icon={<Upload size={16} />}
        fullWidth
        disabled={disabled || pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? "Subiendo…" : label}
      </Button>

      {error ? (
        <p role="alert" className="text-xs text-critical">
          {error}
        </p>
      ) : (
        <p className="text-xs text-ink-muted">
          {Object.values(rule.types).join(", ")} · hasta{" "}
          {formatBytes(rule.maxBytes)}
        </p>
      )}
    </div>
  );
}
