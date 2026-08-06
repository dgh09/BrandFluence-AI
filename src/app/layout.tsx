import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
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
    <html lang="es" className={`${jakarta.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        {children}
      </body>
    </html>
  );
}
