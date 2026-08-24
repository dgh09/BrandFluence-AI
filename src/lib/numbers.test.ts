import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatCount, formatPercent, formatScore } from "./numbers.ts";

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

describe("formatScore", () => {
  it("las cifras que la portada enseña, tal como salen de scoreMatch", () => {
    assert.equal(formatScore(89.33), "89,33");
    assert.equal(formatScore(21.83), "21,83");
    assert.equal(formatScore(22.5), "22,5");
  });

  it("un componente exacto no finge decimales", () => {
    // 40 de nicho es 40, no 40,00: el algoritmo no tiene esa precisión.
    assert.equal(formatScore(40), "40");
    assert.equal(formatScore(5), "5");
  });

  it("el déficit se formatea igual que el valor", () => {
    // La portada enseña «faltan 3,17» junto a «21,83 de 25».
    assert.equal(formatScore(25 - 21.83), "3,17");
    assert.equal(formatScore(25 - 22.5), "2,5");
  });

  it("un número imposible no pinta «NaN»", () => {
    assert.equal(formatScore(Number.NaN), "");
  });
});
