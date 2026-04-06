/**
 * Validacion inteligente de datos ingresados
 */

export interface ValidacionResult {
  valido: boolean
  advertencias: string[]
  errores: string[]
}

// Rangos tipicos de potencia por categoria
const RANGOS_POTENCIA: Record<string, { min: number; max: number; tipico: string }> = {
  red: { min: 5, max: 5000, tipico: '10-500W (switches, routers, OLTs)' },
  climatizacion: { min: 200, max: 15000, tipico: '800-5000W (aires acondicionados)' },
  iluminacion: { min: 5, max: 2000, tipico: '10-200W (luminarias LED/fluorescentes)' },
  otros: { min: 1, max: 10000, tipico: '5-500W (UPS, sensores, camaras)' },
}

export function validarEquipo(
  nombre: string,
  categoria: string,
  potenciaW: number,
  cantidad: number,
  horasOperacion: number
): ValidacionResult {
  const errores: string[] = []
  const advertencias: string[] = []

  if (!nombre.trim()) errores.push('El nombre del equipo es obligatorio')
  if (nombre.length > 100) errores.push('El nombre es demasiado largo (max 100 caracteres)')

  if (potenciaW <= 0) errores.push('La potencia debe ser mayor a 0')
  if (potenciaW > 50000) errores.push('Potencia demasiado alta. Verifique el valor (max 50kW)')

  const rango = RANGOS_POTENCIA[categoria]
  if (rango) {
    if (potenciaW < rango.min) {
      advertencias.push(`Potencia inusualmente baja para ${categoria}. Rango tipico: ${rango.tipico}`)
    }
    if (potenciaW > rango.max) {
      advertencias.push(`Potencia inusualmente alta para ${categoria}. Rango tipico: ${rango.tipico}`)
    }
  }

  if (cantidad < 1) errores.push('La cantidad debe ser al menos 1')
  if (cantidad > 100) advertencias.push('Cantidad elevada. Verifique que es correcta')

  if (horasOperacion < 0 || horasOperacion > 24) errores.push('Las horas de operacion deben estar entre 0 y 24')
  if (horasOperacion === 0) advertencias.push('El equipo tiene 0 horas de operacion, no consumira energia')

  return { valido: errores.length === 0, advertencias, errores }
}

export function validarNodo(nombre: string, ubicacion: string): ValidacionResult {
  const errores: string[] = []
  const advertencias: string[] = []

  if (!nombre.trim()) errores.push('El nombre del nodo es obligatorio')
  if (nombre.length < 2) errores.push('El nombre debe tener al menos 2 caracteres')
  if (!ubicacion.trim()) errores.push('La ubicacion es obligatoria')
  if (ubicacion.length < 2) errores.push('La ubicacion debe tener al menos 2 caracteres')

  return { valido: errores.length === 0, advertencias, errores }
}

export function validarRespaldo(
  tipo: string,
  autonomiaHoras: number,
  consumoCombustible: number | null,
  costoMantenimiento: number
): ValidacionResult {
  const errores: string[] = []
  const advertencias: string[] = []

  if (autonomiaHoras <= 0) errores.push('La autonomia debe ser mayor a 0')
  if (autonomiaHoras > 72) advertencias.push('Autonomia superior a 72h es inusual para nodos ISP')

  if (tipo === 'planta_diesel') {
    if (!consumoCombustible || consumoCombustible <= 0) errores.push('Indique el consumo de combustible')
    if (consumoCombustible && consumoCombustible > 100) advertencias.push('Consumo de combustible elevado (>100 L/h)')
  }

  if (costoMantenimiento < 0) errores.push('El costo no puede ser negativo')
  if (costoMantenimiento === 0) advertencias.push('Un costo de mantenimiento de $0 es inusual')
  if (costoMantenimiento > 50000) advertencias.push('Costo mensual muy elevado. Verifique el valor')

  return { valido: errores.length === 0, advertencias, errores }
}

export function validarCondiciones(
  horasFalla: number,
  margenCrecimiento: number,
  autonomiaDeseada: number,
  radiacionSolar: number
): ValidacionResult {
  const errores: string[] = []
  const advertencias: string[] = []

  if (horasFalla < 0 || horasFalla > 24) errores.push('Las horas de falla deben estar entre 0 y 24')
  if (horasFalla === 0) advertencias.push('Sin fallas electricas, el respaldo solar puede no ser necesario')
  if (horasFalla > 12) advertencias.push('Mas de 12h/dia de falla indica un suministro electrico critico')

  if (margenCrecimiento < 0) errores.push('El margen no puede ser negativo')
  if (margenCrecimiento > 100) advertencias.push('Un margen >100% duplicaria la capacidad. Es intencional?')

  if (autonomiaDeseada < 1) errores.push('La autonomia deseada debe ser al menos 1 hora')
  if (autonomiaDeseada > 48) advertencias.push('Autonomia >48h requiere un sistema muy grande')

  if (radiacionSolar < 1 || radiacionSolar > 8) errores.push('La radiacion solar debe estar entre 1 y 8 kWh/m2/dia')
  if (radiacionSolar < 3) advertencias.push('Radiacion solar baja. El sistema requerira mas paneles')

  return { valido: errores.length === 0, advertencias, errores }
}

export function getRangosPotencia() {
  return RANGOS_POTENCIA
}
