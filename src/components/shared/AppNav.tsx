"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CircleUser,
  Handshake,
  House,
  Megaphone,
  Sparkles,
  Users,
} from "lucide-react";

import { Logo } from "@/components/shared/Logo";

type UserType = "creator" | "brand" | null;

interface NavItem {
  href: string;
  label: string;
  Icon: typeof House;
}

const AVISOS: NavItem = { href: "/notifications", label: "Avisos", Icon: Bell };

const CREATOR_NAV: NavItem[] = [
  { href: "/dashboard", label: "Inicio", Icon: House },
  { href: "/matches", label: "Matches", Icon: Sparkles },
  { href: "/collaborations", label: "Colabos", Icon: Handshake },
  AVISOS,
  { href: "/profile", label: "Cuenta", Icon: CircleUser },
];

const BRAND_NAV: NavItem[] = [
  { href: "/dashboard", label: "Inicio", Icon: House },
  { href: "/campaigns", label: "Campañas", Icon: Megaphone },
  { href: "/candidates", label: "Candidatos", Icon: Users },
  { href: "/collaborations", label: "Colabos", Icon: Handshake },
  AVISOS,
  { href: "/profile", label: "Cuenta", Icon: CircleUser },
];

/**
 * El contador de no leídas.
 *
 * Se corta en 9+ porque el hueco es el que es y «14» ya no cabe sin romper
 * la fila de la tab bar. Además del número, va el texto para lectores de
 * pantalla: un globo rojo no dice nada por sí solo.
 */
function unreadLabel(count: number): string {
  return count === 1 ? "1 aviso sin leer" : `${count} avisos sin leer`;
}

function badgeText(count: number): string {
  return count > 9 ? "9+" : String(count);
}

/**
 * Navegación principal.
 *
 * Mobile-first, igual que la referencia: tab bar fija abajo con 4 destinos.
 * A partir de `md` se convierte en sidebar lateral, porque una tab bar
 * inferior en un monitor de 27" no tiene ningún sentido.
 */
export function AppNav({
  userType,
  unreadCount = 0,
}: {
  userType: UserType;
  /** No leídas. Lo calcula el layout en el servidor, en cada carga. */
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const items = userType === "brand" ? BRAND_NAV : CREATOR_NAV;

  /**
   * El globo se calla mientras estás en la propia página de avisos.
   *
   * El contador lo cuenta el layout en el servidor, y el layout se renderiza
   * ANTES de que la página marque los avisos como leídos. Sin esto, entrar
   * en /notifications deja la campana insistiendo en que te queda uno sin
   * leer justo mientras lo estás leyendo, hasta la siguiente navegación.
   *
   * Y es cierto además de conveniente: en esa pantalla están todos a la
   * vista, así que no queda nada de lo que avisar.
   */
  const showBadge = unreadCount > 0 && pathname !== AVISOS.href;
  const isBell = (href: string) => href === AVISOS.href;

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* --- Móvil: tab bar inferior --------------------------------------- */}
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-canvas/95 backdrop-blur md:hidden"
        // Respeta el home indicator del iPhone
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="flex">
          {items.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                    active ? "text-accent" : "text-ink-muted hover:text-ink-secondary",
                  ].join(" ")}
                >
                  <span className="relative">
                    <Icon size={22} strokeWidth={active ? 2.4 : 1.8} aria-hidden="true" />
                    {isBell(href) && showBadge ? (
                      <>
                        <span
                          className="absolute -right-2 -top-1 grid min-w-4 place-items-center rounded-pill bg-accent px-1 text-[10px] font-bold text-accent-ink"
                          aria-hidden="true"
                        >
                          {badgeText(unreadCount)}
                        </span>
                        <span className="sr-only">{unreadLabel(unreadCount)}</span>
                      </>
                    ) : null}
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* --- Escritorio: sidebar ------------------------------------------- */}
      <nav
        aria-label="Navegación principal"
        className="fixed inset-y-0 left-0 z-50 hidden w-60 flex-col border-r border-line bg-surface px-4 py-6 md:flex"
      >
        <Link href="/dashboard" className="mb-8 inline-flex w-fit px-2">
          <Logo size={30} />
        </Link>

        <ul className="flex flex-col gap-1">
          {items.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex items-center gap-3 rounded-tile px-3 py-2.5 text-sm font-semibold transition-colors",
                    active
                      ? "bg-accent text-accent-ink"
                      : "text-ink-secondary hover:bg-surface-2 hover:text-ink",
                  ].join(" ")}
                >
                  <Icon size={20} strokeWidth={2} aria-hidden="true" />
                  {label}
                  {isBell(href) && showBadge ? (
                    <>
                      {/* En la barra activa el globo iría rojo sobre rojo, así
                          que ahí se invierte. */}
                      <span
                        className={[
                          "ml-auto grid min-w-5 place-items-center rounded-pill px-1.5 text-[11px] font-bold",
                          active
                            ? "bg-accent-ink text-accent"
                            : "bg-accent text-accent-ink",
                        ].join(" ")}
                        aria-hidden="true"
                      >
                        {badgeText(unreadCount)}
                      </span>
                      <span className="sr-only">{unreadLabel(unreadCount)}</span>
                    </>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
