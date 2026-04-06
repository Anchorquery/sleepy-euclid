/**
 * Motor de decisión basado en reglas fijas
 * Evalúa la viabilidad de migración a sistema fotovoltaico
 */

import { ResultadoDimensionamiento } from './dimensionamiento'
import {
  calcularEmisionesCO2Actual,
  calcularEmisionesCO2Solar,
  calcularReduccionCO2,
  calcularDisponibilidad,
  clasificarSLA,
  calcularIndisponibilidadAnual,
} from './indicadores'

export interface DatosDecision {
  // Sistema actual
  tipoRespaldoActual: 'baterias' | 'planta_diesel'
  autonomiaActualHoras: number
  costoMensualActual: number
  consumoCombustibleLh?: number | null

  // Propuesta FV
  dimensionamiento: ResultadoDimensionamiento

  // Condiciones
  horasFallaPromedio: number
  autonomiaDeseada: number
  consumoDiarioKwh?: number
}

export interface IndicadoresAmbientalesOperativos {
  // CO₂
  emisionesCO2ActualKgMes: number
  emisionesCO2SolarKgMes: number
  reduccionCO2KgMes: number
  reduccionCO2KgAnio: number

  // Disponibilidad / SLA
  disponibilidadActualPct: number
  disponibilidadSolarPct: number
  slaActual: string
  slaSolar: string
  indisponibilidadActualHAnio: number
  indisponibilidadSolarHAnio: number
}

export interface ResultadoDecision {
  recomendacion: 'Migración recomendada' | 'Migración no recomendable' | 'Migración parcialmente viable'
  puntuacion: number // 0-100
  reglas: ReglaEvaluada[]
  justificacion: string
  indicadores: IndicadoresAmbientalesOperativos
}

export interface ReglaEvaluada {
  nombre: string
  descripcion: string
  cumple: boolean
  peso: number
  detalle: string
}

export function evaluarMigracion(datos: DatosDecision): ResultadoDecision {
  const reglas: ReglaEvaluada[] = []

  // Regla 1: Autonomía suficiente
  const autonomiaSuficiente = datos.dimensionamiento.autonomiaEstimadaHoras >= datos.horasFallaPromedio
  reglas.push({
    nombre: 'R1 - Autonomía',
    descripcion: 'La autonomía del sistema solar debe cubrir las horas promedio de fallas',
    cumple: autonomiaSuficiente,
    peso: 30,
    detalle: autonomiaSuficiente
      ? `Autonomía solar (${datos.dimensionamiento.autonomiaEstimadaHoras}h) >= Fallas promedio (${datos.horasFallaPromedio}h)`
      : `Autonomía solar (${datos.dimensionamiento.autonomiaEstimadaHoras}h) < Fallas promedio (${datos.horasFallaPromedio}h)`,
  })

  // Regla 2: Ahorro económico
  const hayAhorro = datos.dimensionamiento.costoMensualEstimado < datos.costoMensualActual
  reglas.push({
    nombre: 'R2 - Costo operativo',
    descripcion: 'El costo mensual del sistema solar debe ser menor al actual',
    cumple: hayAhorro,
    peso: 25,
    detalle: hayAhorro
      ? `Costo solar ($${datos.dimensionamiento.costoMensualEstimado}/mes) < Costo actual ($${datos.costoMensualActual}/mes)`
      : `Costo solar ($${datos.dimensionamiento.costoMensualEstimado}/mes) >= Costo actual ($${datos.costoMensualActual}/mes)`,
  })

  // Regla 3: Dependencia logística
  const esDiesel = datos.tipoRespaldoActual === 'planta_diesel'
  reglas.push({
    nombre: 'R3 - Independencia logística',
    descripcion: 'Eliminación de dependencia de combustible fósil',
    cumple: esDiesel, // Si es diésel, migrar elimina dependencia
    peso: 20,
    detalle: esDiesel
      ? 'Sistema actual depende de combustible fósil — la migración elimina esta dependencia'
      : 'Sistema actual usa baterías — no hay dependencia de combustible',
  })

  // Regla 4: Autonomía deseada
  const cumpleAutonomiaDeseada = datos.dimensionamiento.autonomiaEstimadaHoras >= datos.autonomiaDeseada
  reglas.push({
    nombre: 'R4 - Autonomía deseada',
    descripcion: 'El sistema solar cumple con la autonomía deseada por el operador',
    cumple: cumpleAutonomiaDeseada,
    peso: 15,
    detalle: cumpleAutonomiaDeseada
      ? `Autonomía solar (${datos.dimensionamiento.autonomiaEstimadaHoras}h) >= Deseada (${datos.autonomiaDeseada}h)`
      : `Autonomía solar (${datos.dimensionamiento.autonomiaEstimadaHoras}h) < Deseada (${datos.autonomiaDeseada}h)`,
  })

  // Regla 5: Retorno de inversión razonable (< 5 años)
  const ahorroMensual = datos.costoMensualActual - datos.dimensionamiento.costoMensualEstimado
  const mesesROI = ahorroMensual > 0 ? datos.dimensionamiento.inversionTotal / ahorroMensual : Infinity
  const roiRazonable = mesesROI <= 60 // 5 años
  reglas.push({
    nombre: 'R5 - Retorno de inversión',
    descripcion: 'La inversión se recupera en un período razonable (≤ 5 años)',
    cumple: roiRazonable,
    peso: 10,
    detalle: roiRazonable
      ? `ROI estimado: ${Math.round(mesesROI)} meses (${(mesesROI / 12).toFixed(1)} años)`
      : `ROI estimado: ${mesesROI === Infinity ? 'No aplica (sin ahorro)' : `${Math.round(mesesROI)} meses`}`,
  })

  // Calcular puntuación
  const puntuacion = reglas.reduce((sum, r) => sum + (r.cumple ? r.peso : 0), 0)

  // Determinar recomendación
  let recomendacion: ResultadoDecision['recomendacion']
  let justificacion: string

  if (puntuacion >= 70) {
    recomendacion = 'Migración recomendada'
    justificacion = 'El análisis técnico-económico indica que la migración hacia un sistema fotovoltaico es viable y beneficiosa para el nodo evaluado. Se recomienda proceder con el dimensionamiento detallado y la implementación.'
  } else if (puntuacion >= 40) {
    recomendacion = 'Migración parcialmente viable'
    justificacion = 'El análisis muestra viabilidad parcial. Se sugiere revisar las condiciones que no se cumplen y evaluar si pueden optimizarse antes de tomar una decisión definitiva.'
  } else {
    recomendacion = 'Migración no recomendable'
    justificacion = 'Bajo las condiciones actuales, la migración hacia energía fotovoltaica no presenta beneficios significativos. Se recomienda reevaluar cuando cambien las condiciones operativas o económicas.'
  }

  // ── Calcular indicadores ambientales y operativos ──────────────────────────
  const emisionesCO2ActualKgMes = calcularEmisionesCO2Actual(
    datos.tipoRespaldoActual,
    datos.consumoCombustibleLh ?? null,
    datos.horasFallaPromedio
  )
  const emisionesCO2SolarKgMes = calcularEmisionesCO2Solar(datos.consumoDiarioKwh ?? 0)
  const reduccionCO2KgMes = calcularReduccionCO2(emisionesCO2ActualKgMes, emisionesCO2SolarKgMes)

  const disponibilidadActualPct = calcularDisponibilidad(
    datos.horasFallaPromedio,
    datos.autonomiaActualHoras
  )
  const disponibilidadSolarPct = calcularDisponibilidad(
    datos.horasFallaPromedio,
    datos.dimensionamiento.autonomiaEstimadaHoras
  )

  const indicadores: IndicadoresAmbientalesOperativos = {
    emisionesCO2ActualKgMes,
    emisionesCO2SolarKgMes,
    reduccionCO2KgMes,
    reduccionCO2KgAnio: Math.round(reduccionCO2KgMes * 12),
    disponibilidadActualPct,
    disponibilidadSolarPct,
    slaActual: clasificarSLA(disponibilidadActualPct),
    slaSolar: clasificarSLA(disponibilidadSolarPct),
    indisponibilidadActualHAnio: calcularIndisponibilidadAnual(datos.horasFallaPromedio, datos.autonomiaActualHoras),
    indisponibilidadSolarHAnio: calcularIndisponibilidadAnual(datos.horasFallaPromedio, datos.dimensionamiento.autonomiaEstimadaHoras),
  }

  return { recomendacion, puntuacion, reglas, justificacion, indicadores }
}
