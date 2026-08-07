import assert from "node:assert/strict";
import { describe, it } from "node:test";

// Extensión explícita: `node --test` resuelve como ESM y necesita el .ts.
import { engagementRate, parseMetrics } from "./metrics.ts";

describe("engagementRate", () => {
  it("divide las interacciones entre las visualizaciones", () => {
    const rate = engagementRate({
      views: 10_000,
      likes: 400,
      comments: 50,
      shares: 30,
      saves: 20,
    });
    assert.equal(rate, 5); // 500 / 10 000
  });

  it("suma solo las cuatro interacciones, no las visualizaciones", () => {
    assert.equal(engagementRate({ views: 100, likes: 10 }), 10);
  });

  it("trata los campos ausentes como cero interacciones, no como error", () => {
    assert.equal(engagementRate({ views: 200 }), 0);
  });

  it("sin visualizaciones no se puede calcular, y eso NO es un 0%", () => {
    // Si devolviera 0, un creador que aún no ha reportado las
    // visualizaciones aparecería con el mismo engagement que uno cuyo vídeo
    // no interesó a nadie. Es la misma distinción que hace matching.ts.
    assert.equal(engagementRate({ likes: 500 }), null);
    assert.equal(engagementRate({ views: 0, likes: 500 }), null);
    assert.equal(engagementRate(null), null);
  });

  it("un vídeo que nadie tocó da un 0% real", () => {
    assert.equal(engagementRate({ views: 5000, likes: 0 }), 0);
  });
});

describe("parseMetrics", () => {
  it("acepta un reporte normal", () => {
    const parsed = parseMetrics({ views: 1000, likes: 50, reportedAt: "2026-08-07" });
    assert.deepEqual(parsed, { views: 1000, likes: 50, reportedAt: "2026-08-07" });
  });

  it("devuelve null cuando no hay nada guardado", () => {
    assert.equal(parseMetrics(null), null);
    assert.equal(parseMetrics(undefined), null);
    assert.equal(parseMetrics({}), null);
  });

  it("descarta un array: el formato es un objeto", () => {
    assert.equal(parseMetrics([{ views: 10 }]), null);
  });

  it("descarta valores que no son números utilizables", () => {
    const parsed = parseMetrics({
      views: 1000,
      likes: "muchos",
      comments: -5,
      shares: Number.NaN,
      saves: null,
    });
    assert.deepEqual(parsed, { views: 1000 });
  });

  it("ignora claves que no son métricas conocidas", () => {
    const parsed = parseMetrics({ views: 10, seguidores: 999 });
    assert.deepEqual(parsed, { views: 10 });
  });

  it("una marca de tiempo suelta no es un reporte", () => {
    // Sin ninguna cifra no hay nada que enseñar, así que no se pinta la
    // sección con un "Reportado el ..." vacío.
    assert.equal(parseMetrics({ reportedAt: "2026-08-07" }), null);
  });

  it("conserva un cero real, que no es lo mismo que no reportar", () => {
    assert.deepEqual(parseMetrics({ views: 0 }), { views: 0 });
  });
});
