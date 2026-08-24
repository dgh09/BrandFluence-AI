import type { Metadata, Viewport } from "next";
import {
  Big_Shoulders,
  Faustina,
  Martian_Mono,
  Plus_Jakarta_Sans,
} from "next/font/google";
import "./globals.css";

/** La cara del panel. Sigue mandando en la aplicación entera. */
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Display. Grotesca comprimida de rotulación, con caja baja de verdad.
 * `axes: ["opsz"]` trae el tamaño óptico (10–72): a cuerpo de titular la cara
 * afina los trazos por sí sola, que es la diferencia entre una condensada de
 * rótulo y una normal apretada a mano.
 */
const shoulders = Big_Shoulders({
  variable: "--font-shoulders",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
  // Next no tiene métricas de sustitución para esta cara y avisa de que no
  // genera respaldo ajustado, así que el respaldo se declara a mano: una
  // condensada de sistema, para que el salto al cargar la cara real sea de
  // milímetros y no de renglones.
  fallback: ["Arial Narrow", "Helvetica Neue Condensed", "Arial", "sans-serif"],
});

/** Cuerpo. Serif de texto: la prosa vive sobre papel claro. */
const faustina = Faustina({
  variable: "--font-faustina",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Utilidad. Monoespaciada con eje de anchura, que se usa condensada al 80%:
 * las etiquetas van en versalitas y a la misma talla que el cuerpo, así que
 * tienen que ocupar menos para que la talla única no reviente las columnas.
 */
const martian = Martian_Mono({
  variable: "--font-martian",
  subsets: ["latin"],
  axes: ["wdth"],
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

/**
 * El contrato de dirección, emitido en el HTML.
 *
 * React no renderiza comentarios JSX, y este tiene que sobrevivir al build de
 * producción para poder auditarse: de ahí el div oculto. Es lo que se relee
 * antes de cada edición de la portada.
 */
const CONTRATO = `<!--
THESIS: la nota se audita, no se presenta. Rechaza la rejilla de cuatro tarjetas
de componentes que envia toda la categoria.
OWN-WORLD: tinta #0B0B0C, papel bond #F0EDE4, un solo gris #63615C, coral
#FF3B4F solo como marca de correccion. Big Shoulders en caja baja, Faustina de
cuerpo, Martian Mono de etiqueta. Radio 0, sin sombras, bordes rasgados por
filtro SVG, tres tamanos en toda la pagina.
STORY: el visitante ve un numero enorme, lee de donde sale cada punto y cuanto
falta, ve una campana tachada que no llego a existir, y entra por su lado.
FIRST VIEWPORT: ficha de papel a la izquierda con 89,33 al mayor tamano de la
pagina y las cuatro lineas de desglose debajo; a la derecha el titular en caja
baja a dos lineas y los dos botones. Nada centrado.
FORM: dossier de casting calificado, fijado por el brief; candidato 1 de la
lista propia, asignacion 6 descartada por el pin. Seed d9c9bd0d.
FINISH: unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, DESIGN.md, and every shipping raster carrying its
provenance
-->`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${jakarta.variable} ${shoulders.variable} ${faustina.variable} ${martian.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        <div hidden dangerouslySetInnerHTML={{ __html: CONTRATO }} />
        {children}
      </body>
    </html>
  );
}
