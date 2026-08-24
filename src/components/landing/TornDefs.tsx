/**
 * El filtro que rasga los bordes del papel.
 *
 * Ruido fractal desplazando la geometría: es lo que convierte un rectángulo en
 * un recorte. Se declara una sola vez por documento y lo consumen todos los
 * `<Paper>` por `filter: url(#borde-rasgado)`.
 *
 * Nunca se aplica al contenido, solo a la capa de fondo de `Paper`: el mismo
 * desplazamiento que rompe un borde recto haría ilegible un párrafo.
 *
 * `baseFrequency` asimétrica a propósito. Con los dos ejes iguales el borde
 * queda ondulado y regular, que parece un sello; con la frecuencia vertical
 * mucho más alta que la horizontal, las fibras se rompen a distinta escala en
 * cada dirección y es lo que lee como papel rasgado.
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
          id="borde-rasgado"
          x="-5%"
          y="-5%"
          width="110%"
          height="110%"
          // Sin esto el filtro trabaja en unidades relativas al objeto y el
          // desgarro sale gigante en las fichas pequeñas y minúsculo en las
          // grandes: la escala tiene que ser la misma en todas.
          filterUnits="objectBoundingBox"
          primitiveUnits="userSpaceOnUse"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.014 0.075"
            numOctaves="4"
            seed="11"
            result="fibra"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="fibra"
            scale="9"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
