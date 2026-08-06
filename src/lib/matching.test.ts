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
