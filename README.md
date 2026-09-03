# GitHub Copilot Analytics Dashboard

Dashboard de análisis de GitHub Copilot Premium Requests con **validación automática de duplicados**, backend .NET 8, frontend React con sistema de diseño INEGI, y despliegue en contenedores Podman.

## 🌟 Características

✅ **Backend .NET 8** con Entity Framework Core + SQLite  
✅ **Validación automática de duplicados** al importar CSVs  
✅ **Frontend React 18** con librería de componentes INEGI  
✅ **Apache ECharts** integrado con design tokens INEGI  
✅ **Sistema de diseño INEGI** estricto (cero hardcoding)  
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
# En el directorio app/
cd app

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
app/
├── backend/              # API .NET 8
│   ├── GitHubCopilotAPI/
│   │   ├── Controllers/
│   │   ├── Models/
│   │   ├── Data/
│   │   ├── Services/
│   │   └── Program.cs
│   └── Dockerfile
├── frontend/             # React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── context/
│   │   └── utils/
│   ├── Dockerfile
│   └── .npmrc
├── data/                 # SQLite (persiste entre reinicios)
├── compose.yaml
└── *.sh                  # Scripts de gestión
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

## 🎨 Sistema de Diseño INEGI

El frontend sigue **estrictamente** el sistema de diseño INEGI:

### Librería de Componentes
```bash
# Registry interno INEGI (10.153.10.88)
@reactjscomponentrepository/components
```

### Componentes Usados
- `Button`, `Card`, `Badge`, `Input`, `Select`, `Table`
- `ThemeProvider`, `GlobalStyle`
- Design tokens: `colors`, `spacing`, `typography`, `shadows`

### Apache ECharts + Tema INEGI
Las gráficas usan un tema personalizado que mapea tokens INEGI:

```jsx
import { createEchartsTheme } from './utils/echartsTheme'

const theme = useTheme()
const echartsTheme = createEchartsTheme(theme)

<Chart option={{ ...echartsTheme, ...myData }} />
```

### Cero Hardcoding
```jsx
// ❌ PROHIBIDO
color: '#3b82f6'
padding: '16px'

// ✅ OBLIGATORIO
color: ${({ theme }) => theme.colors.primary.main}
padding: ${({ theme }) => theme.spacing.md}
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
Juan Pérez,juan.perez,juan.perez@inegi.org.mx
María López,maria.lopez,maria.lopez@inegi.org.mx
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

Puedes importar CSVs múltiples veces:
- ✅ El sistema **automáticamente** detecta duplicados
- ✅ No necesitas limpiar datos manualmente
- ✅ Puedes subir el mismo archivo sin problemas

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

**Comparación de Equipos** — Barras agrupadas: usuarios activos, requests totales y costo por equipo. Útil para comparar adopción entre áreas.

**Uso por Modelo de IA** — Pie chart: distribución de requests por modelo (GPT-4, Claude, etc.).

#### Tabla de Usuarios

La tabla inferior muestra usuario, requests, días activos, % de uso, categoría y costo total. Soporta ordenamiento por columna y badges de color por categoría.

### Filtrar y Analizar

#### Por Usuario
1. Usar selector de usuario (búsqueda)
2. Ver timeline detallado de uso
3. Ver desglose de modelos utilizados

#### Por Equipo
- Comparar IKTAN, SIA, SSPTIC
- Ver usuarios activos vs con bajo uso
- Identificar licencias a remover

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
# Detener servicios
./podman-stop.sh

# Eliminar base de datos
rm ./data/copilot.db

# Reiniciar (se crea BD nueva)
./podman-start.sh
```

## 🗄️ Gestión de Datos (API)

### Ver Estadísticas de BD

```bash
curl http://localhost:5000/api/datamanagement/stats
```

### Eliminar Periodo

```bash
curl -X DELETE "http://localhost:5000/api/datamanagement/period?startDate=2024-01-01&endDate=2024-01-31"
```

### Remover Duplicados Manualmente

```bash
curl -X POST http://localhost:5000/api/datamanagement/deduplicate
```

### Exportar a CSV

```bash
curl http://localhost:5000/api/datamanagement/export -o export.csv
```

## 🔧 Configuración

### Variables de Entorno
Editar `.env` para cambiar puertos o configuraciones.

### Acceso a GitLab Registry Interno
El frontend requiere acceso al GitLab interno de INEGI:
- **Registry**: http://10.153.10.88/api/v4/projects/1127/packages/npm/
- **Acceso**: Solo desde red corporativa INEGI
- **Configuración**: Ver `frontend/.npmrc`

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

**Síntoma**: Frontend muestra "Error loading data"

```bash
# Ver logs
./podman-logs.sh backend

# Verificar health
curl http://localhost:5000/health

# Reiniciar solo backend
podman-compose restart backend
```

### Frontend no carga / INEGI components not found

**Causa**: Sin acceso a red corporativa INEGI (10.153.10.88)

```bash
# Verificar conexión
ping 10.153.10.88

# Verificar .npmrc
cat frontend/.npmrc

# Reinstalar desde red corporativa
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Error al subir CSV

**Causas posibles**: archivo no válido, faltan columnas requeridas, codificación incorrecta.

```bash
# Verificar encoding (debe ser UTF-8)
file -i archivo.csv

# Convertir si es necesario
iconv -f ISO-8859-1 -t UTF-8 archivo.csv > archivo_utf8.csv
```

### Database is locked

```bash
# Detener todo
podman-compose down

# Verificar procesos usando la BD
lsof data/copilot.db          # Linux/Mac
Get-Process | Where-Object {$_.Path -like "*copilot.db*"}  # PowerShell

# Reiniciar
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

3. Limpiar contenedores y reconstruir:
```bash
./podman-rebuild.sh
```

### Frontend muestra datos desactualizados

```bash
# Forzar recarga
Ctrl+Shift+R  # Windows/Linux
Cmd+Shift+R   # Mac

# Verificar que backend tiene los datos
curl http://localhost:5000/api/metrics/summary
```

### Reinicio completo

```bash
./podman-stop.sh
rm ./data/copilot.db
./podman-rebuild.sh
```

## 🎯 Equipos Monitoreados

| Equipo | Usuarios | CSV |
|--------|----------|-----|
| IKTAN | 45 | `teams/iktan.csv` |
| SIA | 8 | `teams/sia.csv` |
| SSPTIC | 9 | `teams/ssptic.csv` |
| Vibe_Coding | Variable | `teams/Vibe_Coding.csv` |

## 📚 Documentación Adicional

- **Swagger**: http://localhost:5000/swagger
- **Plan de implementación**: Ver `/memories/session/plan.md`
- **Sistema de diseño INEGI**: Ver `.github/` en librería de componentes

## 📝 Licencia

© 2026 INEGI - Instituto Nacional de Estadística y Geografía

---

**Desarrollado por**: Equipo SSPTIC INEGI  
**Versión**: 1.0.0  
**Fecha**: Mayo 2026
