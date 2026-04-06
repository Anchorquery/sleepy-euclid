export type TipoNodo = 'acceso' | 'distribucion' | 'core'
export type CategoriaEquipo = 'red' | 'climatizacion' | 'iluminacion' | 'otros'
export type TipoRespaldo = 'baterias' | 'planta_diesel'
export type TipoComponenteFV = 'panel' | 'bateria' | 'inversor' | 'controlador'

export interface Nodo {
  id: string
  nombre: string
  ubicacion: string
  tipo_nodo: TipoNodo
  created_at?: string
}

export interface Equipo {
  id: string
  nodo_id: string
  nombre: string
  categoria: CategoriaEquipo
  potencia_w: number
  cantidad: number
  horas_operacion: number
}

export interface RespaldoActual {
  id: string
  nodo_id: string
  tipo: TipoRespaldo
  autonomia_horas: number
  consumo_combustible_lh: number | null
  costo_mantenimiento_mensual: number
}

export interface CondicionesOperativas {
  id: string
  nodo_id: string
  horas_falla_promedio: number
  margen_crecimiento: number
  autonomia_deseada: number
  radiacion_solar_kwh_m2: number
}

export interface PropuestaFV {
  id: string
  nodo_id: string
  consumo_total_w: number
  consumo_diario_kwh: number
  consumo_con_margen_kwh: number
  paneles_requeridos: number
  potencia_paneles_kw: number
  capacidad_baterias_kwh: number
  inversor_kw: number
  controlador_a: number
  inversion_estimada: number
  costo_mensual_estimado: number
  autonomia_estimada: number
  recomendacion: string
  detalles_json: Record<string, unknown>
  created_at?: string
}

export interface ComponenteFV {
  id: string
  tipo: TipoComponenteFV
  nombre: string
  especificacion: string
  precio_unitario: number
  vida_util_anos: number
}

export interface WizardState {
  nodoId: string | null
  paso: number
}
