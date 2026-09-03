# GitHub Copilot Analytics - Guía de Uso

## 📖 Índice

1. [Primer Uso](#primer-uso)
2. [Importar Datos](#importar-datos)
3. [Visualizar Métricas](#visualizar-métricas)
4. [Gestión de Datos](#gestión-de-datos)
5. [Troubleshooting](#troubleshooting)

## 🎬 Primer Uso

### 1. Levantar la aplicación

```bash
# Opción 1: Con script
cd app
./podman-start.sh

# Opción 2: Manual
podman-compose up --build
```

### 2. Verificar que esté funcionando

```bash
# Backend health check
curl http://localhost:5000/health

# Abrir frontend
open http://localhost:8080
```

### 3. Preparar CSVs

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

## 📤 Importar Datos

### Paso 1: Importar Premium Requests

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

### Paso 2: Importar Equipos (Opcional)

1. En la sección **"👥 Importar Equipo"**:
   - Escribe el nombre del equipo (ej: "IKTAN")
   - Selecciona el CSV del equipo
   - Click en "Subir Equipo"

Esto asocia usuarios a equipos para análisis por área.

### Importación Múltiple

Puedes importar CSVs múltiples veces:
- ✅ El sistema **automáticamente** detecta duplicados
- ✅ No necesitas limpiar datos manualmente
- ✅ Puedes subir el mismo archivo sin problemas

## 📊 Visualizar Métricas

### KPIs Principales

En la parte superior verás 4 tarjetas con:
- **Total Requests**: Solicitudes totales procesadas
- **Usuarios Totales**: Usuarios con datos registrados
- **Usuarios Activos**: Usuarios con uso > 0
- **Costo Total**: Gasto acumulado en USD

### Gráficas Disponibles

#### 1. Tendencia Diaria
- **Tipo**: Barras + línea
- **Muestra**: Requests por día (barras) + usuarios activos (línea)
- **Uso**: Identificar picos de actividad

#### 2. Distribución por Categoría
- **Tipo**: Dona (pie chart)
- **Muestra**: Usuarios por categoría de uso
- **Categorías**:
  - 🔴 SIN USO (0 requests)
  - 🟡 USO BAJO (<40%) - menos de 120 requests
  - 🔵 USO MODERADO (40-70%) - 120-209 requests
  - 🟢 USO ALTO (>70%) - 210+ requests

#### 3. Comparación de Equipos
- **Tipo**: Barras agrupadas
- **Muestra**: Usuarios activos, requests totales y costo por equipo
- **Uso**: Comparar adopción entre áreas

#### 4. Uso por Modelo de IA
- **Tipo**: Pie chart
- **Muestra**: Distribución de requests por modelo (GPT-4, Claude, etc.)
- **Uso**: Identificar preferencias de modelo

### Tabla de Usuarios

La tabla inferior muestra:
- **Usuario**: Username de GitHub
- **Requests**: Total de solicitudes
- **Días Activos**: Días con actividad
- **% Uso**: Porcentaje del quota mensual (300)
- **Categoría**: Badge de color según uso
- **Costo Total**: Gasto acumulado

**Funciones:**
- ✅ Click en columnas para ordenar
- ✅ Badge de color indica categoría
- ✅ Números formateados con separadores de miles

## 🛠 Gestión de Datos

### Ver Estadísticas de BD

```bash
# Endpoint API
curl http://localhost:5000/api/datamanagement/stats
```

Retorna:
- Total de registros
- Total de usuarios
- Fecha más antigua/reciente
- Historial de uploads

### Eliminar Periodo

```bash
# Eliminar registros de un periodo específico
curl -X DELETE "http://localhost:5000/api/datamanagement/period?startDate=2024-01-01&endDate=2024-01-31"
```

### Remover Duplicados Manualmente

Si detectas duplicados (no debería pasar):

```bash
curl -X POST http://localhost:5000/api/datamanagement/deduplicate
```

### Backup de Base de Datos

```bash
# Crear backup
./scripts/backup-db.sh

# Se crea archivo: data/copilot.db.backup.YYYYMMDD_HHMMSS
```

### Restaurar Backup

```bash
# 1. Detener aplicación
podman-compose down

# 2. Reemplazar base de datos
cp data/copilot.db.backup.20240115_143022 data/copilot.db

# 3. Reiniciar
podman-compose up -d
```

## 🔍 Troubleshooting

### Error: "No se puede conectar al backend"

**Síntoma**: Frontend muestra "Error loading data"

**Solución**:
```bash
# 1. Verificar que backend esté corriendo
podman ps | grep backend

# 2. Ver logs
podman logs app-backend-1

# 3. Reiniciar backend
podman-compose restart backend
```

### Error: "INEGI components not found"

**Síntoma**: Error al hacer `npm install` en frontend

**Causa**: No hay acceso a red corporativa INEGI (10.153.10.88)

**Solución**:
```bash
# 1. Verificar conexión
ping 10.153.10.88

# 2. Verificar .npmrc
cat frontend/.npmrc
# Debe contener:
# @reactjscomponentrepository:registry=http://10.153.10.88/...

# 3. Reinstalar desde red corporativa
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Error: "Database is locked"

**Síntoma**: Operaciones de BD fallan

**Solución**:
```bash
# 1. Detener todo
podman-compose down

# 2. Verificar que no haya procesos usando la BD
lsof data/copilot.db  # Linux/Mac
# o
Get-Process | Where-Object {$_.Path -like "*copilot.db*"}  # PowerShell

# 3. Reiniciar
podman-compose up -d
```

### Error: "CSV format invalid"

**Síntoma**: Error al subir CSV

**Causas posibles**:
- ✅ Archivo no es CSV válido
- ✅ Faltan columnas requeridas
- ✅ Codificación incorrecta (debe ser UTF-8)

**Solución**:
```bash
# Verificar encoding
file -i archivo.csv
# Debe mostrar: charset=utf-8

# Convertir a UTF-8 si es necesario
iconv -f ISO-8859-1 -t UTF-8 archivo.csv > archivo_utf8.csv
```

### Performance Lento

**Síntoma**: Dashboard carga lento con muchos datos

**Optimizaciones**:

1. **Eliminar datos antiguos**:
```bash
curl -X DELETE "http://localhost:5000/api/datamanagement/period?startDate=2023-01-01&endDate=2023-12-31"
```

2. **Verificar índices de BD**:
```bash
# Conectar a SQLite
sqlite3 data/copilot.db

# Ver índices
.indexes premium_requests

# Debe mostrar:
# - IX_PremiumRequests_Date
# - IX_PremiumRequests_Username
# - IX_PremiumRequests_Model
# - IX_PremiumRequests_DuplicateCheck
```

3. **Limpiar contenedores**:
```bash
./scripts/clean.sh
podman-compose up --build
```

### Frontend muestra datos desactualizados

**Síntoma**: Subiste CSV pero no aparecen datos nuevos

**Solución**:
```bash
# 1. Forzar recarga del navegador
Ctrl+Shift+R  # Windows/Linux
Cmd+Shift+R   # Mac

# 2. Limpiar cache del navegador
# Abrir DevTools (F12) → Application → Clear storage

# 3. Verificar que backend tiene los datos
curl http://localhost:5000/api/metrics/summary
```

## 🆘 Soporte

Para problemas no cubiertos aquí:

1. **Ver logs detallados**:
```bash
# Backend
podman logs -f app-backend-1

# Frontend
podman logs -f app-frontend-1
```

2. **Reinicio completo**:
```bash
./scripts/clean.sh
podman-compose up --build
```

3. **Contacto**:
   - **Equipo**: DCMTIC - INEGI
   - **Proyecto**: GitHub Copilot Analytics

## 📚 Recursos Adicionales

- [README Principal](./README.md) - Arquitectura y configuración
- [API Documentation](http://localhost:5000/swagger) - Swagger UI
- [Frontend README](./frontend/README.md) - Desarrollo frontend
- [Backend README](./backend/README.md) - Desarrollo backend (si existe)

---

**Última actualización**: 2024
**Versión**: 1.0.0
