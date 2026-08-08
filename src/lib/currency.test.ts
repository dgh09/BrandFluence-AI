import assert from "node:assert/strict";
import { describe, it } from "node:test";

// Extensión explícita: `node --test` resuelve como ESM y necesita el .ts.
import { CURRENCY_CODE, formatCOP, formatCOPExplicit } from "./currency.ts";

describe("formatCOP", () => {
  it("agrupa los miles con punto, como se escribe en Colombia", () => {
    assert.equal(formatCOP(2_500_000), "$2.500.000");
    assert.equal(formatCOP(1_800), "$1.800");
  });

  it("no arrastra decimales: el centavo de peso no circula", () => {
    assert.equal(formatCOP(2500.49), "$2.500");
    assert.equal(formatCOP(2500.5), "$2.501");
  });

  it("no mete espacios raros entre el símbolo y la cifra", () => {
    // Es la razón de que el símbolo lo pongamos a mano en vez de pedirle a
    // Intl el formato de moneda: ese devuelve U+00A0, cuyo valor depende de
    // la versión de ICU y rompe la hidratación entre servidor y navegador.
    const salida = formatCOP(1000);
    assert.equal(salida, "$1.000");
    assert.ok(!salida.includes(" "), "no debe haber espacio duro");
    assert.ok(!/\s/.test(salida), "no debe haber ningún espacio");
  });

  it("aguanta el cero y los importes grandes", () => {
    assert.equal(formatCOP(0), "$0");
    assert.equal(formatCOP(999_999_999), "$999.999.999");
  });
});

describe("formatCOPExplicit", () => {
  it("dice la moneda para donde confundirla con dólares saldría caro", () => {
    assert.equal(formatCOPExplicit(2_500_000), "$2.500.000 COP");
  });

  it("usa el mismo código que se guarda", () => {
    assert.ok(formatCOPExplicit(1).endsWith(CURRENCY_CODE));
  });
});
