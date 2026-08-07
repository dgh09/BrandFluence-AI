import { randomUUID } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  objectPath,
  PURPOSE_RULES,
  publicUrl,
  type UploadPurpose,
} from "@/lib/uploads";

/**
 * Supabase Storage.
 *
 * SOLO SERVIDOR: usa la service role key, que se salta el RLS. Este módulo
 * no puede importarse nunca desde un componente cliente.
 *
 * El navegador **no sube los bytes a través de esta app**. Pide aquí un
 * permiso firmado y sube directo a Supabase. Dos motivos:
 *
 *  1. Un endpoint serverless tiene un límite de cuerpo de unos pocos MB. Un
 *     vídeo de 200 MB no cabe por ahí ni pasándolo en trozos.
 *  2. Aunque cupiera, estaríamos pagando por mover bytes que Supabase ya
 *     sabe recibir, y ocupando una función durante toda la subida.
 *
 * Lo que sí decide el servidor es **qué** se puede subir y **dónde** va: el
 * cliente nunca manda una ruta.
 */

declare global {
  var _supabaseAdmin: SupabaseClient | undefined;
}

/** Se lanza cuando falta configuración. La ruta la traduce a un 503. */
export class StorageNotConfiguredError extends Error {
  constructor(missing: string) {
    super(`Falta ${missing} en el entorno (.env.local)`);
    this.name = "StorageNotConfiguredError";
  }
}

let localAdmin: SupabaseClient | null = null;

/**
 * El cliente se crea en la PRIMERA llamada, no al importar el módulo, por el
 * mismo motivo que el pool de Postgres: `next build` recolecta las rutas sin
 * variables de entorno y fallaría al importar.
 *
 * Si falta la clave, esto revienta y la ruta responde 503. Falla cerrado, no
 * abierto: igual que MATCHING_ADMIN_TOKEN.
 */
function getAdmin(): SupabaseClient {
  const cached = globalThis._supabaseAdmin ?? localAdmin;
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new StorageNotConfiguredError("NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) throw new StorageNotConfiguredError("SUPABASE_SERVICE_ROLE_KEY");

  localAdmin = createClient(url, serviceKey, {
    // No hay usuario de Supabase Auth detrás: la identidad la pone NextAuth.
    // Sin esto el SDK intentaría persistir y refrescar una sesión que no
    // existe, en un entorno donde además no hay dónde guardarla.
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (process.env.NODE_ENV !== "production") {
    globalThis._supabaseAdmin = localAdmin;
  }

  return localAdmin;
}

export interface UploadTicket {
  bucket: string;
  /** Ruta dentro del bucket. Es lo que hay que guardar en la base. */
  path: string;
  /** URL a la que el navegador sube el fichero. */
  signedUrl: string;
  token: string;
  /** Solo en buckets públicos; null en los privados. */
  publicUrl: string | null;
}

/**
 * Firma un permiso de subida de un solo uso.
 *
 * `ownerId` es el usuario (avatar, logo) o la colaboración (contenido
 * entregado). Quien llama ya ha comprobado que la sesión tiene derecho a
 * escribir ahí; aquí solo se construye la ruta.
 */
export async function createUploadTicket(
  purpose: UploadPurpose,
  ownerId: string,
  contentType: string,
): Promise<UploadTicket> {
  const rule = PURPOSE_RULES[purpose];
  const path = objectPath(purpose, ownerId, contentType, randomUUID());

  const { data, error } = await getAdmin()
    .storage.from(rule.bucket)
    .createSignedUploadUrl(path);

  if (error || !data) {
    throw new Error(`No se pudo firmar la subida: ${error?.message ?? "sin datos"}`);
  }

  return {
    bucket: rule.bucket,
    path: data.path,
    signedUrl: data.signedUrl,
    token: data.token,
    publicUrl:
      rule.visibility === "public"
        ? publicUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!, rule.bucket, data.path)
        : null,
  };
}

/**
 * URL de lectura temporal para un objeto de un bucket privado.
 *
 * Caduca pronto a propósito. Es un enlace que sirve para pintar la página
 * que se acaba de autorizar, no una dirección permanente que pueda circular
 * por ahí: quien la reenvíe estará compartiendo algo que deja de funcionar.
 */
export async function createReadUrl(
  bucket: string,
  path: string,
  expiresInSeconds = 60,
): Promise<string | null> {
  const { data, error } = await getAdmin()
    .storage.from(bucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data) return null;
  return data.signedUrl;
}

/** Borra un objeto. Los fallos no se propagan: son basura, no un error. */
export async function removeObject(bucket: string, path: string): Promise<void> {
  await getAdmin()
    .storage.from(bucket)
    .remove([path])
    .catch(() => undefined);
}
