# GitHub Copilot Analytics — Frontend

Frontend React 18 + TypeScript + Vite para el dashboard de análisis de GitHub Copilot Premium Requests.

## 🛠️ Stack

- **React 18** + **TypeScript**
- **Vite** como bundler
- **styled-components** para estilos
- **Apache ECharts** (echarts-for-react) para gráficas
- **@xyflow/react** para diagramas de flujo
- **date-fns** para manejo de fechas

## 🚀 Desarrollo local

```bash
npm install
npm run dev
# Dev server en http://localhost:5173
```

## 🏗️ Build

```bash
npm run build
npm run preview
```

## 🔍 Type checking

```bash
npm run typecheck
```

## 📁 Estructura

```
src/
├── components/    # Componentes reutilizables
├── services/      # Llamadas a la API
├── context/       # Estado global (Context API)
└── utils/         # Helpers (echartsTheme, formatters...)
```

## 🔌 Conexión con el backend

El frontend consume la API en `http://localhost:5000`. Configurable en `.env`.
