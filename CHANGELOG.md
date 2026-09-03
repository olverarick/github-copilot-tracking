# Changelog

Historial de cambios del proyecto GitHub Copilot Analytics Dashboard.

## [2.0.0] - 2026

### ✨ Refactorización del Frontend

- Migración completa a React 18 + TypeScript + Vite
- Eliminación de dependencias de librería de componentes privada
- styled-components como sistema de estilos
- Apache ECharts para visualizaciones

## [1.0.0] - 2024

### ✨ Funcionalidades Iniciales

#### Backend (.NET 8)
- ✅ API REST con ASP.NET Core
- ✅ Entity Framework Core con SQLite
- ✅ **Validación automática de duplicados** al importar CSVs
  - Índice compuesto optimizado (Date, Username, Model, Quantity, NetAmount)
  - Búsquedas O(log n) gracias a índice de BD
- ✅ Endpoints de métricas: Summary, Users, Timeline, Teams, Models, Daily trend
- ✅ Gestión de datos: estadísticas, eliminación por periodo, deduplicación, historial de uploads
- ✅ Documentación Swagger/OpenAPI
- ✅ Health check endpoint
- ✅ CORS configurado para frontend

#### Frontend (React 18 + TypeScript)
- ✅ **Apache ECharts** para visualizaciones:
  - Gráfica de tendencia diaria (barras + línea)
  - Distribución por categoría (dona)
  - Comparación de equipos (barras agrupadas)
  - Uso por modelo IA (pie chart)
- ✅ Dashboard interactivo con 4 KPIs principales
- ✅ Tabla de usuarios ordenable con badges de categoría
- ✅ Uploader de CSVs con feedback visual
- ✅ Context API para estado global
- ✅ Skeleton loaders y estados vacíos
- ✅ Responsive design

#### Infraestructura
- ✅ Contenedores Podman/Docker con multi-stage builds
- ✅ Podman Compose para orquestación
- ✅ Nginx como reverse proxy para frontend
- ✅ SQLite con volumen persistente
- ✅ Scripts de utilidad (start, stop, clean, backup)
- ✅ Variables de entorno con .env

### 🔄 Categorización de Uso

- **SIN USO**: 0 requests
- **USO BAJO (<40%)**: < 120 requests
- **USO MODERADO (40-70%)**: 120-209 requests
- **USO ALTO (>70%)**: ≥ 210 requests

Quota mensual: 300 requests

### 📊 Base de Datos

**Entidades:** `PremiumRequests`, `Users`, `Uploads`

**Índices optimizados:**
- `IX_PremiumRequests_Date`
- `IX_PremiumRequests_Username`
- `IX_PremiumRequests_Model`
- `IX_PremiumRequests_DuplicateCheck` (compuesto)
- `IX_Users_Usuario` (único)

### 🔐 Validación de Duplicados

```
1. Usuario sube CSV
2. Parser lee todas las líneas
3. Por cada registro: query AnyAsync(Date, Username, Model, Quantity, NetAmount)
4. Insertar solo registros nuevos
5. Registrar upload en tabla Uploads
6. Retornar estadísticas
```

### 📦 Dependencias Principales

**Backend:**
- Microsoft.EntityFrameworkCore.Sqlite 8.0.0
- CsvHelper 30.0.1
- Swashbuckle.AspNetCore 6.5.0

**Frontend:**
- react 18.2.0
- echarts 6.1.0
- styled-components 6.1.8
- date-fns 2.30.0

### 🐛 Known Issues

- ⚠️ SQLite puede tener problemas de concurrencia con muchas escrituras simultáneas (considerar PostgreSQL en producción)

### 🔜 Roadmap

**v2.1.0:**
- [ ] Filtros avanzados en tabla de usuarios
- [ ] Exportar datos a Excel/CSV
- [ ] Modal con detalle de usuario
- [ ] Tests unitarios (Vitest + Testing Library)

**v3.0.0:**
- [ ] Autenticación y roles (Azure AD)
- [ ] Alertas automáticas (bajo uso, sobre uso)
- [ ] Reportes programados por email
- [ ] Migración a PostgreSQL

---

## Guía de Versiones

Seguimos [Semantic Versioning](https://semver.org/):
- **MAJOR**: Cambios incompatibles en API
- **MINOR**: Nueva funcionalidad compatible
- **PATCH**: Bug fixes

## Contribuidores

- **Equipo SSPTIC**: Desarrollo y mantenimiento

## Licencia

© 2026 - Equipo SSPTIC
