import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  collaborationClosed,
  deliverablesDefined,
  matchAccepted,
  matchApplied,
  matchDeclined,
  paymentConfirmed,
  paymentDeclared,
} from "./notifications.ts";

describe("textos de las notificaciones", () => {
  it("nombra al creador con arroba y a la marca por su nombre", () => {
    const applied = matchApplied({
      matchId: "m1",
      campaignTitle: "Reto 30 días",
      creatorUsername: "luciamarquez",
    });
    assert.match(applied.body!, /@luciamarquez/);
    assert.match(applied.body!, /«Reto 30 días»/);
  });

  it("aguanta un perfil a medio rellenar sin escribir «null»", () => {
    const applied = matchApplied({
      matchId: "m1",
      campaignTitle: "Reto",
      creatorUsername: null,
    });
    assert.match(applied.body!, /^Un creador/);
    assert.doesNotMatch(applied.body!, /null|undefined|@\s/);

    const declined = matchDeclined({
      matchId: "m1",
      campaignTitle: "Reto",
      brandName: null,
    });
    assert.match(declined.body!, /^La marca/);
    assert.doesNotMatch(declined.body!, /null|undefined/);
  });

  it("el importe aceptado va formateado en pesos", () => {
    const accepted = matchAccepted({
      collaborationId: "c1",
      campaignTitle: "Reto",
      brandName: "Ironpeak",
      agreedAmount: 2_500_000,
    });
    assert.match(accepted.body!, /\$2\.500\.000/);
    assert.equal(accepted.href, "/collaborations/c1");
  });

  it("sin importe acordado no deja la frase colgando", () => {
    const accepted = matchAccepted({
      collaborationId: "c1",
      campaignTitle: "Reto",
      brandName: "Ironpeak",
      agreedAmount: null,
    });
    assert.doesNotMatch(accepted.body!, /Importe|null|\$/);
    assert.match(accepted.body!, /\.$/);
  });

  it("el rechazo no inventa un motivo ni dice «descartada»", () => {
    const declined = matchDeclined({
      matchId: "m1",
      campaignTitle: "Reto",
      brandName: "Ironpeak",
    });
    // «Descartada» es la palabra del otro estado, el que escribe el creador.
    assert.doesNotMatch(declined.title + declined.body!, /descart/i);
    assert.match(declined.href!, /estado=declined/);
  });

  it("el pago dice «declaró», nunca que la plataforma lo haya visto", () => {
    const declared = paymentDeclared({
      collaborationId: "c1",
      campaignTitle: "Reto",
      brandName: "Ironpeak",
      amount: 2_500_000,
    });
    assert.match(declared.title, /declaró/);
    assert.match(declared.body!, /dice haber enviado/);

    const confirmed = paymentConfirmed({
      collaborationId: "c1",
      campaignTitle: "Reto",
      creatorUsername: "lucia",
      amount: 2_500_000,
    });
    assert.match(confirmed.body!, /confirma haber recibido/);
  });

  it("singular y plural de los entregables", () => {
    const one = deliverablesDefined({
      collaborationId: "c1",
      campaignTitle: "Reto",
      brandName: "Ironpeak",
      count: 1,
    });
    assert.match(one.body!, /1 entregable\b/);

    const many = deliverablesDefined({
      collaborationId: "c1",
      campaignTitle: "Reto",
      brandName: "Ironpeak",
      count: 3,
    });
    assert.match(many.body!, /3 entregables/);
  });

  it("completar y cancelar dan tipos distintos", () => {
    const done = collaborationClosed({
      collaborationId: "c1",
      campaignTitle: "Reto",
      status: "completed",
      closedByName: "Ironpeak",
    });
    const cancelled = collaborationClosed({
      collaborationId: "c1",
      campaignTitle: "Reto",
      status: "cancelled",
      closedByName: "Ironpeak",
    });

    assert.equal(done.type, "collaboration_completed");
    assert.equal(cancelled.type, "collaboration_cancelled");
    assert.match(done.title, /completada/);
    assert.match(cancelled.title, /cancelada/);
  });

  it("todos apuntan a una pantalla que existe", () => {
    const all = [
      matchApplied({ matchId: "m", campaignTitle: "t", creatorUsername: "u" }),
      matchAccepted({
        collaborationId: "c",
        campaignTitle: "t",
        brandName: "b",
        agreedAmount: 1,
      }),
      matchDeclined({ matchId: "m", campaignTitle: "t", brandName: "b" }),
    ];
    for (const n of all) {
      assert.match(n.href!, /^\//, `${n.type} no apunta a una ruta interna`);
    }
  });
});
