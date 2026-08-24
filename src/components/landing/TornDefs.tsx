/**
 * El filtro que rasga los bordes del papel.
 *
 * Ruido fractal desplazando la geometría. Se declara una vez por documento y
 * lo consumen todos los `<Paper>` por `filter: url(#rasgado)`.
 *
 * Nunca se aplica al contenido, solo a la capa de fondo de `Paper`: el mismo
 * desplazamiento que rompe un borde recto haría ilegible un párrafo.
 *
 * `baseFrequency` asimétrica a propósito: con los dos ejes iguales el borde
 * queda ondulado y regular, que parece un sello. Con la frecuencia vertical
 * mucho más alta, las fibras se rompen a distinta escala en cada dirección,
 * que es lo que lee como papel rasgado a mano.
 */
export function TornDefs() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none absolute size-0"
    >
      <defs>
        <filter
          id="rasgado"
          x="-5%"
          y="-5%"
          width="110%"
          height="110%"
          primitiveUnits="userSpaceOnUse"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.09"
            numOctaves="4"
            seed="23"
            result="fibra"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="fibra"
            scale="8"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
