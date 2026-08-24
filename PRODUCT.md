# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Dos audiencias, y **ninguna manda sobre la otra** (confirmado por Daniel el 24 de
agosto de 2026): cuando el diseño tenga que elegir un lado, no elige.

- **Creadores de contenido en Colombia**, sobre todo micro-influencers. Situación:
  tienen audiencia y no tienen forma de encontrar marcas. Trabajo: montar un
  perfil con nicho, seguidores y engagement, ver qué campañas les salen
  puntuadas, postularse y entregar.
- **Marcas que publican campañas UGC.** Situación: quieren creadores afines y hoy
  buscan a mano o por agencia. Trabajo: publicar una campaña con nicho objetivo y
  mínimo de seguidores, recibir candidatos ya puntuados, aceptar o rechazar, y
  llevar la colaboración hasta el cierre.

## Product Purpose

Emparejar creadores con campañas y **explicar cada emparejamiento**. El sistema
puntúa cada pareja creador-campaña de 0 a 100 y guarda el desglose, de modo que
«¿por qué me sale esta campaña?» tiene respuesta sin recalcular nada. Éxito es
que las dos partes entiendan la nota lo bastante como para discutirla.

## Positioning

El diferencial no es que haya matching: es que el matching **se explica y se
puede auditar**. Tres cosas que un competidor no puede copiar diciéndolas:

- El score se reparte en cuatro componentes con pesos declarados (nicho 40,
  audiencia 25, engagement 25, confianza 10) y el desglose viaja con cada match.
- Los filtros duros **no restan puntos: impiden que la pareja exista**. Nicho sin
  relación, audiencia por debajo del mínimo o sospecha de fraude no producen una
  nota baja, producen ausencia de match.
- El algoritmo es una función pura, testeada por su comportamiento y no mirando
  la pantalla, con tres decisiones deliberadas: la audiencia satura a 10× el
  mínimo, existen los nichos afines (24 de 40 en vez de nada), y «sin datos de
  engagement» no es «engagement 0».

## Operating Context

- **Colombia.** Importes en pesos colombianos, formato `es-CO` en todo (los
  módulos `currency.ts`, `dates.ts` y `numbers.ts` existen para eso; no hay
  ningún `Intl` suelto).
- **La plataforma no mueve dinero.** La marca paga por fuera y las dos partes
  declaran el pago: la marca dice que pagó, el creador confirma que lo recibió.
  No hay retención, transferencia ni comisión, y no hay pasarela integrada.
- Un match recorre cinco estados y cada transición la provoca una persona
  distinta. Los entregables se suben a Supabase Storage en dos buckets.
- Los avisos son **solo dentro de la aplicación**: hay que entrar para enterarse.

## Capabilities and Constraints

Next.js 16 (App Router) · Auth.js v5 · Postgres en Supabase **por `pg`, no por
PostgREST** · Supabase Storage · Tailwind v4 · `motion`. Repositorio público.

- El matching se recalcula al publicar una campaña y al actualizar un perfil, y
  un invariante en SQL impide pisar un match que el creador ya tocó.
- Sin librería de componentes, y es deliberado: `design-tokens.ts` duplica los
  tokens en TypeScript para que la futura app de Expo los consuma tal cual.
- Nunca activar `FORCE ROW LEVEL SECURITY`: la app se conecta como dueño de las
  tablas y forzarlo dejaría el sitio en cero filas.

**Decisiones de producto explícitamente sin decidir** (no inventarlas):
negociar el importe por candidato, deshacer un rechazo, borrar de Storage los
ficheros de una colaboración eliminada, avisar fuera de la app, verificar el
email en el alta, cobro real con pasarela, y si se cambia la paleta de acento.

## Brand Commitments

- Nombre **BrandFluence AI**. Eslogan **«Cada match, con su porqué»**, elegido
  entre seis propuestas.
- **La honestidad del pie es intocable** (confirmado por Daniel): «MVP en
  desarrollo activo, construido en público». Ninguna pieza puede dar a entender
  una plataforma consolidada.
- Voz: español de Colombia, plana y específica, voz activa, sentence case. El
  botón dice exactamente lo que pasa al pulsarlo.
- Existe un logotipo de cubo hexagonal en un solo sitio
  (`src/components/shared/Logo.tsx`) más `icon.svg` y `favicon.ico`. Daniel **no**
  lo declaró intocable.

## Evidence on Hand

- **Real y verificable:** el algoritmo. Lucía (fitness, 48.200 seguidores, 5,4%
  de engagement) puntúa 89,33 · 86,32 · 76,34 contra tres campañas y **sin match**
  contra «Colección ropa técnica» por audiencia. Sale de ejecutar `scoreMatch` y
  está fijado en `matching.test.ts`.
- **No existe, y no se puede fabricar:** testimonios, logotipos de clientes,
  cifras de tracción, casos de éxito, reseñas. No hay usuarios reales.
- Usuarios de demo sembrados por `seed-demo.mjs` para probar contra producción.

## Product Principles

1. **Si aparece un número, se puede rastrear de dónde salió.** Ninguna cifra
   visible se escribe a ojo; sale del algoritmo y queda fijada en un test.
2. **El desglose se enseña antes de que lo pidan.** Nunca detrás de un tooltip ni
   de un acordeón cerrado.
3. **Una ausencia se explica igual que una nota.** El filtro duro se muestra, no
   se cuenta.
4. **El estado real se dice en voz alta.** Lo que no está construido no se
   insinúa, y lo que está sin decidir se anota como sin decidir.
5. **Los tokens son código compartido, no CSS.** Cualquier valor visual tiene que
   poder viajar a la app nativa sin traducción.

## Accessibility & Inclusion

Contraste AA como mínimo, foco de teclado visible, `prefers-reduced-motion`
respetado, imágenes con `alt` real, y la interfaz utilizable hasta 360px de
ancho. El producto es dark-only por diseño.
