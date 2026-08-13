// Los valores vienen del CHECK de `campaigns.status` (database/schema.sql).
// La base habla en inglés; la interfaz, no.
const STATUS: Record<string, string> = {
  draft: "Borrador",
  published: "Publicada",
  active: "Activa",
  completed: "Completada",
};

/**
 * Estado de una campaña.
 *
 * Neutra a propósito, al revés que la de colaboraciones: ahí el verde y el
 * rojo separan «Activa» de «Cancelada», que son desenlaces. Aquí los cuatro
 * estados son etapas normales de una campaña y ninguno es una mala noticia,
 * así que colorearlos sugeriría una alarma que no existe.
 */
export function CampaignStatusBadge({ status }: { status: string }) {
  return (
    <span className="shrink-0 rounded-pill bg-surface-2 px-3 py-1 text-xs font-medium text-ink-secondary">
      {STATUS[status] ?? status}
    </span>
  );
}
