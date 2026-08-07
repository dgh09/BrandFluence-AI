import assert from "node:assert/strict";
import { describe, it } from "node:test";

// Extensión explícita: `node --test` resuelve como ESM y necesita el .ts.
import {
  checkUpload,
  isVideo,
  objectPath,
  publicUrl,
  PURPOSE_RULES,
} from "./uploads.ts";

describe("checkUpload", () => {
  it("acepta una imagen normal como avatar", () => {
    assert.equal(checkUpload("avatar", "image/jpeg", 800_000), null);
  });

  it("rechaza un tipo que no está en la allowlist", () => {
    const error = checkUpload("avatar", "image/svg+xml", 1000);
    assert.match(error ?? "", /Formato no admitido/);
  });

  it("no deja subir vídeo como foto de perfil", () => {
    assert.notEqual(checkUpload("avatar", "video/mp4", 1000), null);
    // Pero sí como contenido entregado.
    assert.equal(checkUpload("deliverable", "video/mp4", 1000), null);
  });

  it("rechaza por tamaño con un mensaje legible", () => {
    const error = checkUpload("avatar", "image/png", 9_000_000);
    assert.match(error ?? "", /5 MB/);
  });

  it("acepta justo en el límite y rechaza un byte por encima", () => {
    const max = PURPOSE_RULES.avatar.maxBytes;
    assert.equal(checkUpload("avatar", "image/png", max), null);
    assert.notEqual(checkUpload("avatar", "image/png", max + 1), null);
  });

  it("rechaza un fichero vacío o un tamaño absurdo", () => {
    assert.notEqual(checkUpload("avatar", "image/png", 0), null);
    assert.notEqual(checkUpload("avatar", "image/png", -1), null);
    assert.notEqual(checkUpload("avatar", "image/png", 1.5), null);
  });

  it("el vídeo entregado tiene mucho más margen que un avatar", () => {
    assert.ok(PURPOSE_RULES.deliverable.maxBytes > PURPOSE_RULES.avatar.maxBytes);
  });
});

describe("objectPath", () => {
  it("mete cada fichero en la carpeta de su dueño", () => {
    const path = objectPath("avatar", "user-1", "image/jpeg", "abc");
    assert.equal(path, "avatars/user-1/abc.jpg");
  });

  it("agrupa el contenido entregado por colaboración", () => {
    const path = objectPath("deliverable", "collab-9", "video/mp4", "xyz");
    assert.equal(path, "collaborations/collab-9/xyz.mp4");
  });

  it("la extensión sale del tipo declarado, nunca del nombre del fichero", () => {
    // Un `foto.jpg.svg` subido como image/png se guarda .png y no se
    // ejecuta como documento en el navegador.
    assert.ok(objectPath("avatar", "u", "image/png", "id").endsWith(".png"));
  });

  it("revienta si el tipo no está permitido para ese propósito", () => {
    // Nunca debería llegar aquí sin pasar por checkUpload, pero si pasa,
    // mejor un error que una ruta sin extensión.
    assert.throws(() => objectPath("avatar", "u", "video/mp4", "id"));
  });
});

describe("visibilidad de los buckets", () => {
  it("avatares y logos son públicos", () => {
    assert.equal(PURPOSE_RULES.avatar.visibility, "public");
    assert.equal(PURPOSE_RULES.logo.visibility, "public");
  });

  it("el contenido entregado es privado y va en otro bucket", () => {
    // Puede ser material de campaña sin publicar: solo lo ven las dos
    // partes, y a través de una URL firmada que caduca.
    assert.equal(PURPOSE_RULES.deliverable.visibility, "private");
    assert.notEqual(
      PURPOSE_RULES.deliverable.bucket,
      PURPOSE_RULES.avatar.bucket,
    );
  });
});

describe("isVideo", () => {
  it("distingue vídeo de imagen", () => {
    assert.equal(isVideo("video/mp4"), true);
    assert.equal(isVideo("video/quicktime"), true);
    assert.equal(isVideo("image/png"), false);
  });
});

describe("publicUrl", () => {
  it("construye la URL pública", () => {
    assert.equal(
      publicUrl("https://ref.supabase.co", "media", "avatars/u/a.jpg"),
      "https://ref.supabase.co/storage/v1/object/public/media/avatars/u/a.jpg",
    );
  });

  it("no duplica la barra si la base ya la trae", () => {
    assert.equal(
      publicUrl("https://ref.supabase.co/", "media", "a.jpg"),
      "https://ref.supabase.co/storage/v1/object/public/media/a.jpg",
    );
  });
});
