# SolarISP — Sistema de Evaluación de Respaldo Energético para Nodos de Telecomunicaciones

> Herramienta de apoyo a la decisión para evaluar la viabilidad técnica, financiera y ambiental de migrar sistemas de respaldo energético tradicionales (baterías / planta diésel) a soluciones fotovoltaicas en nodos de ISP.
>
> **Tesis de Grado — Ingeniería de Telecomunicaciones**

---

## Descripción

SolarISP es una aplicación web desarrollada como proyecto de tesis que permite a operadores de redes ISP analizar y comparar el desempeño de sus actuales sistemas de respaldo energético frente a una propuesta de sistema fotovoltaico (FV) diseñado a medida.

El sistema guía al usuario a través de un wizard multi-paso donde ingresa los parámetros del nodo (consumo, ubicación, tipo de respaldo actual, historial de fallas), y genera automáticamente:

- Dimensionamiento del sistema FV (paneles, baterías, inversor, controlador)
- Indicadores financieros: TIR, VPN, período de retorno, costo mensual estimado
- Indicadores ambientales: reducción de emisiones CO₂ (kg/mes y kg/año)
- Indicadores operativos: disponibilidad, SLA, indisponibilidad anual
- Análisis de sensibilidad y escenarios comparativos
- Reporte exportable en PDF

---

## Características principales

| Módulo | Descripción |
|--------|-------------|
| **Wizard de evaluación** | Flujo guiado en 6 pasos: nodo → equipos → condiciones → respaldo → resultados → reporte |
| **Motor de decisión** | Reglas basadas en autonomía, costo mensual, disponibilidad y payback |
| **Dimensionamiento FV** | Cálculo de paneles, baterías (Ah/kWh), inversor y controlador de carga |
| **Indicadores financieros** | TIR, VPN a 10 años, período de retorno simple y descontado |
| **Indicadores ambientales** | Factores de emisión IPCC 2006, NREL 2021, red eléctrica venezolana (IEA) |
| **Indicadores operativos** | Disponibilidad %, clasificación SLA (ITU-T E.800), indisponibilidad anual |
| **Análisis de sensibilidad** | Variación de parámetros clave sobre el VPN y TIR |
| **Caso de estudio demo** | Datos precargados para explorar la herramienta sin registro |
| **Historial** | Registro de evaluaciones previas por usuario (Supabase) |
| **Exportación PDF** | Reporte técnico completo generado en el navegador |
| **i18n** | Soporte multiidioma (español / inglés) |
| **Dark mode** | Tema claro/oscuro persistente |

---

## Stack tecnológico

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router) + React 19
- **Lenguaje:** TypeScript 5
- **Estilos:** Tailwind CSS 4
- **Base de datos / Auth:** [Supabase](https://supabase.com/) (`@supabase/ssr`)
- **Gráficos:** Chart.js 4 + react-chartjs-2
- **Exportación PDF:** jsPDF + html2canvas
- **Deploy:** Coolify (self-hosted)

---

## Estructura del proyecto

```
src/
├── app/
│   ├── auth/           # Página de autenticación (login / registro)
│   ├── dashboard/      # Panel principal del usuario autenticado
│   ├── historial/      # Historial de evaluaciones guardadas
│   └── wizard/         # Flujo de evaluación multi-paso
│       ├── nodo/       # Paso 1: datos del nodo
│       ├── equipos/    # Paso 2: catálogo de equipos
│       ├── condiciones/# Paso 3: condiciones de operación
│       ├── respaldo/   # Paso 4: sistema de respaldo actual
│       ├── resultados/ # Paso 5: resultados del análisis
│       └── reporte/    # Paso 6: generación de reporte PDF
├── components/
│   ├── charts/         # AutonomiaChart, ConsumoPieChart, CostosChart, etc.
│   └── wizard/         # Stepper, CatalogoEquipos, ValidacionAlert
├── hooks/
│   └── useWizard.ts    # Estado global del wizard
├── lib/
│   ├── auth.tsx        # Contexto de autenticación (Supabase + modo invitado)
│   ├── calculos.ts     # Utilidades de cálculo general
│   ├── caso-estudio.ts # Datos del caso de estudio demo
│   ├── catalogo-equipos.ts  # Catálogo de equipos de telecomunicaciones
│   ├── dimensionamiento.ts  # Dimensionamiento del sistema FV
│   ├── escenarios.ts        # Comparación de escenarios
│   ├── exportar.ts          # Exportación de datos
│   ├── generar-pdf.ts       # Generación del reporte PDF
│   ├── i18n.ts              # Internacionalización
│   ├── indicadores.ts       # Indicadores financieros, ambientales y operativos
│   ├── motor-decision.ts    # Motor de decisión basado en reglas
│   ├── radiacion-solar.ts   # Datos de radiación solar (HSP)
│   ├── sensibilidad.ts      # Análisis de sensibilidad
│   ├── supabase.ts          # Cliente Supabase
│   └── validacion.ts        # Validación de entradas del wizard
└── types/
    └── index.ts        # Interfaces y tipos del dominio
```

---

## Instalación y uso local

### Requisitos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com/) (o instancia self-hosted)

### Variables de entorno

Crea un archivo `.env.local` en la raíz:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### Comandos

```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Build de producción
npm run build

# Iniciar en producción
npm start
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

---

## Referencias técnicas

- **IPCC (2006).** Guidelines for National Greenhouse Gas Inventories, Vol. 2 — Factor de emisión diésel: 2.68 kg CO₂/L
- **NREL (2021).** Life Cycle Greenhouse Gas Emissions from Solar Photovoltaics — Factor FV: 0.048 kg CO₂/kWh
- **IEA / CORPOELEC (2022).** Factor de emisión red eléctrica venezolana: 0.29 kg CO₂/kWh
- **ITU-T E.800 (2008).** Definiciones de disponibilidad y calidad de servicio (SLA)

---

## Licencia

Proyecto académico — uso educativo. Todos los derechos reservados al autor.
