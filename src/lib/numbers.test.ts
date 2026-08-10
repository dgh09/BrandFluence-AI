import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatCount, formatPercent } from "./numbers.ts";

describe("formatCount", () => {
  it("agrupa los miles", () => {
    assert.equal(formatCount(42_000), "42.000");
    assert.equal(formatCount(1_234_567), "1.234.567");
  });

  it("agrupa también los de cuatro dígitos", () => {
    // Aquí es donde es-CO y es-ES se separan: España dejaría «3100», y en
    // una fila junto a «42.000» se leen con reglas distintas.
    assert.equal(formatCount(3100), "3.100");
    assert.equal(formatCount(1000), "1.000");
  });

  it("por debajo del millar no inventa separadores", () => {
    assert.equal(formatCount(0), "0");
    assert.equal(formatCount(999), "999");
  });

  it("redondea: no hay medias visualizaciones", () => {
    assert.equal(formatCount(1499.6), "1.500");
  });

  it("un número imposible no pinta «NaN» en pantalla", () => {
    assert.equal(formatCount(Number.NaN), "");
    assert.equal(formatCount(Number.POSITIVE_INFINITY), "");
  });
});

describe("formatPercent", () => {
  it("siempre un decimal, para que la columna quede alineada", () => {
    assert.equal(formatPercent(7.4), "7,4%");
    assert.equal(formatPercent(12), "12,0%");
  });

  it("coma decimal, no punto", () => {
    assert.match(formatPercent(7.4), /,/);
  });

  it("un número imposible no pinta «NaN%»", () => {
    assert.equal(formatPercent(Number.NaN), "");
  });
});
