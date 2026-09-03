# GitHub Copilot Analytics Dashboard

Dashboard de análisis de GitHub Copilot Premium Requests con **validación automática de duplicados**, backend .NET 8, frontend React + TypeScript, y despliegue en contenedores Podman.

## 🌟 Características

✅ **Backend .NET 8** con Entity Framework Core + SQLite  
✅ **Validación automática de duplicados** al importar CSVs  
✅ **Frontend React 18 + TypeScript** con Vite  
✅ **Apache ECharts** para visualizaciones interactivas  
✅ **styled-components** para estilos en componentes  
✅ **Contenedores Podman** optimizados  
✅ **API REST** documentada con Swagger  
✅ **Dashboard interactivo** con filtros y visualizaciones  
✅ **Persistencia de datos** en SQLite  
✅ **Responsive design** mobile-first  
✅ **Accesibilidad WCAG AA**  

## 🚀 Inicio Rápido

### Prerequisitos

```bash
# Podman y Podman Compose
# En Windows con WSL2 o PowerShell
winget install RedHat.Podman

# Verificar instalación
podman --version
podman-compose --version
```

### Iniciar la aplicación

```powershell
# Dar permisos de ejecución (Git Bash o WSL)
chmod +x *.sh

# Iniciar todos los servicios
./podman-start.sh

# O en PowerShell (Windows)
podman-compose up -d --build
```

**URLs disponibles:**
- 🌐 Frontend: http://localhost:8080
- 🔌 Backend API: http://localhost:5000
- 📚 Swagger: http://localhost:5000/swagger
- ❤️ Health Check: http://localhost:5000/health

## 📁 Estructura del Proyecto

```
├── backend/              # API .NET 8
│   ├── GitHubCopilotAPI/
│   │   ├── Controllers/
│   │   ├── Models/
│   │   ├── Data/
│   │   ├── Services/
│   │   └── Program.cs
│   └── Dockerfile
├── frontend/             # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── context/
│   │   └── utils/
│   ├── Dockerfile
│   └── vite.config.ts
├── data/                 # SQLite (persiste entre reinicios)
└── compose.yaml
```

## 🔄 Validación de Duplicados

El sistema **automáticamente valida duplicados** al importar CSVs:

### Criterio de Duplicado
Un registro se considera duplicado si coinciden:
- ✅ Fecha
- ✅ Usuario
- ✅ Modelo
- ✅ Cantidad
- ✅ Costo neto

### Flujo de Importación

```
1. Usuario sube CSV → API recibe archivo
2. Parser lee registros → Valida contra BD
3. Solo inserta nuevos → Retorna estadísticas
4. Usuario ve resultado → "X nuevos, Y duplicados"
```

### Ejemplo de Respuesta

```json
{
  "success": true,
  "message": "1,234 registros nuevos importados, 567 duplicados omitidos",
  "details": {
    "totalParsed": 1801,
    "imported": 1234,
    "duplicates": 567
  }
}
```

## 📊 Uso de la Aplicación

### Primer Uso

#### 1. Verificar que esté funcionando

```bash
# Backend health check
curl http://localhost:5000/health

# Abrir frontend
open http://localhost:8080
```

#### 2. Preparar CSVs

Necesitas dos tipos de archivos:

**A) Premium Requests CSV** (de GitHub):
```
date,username,product,sku,model,quantity,...
2024-01-15,juan.perez,Copilot,...,gpt-4,25,...
2024-01-15,maria.lopez,Copilot,...,claude-3.5,42,...
```

**B) Teams CSV** (equipos internos):
```
nombre,usuario,correo
Juan Pérez,juan.perez,juan.perez@correo.com
María López,maria.lopez,maria.lopez@correo.com
```

### Importar Datos

#### Paso 1: Importar Premium Requests

1. Ve a http://localhost:8080
2. En la sección **"📊 Importar Premium Requests"**:
   - Click en "Seleccionar archivo"
   - Elige tu CSV de GitHub Copilot
   - Click en "Subir CSV"

El sistema:
- ✅ Valida automáticamente duplicados
- ✅ Solo importa registros nuevos
- ✅ Te muestra estadísticas: "X nuevos, Y duplicados"

**Ejemplo de resultado:**
```
✅ 1,234 registros nuevos importados, 567 duplicados omitidos
```

#### Paso 2: Importar Equipos (Opcional)

1. En la sección **"👥 Importar Equipo"**:
   - Escribe el nombre del equipo (ej: "IKTAN")
   - Selecciona el CSV del equipo
   - Click en "Subir Equipo"

Esto asocia usuarios a equipos para análisis por área.

#### Importación Múltiple

Puedes importar CSVs múltiples veces — el sistema detecta duplicados automáticamente, sin necesidad de limpiar datos antes de volver a subir.

### Visualizar Métricas

#### KPIs Principales

En la parte superior verás 4 tarjetas con:
- **Total Requests**: Solicitudes totales procesadas
- **Usuarios Totales**: Usuarios con datos registrados
- **Usuarios Activos**: Usuarios con uso > 0
- **Costo Total**: Gasto acumulado en USD

#### Gráficas Disponibles

**Tendencia Diaria** — Barras + línea: requests por día y usuarios activos. Útil para identificar picos de actividad.

**Distribución por Categoría** — Dona: usuarios por nivel de uso:
- 🔴 SIN USO (0 requests)
- 🟡 USO BAJO (<40%) — menos de 120 requests
- 🔵 USO MODERADO (40-70%) — 120-209 requests
- 🟢 USO ALTO (>70%) — 210+ requests

**Comparación de Equipos** — Barras agrupadas: usuarios activos, requests totales y costo por equipo.

**Uso por Modelo de IA** — Pie chart: distribución de requests por modelo (GPT-4, Claude, etc.).

#### Tabla de Usuarios

Muestra usuario, requests, días activos, % de uso, categoría y costo total. Soporta ordenamiento por columna y badges de color por categoría.

### Filtrar y Analizar

**Por Usuario**: selector con búsqueda → timeline detallado → desglose de modelos utilizados.

**Por Equipo**: compara equipos, identifica usuarios activos vs bajo uso y licencias a remover.

## 🛠️ Comandos Disponibles

### Gestión de Contenedores

```bash
# Iniciar
./podman-start.sh

# Detener
./podman-stop.sh

# Ver logs
./podman-logs.sh              # Todos
./podman-logs.sh backend      # Solo backend
./podman-logs.sh frontend     # Solo frontend

# Reconstruir desde cero
./podman-rebuild.sh

# Ver estado
podman-compose ps
```

### Desarrollo Local

#### Backend
```bash
cd backend/GitHubCopilotAPI
dotnet restore
dotnet run
# API en http://localhost:5000
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
# Dev server en http://localhost:5173
```

## 💾 Base de Datos

### Ubicación
`./data/copilot.db` (SQLite)

### Tablas
- `premium_requests` - Registros de uso
- `users` - Usuarios por equipo
- `uploads` - Historial de importaciones

### Backup

```bash
# Crear backup
cp ./data/copilot.db ./data/backup_$(date +%Y%m%d_%H%M%S).db

# Restaurar
cp ./data/backup_YYYYMMDD_HHMMSS.db ./data/copilot.db
```

### Limpiar datos

```bash
./podman-stop.sh
rm ./data/copilot.db
./podman-start.sh   # Se crea una BD nueva vacía
```

## 🗄️ Gestión de Datos (API)

```bash
# Ver estadísticas de BD
curl http://localhost:5000/api/datamanagement/stats

# Eliminar registros de un periodo
curl -X DELETE "http://localhost:5000/api/datamanagement/period?startDate=2024-01-01&endDate=2024-01-31"

# Remover duplicados manualmente
curl -X POST http://localhost:5000/api/datamanagement/deduplicate

# Exportar a CSV
curl http://localhost:5000/api/datamanagement/export -o export.csv
```

## 🔧 Configuración

Editar `.env` para cambiar puertos u otras configuraciones.

## 📡 API Endpoints

### Upload
- `POST /api/upload/premium-requests` - Importar CSV (con validación)
- `POST /api/upload/teams` - Importar equipos

### Métricas
- `GET /api/metrics/summary` - Resumen general
- `GET /api/metrics/users` - Lista de usuarios con métricas
- `GET /api/metrics/users/{username}/timeline` - Timeline por usuario
- `GET /api/metrics/users/{username}/models` - Modelos por usuario
- `GET /api/metrics/teams` - Métricas por equipo
- `GET /api/metrics/models` - Distribución de modelos
- `GET /api/metrics/daily-trend` - Tendencia diaria

### Gestión de Datos
- `GET /api/datamanagement/stats` - Estadísticas de BD
- `DELETE /api/datamanagement/period` - Limpiar período
- `POST /api/datamanagement/deduplicate` - Eliminar duplicados
- `GET /api/datamanagement/export` - Exportar a CSV

## 🐛 Troubleshooting

### Backend no responde

```bash
./podman-logs.sh backend
curl http://localhost:5000/health
podman-compose restart backend
```

### Frontend no carga

```bash
./podman-logs.sh frontend
curl http://localhost:5000/api/metrics/summary
```

### Error al instalar dependencias del frontend

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Error al subir CSV

Causas posibles: archivo no válido, faltan columnas requeridas, codificación incorrecta (debe ser UTF-8).

```bash
# Verificar encoding
file -i archivo.csv

# Convertir si es necesario
iconv -f ISO-8859-1 -t UTF-8 archivo.csv > archivo_utf8.csv
```

### Database is locked

```bash
podman-compose down
# Verificar procesos usando la BD
lsof data/copilot.db                                              # Linux/Mac
Get-Process | Where-Object {$_.Path -like "*copilot.db*"}         # PowerShell
podman-compose up -d
```

### Base de datos corrupta

```bash
./podman-stop.sh
rm ./data/copilot.db
./podman-start.sh
```

### Performance lento con muchos datos

1. Eliminar datos de periodos antiguos:
```bash
curl -X DELETE "http://localhost:5000/api/datamanagement/period?startDate=2023-01-01&endDate=2023-12-31"
```

2. Verificar índices en SQLite:
```bash
sqlite3 data/copilot.db ".indexes premium_requests"
# Esperado: IX_PremiumRequests_Date, _Username, _Model, _DuplicateCheck
```

3. Reconstruir contenedores:
```bash
./podman-rebuild.sh
```

### Frontend muestra datos desactualizados

```bash
# Forzar recarga del navegador
Ctrl+Shift+R   # Windows/Linux
Cmd+Shift+R    # Mac
```

### Reinicio completo

```bash
./podman-stop.sh
rm ./data/copilot.db
./podman-rebuild.sh
```

## 🎯 Equipos Monitoreados

| Equipo | CSV |
|--------|-----|
| IKTAN | `teams/iktan.csv` |
| SIA | `teams/sia.csv` |
| SSPTIC | `teams/ssptic.csv` |
| Vibe_Coding | `teams/Vibe_Coding.csv` |

## 📚 Documentación Adicional

- **Swagger**: http://localhost:5000/swagger

## 📝 Licencia

© 2026 - Equipo SSPTIC  
**Versión**: 2.0.0
