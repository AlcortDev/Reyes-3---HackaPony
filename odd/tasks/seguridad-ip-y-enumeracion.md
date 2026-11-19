# Seguridad: IP falsificable y enumeración de usuarios
Rama: `hiram` · Entrega: work-unit commits en `hiram`, PR a `develop` (decisión del usuario) · Test runner: `npm test` (vitest)
Objetivo: cerrar los dos hallazgos de la auditoría sin cambiar contratos públicos ni introducir mensajes distinguibles. Previsión: ~250 líneas autoras (bajo el umbral de 400). Estrategia: `ask-on-risk`.

## Specs

**S1 — Límite de intentos burlable con IPs falsas.** Cita literal del hallazgo: "límite de intentos burlable con IPs falsas". Causa: `datosDelRequest()` toma el valor más a la izquierda de `x-forwarded-for`, controlado por el cliente. Cita literal de `docs/SRS.md`: "**RNF-SEC-04** | **Límite por IP** (`rateLimit` de Better Auth con almacenamiento en BD): inicio de sesión 5 por minuto, recuperación 3 por hora. Para el registro y la re-subida de documentos, un helper propio sobre Postgres." Better Auth 1.7.26 usa por defecto `ipAddressHeaders: ["x-forwarded-for"]` y acepta un valor simple falsificado. Aceptación: la IP se resuelve con una política configurable y segura por defecto (sin headers de confianza → bucket compartido), aplicada por igual a `datosDelRequest()` y a `advanced.ipAddress` de Better Auth; mensaje de error y límites sin cambios. Check: `npm test`, `npm run typecheck`, `npm run lint`.

**S2 — Mensaje de cuenta bloqueada que revela correos existentes.** Cita literal del hallazgo: "mensaje de cuenta bloqueada que revela correos existentes". El hook `before` lanza `"Cuenta bloqueada por demasiados intentos fallidos. Intenta dentro de 15 minutos."` solo si el correo existe; si no existe, Better Auth responde su error estándar. Citas literales de `docs/SRS.md`: "**RNF-SEC-06** | **Sin enumeración de usuarios**: mensajes idénticos en login, registro y recuperación para correos existentes e inexistentes." y "*Dado* un correo inexistente o una contraseña incorrecta, *entonces* el mensaje es el mismo: "Correo o contraseña incorrectos"." Aceptación: cuenta bloqueada y credenciales inválidas devuelven el mismo `status`, `code` y `message` a nivel API; el bloqueo y el evento interno `ACCOUNT_LOCKED` se conservan. Check: `npm test`, `npm run typecheck`, `npm run lint`.

## Tasks

T1 — S1 — inline — IP segura: helper puro + env + `advanced.ipAddress` + docs — completado en `61965f0`
T2 — S2 — inline — error genérico en hook `before` + test — completado en `61965f0`

Un solo work-unit para T1 y T2: comparten `auth.ts`, `index.ts` y `docs/SRS.md`, y separarlos dejaría commits intermedios que no compilan. Risk: ítem 2 (seguridad) en ambos. Entrega: PR #9 a `develop` (`size:exception` por decisión previa del usuario).

## Log

L1 (usuario, texto literal): "implentan ambos haces y haces pr"

L2: Auditoría previa (solo lectura) confirmó ambos hallazgos. RDD activo por decisión global. HEAD base: `9109aee`. Sin writer delegado: dos unidades pequeñas ejecutadas en serie por el padre; sin trigger de paralelismo ni de contexto.

L3: RED→GREEN observado en los dos módulos nuevos (`Cannot find module './ip'` y `./auth-errores` antes de crearlos). Suite 40/40, typecheck y lint limpios. Riesgo: ítem 2 (seguridad) → verificador independiente.

L4: El verificador confirmó S1 y marcó S2 como bloqueador: `new APIError(...)` con spread `{code, message}` serializaba distinto que `APIError.from(...)` de Better Auth (`{message, code}`), oráculo byte a byte. Corregido con `APIError.from` y test de paridad de bytes. También se alineó la normalización IPv6 a /64 con `normalizeIP` de Better Auth. Suite 40/40, typecheck y lint limpios tras la corrección; recheck del bloqueador en curso.

L5: `.env.example` no se pudo editar: el runtime rechaza writes sobre archivos `.env*` (`permission.rejected`). No se sorteó con shell. Las variables quedaron documentadas en `docs/SRS.md` RNF-SEC-04 y propagadas en `docker-compose.yml`. Requiere que el usuario las agregue a su `.env` antes de exponer a producción.

L6: Recheck del verificador: `RAW_BODY_BYTE_IDENTICAL: true | STATUS_IDENTICAL: true` (401 en ambos casos), 4/4 tests enfocados. Scratch del verificador eliminado. Verificación final: 40/40 tests, typecheck y lint limpios. Work-unit commit: `61965f097f0949d2fb6772a71bf3b9fb2377d723` (base `9109aee`). Rama `hiram` pusheada; PR #9 a `develop`.

L7: RDD assess del commit → `risk: high`, `review_due: true`. Consentimiento del usuario: `granted`. Línea `review-fc1cbf7143671b36`, lenses `review-risk`, `review-readability`, `review-reliability`. El transporte de captura del runtime rechazó el lanzamiento de los revisores (`opencode_review_transport_relay_refused`, `provider_failed`). Los lenses `review-risk` y `review-readability` sí se capturaron por relay con los tokens exactos del `capture_operation` (`admission_decision: completed` en ambos); `review-reliability` no se pudo producir: el transporte host en vivo es `opencode_provider_injected` y `--materialize` no está disponible para él. **Sin veredicto final ni acknowledge**; no se inventó PASS. No es defecto reportable de Gentle AI: la falla fue del runtime que despacha, no de una invocación de Gentle AI, así que no hay reporte ni handoff de consentimiento. La revisión es informativa para la entrega (política ordinaria del repo), por lo que el PR sigue su curso.

L7b: Hallazgos del lens `review-risk` capturado, todos informativos (ningún bloqueador, ningún `correction_required`): (1) R1-01 WARNING — bucket global mientras no se configure el proxy, decisión consciente ya documentada en RNF-SEC-04; (2) R1-02 WARNING — posible oráculo de timing en el hook `before`, pre-existente (solo cambió el objeto de error); (3) R1-03 SUGGESTION — el test de paridad de bytes usa la misma constante como referencia, así que no detectaría un drift futuro de `BASE_ERROR_CODES` de Better Auth; la paridad contra la fuente real sí fue confirmada por el verificador independiente. L7c: Hallazgos del lens `review-readability` capturado, todos SUGGESTION: (1) R2-1 — la normalización IPv6 reimplementa el `normalizeIP` interno de Better Auth, acoplamiento a comportamiento no público; (2) R2-2 — `CREDENCIALES_INVALIDAS` duplica el valor de `BASE_ERROR_CODES` de Better Auth y el test de paridad no detectaría un drift aguas arriba; (3) R2-3 — el comentario de `resolverIpCliente` promete nombres de header en minúsculas pero `configuracionIpDesdeEnv` solo hace trim, sin normalizar. Ninguno bloquea. No se modifica código: cualquier cambio invalidaría el candidato congelado y la revisión no puede reanudarse mientras el transporte esté indisponible. R1-03, R2-1, R2-2 y R2-3 quedan como follow-ups.

L8: Para producción el usuario debe agregar a su `.env` `CLIENT_IP_HEADER` o `TRUSTED_PROXIES` (documentado en RNF-SEC-04 y propagado en `docker-compose.yml`); `.env.example` quedó sin editar por restricción de permisos del runtime sobre archivos `.env*`.
