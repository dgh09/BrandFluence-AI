import type { Metadata, Viewport } from "next";
import {
  Archivo,
  IBM_Plex_Mono,
  Newsreader,
  Plus_Jakarta_Sans,
} from "next/font/google";
import "./globals.css";

/** La cara del panel. Sigue siendo la de la aplicación entera. */
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Las tres caras del documento, solo para la portada.
 *
 * `axes: ["wdth"]` trae el eje de anchura de Archivo (62–125): la condensación
 * de los titulares es del tipo, no un `scaleX` sobre la cara normal. Cuesta
 * unos kilobytes más de fichero y es la diferencia entre una grotesca de
 * titular y una cara estirada a mano.
 */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

/** Cuerpo. Serif de lectura porque el texto vive sobre papel claro. */
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
});

/** Etiquetas, metadatos y cifras. No es variable: pesos explícitos. */
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "BrandFluence AI",
    template: "%s · BrandFluence AI",
  },
  description:
    "La plataforma que conecta creadores con marcas. Matching con IA para campañas UGC.",
  applicationName: "BrandFluence AI",
  // Para que instalada como PWA se comporte como app nativa
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BrandFluence",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0B0C",
  // La referencia es una app a pantalla completa: que el contenido pueda
  // llegar hasta debajo de la barra de estado y el home indicator.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${jakarta.variable} ${archivo.variable} ${newsreader.variable} ${plexMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        {children}
      </body>
    </html>
  );
}
