# Changelog

Historial de cambios del proyecto GitHub Copilot Analytics Dashboard.

## [1.0.0] - 2024-01-XX

### ✨ Funcionalidades Iniciales

#### Backend (.NET 8)
- ✅ API REST con ASP.NET Core
- ✅ Entity Framework Core con SQLite
- ✅ **Validación automática de duplicados** al importar CSVs
  - Índice compuesto optimizado (Date, Username, Model, Quantity, NetAmount)
  - Búsquedas O(log n) gracias a índice de BD
- ✅ Endpoints de métricas:
  - Summary (KPIs)
  - Users (listado con categorización)
  - User timeline (actividad diaria)
  - User models (distribución por modelo)
  - Teams (comparativa equipos)
  - Models (uso por modelo IA)
  - Daily trend (tendencia temporal)
- ✅ Gestión de datos:
  - Estadísticas de BD
  - Eliminación por periodo
  - Deduplicación manual
  - Historial de uploads
- ✅ Documentación Swagger/OpenAPI
- ✅ Health check endpoint
- ✅ Logging estructurado con emojis
- ✅ CORS configurado para frontend

#### Frontend (React 18)
- ✅ **Librería de componentes INEGI** (sistema de diseño estricto)
  - ThemeProvider con tokens globales
  - Componentes: Button, Card, Badge, Input, Select
  - Zero hardcoding (solo tokens)
- ✅ **Apache ECharts** con tema personalizado INEGI
  - Gráfica de tendencia diaria (barras + línea)
  - Distribución por categoría (dona)
  - Comparación de equipos (barras agrupadas)
  - Uso por modelo IA (pie chart)
- ✅ Dashboard interactivo:
  - 4 KPIs principales
  - Tabla de usuarios ordenable
  - Badges de categoría con colores del tema
  - Formateo de números y moneda
- ✅ Uploader de CSVs con feedback visual
- ✅ Context API para estado global
- ✅ Skeleton loaders durante carga
- ✅ Estados vacíos informativos
- ✅ Responsive design

#### Infraestructura
- ✅ Contenedores Podman/Docker
  - Multi-stage builds optimizados
  - Health checks en ambos servicios
- ✅ Podman Compose para orquestación
- ✅ Nginx como reverse proxy para frontend
- ✅ SQLite con volumen persistente
- ✅ Scripts de utilidad (start, stop, clean, backup)
- ✅ Variables de entorno con .env

#### Documentación
- ✅ README completo con guía de uso
- ✅ USAGE_GUIDE.md para usuarios finales
- ✅ Comentarios JSDoc en servicios
- ✅ Estructura de proyecto documentada
- ✅ Troubleshooting guide

### 🔄 Categorización de Uso

Sistema de clasificación automática:
- **SIN USO**: 0 requests
- **USO BAJO (<40%)**: < 120 requests (< 40% del quota)
- **USO MODERADO (40-70%)**: 120-209 requests
- **USO ALTO (>70%)**: ≥ 210 requests

Quota mensual: 300 requests

### 📊 Base de Datos

**Entidades:**
- `PremiumRequests`: Registros de uso de Copilot
- `Users`: Usuarios y equipos
- `Uploads`: Historial de importaciones

**Índices optimizados:**
- `IX_PremiumRequests_Date`
- `IX_PremiumRequests_Username`
- `IX_PremiumRequests_Model`
- `IX_PremiumRequests_DuplicateCheck` (compuesto)
- `IX_Users_Usuario` (único)

### 🎨 Sistema de Diseño

Uso estricto del sistema de tokens INEGI:
- ✅ `theme.colors.*` para todos los colores
- ✅ `theme.spacing.*` para todos los espaciados
- ✅ `theme.typography.*` para tipografía
- ✅ `theme.shadows.*` para sombras
- ✅ `theme.borderRadius.*` para bordes
- ❌ **CERO hardcoding** de valores

### 🔐 Validación de Duplicados

**Algoritmo:**
```
1. Usuario sube CSV
2. Parser lee todas las líneas
3. Por cada registro:
   a. Query: AnyAsync(Date, Username, Model, Quantity, NetAmount)
   b. Si existe → marcar como duplicado
   c. Si no existe → agregar a lista de nuevos
4. Insertar solo registros nuevos
5. Registrar upload en tabla Uploads
6. Retornar estadísticas
```

**Performance:**
- Índice compuesto en 5 campos
- Búsquedas O(log n)
- Bulk insert para registros nuevos

### 🧪 Testing

**Backend:**
- ✅ Validación de modelos con Data Annotations
- ✅ Error handling en todos los controladores
- ✅ Logging de errores y advertencias

**Frontend:**
- ✅ PropTypes en componentes críticos
- ✅ Error boundaries (pendiente)
- ✅ Manejo de estados de carga y error

### 📦 Dependencias Principales

**Backend:**
- Microsoft.EntityFrameworkCore.Sqlite: 8.0.0
- CsvHelper: 30.0.1
- Swashbuckle.AspNetCore: 6.5.0

**Frontend:**
- react: 18.2.0
- @reactjscomponentrepository/components: ^1.0.0
- echarts: 5.5.0
- styled-components: 6.1.8
- date-fns: 2.30.0

### 🚀 Deployment

**Requisitos:**
- Podman/Docker instalado
- Acceso a red corporativa INEGI (para instalar frontend deps)
- Puerto 5000 disponible (backend)
- Puerto 8080 disponible (frontend)

**Comandos:**
```bash
podman-compose up --build   # Levantar todo
podman-compose down         # Detener
./scripts/backup-db.sh      # Backup manual
```

### 🐛 Known Issues

- ⚠️ Frontend requiere red corporativa INEGI para `npm install`
- ⚠️ SQLite puede tener problemas de concurrencia con muchas escrituras simultáneas (considerar PostgreSQL en producción)
- ⚠️ Gráficas ECharts no adaptan completamente el tema INEGI (mapeo manual)

### 🔜 Roadmap

**v1.1.0:**
- [ ] Filtros avanzados en tabla de usuarios
- [ ] Exportar datos a Excel/CSV
- [ ] Modal con detalle de usuario
- [ ] Gráfica de timeline de usuario individual
- [ ] Tests unitarios (Vitest + Testing Library)

**v1.2.0:**
- [ ] Autenticación y roles (Azure AD)
- [ ] Alertas automáticas (bajo uso, sobre uso)
- [ ] Reportes programados por email
- [ ] Integración con Microsoft Teams

**v2.0.0:**
- [ ] Migración a PostgreSQL
- [ ] Redis para cache
- [ ] GraphQL API
- [ ] PWA (offline support)

---

## Guía de Versiones

Seguimos [Semantic Versioning](https://semver.org/):
- **MAJOR**: Cambios incompatibles en API
- **MINOR**: Nueva funcionalidad compatible
- **PATCH**: Bug fixes

## Contribuidores

- **DCMTIC - INEGI**: Desarrollo inicial y mantenimiento

## Licencia

Proyecto interno INEGI - Uso exclusivo corporativo.
