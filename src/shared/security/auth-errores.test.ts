import { APIError } from "better-auth/api";
import { describe, expect, it } from "vitest";
import { CREDENCIALES_INVALIDAS, errorCredencialesInvalidas } from "./auth-errores";

describe("errorCredencialesInvalidas", () => {
  it("replica exactamente el error de Better Auth para credenciales inválidas", () => {
    const error = errorCredencialesInvalidas();
    expect(error.status).toBe("UNAUTHORIZED");
    expect(error.statusCode).toBe(401);
    expect(error.body).toMatchObject({
      code: "INVALID_EMAIL_OR_PASSWORD",
      message: "Invalid email or password",
    });
  });

  it("no revela el estado de bloqueo de la cuenta", () => {
    const cuerpo = JSON.stringify(errorCredencialesInvalidas().body).toLowerCase();
    expect(cuerpo).not.toContain("bloquead");
    expect(cuerpo).not.toContain("locked");
    expect(cuerpo).not.toContain("15 minutos");
  });

  it("serializa el cuerpo byte a byte igual que el error de Better Auth", () => {
    // El orden de las claves importa: JSON.stringify lo preserva y lo expone al cliente.
    const referencia = APIError.from("UNAUTHORIZED", CREDENCIALES_INVALIDAS);
    const obtenido = errorCredencialesInvalidas();
    expect(obtenido.statusCode).toBe(referencia.statusCode);
    expect(JSON.stringify(obtenido.body)).toBe(JSON.stringify(referencia.body));
  });

  it("expone una constante estable para reutilizar", () => {
    expect(CREDENCIALES_INVALIDAS).toEqual({
      code: "INVALID_EMAIL_OR_PASSWORD",
      message: "Invalid email or password",
    });
  });
});
