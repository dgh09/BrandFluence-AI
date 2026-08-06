"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CircleUser,
  Handshake,
  House,
  Megaphone,
  Sparkles,
  Users,
} from "lucide-react";

type UserType = "creator" | "brand" | null;

interface NavItem {
  href: string;
  label: string;
  Icon: typeof House;
}

const CREATOR_NAV: NavItem[] = [
  { href: "/dashboard", label: "Inicio", Icon: House },
  { href: "/matches", label: "Matches", Icon: Sparkles },
  { href: "/collaborations", label: "Colabos", Icon: Handshake },
  { href: "/profile", label: "Cuenta", Icon: CircleUser },
];

const BRAND_NAV: NavItem[] = [
  { href: "/dashboard", label: "Inicio", Icon: House },
  { href: "/campaigns", label: "Campañas", Icon: Megaphone },
  { href: "/candidates", label: "Candidatos", Icon: Users },
  { href: "/profile", label: "Cuenta", Icon: CircleUser },
];

/**
 * Navegación principal.
 *
 * Mobile-first, igual que la referencia: tab bar fija abajo con 4 destinos.
 * A partir de `md` se convierte en sidebar lateral, porque una tab bar
 * inferior en un monitor de 27" no tiene ningún sentido.
 */
export function AppNav({ userType }: { userType: UserType }) {
  const pathname = usePathname();
  const items = userType === "brand" ? BRAND_NAV : CREATOR_NAV;

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
                  <Icon size={22} strokeWidth={active ? 2.4 : 1.8} aria-hidden="true" />
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
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-2 px-2 text-lg font-extrabold tracking-tight"
        >
          <span
            className="grid size-8 place-items-center rounded-chip bg-accent text-accent-ink"
            aria-hidden="true"
          >
            B
          </span>
          BrandFluence
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
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
