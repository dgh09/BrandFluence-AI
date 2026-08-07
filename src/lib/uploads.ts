/**
 * Reglas de subida de ficheros.
 *
 * Módulo puro, como `matching.ts` y `metrics.ts`: qué se acepta, cuánto puede
 * pesar y dónde se guarda. Sin SDK, sin red y —a propósito— **sin
 * `node:crypto`**, porque el formulario del navegador importa estas mismas
 * reglas para avisar antes de empezar a subir 200 MB que van a ser
 * rechazados. El identificador único lo pone quien llama.
 *
 * El acceso real a Supabase Storage vive en `storage.ts`.
 */

export const UPLOAD_PURPOSES = ["avatar", "logo", "deliverable"] as const;
export type UploadPurpose = (typeof UPLOAD_PURPOSES)[number];

/**
 * Allowlist, no denylist. Una lista de lo prohibido siempre se queda corta:
 * basta un tipo nuevo para que se cuele algo que nadie previó.
 *
 * El valor es la extensión con la que se guarda. No se usa la del nombre
 * original: `foto.jpg.svg` se guardaría como `.svg` y el navegador lo
 * ejecutaría como documento, con su script dentro.
 */
const IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

const VIDEO_TYPES = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
} as const;

const MB = 1024 * 1024;

export interface PurposeRule {
  /** Bucket de Supabase Storage. */
  bucket: string;
  /** Público = cualquiera con la URL lo ve. Privado = URL firmada y caduca. */
  visibility: "public" | "private";
  types: Record<string, string>;
  maxBytes: number;
  /** Carpeta raíz dentro del bucket. */
  folder: string;
}

/**
 * Las fotos de perfil y los logos son públicos: se enseñan en listados a
 * gente que todavía no tiene relación con su dueño, y firmar cada miniatura
 * sería una petición por avatar.
 *
 * El contenido entregado NO. Puede ser material de una campaña sin publicar,
 * y solo tiene sentido para las dos partes de esa colaboración.
 */
export const PURPOSE_RULES: Record<UploadPurpose, PurposeRule> = {
  avatar: {
    bucket: "media",
    visibility: "public",
    types: IMAGE_TYPES,
    maxBytes: 5 * MB,
    folder: "avatars",
  },
  logo: {
    bucket: "media",
    visibility: "public",
    types: IMAGE_TYPES,
    maxBytes: 5 * MB,
    folder: "logos",
  },
  deliverable: {
    bucket: "deliverables",
    visibility: "private",
    types: { ...IMAGE_TYPES, ...VIDEO_TYPES },
    // 50 MB es el techo del plan gratuito de Supabase: un bucket no puede
    // superar el límite global del proyecto, y crearlo con más falla con
    // "The object exceeded the maximum allowed size". En un plan de pago se
    // sube en Settings > Storage y luego aquí — este número manda sobre el
    // formulario, la validación del servidor y el propio bucket.
    maxBytes: 50 * MB,
    folder: "collaborations",
  },
};

export function isUploadPurpose(value: unknown): value is UploadPurpose {
  return UPLOAD_PURPOSES.includes(value as UploadPurpose);
}

export function isVideo(contentType: string): boolean {
  return contentType in VIDEO_TYPES;
}

/** Para mensajes de error legibles: 5 MB, no 5242880. */
export function formatBytes(bytes: number): string {
  if (bytes >= MB) return `${Math.round(bytes / MB)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

/**
 * Valida una subida antes de firmarla.
 *
 * Devuelve el mensaje de error, o null si todo va bien. Se ejecuta en el
 * servidor —que es donde cuenta— y también en el navegador, para no hacer
 * subir un fichero entero antes de decir que no.
 *
 * El tamaño que se comprueba aquí es el que **declara** el cliente. No es
 * una garantía: quien quiera puede mentir. Es Supabase, con el límite del
 * bucket, quien lo impone de verdad; esto solo evita el viaje inútil.
 */
export function checkUpload(
  purpose: UploadPurpose,
  contentType: string,
  size: number,
): string | null {
  const rule = PURPOSE_RULES[purpose];

  if (!(contentType in rule.types)) {
    const allowed = Object.values(rule.types).join(", ");
    return `Formato no admitido. Se aceptan: ${allowed}`;
  }

  if (!Number.isInteger(size) || size <= 0) {
    return "Fichero vacío o tamaño no válido";
  }

  if (size > rule.maxBytes) {
    return `El fichero supera el máximo de ${formatBytes(rule.maxBytes)}`;
  }

  return null;
}

/**
 * Dónde se guarda el objeto.
 *
 * La construye **el servidor** a partir de la sesión, nunca el cliente. Si
 * la ruta viniera en la petición, cualquiera podría escribir en la carpeta
 * de otra persona o salirse del bucket con un `../`.
 *
 * `ownerId` es el usuario para avatares y logos, y la colaboración para el
 * contenido entregado: así todo lo de una colaboración queda junto y se
 * puede borrar de una vez cuando toque.
 */
export function objectPath(
  purpose: UploadPurpose,
  ownerId: string,
  contentType: string,
  uniqueId: string,
): string {
  const rule = PURPOSE_RULES[purpose];
  const extension = rule.types[contentType];

  if (!extension) {
    throw new Error(`Tipo no admitido para ${purpose}: ${contentType}`);
  }

  return `${rule.folder}/${ownerId}/${uniqueId}.${extension}`;
}

/** URL pública de un objeto en un bucket público. */
export function publicUrl(
  supabaseUrl: string,
  bucket: string,
  path: string,
): string {
  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${path}`;
}
