# Reporte de Auditoría — `app/`

**Auditoría inicial:** 2026-05-14  
**Actualización:** 2026-08-18  
**Versión auditada:** frontend v2.0.0 · backend .NET 8  
**Alcance:** Seguridad (OWASP Top 10), dependencias (NuGet + npm), calidad de código, despliegue rootless

---

## Resumen Ejecutivo — Estado actual

| Área | Resueltos | Pendientes |
|------|-----------|-----------|
| Seguridad | 5 de 5 | 0 |
| Dependencias | 0 de 4 | 4 |
| Calidad de código | 6 de 6 | 0 |

---

## 1. Seguridad

### ✅ SEC-01 — API Key de Azure OpenAI expuesta en código fuente (RESUELTO)

**Estado:** La clave fue eliminada de `compose.yaml` y de `appsettings.json`. Se inyecta exclusivamente desde `.env` mediante `${AZURE_OPENAI_API_KEY}`.

**Acción pendiente del usuario:** Rotar la clave en el portal de Azure si el repositorio fue compartido antes de este cambio.

```json
// appsettings.json — estado actual correcto
"AzureOpenAI": {
  "Endpoint": "https://tracking-app.openai.azure.com/",
  "ApiKey": "",
  "DeploymentName": "gpt-4o"
}
```

Agregar a `.gitignore`:
```
app/.env
app/backend/GitHubCopilotAPI/appsettings.Production.json
```

---

### ✅ SEC-02 — Sin autenticación en endpoints de escritura (RESUELTO)

**Estado:** Implementado JWT Bearer (HS256, 8 h). Todos los endpoints POST / PUT / DELETE y los que generan costos en Azure OpenAI están protegidos con `[Authorize]`.

| Controller | Endpoints protegidos |
|---|---|
| `UploadController` | POST `/upload/premium-requests`, POST `/upload/teams` |
| `DataManagementController` | DELETE `/datamanagement/period`, POST `/datamanagement/deduplicate` |
| `LicenseAdminController` | PUT `/licenses/user/{usuario}`, POST `/licenses/bulk` |
| `AIReportController` | POST `/ai-report/{year}/{month}`, POST `/ai-report/{year}` |
| `AIAuditController` | POST `/ai-audit/{year}/{month}`, POST `/ai-audit/{year}/{month}/{team}/{username}` |
| `UsageQuotasController` | PUT `/usage-quotas` |

Los GET de métricas y licencias permanecen públicos por decisión de negocio (datos no sensibles).

**Implementación:**
- `Models/AppUser.cs` — modelo de usuario con PBKDF2-SHA256 (100 000 iter., solo BCL .NET 8)
- `Controllers/AuthController.cs` — `POST /api/auth/login`, `GET /api/auth/me`
- `Program.cs` — middleware JWT, seed de admin, Swagger solo en Development
- `Jwt__SecretKey` obligatorio en variables de entorno (la app lanza excepción si falta)
- Frontend: `AuthContext.tsx` (token en memoria React, sin localStorage), `LoginModal` en sidebar

---

### ✅ SEC-03 — Swagger habilitado en Producción (RESUELTO)

**Estado:** `Program.cs` condiciona Swagger solo a `IsDevelopment()`.

---

### ✅ SEC-04 — Mensajes de excepción internos en respuestas HTTP (RESUELTO)

**Estado:** Todos los bloques `catch` en los controllers reemplazaron `ex.Message` con mensajes genéricos. El detalle del error se registra vía `_logger.LogError`.

**Archivos corregidos:**
- `MetricsController.cs` — 8 catch blocks
- `DataManagementController.cs` — 4 catch blocks
- `LicenseAdminController.cs` — 8 catch blocks
- `UploadController.cs` — 2 catch blocks restantes
- `AIReportController.cs` — catch genérico
- `AIAuditController.cs` — 3 catch blocks

**OWASP:** A09:2021 – Security Logging and Monitoring Failures

---

### ✅ SEC-05 — `AllowedHosts: "*"` en producción (RESUELTO)

**Estado:** `appsettings.json` ahora usa `"AllowedHosts": "localhost;backend"` — `backend` es el nombre del servicio Docker en la red interna; se restringe el host header a valores controlados.

**OWASP:** A05:2021 – Security Misconfiguration

---

## 2. Dependencias

### Backend — NuGet

| Paquete | Versión actual | Última estable | Estado |
|---------|---------------|----------------|--------|
| `Microsoft.EntityFrameworkCore.Sqlite` | 8.0.0 | 8.0.11 (LTS) | 🟡 Actualizar |
| `Swashbuckle.AspNetCore` | 6.5.0 | 6.7.3 | 🟡 Actualizar |
| `CsvHelper` | 30.0.1 | 33.0.1 | 🟡 Actualizar |
| `Azure.AI.OpenAI` | 2.1.0 | 2.2.0 | 🟢 Estable |

```bash
dotnet add package Microsoft.EntityFrameworkCore.Sqlite --version 8.0.11
dotnet add package Microsoft.EntityFrameworkCore.Tools --version 8.0.11
dotnet add package Swashbuckle.AspNetCore --version 6.7.3
dotnet add package CsvHelper --version 33.0.1
```

### Frontend — npm

| Paquete | Estado |
|---------|--------|
| `vite` ^5.0.8 | 🟡 Actualizar a ^5.4.x (parches de seguridad en servidor de dev) |
| `react` / `react-dom` ^18.2.0 | 🟢 18.3.1 disponible |
| `date-fns` ^2.30.0 | 🟢 v3/v4 disponibles, no urgente (breaking change) |

```bash
cd app/frontend && npm update vite @vitejs/plugin-react react react-dom && npm audit fix
```

---

## 3. Calidad de Código

### ✅ CAL-01 — Duplicado de archivos de configuración de Vite (RESUELTO)

`frontend/vite.config.js` copiado a `old/`. **Acción pendiente del usuario:** eliminar manualmente `app/frontend/vite.config.js` (el bridge de Cowork no puede borrar archivos en Windows).

---

### ✅ CAL-02 — Ruta `/app/use-cases` hardcodeada en servicios (RESUELTO)

**Archivos corregidos:** `AIReportService.cs`, `AIAuditService.cs`, `UseCasesController.cs`

Ahora leen de configuración con fallback:
```csharp
private readonly string _baseDir = Path.GetFullPath(
    config["Storage:UseCasesPath"] ?? "/app/use-cases");
```

Para desarrollo local, añadir en `appsettings.Development.json` o `.env`:
```json
"Storage": { "UseCasesPath": "./use-cases" }
```

---

### ✅ CAL-03 — Sin límite de tamaño en endpoints de upload (RESUELTO)

`UploadController.cs` — ambos endpoints POST tienen `[RequestSizeLimit(10 * 1024 * 1024)]` (10 MB).

---

### ✅ CAL-04 — Sin CancellationToken en llamadas a Azure OpenAI (RESUELTO)

`AIReportService.GenerateAsync` y `AIAuditService.GenerateFullAuditAsync` / `GenerateUserAuditAsync` ahora reciben `CancellationToken cancellationToken = default` y lo propagan a `CompleteChatAsync` y `Task.Delay`. Los controllers pasan `HttpContext.RequestAborted`. Si el cliente cancela la petición, la llamada al LLM se interrumpe y no se generan costos adicionales.

---

### ✅ CAL-05 — `console.error` en producción (RESUELTO)

El `ApiService` en `api.ts` no propaga stack traces en producción — los errores 401 se manejan internamente llamando al callback de logout del `AuthContext`.

---

### ✅ CAL-06 — Contenedores ejecutan como root (RESUELTO)

- **Backend:** `Dockerfile` añade `appuser` (uid 1001), `USER appuser` explícito; directorios `/app/data` y `/app/use-cases` con propiedad del usuario de la app.
- **Frontend:** migrado de `nginx:alpine` a `nginxinc/nginx-unprivileged:alpine` (uid 101, puerto 8080). No requiere `CAP_NET_BIND_SERVICE`.
- **Compose:** volúmenes con flag `:U` para ajuste automático de propiedad en Podman rootless.

---

## 4. Checklist de Remediación

| Prioridad | ID | Tarea | Estado |
|-----------|-----|-------|--------|
| 🔴 P1 | SEC-01 | Rotar API key de Azure y limpiar `appsettings.json` | ✅ Resuelto (rotar key pendiente del usuario) |
| 🔴 P1 | SEC-02 | Autenticación JWT en endpoints de escritura | ✅ Resuelto |
| 🔴 P1 | SEC-03 | Deshabilitar Swagger en producción | ✅ Resuelto |
| 🟠 P2 | SEC-04 | Ocultar detalles de excepción en respuestas 500 | ✅ Resuelto |
| 🟠 P2 | SEC-05 | Restringir `AllowedHosts` | ✅ Resuelto |
| 🟡 P3 | DEP-01 | Actualizar paquetes NuGet a parches LTS | ⏳ Pendiente |
| 🟡 P3 | DEP-02 | `npm audit fix` en frontend | ⏳ Pendiente |
| 🟡 P3 | CAL-01 | Eliminar `vite.config.js` duplicado | ✅ Resuelto (borrado manual pendiente) |
| 🟡 P3 | CAL-02 | Externalizar ruta `/app/use-cases` a configuración | ✅ Resuelto |
| 🟡 P3 | CAL-03 | `[RequestSizeLimit]` en endpoints de upload | ✅ Resuelto |
| 🟡 P3 | CAL-04 | Propagar `CancellationToken` en servicios AI | ✅ Resuelto |
| 🟡 P3 | CAL-05 | `console.error` solo en DEV | ✅ Resuelto |
| 🟡 P3 | CAL-06 | Contenedores sin root / rootless Podman | ✅ Resuelto |

---

*Auditoría inicial: 2026-05-14. Actualización: 2026-08-18.*
