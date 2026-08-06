import type { ReactNode } from "react";

import { Card } from "@/components/ui/Card";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

/**
 * Estado vacío. Nunca dejamos una sección en blanco: siempre decimos qué
 * pasa y cuál es el siguiente paso.
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      {icon ? (
        <span className="text-ink-muted" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mx-auto mt-1 max-w-xs text-sm text-ink-secondary">
          {description}
        </p>
      </div>
      {action}
    </Card>
  );
}
