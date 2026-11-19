# Seguridad: IP falsificable y enumeración de usuarios
Rama: `hiram` · Entrega: work-unit commits en `hiram`, PR a `develop` (decisión del usuario) · Test runner: `npm test` (vitest)
Objetivo: cerrar los dos hallazgos de la auditoría sin cambiar contratos públicos ni introducir mensajes distinguibles. Previsión: ~250 líneas autoras (bajo el umbral de 400). Estrategia: `ask-on-risk`.

## Specs

**S1 — Límite de intentos burlable con IPs falsas.** Cita literal del hallazgo: "límite de intentos burlable con IPs falsas". Causa: `datosDelRequest()` toma el valor más a la izquierda de `x-forwarded-for`, controlado por el cliente. Cita literal de `docs/SRS.md`: "**RNF-SEC-04** | **Límite por IP** (`rateLimit` de Better Auth con almacenamiento en BD): inicio de sesión 5 por minuto, recuperación 3 por hora. Para el registro y la re-subida de documentos, un helper propio sobre Postgres." Better Auth 1.7.26 usa por defecto `ipAddressHeaders: ["x-forwarded-for"]` y acepta un valor simple falsificado. Aceptación: la IP se resuelve con una política configurable y segura por defecto (sin headers de confianza → bucket compartido), aplicada por igual a `datosDelRequest()` y a `advanced.ipAddress` de Better Auth; mensaje de error y límites sin cambios. Check: `npm test`, `npm run typecheck`, `npm run lint`.

**S2 — Mensaje de cuenta bloqueada que revela correos existentes.** Cita literal del hallazgo: "mensaje de cuenta bloqueada que revela correos existentes". El hook `before` lanza `"Cuenta bloqueada por demasiados intentos fallidos. Intenta dentro de 15 minutos."` solo si el correo existe; si no existe, Better Auth responde su error estándar. Citas literales de `docs/SRS.md`: "**RNF-SEC-06** | **Sin enumeración de usuarios**: mensajes idénticos en login, registro y recuperación para correos existentes e inexistentes." y "*Dado* un correo inexistente o una contraseña incorrecta, *entonces* el mensaje es el mismo: "Correo o contraseña incorrectos"." Aceptación: cuenta bloqueada y credenciales inválidas devuelven el mismo `status`, `code` y `message` a nivel API; el bloqueo y el evento interno `ACCOUNT_LOCKED` se conservan. Check: `npm test`, `npm run typecheck`, `npm run lint`.

## Tasks

T1 — S1 — inline — IP segura: helper puro + env + `advanced.ipAddress` + docs — completado, commit abajo
T2 — S2 — inline — error genérico en hook `before` + test — completado, commit abajo

Un solo work-unit para T1 y T2: comparten `auth.ts`, `index.ts` y `docs/SRS.md`, y separarlos dejaría commits intermedios que no compilan. Risk: ítem 2 (seguridad) en ambos.

## Log

L1 (usuario, texto literal): "implentan ambos haces y haces pr"

L2: Auditoría previa (solo lectura) confirmó ambos hallazgos. RDD activo por decisión global. HEAD base: `9109aee`. Sin writer delegado: dos unidades pequeñas ejecutadas en serie por el padre; sin trigger de paralelismo ni de contexto.

L3: RED→GREEN observado en los dos módulos nuevos (`Cannot find module './ip'` y `./auth-errores` antes de crearlos). Suite 40/40, typecheck y lint limpios. Riesgo: ítem 2 (seguridad) → verificador independiente.

L4: El verificador confirmó S1 y marcó S2 como bloqueador: `new APIError(...)` con spread `{code, message}` serializaba distinto que `APIError.from(...)` de Better Auth (`{message, code}`), oráculo byte a byte. Corregido con `APIError.from` y test de paridad de bytes. También se alineó la normalización IPv6 a /64 con `normalizeIP` de Better Auth. Suite 40/40, typecheck y lint limpios tras la corrección; recheck del bloqueador en curso.

L5: `.env.example` no se pudo editar: el runtime rechaza writes sobre archivos `.env*` (`permission.rejected`). No se sorteó con shell. Las variables quedaron documentadas en `docs/SRS.md` RNF-SEC-04 y propagadas en `docker-compose.yml`. Requiere que el usuario las agregue a su `.env` antes de exponer a producción.

L6: Recheck del verificador: `RAW_BODY_BYTE_IDENTICAL: true | STATUS_IDENTICAL: true` (401 en ambos casos), 4/4 tests enfocados. Scratch del verificador eliminado. Verificación final: 40/40 tests, typecheck y lint limpios. Commit: <por registrar>.
