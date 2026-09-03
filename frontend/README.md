# Frontend - GitHub Copilot Analytics

Frontend de la aplicación de análisis de GitHub Copilot Premium Requests.

## Tecnologías

- ⚛️ React 18
- ⚡ Vite
- 🎨 Librería de componentes INEGI (`@reactjscomponentrepository/components`)
- 📊 Apache ECharts
- 💅 Styled Components

## Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Build para producción
npm run build
```

## Configuración

### Registry npm Interno INEGI

El proyecto usa la librería de componentes INEGI alojada en el GitLab interno.

**.npmrc**:
```
@reactjscomponentrepository:registry=http://10.153.10.88/api/v4/projects/1127/packages/npm/
```

⚠️ **Nota**: Solo accesible desde red corporativa INEGI.

## Sistema de Diseño

El frontend sigue estrictamente el sistema de diseño INEGI:

- ✅ Cero hardcoding de estilos
- ✅ Uso exclusivo de design tokens
- ✅ Componentes base de la librería INEGI
- ✅ ForwardRef en componentes personalizados
- ✅ Accesibilidad WCAG AA

## Estructura

```
frontend/
├── src/
│   ├── components/
│   │   ├── Charts/          # Gráficas ECharts
│   │   ├── Dashboard/       # KPIs y métricas
│   │   ├── Tables/          # Tablas de datos
│   │   ├── Filters/         # Filtros de búsqueda
│   │   └── DataUploader/    # Carga de CSVs
│   ├── services/
│   │   └── api.js          # Cliente API
│   ├── context/
│   │   └── DataContext.jsx # Estado global
│   ├── utils/
│   │   ├── echartsTheme.js # Tema ECharts con tokens INEGI
│   │   └── usageColors.js  # Colores para categorías
│   ├── App.jsx
│   └── main.jsx
├── public/
├── index.html
├── package.json
└── vite.config.js
```
