import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { relativeTime } from "./dates.ts";

const NOW = new Date("2026-08-10T12:00:00.000Z").getTime();
const ago = (ms: number) => new Date(NOW - ms).toISOString();

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("relativeTime", () => {
  it("por debajo del minuto no cuenta los segundos", () => {
    assert.equal(relativeTime(ago(0), NOW), "ahora mismo");
    assert.equal(relativeTime(ago(59_000), NOW), "ahora mismo");
  });

  it("cuenta minutos y horas", () => {
    assert.equal(relativeTime(ago(MINUTE), NOW), "hace 1 min");
    assert.equal(relativeTime(ago(59 * MINUTE), NOW), "hace 59 min");
    assert.equal(relativeTime(ago(HOUR), NOW), "hace 1 h");
    assert.equal(relativeTime(ago(23 * HOUR), NOW), "hace 23 h");
  });

  it("el día anterior se dice «ayer», no «hace 1 d»", () => {
    assert.equal(relativeTime(ago(DAY), NOW), "ayer");
    assert.equal(relativeTime(ago(2 * DAY - 1), NOW), "ayer");
    assert.equal(relativeTime(ago(2 * DAY), NOW), "hace 2 d");
  });

  it("a partir de una semana pasa a fecha absoluta", () => {
    assert.equal(relativeTime(ago(6 * DAY), NOW), "hace 6 d");
    // Lo relativo deja de ayudar cuando el número obliga a echar la cuenta.
    assert.match(relativeTime(ago(7 * DAY), NOW), /2026/);
    assert.match(relativeTime(ago(60 * DAY), NOW), /2026/);
  });

  it("un instante en el futuro no dice «hace -1 min»", () => {
    // Pasa de verdad: el reloj del servidor puede ir un pelo por delante.
    assert.equal(relativeTime(new Date(NOW + 5_000).toISOString(), NOW), "ahora mismo");
  });

  it("una fecha ilegible devuelve cadena vacía, no «Invalid Date»", () => {
    assert.equal(relativeTime("no-es-una-fecha", NOW), "");
  });
});
