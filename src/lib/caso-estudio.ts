/**
 * Caso de Estudio Precargado — Validación del Modelo
 * Nodo ISP real de acceso, Valencia, Estado Carabobo, Venezuela
 *
 * Propósito académico: Valida el modelo propuesto aplicándolo a un nodo
 * de telecomunicaciones real, conforme a la Sección 4.9 del marco metodológico.
 *
 * Datos basados en:
 * - Inventario de equipos de un nodo de acceso ISP clase media (Venezuela, 2024)
 * - Tarifas de combustible y mantenimiento registradas en campo
 * - Radiación solar: Atlas Solar de Venezuela (CORPOELEC/IDEAM), Valencia = 5.2 kWh/m²/día
 */

export interface CasoEstudioEquipo {
  nombre: string
  categoria: 'red' | 'climatizacion' | 'iluminacion' | 'otros'
  potencia_w: number
  cantidad: number
  horas_operacion: number
}

export interface CasoEstudio {
  meta: {
    titulo: string
    descripcion: string
    fuente: string
    fecha: string
  }
  nodo: {
    nombre: string
    ubicacion: string
    tipo_nodo: 'acceso' | 'distribucion' | 'core'
  }
  equipos: CasoEstudioEquipo[]
  respaldo: {
    tipo: 'baterias' | 'planta_diesel'
    autonomia_horas: number
    consumo_combustible_lh: number | null
    costo_mantenimiento_mensual: number
  }
  condiciones: {
    horas_falla_promedio: number
    margen_crecimiento: number
    autonomia_deseada: number
    radiacion_solar_kwh_m2: number
    ciudad_referencia: string
  }
}

export const CASO_ESTUDIO_DEMO: CasoEstudio = {
  meta: {
    titulo: 'Nodo ISP de Acceso — Valencia, Carabobo',
    descripcion:
      'Nodo de acceso perteneciente a un proveedor de servicios de Internet (ISP) en la ciudad de Valencia, ' +
      'Estado Carabobo. Atiende aproximadamente 850 suscriptores residenciales y empresariales. ' +
      'Actualmente opera con una planta eléctrica diésel como sistema de respaldo energético principal, ' +
      'enfrentando elevados costos operativos y dependencia logística de combustible.',
    fuente: 'Levantamiento de campo — ISP Región Central Venezuela (2024)',
    fecha: '2024-Q3',
  },
  nodo: {
    nombre: 'Nodo ISP Valencia Centro',
    ubicacion: 'Valencia, Carabobo',
    tipo_nodo: 'acceso',
  },
  equipos: [
    // Red
    { nombre: 'OLT (Optical Line Terminal)',   categoria: 'red',          potencia_w: 350,  cantidad: 1, horas_operacion: 24 },
    { nombre: 'Switch Core 24p',               categoria: 'red',          potencia_w: 150,  cantidad: 2, horas_operacion: 24 },
    { nombre: 'Router de borde',               categoria: 'red',          potencia_w: 200,  cantidad: 1, horas_operacion: 24 },
    { nombre: 'Radio Enlace Microondas',       categoria: 'red',          potencia_w: 85,   cantidad: 2, horas_operacion: 24 },
    { nombre: 'Switch de Acceso 48p',          categoria: 'red',          potencia_w: 120,  cantidad: 3, horas_operacion: 24 },
    { nombre: 'Servidor de Gestión',           categoria: 'red',          potencia_w: 250,  cantidad: 1, horas_operacion: 24 },
    // Climatización
    { nombre: 'Aire Acondicionado 24000 BTU',  categoria: 'climatizacion', potencia_w: 2400, cantidad: 1, horas_operacion: 18 },
    { nombre: 'Ventilador Extractor',          categoria: 'climatizacion', potencia_w: 120,  cantidad: 2, horas_operacion: 24 },
    // Iluminación
    { nombre: 'Panel LED Interior',            categoria: 'iluminacion',   potencia_w: 40,   cantidad: 4, horas_operacion: 10 },
    // Otros
    { nombre: 'Sistema CCTV (4 cámaras)',      categoria: 'otros',         potencia_w: 60,   cantidad: 1, horas_operacion: 24 },
    { nombre: 'UPS de administración',         categoria: 'otros',         potencia_w: 100,  cantidad: 1, horas_operacion: 24 },
  ],
  respaldo: {
    tipo: 'planta_diesel',
    autonomia_horas: 6,
    consumo_combustible_lh: 3.2,
    costo_mantenimiento_mensual: 280,
  },
  condiciones: {
    horas_falla_promedio: 5,
    margen_crecimiento: 20,
    autonomia_deseada: 8,
    radiacion_solar_kwh_m2: 5.2,
    ciudad_referencia: 'Valencia',
  },
}

/** Resumen ejecutivo del caso de estudio para mostrar en UI */
export function getCasoEstudioResumen(c: CasoEstudio): string {
  const totalEquipos = c.equipos.length
  const potenciaTotal = c.equipos.reduce((s, e) => s + e.potencia_w * e.cantidad, 0)
  return (
    `${c.meta.titulo} · ${totalEquipos} equipos · ${(potenciaTotal / 1000).toFixed(1)} kW instalado · ` +
    `Respaldo: ${c.respaldo.tipo === 'planta_diesel' ? 'Planta Diésel' : 'Baterías'} (${c.respaldo.autonomia_horas}h) · ` +
    `Radiación: ${c.condiciones.radiacion_solar_kwh_m2} kWh/m²/día`
  )
}
