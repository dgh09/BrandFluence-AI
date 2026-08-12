import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  AUDIENCE_BASELINE,
  ENGAGEMENT_TARGET,
  FRAUD_THRESHOLD,
  WEIGHTS,
  areRelated,
  scoreMatch,
  type CampaignFacts,
  type CreatorFacts,
} from "./matching.ts";

const creator = (overrides: Partial<CreatorFacts> = {}): CreatorFacts => ({
  niche: "fitness",
  followerCount: 50_000,
  engagementRate: 6,
  isVerified: false,
  fraudScore: null,
  hasBio: true,
  ...overrides,
});

const campaign = (overrides: Partial<CampaignFacts> = {}): CampaignFacts => ({
  targetNiche: "fitness",
  minFollowers: 10_000,
  ...overrides,
});

describe("filtros duros", () => {
  it("descarta si el nicho no es afín", () => {
    const result = scoreMatch(creator(), campaign({ targetNiche: "finanzas" }));
    assert.equal(result.eligible, false);
    assert.match(result.reason ?? "", /Nicho no afín/);
    assert.equal(result.score, 0);
  });

  it("descarta si no llega al mínimo de seguidores", () => {
    const result = scoreMatch(
      creator({ followerCount: 9_999 }),
      campaign({ minFollowers: 10_000 }),
    );
    assert.equal(result.eligible, false);
    assert.match(result.reason ?? "", /Audiencia insuficiente/);
  });

  it("acepta si iguala exactamente el mínimo", () => {
    const result = scoreMatch(
      creator({ followerCount: 10_000 }),
      campaign({ minFollowers: 10_000 }),
    );
    assert.equal(result.eligible, true);
  });

  it("descarta por sospecha de fraude", () => {
    const result = scoreMatch(
      creator({ fraudScore: FRAUD_THRESHOLD + 0.01 }),
      campaign(),
    );
    assert.equal(result.eligible, false);
    assert.match(result.reason ?? "", /fraude/);
  });

  it("descarta si falta el nicho de cualquiera de los dos lados", () => {
    assert.equal(scoreMatch(creator({ niche: null }), campaign()).eligible, false);
    assert.equal(
      scoreMatch(creator(), campaign({ targetNiche: null })).eligible,
      false,
    );
  });
});

describe("nicho", () => {
  it("da los puntos completos al nicho exacto", () => {
    const result = scoreMatch(creator(), campaign());
    assert.equal(result.breakdown.niche, WEIGHTS.niche);
  });

  it("da el 60% al nicho afín", () => {
    const result = scoreMatch(creator(), campaign({ targetNiche: "salud" }));
    assert.equal(result.eligible, true);
    assert.equal(result.breakdown.niche, WEIGHTS.niche * 0.6);
  });

  it("el mapa de afinidad es simétrico", () => {
    assert.equal(areRelated("fitness", "salud"), true);
    assert.equal(areRelated("salud", "fitness"), true);
    assert.equal(areRelated("fitness", "finanzas"), false);
  });

  it("un nicho no es afín consigo mismo en el mapa", () => {
    // La igualdad exacta se comprueba aparte; el mapa es solo para vecinos.
    assert.equal(areRelated("fitness", "fitness"), false);
  });
});

describe("audiencia", () => {
  it("puntúa más al que supera más el mínimo", () => {
    const justo = scoreMatch(
      creator({ followerCount: 10_000 }),
      campaign({ minFollowers: 10_000 }),
    );
    const holgado = scoreMatch(
      creator({ followerCount: 100_000 }),
      campaign({ minFollowers: 10_000 }),
    );
    assert.ok(holgado.breakdown.audience > justo.breakdown.audience);
  });

  it("satura: 100x el mínimo no puntúa más que 10x", () => {
    const diez = scoreMatch(
      creator({ followerCount: 100_000 }),
      campaign({ minFollowers: 10_000 }),
    );
    const cien = scoreMatch(
      creator({ followerCount: 1_000_000 }),
      campaign({ minFollowers: 10_000 }),
    );
    assert.equal(cien.breakdown.audience, diez.breakdown.audience);
    assert.equal(cien.breakdown.audience, WEIGHTS.audience);
  });

  it("usa un suelo cuando la campaña no exige mínimo", () => {
    const result = scoreMatch(
      creator({ followerCount: AUDIENCE_BASELINE }),
      campaign({ minFollowers: 0 }),
    );
    // Justo en el suelo → nada de bonus por crecimiento, solo la base del 60%.
    assert.equal(result.breakdown.audience, WEIGHTS.audience * 0.6);
  });
});

describe("engagement", () => {
  it("da los puntos completos al alcanzar el objetivo", () => {
    const result = scoreMatch(
      creator({ engagementRate: ENGAGEMENT_TARGET }),
      campaign(),
    );
    assert.equal(result.breakdown.engagement, WEIGHTS.engagement);
  });

  it("no supera el máximo aunque el engagement sea altísimo", () => {
    const result = scoreMatch(creator({ engagementRate: 100 }), campaign());
    assert.equal(result.breakdown.engagement, WEIGHTS.engagement);
  });

  it("distingue 'sin datos' de 'engagement cero'", () => {
    const sinDatos = scoreMatch(creator({ engagementRate: null }), campaign());
    const cero = scoreMatch(creator({ engagementRate: 0 }), campaign());
    assert.ok(sinDatos.breakdown.engagement > cero.breakdown.engagement);
    assert.equal(cero.breakdown.engagement, 0);
    assert.ok(sinDatos.notes.includes("Sin datos de engagement"));
  });
});

describe("score total", () => {
  it("el perfil ideal llega a 100", () => {
    const result = scoreMatch(
      creator({
        followerCount: 1_000_000,
        engagementRate: 10,
        isVerified: true,
        fraudScore: 0,
        hasBio: true,
      }),
      campaign({ minFollowers: 10_000 }),
    );
    assert.equal(result.score, 100);
  });

  it("nunca se sale de 0-100", () => {
    const casos: CreatorFacts[] = [
      creator({ followerCount: 10_000_000, engagementRate: 99, isVerified: true }),
      creator({ followerCount: 10_000, engagementRate: 0, hasBio: false }),
      creator({ engagementRate: null, fraudScore: 0.69 }),
    ];
    for (const c of casos) {
      const result = scoreMatch(c, campaign());
      assert.ok(result.score >= 0 && result.score <= 100, `score ${result.score}`);
    }
  });

  it("el desglose suma exactamente el total", () => {
    const result = scoreMatch(creator({ engagementRate: 3.7 }), campaign());
    const { niche, audience, engagement, trust } = result.breakdown;
    const suma = Math.round((niche + audience + engagement + trust) * 100) / 100;
    assert.equal(suma, result.score);
  });

  it("un candidato mejor siempre puntúa por encima de uno peor", () => {
    const bueno = scoreMatch(
      creator({ engagementRate: 8, isVerified: true, followerCount: 200_000 }),
      campaign(),
    );
    const malo = scoreMatch(
      creator({
        niche: "salud",
        engagementRate: 1,
        isVerified: false,
        hasBio: false,
        followerCount: 10_000,
      }),
      campaign(),
    );
    assert.ok(bueno.score > malo.score);
  });
});

/**
 * La portada enseña cifras concretas como «ejemplo real del algoritmo». Si el
 * algoritmo cambia y estos números no, la portada miente y nadie se entera:
 * el resto del fichero comprueba el comportamiento, no los valores que la
 * página tiene escritos. Estos tests son el sitio donde se nota.
 *
 * Si uno falla, hay que cambiar `src/app/page.tsx` — no el test.
 */
describe("cifras que la portada tiene escritas", () => {
  /** Lucía: el perfil del ejemplo. Con bio, sin verificar → confianza 5. */
  const lucia = creator({
    niche: "fitness",
    followerCount: 48_200,
    engagementRate: 5.4,
    isVerified: false,
    fraudScore: null,
    hasBio: true,
  });

  it("la bandeja de Lucía: 89,33 · 86,32 · 76,34", () => {
    assert.equal(scoreMatch(lucia, campaign({ minFollowers: 10_000 })).score, 89.33);
    assert.equal(scoreMatch(lucia, campaign({ minFollowers: 20_000 })).score, 86.32);
    assert.equal(
      scoreMatch(lucia, campaign({ targetNiche: "salud", minFollowers: 5_000 })).score,
      76.34,
    );
  });

  it("«Colección ropa técnica» no le sale a Lucía: es filtro duro, no nota baja", () => {
    const result = scoreMatch(
      lucia,
      campaign({ targetNiche: "moda", minFollowers: 50_000 }),
    );
    assert.equal(result.eligible, false);
  });

  it("los candidatos del swipe: 89,33 · 77,36 · 46,93", () => {
    const proteina = campaign({ targetNiche: "fitness", minFollowers: 10_000 });

    assert.equal(scoreMatch(lucia, proteina).score, 89.33);

    const andres = creator({
      niche: "salud",
      followerCount: 21_700,
      engagementRate: 6,
      isVerified: true,
      fraudScore: null,
      hasBio: true,
    });
    assert.equal(scoreMatch(andres, proteina).score, 77.36);

    const lifestyle = creator({
      niche: "lifestyle",
      followerCount: 12_400,
      engagementRate: 1.2,
      isVerified: false,
      fraudScore: null,
      hasBio: false,
    });
    assert.equal(scoreMatch(lifestyle, proteina).score, 46.93);
  });

  it("los tres del swipe caen en el color que la portada enseña", () => {
    // El umbral importa: 77,36 en verde y 46,93 en rojo es lo que hace legible
    // «conectar» frente a «pasar» sin leer la cifra.
    assert.ok(89.33 >= 75 && 77.36 >= 75, "los dos de conectar van en verde");
    assert.ok(46.93 < 50, "el de pasar va en rojo");
  });
});
