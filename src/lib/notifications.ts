/**
 * Qué dice cada notificación.
 *
 * Módulo **puro**, como `matching.ts`, `metrics.ts` o `currency.ts`: recibe
 * datos y devuelve texto. Sin base de datos, sin sesión, sin `fetch`. Todo el
 * copy de los avisos vive aquí y solo aquí, así que cambiar cómo se lee un
 * aviso no obliga a abrir seis rutas de API.
 *
 * El texto se compone al CREAR el aviso y se guarda tal cual (ver
 * migrations/004). Un aviso cuenta lo que pasó cuando pasó: si la marca
 * renombra la campaña mañana, el aviso de hoy sigue diciendo la verdad.
 */

// Import relativo y con extensión, como el resto de módulos puros: los tests
// corren con `node --experimental-strip-types`, sin bundler, y ahí el alias
// `@/` no se resuelve.
import { formatCOP } from "./currency.ts";

export type NotificationType =
  | "match_applied"
  | "match_accepted"
  | "match_declined"
  | "deliverables_defined"
  | "deliverable_submitted"
  | "metrics_reported"
  | "payment_declared"
  | "payment_confirmed"
  | "collaboration_completed"
  | "collaboration_cancelled";

/** Lo que se guarda en una fila de `notifications`, sin el destinatario. */
export interface NotificationContent {
  type: NotificationType;
  title: string;
  body: string | null;
  href: string | null;
  entityType: "match" | "collaboration";
  entityId: string;
}

/**
 * Entrecomillado tipográfico español: «así», no "así".
 *
 * Los títulos de campaña los escribe la marca y pueden traer comillas
 * rectas dentro. Las angulares no chocan con nada de lo que se teclea
 * normalmente en un formulario.
 */
function quote(text: string): string {
  return `«${text}»`;
}

/** Nombre visible de un creador, que puede no tener username todavía. */
function creator(username: string | null): string {
  return username ? `@${username}` : "Un creador";
}

/** Nombre visible de una marca, que puede no tener razón social todavía. */
function brand(companyName: string | null): string {
  return companyName ?? "La marca";
}

// ---------------------------------------------------------------------------
// Candidaturas — el aviso va siempre a la parte contraria de quien actúa
// ---------------------------------------------------------------------------

/** El creador se postula. Se entera la marca. */
export function matchApplied(input: {
  matchId: string;
  campaignTitle: string;
  creatorUsername: string | null;
}): NotificationContent {
  return {
    type: "match_applied",
    title: "Nueva candidatura",
    body: `${creator(input.creatorUsername)} se postuló a ${quote(input.campaignTitle)}.`,
    href: "/candidates",
    entityType: "match",
    entityId: input.matchId,
  };
}

/** La marca acepta. Se entera el creador, y es la mejor noticia del producto. */
export function matchAccepted(input: {
  collaborationId: string;
  campaignTitle: string;
  brandName: string | null;
  agreedAmount: number | null;
}): NotificationContent {
  const amount =
    input.agreedAmount !== null ? ` Importe acordado: ${formatCOP(input.agreedAmount)}.` : "";

  return {
    type: "match_accepted",
    title: `Te aceptaron en ${quote(input.campaignTitle)}`,
    body: `${brand(input.brandName)} abrió la colaboración.${amount}`,
    href: `/collaborations/${input.collaborationId}`,
    entityType: "collaboration",
    entityId: input.collaborationId,
  };
}

/**
 * La marca rechaza. Se entera el creador.
 *
 * El texto es deliberadamente seco y no inventa un motivo: la marca no da
 * ninguno, y adornarlo («buscaban otro perfil») sería ponerle palabras en la
 * boca. Tampoco dice «descartada», que es la palabra del otro estado.
 */
export function matchDeclined(input: {
  matchId: string;
  campaignTitle: string;
  brandName: string | null;
}): NotificationContent {
  return {
    type: "match_declined",
    title: `No te seleccionaron para ${quote(input.campaignTitle)}`,
    body: `${brand(input.brandName)} no siguió adelante con tu candidatura.`,
    href: "/matches?estado=declined",
    entityType: "match",
    entityId: input.matchId,
  };
}

// ---------------------------------------------------------------------------
// Colaboración en marcha
// ---------------------------------------------------------------------------

/** La marca fija qué hay que entregar. Se entera el creador. */
export function deliverablesDefined(input: {
  collaborationId: string;
  campaignTitle: string;
  brandName: string | null;
  count: number;
}): NotificationContent {
  return {
    type: "deliverables_defined",
    title: "Entregables actualizados",
    body: `${brand(input.brandName)} dejó ${input.count} ${
      input.count === 1 ? "entregable" : "entregables"
    } en ${quote(input.campaignTitle)}.`,
    href: `/collaborations/${input.collaborationId}`,
    entityType: "collaboration",
    entityId: input.collaborationId,
  };
}

/** El creador entrega. Se entera la marca. */
export function deliverableSubmitted(input: {
  collaborationId: string;
  campaignTitle: string;
  creatorUsername: string | null;
}): NotificationContent {
  return {
    type: "deliverable_submitted",
    title: "Nuevo entregable",
    body: `${creator(input.creatorUsername)} actualizó los entregables de ${quote(input.campaignTitle)}.`,
    href: `/collaborations/${input.collaborationId}`,
    entityType: "collaboration",
    entityId: input.collaborationId,
  };
}

/** El creador reporta métricas. Se entera la marca. */
export function metricsReported(input: {
  collaborationId: string;
  campaignTitle: string;
  creatorUsername: string | null;
}): NotificationContent {
  return {
    type: "metrics_reported",
    title: "Métricas reportadas",
    body: `${creator(input.creatorUsername)} publicó el rendimiento de ${quote(input.campaignTitle)}.`,
    href: `/collaborations/${input.collaborationId}`,
    entityType: "collaboration",
    entityId: input.collaborationId,
  };
}

// ---------------------------------------------------------------------------
// Pago — las dos mitades de una declaración que ocurre fuera de la plataforma
// ---------------------------------------------------------------------------

/**
 * La marca declara haber pagado. Se entera el creador.
 *
 * Dice «declaró» y no «pagó» a propósito: la plataforma no ha visto ese
 * dinero y no puede afirmarlo. Ver la sección de pagos del README.
 */
export function paymentDeclared(input: {
  collaborationId: string;
  campaignTitle: string;
  brandName: string | null;
  amount: number | null;
}): NotificationContent {
  const amount = input.amount !== null ? ` de ${formatCOP(input.amount)}` : "";

  return {
    type: "payment_declared",
    title: "La marca declaró el pago",
    body: `${brand(input.brandName)} dice haber enviado el pago${amount} de ${quote(input.campaignTitle)}. Confírmalo cuando lo recibas.`,
    href: `/collaborations/${input.collaborationId}`,
    entityType: "collaboration",
    entityId: input.collaborationId,
  };
}

/** El creador confirma haberlo recibido. Se entera la marca. */
export function paymentConfirmed(input: {
  collaborationId: string;
  campaignTitle: string;
  creatorUsername: string | null;
  amount: number | null;
}): NotificationContent {
  const amount = input.amount !== null ? ` de ${formatCOP(input.amount)}` : "";

  return {
    type: "payment_confirmed",
    title: "El creador confirmó el pago",
    body: `${creator(input.creatorUsername)} confirma haber recibido el pago${amount} de ${quote(input.campaignTitle)}.`,
    href: `/collaborations/${input.collaborationId}`,
    entityType: "collaboration",
    entityId: input.collaborationId,
  };
}

// ---------------------------------------------------------------------------
// Cierre
// ---------------------------------------------------------------------------

/**
 * La colaboración se cierra. Se entera la parte que NO la cerró.
 *
 * Un solo constructor para los dos estados terminales: cambia el verbo, no
 * la estructura, y tenerlos juntos evita que uno se quede sin actualizar.
 */
export function collaborationClosed(input: {
  collaborationId: string;
  campaignTitle: string;
  status: "completed" | "cancelled";
  closedByName: string | null;
}): NotificationContent {
  const completed = input.status === "completed";
  const who = input.closedByName ?? "La otra parte";

  return {
    type: completed ? "collaboration_completed" : "collaboration_cancelled",
    title: completed
      ? `Colaboración completada: ${quote(input.campaignTitle)}`
      : `Colaboración cancelada: ${quote(input.campaignTitle)}`,
    body: completed
      ? `${who} dio por terminada la colaboración.`
      : `${who} canceló la colaboración.`,
    href: `/collaborations/${input.collaborationId}`,
    entityType: "collaboration",
    entityId: input.collaborationId,
  };
}
